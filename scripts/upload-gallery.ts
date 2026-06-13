import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, sep } from 'node:path';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import exifr from 'exifr';
import sharp from 'sharp';

const PHOTO_EXTENSIONS = /\.(jpg|jpeg|png)$/i;
const THUMB_WIDTH = 600;
const THUMB_QUALITY = 80;
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const MANIFEST_CACHE_CONTROL = 'public, max-age=300';

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

interface ExifInfo {
  iso?: number;
  exposure?: number;
  fNumber?: number;
  focalLength?: number;
  camera?: string;
  lens?: string;
  date?: string;
  width?: number;
  height?: number;
}

interface ManifestPhoto {
  url: string;
  thumb: string;
  name: string;
  path: string;
  exif: ExifInfo;
}

interface ManifestFolder {
  name: string;
  path: string;
  photoCount: number;
  subfolders: ManifestFolder[];
}

interface Manifest {
  generatedAt: string;
  folders: ManifestFolder[];
  photos: ManifestPhoto[];
}

function requireEnv(name: string, hint: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error(hint);
    process.exit(1);
  }
  return value;
}

const S3_ENDPOINT = requireEnv(
  'S3_ENDPOINT',
  'Set S3_ENDPOINT to your S3-compatible endpoint (Yandex: https://storage.yandexcloud.net, MinIO: your MinIO URL, R2: https://<account>.r2.cloudflarestorage.com).'
);
const S3_REGION = process.env.S3_REGION || 'ru-central1';
const S3_ACCESS_KEY_ID = requireEnv(
  'S3_ACCESS_KEY_ID',
  'Set S3_ACCESS_KEY_ID to your static access key id.'
);
const S3_SECRET_ACCESS_KEY = requireEnv(
  'S3_SECRET_ACCESS_KEY',
  'Set S3_SECRET_ACCESS_KEY to the matching secret access key.'
);
const S3_BUCKET = requireEnv('S3_BUCKET', 'Set S3_BUCKET to the name of your gallery bucket.');
const PUBLIC_URL = requireEnv(
  'GALLERY_BASE_URL',
  'Set GALLERY_BASE_URL to the public base URL for objects (e.g. https://storage.yandexcloud.net/<bucket>, no trailing slash).'
).replace(/\/+$/, '');
const GALLERY_SRC = process.env.GALLERY_SRC || './gallery-src';

const s3 = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  forcePathStyle: true,
  maxAttempts: 5,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
});

async function objectExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

let processedCount = 0;
let totalCount = 0;

async function countPhotos(absPath: string): Promise<number> {
  const entries = await readdir(absPath, { withFileTypes: true });
  let n = 0;
  for (const entry of entries) {
    if (entry.isDirectory()) {
      n += await countPhotos(join(absPath, entry.name));
    } else if (PHOTO_EXTENSIONS.test(entry.name)) {
      n += 1;
    }
  }
  return n;
}

function progressBar(current: number, total: number): string {
  const pct = total ? Math.round((current / total) * 100) : 100;
  const width = 24;
  const filled = Math.round((pct / 100) * width);
  return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}] ${pct}% (${current}/${total})`;
}

function toPosixPath(path: string): string {
  return path.split(sep).join('/');
}

async function extractExif(filePath: string): Promise<ExifInfo> {
  try {
    const data = (await exifr.parse(filePath, { skip: ['makernote'] })) as any;
    const date: Date | undefined = data?.DateTimeOriginal || data?.DateTime;

    return {
      iso: data?.ISO,
      exposure: data?.ExposureTime,
      fNumber: data?.FNumber,
      focalLength: data?.FocalLength,
      camera: data?.Model ? `${data.Make || ''} ${data.Model}`.trim() : undefined,
      lens: data?.LensModel,
      date: date instanceof Date ? date.toISOString() : undefined,
      width: data?.ImageWidth,
      height: data?.ImageHeight,
    };
  } catch {
    return {};
  }
}

async function uploadObject(key: string, body: Buffer, contentType: string, cacheControl: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );
}

interface ScanResult {
  photos: ManifestPhoto[];
  folder: ManifestFolder;
}

async function scanFolder(
  absPath: string,
  relPath: string,
  folderName: string
): Promise<ScanResult> {
  const entries = await readdir(absPath, { withFileTypes: true });
  const photos: ManifestPhoto[] = [];
  const subfolders: ManifestFolder[] = [];

  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of sorted) {
    const entryAbsPath = join(absPath, entry.name);
    const entryRelPath = relPath ? `${relPath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const sub = await scanFolder(entryAbsPath, entryRelPath, entry.name);
      photos.push(...sub.photos);
      subfolders.push(sub.folder);
      continue;
    }

    if (!PHOTO_EXTENSIONS.test(entry.name)) continue;

    const ext = extname(entry.name).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
    const name = entry.name.replace(/\.[^.]+$/, '');

    const exif = await extractExif(entryAbsPath);
    const photoKey = `photos/${toPosixPath(entryRelPath)}`;
    const thumbKey = `thumbs/${toPosixPath(entryRelPath)}.webp`;
    let uploaded = false;

    if (!(await objectExists(photoKey))) {
      const fileBuffer = await readFile(entryAbsPath);
      await uploadObject(photoKey, fileBuffer, contentType, IMMUTABLE_CACHE_CONTROL);
      uploaded = true;
    }

    if (!(await objectExists(thumbKey))) {
      const thumbBuffer = await sharp(entryAbsPath)
        .resize(THUMB_WIDTH, undefined, { withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toBuffer();
      await uploadObject(thumbKey, thumbBuffer, 'image/webp', IMMUTABLE_CACHE_CONTROL);
      uploaded = true;
    }

    processedCount += 1;
    console.log(
      `${progressBar(processedCount, totalCount)} ${uploaded ? 'up ' : 'skip'} ${toPosixPath(entryRelPath)}`
    );

    photos.push({
      url: `${PUBLIC_URL}/${photoKey}`,
      thumb: `${PUBLIC_URL}/${thumbKey}`,
      name,
      path: toPosixPath(relPath) || '/',
      exif,
    });
  }

  const photoCount = photos.length;

  return {
    photos,
    folder: {
      name: folderName,
      path: toPosixPath(relPath) || '/',
      photoCount,
      subfolders,
    },
  };
}

async function main() {
  let rootStat: Awaited<ReturnType<typeof stat>>;
  try {
    rootStat = await stat(GALLERY_SRC);
  } catch {
    console.error(`GALLERY_SRC directory not found: ${GALLERY_SRC}`);
    console.error('Create it and place category subfolders with photos inside, e.g.:');
    console.error('  gallery-src/Поездки/Кронштадт/photo.jpg');
    process.exit(1);
  }

  if (!rootStat.isDirectory()) {
    console.error(`GALLERY_SRC is not a directory: ${GALLERY_SRC}`);
    process.exit(1);
  }

  console.log(`Scanning ${GALLERY_SRC}...`);
  totalCount = await countPhotos(GALLERY_SRC);
  console.log(`Found ${totalCount} photo(s). Uploading (already-uploaded ones are skipped)...`);

  const root = await scanFolder(GALLERY_SRC, '', 'photos');

  const manifest: Manifest = {
    generatedAt: new Date().toISOString(),
    folders: root.folder.subfolders,
    photos: root.photos,
  };

  const manifestBody = Buffer.from(JSON.stringify(manifest, null, 2));
  await uploadObject(
    'gallery-manifest.json',
    manifestBody,
    'application/json',
    MANIFEST_CACHE_CONTROL
  );

  console.log('');
  console.log(`Uploaded ${root.photos.length} photo(s).`);
  console.log(`Manifest: ${PUBLIC_URL}/gallery-manifest.json`);
}

main().catch((err) => {
  console.error('Gallery upload failed:', err);
  process.exit(1);
});

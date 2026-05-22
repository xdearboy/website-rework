import { Elysia } from 'elysia';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, relative, sep, parse } from 'path';
import * as exifr from 'exifr';
import sharp from 'sharp';

const PHOTO_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif)$/i;
const GALLERY_ROOT = join(process.cwd(), 'public', 'photos');
const THUMBS_ROOT = join(process.cwd(), 'public', 'thumbs');

interface PhotoInfo {
  url: string;
  thumb: string;
  name: string;
  path: string;
  exif: any;
  description?: string;
}

interface FolderInfo {
  name: string;
  path: string;
  photoCount: number;
  subfolders: FolderInfo[];
}

interface CacheEntry {
  timestamp: number;
  data: any;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const thumbQueue = new Set<string>();

async function ensureThumbsDir() {
  try {
    await mkdir(THUMBS_ROOT, { recursive: true });
  } catch (err) {
    console.error('Error creating thumbs directory:', err);
  }
}

function getThumbPath(filePath: string) {
  const thumbDir = join(THUMBS_ROOT, relative(GALLERY_ROOT, filePath).split(sep).slice(0, -1).join(sep));
  const parsed = parse(filePath);
  const thumbPath = join(thumbDir, `${parsed.name}-thumb.webp`);
  const thumbUrl = `/thumbs/${relative(THUMBS_ROOT, thumbPath).split(sep).join('/')}`;
  return { thumbPath, thumbUrl };
}

async function generateThumb(filePath: string) {
  try {
    const { thumbPath, thumbUrl } = getThumbPath(filePath);

    try {
      await stat(thumbPath);
      return thumbUrl;
    } catch {
      const thumbDir = parse(thumbPath).dir;
      await mkdir(thumbDir, { recursive: true });
      await sharp(filePath).resize(300, 300, { fit: 'cover', withoutEnlargement: true }).webp({ quality: 80 }).toFile(thumbPath);
      return thumbUrl;
    }
  } catch (err) {
    console.error(`Error generating thumb for ${filePath}:`, err);
    return null;
  }
}

function queueThumbGeneration(filePath: string) {
  if (!thumbQueue.has(filePath)) {
    thumbQueue.add(filePath);
    generateThumb(filePath).catch((err) => console.error('Background thumb gen error:', err)).finally(() => thumbQueue.delete(filePath));
  }
}

async function extractExif(filePath: string) {
  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1000));
    const data = await Promise.race([
      exifr.parse(filePath, { jpegs: ['gps'], skip: ['makernote'] }),
      timeoutPromise,
    ]) as any;

    return {
      iso: data?.ISO,
      exposure: data?.ExposureTime,
      fNumber: data?.FNumber,
      focalLength: data?.FocalLength,
      camera: data?.Model ? `${data.Make || ''} ${data.Model}`.trim() : undefined,
      lens: data?.LensModel,
      date: data?.DateTimeOriginal || data?.DateTime,
      width: data?.ImageWidth,
      height: data?.ImageHeight,
    };
  } catch {
    return {};
  }
}

async function scanFolder(folderPath: string): Promise<{ photos: PhotoInfo[]; structure: FolderInfo }> {
  const cacheKey = folderPath;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const photos: PhotoInfo[] = [];
  const subfolders: FolderInfo[] = [];

  try {
    const files = await readdir(folderPath, { withFileTypes: true });

    for (const file of files) {
      const fullPath = join(folderPath, file.name);
      const relativePath = relative(GALLERY_ROOT, fullPath);
      const urlPath = `/photos/${relativePath.split(sep).join('/')}`;

      if (file.isDirectory()) {
        const subfolder = await scanFolder(fullPath);
        if (subfolder.photos.length > 0 || subfolder.structure.subfolders.length > 0) {
          subfolders.push({
            ...subfolder.structure,
            path: relativePath || '/',
          });
        }
      } else if (PHOTO_EXTENSIONS.test(file.name)) {
        const encodedUrl = encodeURI(urlPath);
        const { thumbUrl } = getThumbPath(fullPath);
        const encodedThumb = encodeURI(thumbUrl);
        queueThumbGeneration(fullPath);
        const exif = await extractExif(fullPath);

        photos.push({
          url: encodedUrl,
          thumb: encodedThumb,
          name: file.name.replace(/\.[^.]+$/, ''),
          path: relativePath,
          exif,
        });
      }
    }
  } catch (err) {
    console.error(`Error scanning folder ${folderPath}:`, err);
  }

  const totalPhotos = photos.length + subfolders.reduce((sum, f) => sum + f.photoCount, 0);

  const result = {
    photos,
    structure: {
      name: folderPath === GALLERY_ROOT ? 'photos' : folderPath.split(sep).pop() || 'photos',
      path: relative(GALLERY_ROOT, folderPath) || '/',
      photoCount: totalPhotos,
      subfolders,
    },
  };

  cache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

ensureThumbsDir();

const app = new Elysia()
  .get('/api/gallery', async ({ query, set }) => {
    try {
      const path = (query.path as string) || '/';
      const fullPath = path === '/' ? GALLERY_ROOT : join(GALLERY_ROOT, path);

      const result = await scanFolder(fullPath);

      set.headers['Cache-Control'] = 'public, max-age=3600';
      set.headers['Content-Type'] = 'application/json';

      return {
        photos: result.photos,
        folders: result.structure.subfolders,
        path,
      };
    } catch (err) {
      console.error('Gallery API error:', err);
      return { photos: [], folders: [], error: 'Failed to load gallery' };
    }
  });

app.listen(3000, () => {
  console.log('🎨 Gallery API running on http://localhost:3000');
});

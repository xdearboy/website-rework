import type { ExifData } from './lib/exif-utils';

export interface GalleryPhoto {
  url: string;
  thumb?: string;
  name: string;
  path: string;
  exif: ExifData;
}

export interface GalleryFolder {
  name: string;
  path: string;
  subfolders: GalleryFolder[];
  photoCount: number;
}

export interface ManifestPhoto extends Omit<GalleryPhoto, 'exif'> {
  exif: Omit<ExifData, 'date'> & { date?: string };
}

export interface GalleryManifest {
  generatedAt: string;
  folders: GalleryFolder[];
  photos: ManifestPhoto[];
}

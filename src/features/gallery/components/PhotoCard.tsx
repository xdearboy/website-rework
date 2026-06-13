import { formatExifValue } from '@/features/gallery/lib/exif-utils';
import type { GalleryPhoto } from '../types';

interface PhotoCardProps {
  photo: GalleryPhoto;
  onClick: () => void;
}

function exifCaption(photo: GalleryPhoto): string | null {
  const { exif } = photo;
  const parts = [
    exif.fNumber ? formatExifValue('fNumber', exif.fNumber) : null,
    exif.exposure ? formatExifValue('exposure', exif.exposure) : null,
    exif.iso ? formatExifValue('iso', exif.iso) : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const caption = exifCaption(photo);

  return (
    <button
      type="button"
      onClick={onClick}
      data-photo-card
      className="group block w-full text-left will-change-transform"
    >
      <span className="block overflow-hidden rounded border border-border bg-card/40 transition-colors duration-200 group-hover:border-primary/60">
        <span className="block aspect-square overflow-hidden">
          <img
            src={photo.thumb || photo.url}
            alt={photo.name}
            data-photo-img
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </span>
      </span>
      <span className="mt-1.5 block truncate text-xs text-muted-foreground">
        {photo.name}
        {caption ? <span className="text-muted-foreground/70"> · {caption}</span> : null}
      </span>
    </button>
  );
}

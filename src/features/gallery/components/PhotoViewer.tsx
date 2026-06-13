import { formatExifValue } from '@/features/gallery/lib/exif-utils';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GalleryPhoto } from '../types';

gsap.registerPlugin(useGSAP);

interface PhotoViewerProps {
  photo: GalleryPhoto;
  allPhotos: GalleryPhoto[];
  onClose: () => void;
  onNavigate?: (index: number) => void;
}

function exifLine(photo: GalleryPhoto): string | null {
  const { exif } = photo;
  const parts = [
    exif.camera,
    exif.lens,
    exif.focalLength ? formatExifValue('focalLength', exif.focalLength) : null,
    exif.fNumber ? formatExifValue('fNumber', exif.fNumber) : null,
    exif.exposure ? formatExifValue('exposure', exif.exposure) : null,
    exif.iso ? formatExifValue('iso', exif.iso) : null,
    exif.date ? formatExifValue('date', exif.date) : null,
    exif.width && exif.height ? `${exif.width}×${exif.height}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export default function PhotoViewer({ photo, allPhotos, onClose, onNavigate }: PhotoViewerProps) {
  const { t } = useTranslation('gallery');
  const [zoom, setZoom] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [fullLoaded, setFullLoaded] = useState(false);
  const currentIndex = allPhotos.findIndex((p) => p.url === photo.url);

  const overlayRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const isFirstOpenRef = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally resets pan/zoom only when the displayed photo changes; the state setters are stable.
  useEffect(() => {
    setOffsetX(0);
    setOffsetY(0);
    setZoom(1);
    setFullLoaded(false);
    setImageError(false);
  }, [photo.url]);

  useEffect(() => {
    for (const i of [currentIndex - 1, currentIndex + 1]) {
      const neighbour = allPhotos[i];
      if (neighbour) {
        const img = new Image();
        img.src = neighbour.url;
      }
    }
  }, [currentIndex, allPhotos]);

  useEffect(() => {
    if (zoom === 1) {
      setOffsetX(0);
      setOffsetY(0);
    }
  }, [zoom]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate?.(currentIndex - 1);
      }
      if (e.key === 'ArrowRight' && currentIndex < allPhotos.length - 1) {
        onNavigate?.(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, allPhotos.length, onClose, onNavigate]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };
        const firstOpen = isFirstOpenRef.current;
        isFirstOpenRef.current = false;

        if (reduceMotion) {
          gsap.set(overlayRef.current, { opacity: 1, backdropFilter: 'blur(6px)' });
          gsap.set(frameRef.current, { opacity: 1, scale: 1, clearProps: 'transform,filter' });
          return;
        }

        if (firstOpen) {
          gsap.fromTo(
            overlayRef.current,
            { opacity: 0, backdropFilter: 'blur(0px)' },
            { opacity: 1, backdropFilter: 'blur(6px)', duration: 0.35, ease: 'power2.out' }
          );
          gsap.fromTo(
            frameRef.current,
            { opacity: 0, scale: 0.92, filter: 'blur(8px)' },
            { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.4, ease: 'power3.out' }
          );
          return;
        }

        gsap.fromTo(
          frameRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.18, ease: 'power1.out' }
        );
      });

      return () => mm.revert();
    },
    { dependencies: [photo.url], scope: overlayRef }
  );

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.shiftKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(1, Math.min(5, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    const maxOffset = Math.min(window.innerWidth, window.innerHeight) * (zoom - 1) * 0.4;
    setOffsetX(Math.max(-maxOffset, Math.min(maxOffset, newX)));
    setOffsetY(Math.max(-maxOffset, Math.min(maxOffset, newY)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const caption = exifLine(photo);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[999999] flex h-full w-full items-center justify-center bg-background/95 font-mono"
      style={{
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
        userSelect: 'none',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t('photoViewer.close')}
        className="absolute right-4 top-4 z-10 rounded p-2 text-muted-foreground transition-colors hover:text-primary"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex h-full w-full items-center justify-center gap-1 sm:gap-4">
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={() => onNavigate?.(currentIndex - 1)}
            aria-label={t('photoViewer.previous')}
            className="absolute left-1 z-10 rounded p-2 text-muted-foreground transition-colors hover:text-primary sm:static sm:left-auto"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div
          className="flex flex-1 items-center justify-center overflow-auto px-10 pb-16 sm:px-0"
          onWheel={handleWheel}
        >
          {imageError ? (
            <div className="text-center text-destructive">
              <p className="mb-2 text-sm">{t('photoViewer.loadError')}</p>
              <p className="break-all text-xs text-muted-foreground">{photo.url}</p>
            </div>
          ) : (
            <div
              ref={frameRef}
              style={{
                transform: `scale(${zoom}) translate(${offsetX / zoom}px, ${offsetY / zoom}px)`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              className="relative h-[78vh] w-full max-w-[88vw] sm:max-w-[80vw]"
            >
              <img
                src={photo.thumb ?? photo.url}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="absolute inset-0 size-full rounded object-contain"
              />
              <img
                src={photo.url}
                alt={photo.name}
                draggable={false}
                onLoad={() => setFullLoaded(true)}
                onError={() => setImageError(true)}
                className="absolute inset-0 block size-full rounded object-contain transition-opacity duration-300"
                style={{ opacity: fullLoaded ? 1 : 0 }}
              />
            </div>
          )}
        </div>

        {currentIndex < allPhotos.length - 1 && (
          <button
            type="button"
            onClick={() => onNavigate?.(currentIndex + 1)}
            aria-label={t('photoViewer.next')}
            className="absolute right-1 z-10 rounded p-2 text-muted-foreground transition-colors hover:text-primary sm:static sm:right-auto"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="absolute inset-x-2 bottom-2 flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm sm:inset-x-4 sm:bottom-4 sm:flex-nowrap sm:gap-4">
        <p className="min-w-0 flex-1 truncate">
          {photo.name}
          {caption ? <span className="text-muted-foreground/70"> · {caption}</span> : null}
        </p>
        <p className="hidden shrink-0 whitespace-nowrap text-muted-foreground/60 sm:block">
          {t('photoViewer.zoomHint')}
        </p>
        <p className="shrink-0 whitespace-nowrap">
          {currentIndex + 1} / {allPhotos.length}
        </p>
      </div>
    </div>
  );
}

import CategoryNav from '@/features/gallery/components/CategoryNav';
import PhotoGrid from '@/features/gallery/components/PhotoGrid';
import type { GalleryFolder, GalleryManifest, GalleryPhoto } from '@/features/gallery/types';
import { usePageTransition } from '@/shared/hooks/usePageTransition';
import PageShell from '@/shared/layout/PageShell';
import { Skeleton, SkeletonGroup } from '@/shared/ui/Skeleton';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const PHOTO_SKELETON_KEYS = Array.from({ length: 12 }, (_, index) => `photo-${index}`);

function matchesPath(photoPath: string, currentPath: string) {
  if (currentPath === '/') return true;
  return photoPath === currentPath || photoPath.startsWith(`${currentPath}/`);
}

export default function GalleryPage() {
  const { t } = useTranslation('gallery');
  const transition = usePageTransition();
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [allPhotos, setAllPhotos] = useState<GalleryPhoto[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadGalleryData = async () => {
      const baseUrl = import.meta.env.VITE_GALLERY_BASE_URL || 'https://storage.yandexcloud.net/photos88';

      if (!baseUrl) {
        setError(t('errors.loadGallery'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}/gallery-manifest.json`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Failed to load gallery manifest');

        const manifest: GalleryManifest = await response.json();
        setFolders(manifest.folders || []);
        setAllPhotos(
          (manifest.photos || []).map((photo) => ({
            ...photo,
            exif: {
              ...photo.exif,
              date: photo.exif.date ? new Date(photo.exif.date) : undefined,
            },
          }))
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(t('errors.loadGallery'));
        console.error('Gallery load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGalleryData();

    return () => controller.abort();
  }, [t]);

  const photos = useMemo(
    () => allPhotos.filter((photo) => matchesPath(photo.path, currentPath)),
    [allPhotos, currentPath]
  );

  return (
    <PageShell className="lg:max-w-4xl 2xl:max-w-4xl">
      <div className={`transition-all duration-300 ${transition}`}>
        <Link to="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          {t('nav.back', { ns: 'common' })}
        </Link>

        <div className="prose-landing mt-4">
          <h3>{t('title')}</h3>
          <p>{t('description')}</p>
        </div>

        <div className="mt-4 mb-6">
          <CategoryNav folders={folders} currentPath={currentPath} onSelect={setCurrentPath} />
        </div>

        {error && <p className="mb-6 text-sm text-destructive">{error}</p>}

        {loading ? (
          <SkeletonGroup className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {PHOTO_SKELETON_KEYS.map((key) => (
              <div key={key} className="space-y-1.5">
                <Skeleton variant="square" className="w-full rounded border border-border" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </SkeletonGroup>
        ) : (
          <PhotoGrid
            photos={photos}
            selectedPhoto={selectedPhoto}
            onSelectPhoto={setSelectedPhoto}
          />
        )}
      </div>
    </PageShell>
  );
}

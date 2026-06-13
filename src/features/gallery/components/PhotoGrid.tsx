import { getMotionMediaQueries } from '@/shared/lib/motion';
import ModalPortal from '@/shared/ui/ModalPortal';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { GalleryPhoto } from '../types';
import PhotoCard from './PhotoCard';
import PhotoViewer from './PhotoViewer';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface PhotoGridProps {
  photos: GalleryPhoto[];
  selectedPhoto: GalleryPhoto | null;
  onSelectPhoto: (photo: GalleryPhoto | null) => void;
}

export default function PhotoGrid({ photos, selectedPhoto, onSelectPhoto }: PhotoGridProps) {
  const { t } = useTranslation('gallery');
  const gridRef = useRef<HTMLDivElement>(null);

  const handlePhotoClick = (photo: GalleryPhoto) => {
    onSelectPhoto(photo);
  };

  const handleNavigate = (index: number) => {
    onSelectPhoto(photos[index]);
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };
        const cards = gsap.utils.toArray<HTMLElement>('[data-photo-card]');

        if (cards.length === 0) return;

        if (reduceMotion) {
          gsap.set(cards, { opacity: 1, clearProps: 'transform' });
          return;
        }

        const images = gsap.utils.toArray<HTMLElement>('[data-photo-img]');
        const hoverCleanups: Array<() => void> = [];
        for (const img of images) {
          const card = img.closest<HTMLElement>('[data-photo-card]');
          if (!card) continue;

          const scaleTo = gsap.quickTo(img, 'scale', { duration: 0.4, ease: 'power3.out' });
          const rotateTo = gsap.quickTo(img, 'rotate', { duration: 0.4, ease: 'power3.out' });

          const onEnter = () => {
            scaleTo(1.06);
            rotateTo(Math.random() > 0.5 ? 0.5 : -0.5);
          };
          const onLeave = () => {
            scaleTo(1);
            rotateTo(0);
          };

          card.addEventListener('mouseenter', onEnter);
          card.addEventListener('mouseleave', onLeave);
          hoverCleanups.push(() => {
            card.removeEventListener('mouseenter', onEnter);
            card.removeEventListener('mouseleave', onLeave);
          });
        }

        gsap.set(cards, { opacity: 0, y: 16, scale: 0.97 });

        const viewportHeight = window.innerHeight;
        const initialCards = cards.filter(
          (card) => card.getBoundingClientRect().top < viewportHeight
        );
        const restCards = cards.filter((card) => !initialCards.includes(card));

        if (initialCards.length > 0) {
          gsap.to(initialCards, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: 'power3.out',
            stagger: 0.05,
          });
        }

        if (restCards.length > 0) {
          ScrollTrigger.batch(restCards, {
            start: 'top 90%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.5,
                ease: 'power3.out',
                stagger: 0.05,
              }),
          });
        }

        return () => {
          for (const cleanup of hoverCleanups) cleanup();
          for (const img of images) gsap.set(img, { clearProps: 'all' });
        };
      });

      return () => mm.revert();
    },
    { scope: gridRef, dependencies: [photos] }
  );

  if (photos.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">{t('photoGrid.empty')}</p>
      </div>
    );
  }

  return (
    <>
      <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => (
          <PhotoCard key={photo.url} photo={photo} onClick={() => handlePhotoClick(photo)} />
        ))}
      </div>

      {selectedPhoto && (
        <ModalPortal>
          <PhotoViewer
            photo={selectedPhoto}
            allPhotos={photos}
            onClose={() => onSelectPhoto(null)}
            onNavigate={handleNavigate}
          />
        </ModalPortal>
      )}
    </>
  );
}

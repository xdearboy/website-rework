import { ExifData } from '@/lib/exif-utils';
import PhotoViewer from './PhotoViewer';
import ModalPortal from './ModalPortal';

interface Photo {
  url: string;
  name: string;
  exif: ExifData;
  description?: string;
}

interface PhotoGridProps {
  photos: Photo[];
  selectedPhoto: Photo | null;
  onSelectPhoto: (photo: Photo | null) => void;
}

export default function PhotoGrid({ photos, selectedPhoto, onSelectPhoto }: PhotoGridProps) {
  const handlePhotoClick = (photo: Photo) => {
    onSelectPhoto(photo);
  };

  const handleNavigate = (index: number) => {
    onSelectPhoto(photos[index]);
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">В этой папке нет фотографий</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.url}
            onClick={() => handlePhotoClick(photo)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border/50 hover:border-primary transition-all duration-300 hover:shadow-lg"
          >
            <img
              src={photo.thumb || photo.url}
              alt={photo.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
              <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-xs text-white truncate">{photo.name}</p>
              </div>
            </div>
          </button>
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

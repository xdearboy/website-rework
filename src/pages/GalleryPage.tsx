import FolderBrowser from '@/components/shared/FolderBrowser';
import PhotoGrid from '@/components/shared/PhotoGrid';
import { usePageTransition } from '@/hooks/usePageTransition';
import { ExifData, extractExif } from '@/lib/exif-utils';
import { useEffect, useState } from 'react';

interface Photo {
  url: string;
  name: string;
  exif: ExifData;
  description?: string;
}

interface FolderStructure {
  name: string;
  path: string;
  subfolders: FolderStructure[];
  photoCount: number;
}

export default function GalleryPage() {
  const transition = usePageTransition();
  const [folders, setFolders] = useState<FolderStructure[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    loadGalleryData();
  }, []);

  const loadGalleryData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gallery');
      if (!response.ok) throw new Error('Failed to load gallery');

      const data = await response.json();
      setFolders(data.folders || []);
      setPhotos(data.photos || []);
    } catch (err) {
      setError('Не удалось загрузить галерею');
      console.error('Gallery load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderSelect = async (path: string) => {
    setCurrentPath(path);
    try {
      const response = await fetch(`/api/gallery?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error('Failed to load folder');

      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (err) {
      setError('Не удалось загрузить папку');
      console.error('Folder load error:', err);
    }
  };

  const displayPath = currentPath === '/' ? 'Все фото' : currentPath;

  return (
    <div
      className={`min-h-screen bg-background text-foreground p-4 font-mono relative dark transition-all duration-300 ${transition}`}
      style={{ overflow: selectedPhoto ? 'hidden' : 'auto' }}
    >
      <div className="max-w-7xl mx-auto">
        <nav className="flex justify-between items-center mb-8 text-sm">
          <div className="flex space-x-6">
            <a href="/" className="text-muted-foreground hover:text-primary transition-colors">
              main
            </a>
            <span>/</span>
            <span className="text-accent">gallery</span>
          </div>
        </nav>

        <div className="mb-8">
          <h1 className="text-2xl mb-2">Галерея фотографий</h1>
          <p className="text-sm text-muted-foreground mb-3">
            Коллекция фотографий с EXIF данными и качественным отображением
          </p>
          <p className="text-xs text-muted-foreground bg-white/5 rounded px-3 py-2 inline-block">
            💡 Подсказка: нажми на фото → Shift+колесико мыши для зума, стрелки для навигации
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Загрузка галереи...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="sticky top-4">
                <h2 className="text-sm font-semibold mb-4 text-primary">Папки</h2>
                <FolderBrowser
                  folders={folders}
                  currentPath={currentPath}
                  onFolderSelect={handleFolderSelect}
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground mb-2">
                  {displayPath}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {photos.length} фотографий · Нажми на фото для просмотра
                </p>
              </div>

              <PhotoGrid
                photos={photos}
                selectedPhoto={selectedPhoto}
                onSelectPhoto={setSelectedPhoto}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

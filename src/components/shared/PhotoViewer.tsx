import { ExifData } from '@/lib/exif-utils';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import ExifPanel from './ExifPanel';

interface PhotoViewerProps {
  photo: {
    url: string;
    name: string;
    exif: ExifData;
    description?: string;
  };
  allPhotos: typeof photo[];
  onClose: () => void;
  onNavigate?: (index: number) => void;
}

export default function PhotoViewer({
  photo,
  allPhotos,
  onClose,
  onNavigate,
}: PhotoViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const currentIndex = allPhotos.findIndex((p) => p.url === photo.url);


  useEffect(() => {
    setOffsetX(0);
    setOffsetY(0);
    setZoom(1);
  }, [photo.url]);

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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          padding: 8,
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          color: 'white',
        }}
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, width: '100%', height: '100%' }}>
        {currentIndex > 0 && (
          <button
            onClick={() => onNavigate?.(currentIndex - 1)}
            style={{
              padding: 8,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              color: 'white',
            }}
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto',
            paddingBottom: 60,
          }}
          onWheel={handleWheel}
        >
          {imageError ? (
            <div style={{ color: '#f87171', textAlign: 'center' }}>
              <p style={{ marginBottom: 8 }}>Ошибка загрузки фото</p>
              <p style={{ fontSize: 12, color: '#fca5a5' }}>{photo.url}</p>
            </div>
          ) : (
            <div
              style={{
                position: 'relative',
                transform: `scale(${zoom}) translate(${offsetX / zoom}px, ${offsetY / zoom}px)`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              }}
            >
              <img
                src={photo.url}
                alt={photo.name}
                draggable={false}
                style={{
                  maxHeight: '80vh',
                  maxWidth: '80vw',
                  objectFit: 'contain',
                  display: 'block',
                }}
                onError={() => {
                  console.error('Image load failed:', photo.url);
                  setImageError(true);
                }}
              />
            </div>
          )}
        </div>

        {currentIndex < allPhotos.length - 1 && (
          <button
            onClick={() => onNavigate?.(currentIndex + 1)}
            style={{
              padding: 8,
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
              color: 'white',
            }}
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          borderRadius: 4,
          padding: '8px 12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ExifPanel exif={photo.exif} />
          </div>
          <div style={{ fontSize: '11px', color: '#999', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {currentIndex + 1} / {allPhotos.length}
          </div>
        </div>
      </div>
    </div>
  );
}

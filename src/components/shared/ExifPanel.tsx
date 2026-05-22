import { ExifData, formatExifValue } from '@/lib/exif-utils';
import { Camera } from 'lucide-react';

interface ExifPanelProps {
  exif: ExifData;
}

export default function ExifPanel({ exif }: ExifPanelProps) {
  const items = [
    exif.iso ? formatExifValue('iso', exif.iso) : null,
    exif.exposure ? formatExifValue('exposure', exif.exposure) : null,
    exif.fNumber ? formatExifValue('fNumber', exif.fNumber) : null,
    exif.focalLength ? formatExifValue('focalLength', exif.focalLength) : null,
    exif.lens,
    exif.camera,
    exif.date ? formatExifValue('date', exif.date) : null,
    exif.width && exif.height ? `${exif.width}×${exif.height}` : null,
  ].filter(Boolean);

  if (items.length === 0) {
    return (
      <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
        EXIF данные не найдены
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#ccc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      <Camera style={{ width: '14px', height: '14px', color: '#3b82f6', flexShrink: 0 }} />
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {i > 0 && <span style={{ color: '#666' }}>·</span>}
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

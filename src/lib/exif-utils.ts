import * as exifr from 'exifr';

export interface ExifData {
  iso?: number;
  exposure?: number;
  fNumber?: number;
  focalLength?: number;
  camera?: string;
  lens?: string;
  date?: Date;
  width?: number;
  height?: number;
}

export async function extractExif(file: File | Blob): Promise<ExifData> {
  try {
    const data = await exifr.parse(file);

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

export function formatExifValue(key: string, value: any): string {
  if (!value) return 'Unknown';

  switch (key) {
    case 'iso':
      return `ISO ${value}`;
    case 'exposure':
      return typeof value === 'number' ? `1/${Math.round(1 / value)}s` : `${value}s`;
    case 'fNumber':
      return `ƒ/${value}`;
    case 'focalLength':
      return `${value}mm`;
    case 'date':
      if (value instanceof Date) {
        return value.toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return String(value);
    default:
      return String(value);
  }
}

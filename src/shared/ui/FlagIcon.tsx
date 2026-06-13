import { cn } from '@/shared/lib/utils';
import flagCN from 'emoji-datasource-apple/img/apple/64/1f1e8-1f1f3.png';
import flagGB from 'emoji-datasource-apple/img/apple/64/1f1ec-1f1e7.png';
import flagRU from 'emoji-datasource-apple/img/apple/64/1f1f7-1f1fa.png';

const flagsByCode = {
  RU: flagRU,
  GB: flagGB,
  CN: flagCN,
} as const;

const countryNames: Record<string, string> = {
  RU: 'Россия',
  GB: 'Великобритания',
  CN: 'Китай',
};

export type FlagCode = keyof typeof flagsByCode;

interface FlagIconProps {
  code: FlagCode;
  className?: string;
}

export function FlagIcon({ code, className }: FlagIconProps) {
  const src = flagsByCode[code];

  if (!src) return null;

  return (
    <img
      src={src}
      alt={countryNames[code] ?? code}
      aria-label={countryNames[code] ?? code}
      className={cn('inline-block h-[1.1em] w-auto align-[-0.15em]', className)}
    />
  );
}

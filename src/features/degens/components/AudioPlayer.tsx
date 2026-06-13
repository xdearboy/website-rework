import { useTranslation } from 'react-i18next';

interface AudioPlayerProps {
  transcript?: string;
}

export function DegenAudioPlayer({ transcript }: AudioPlayerProps) {
  const { t } = useTranslation('degens');

  if (!transcript) {
    return (
      <div className="mt-1 border border-dashed border-border/60 bg-card/40 px-2.5 py-2 text-xs text-muted-foreground/80 backdrop-blur-sm">
        {t('audioPlayer.transcriptUnavailable')}
      </div>
    );
  }

  return (
    <div className="mt-1 border border-border/40 bg-card/60 px-2.5 py-2 text-xs italic leading-relaxed text-muted-foreground backdrop-blur-sm">
      "{transcript}"
    </div>
  );
}

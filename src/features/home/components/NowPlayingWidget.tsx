import { Skeleton, SkeletonGroup } from '@/shared/ui/Skeleton';
import { Music2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getBestLastFmImage } from '../lib/lastfm-client';
import { useLastFmNowPlaying } from '../useLastFmNowPlaying';

interface NowPlayingWidgetProps {
  apiKey: string;
  username: string;
}

export default function NowPlayingWidget({ apiKey, username }: NowPlayingWidgetProps) {
  const { t } = useTranslation('footer');
  const { nowPlaying, isLoading, error } = useLastFmNowPlaying({ apiKey, username });

  const cover = nowPlaying ? getBestLastFmImage(nowPlaying) : null;

  if (isLoading) {
    return (
      <SkeletonGroup className="flex items-center gap-3 text-sm">
        <Skeleton variant="square" className="size-9 shrink-0 rounded-md" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      </SkeletonGroup>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
        {cover ? (
          <img src={cover} alt="" className="size-full object-cover" />
        ) : (
          <Music2 className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{t('nowPlaying.label')}</div>
        {error || !nowPlaying ? (
          <div className="truncate text-foreground/80">{t('nowPlaying.nothingPlaying')}</div>
        ) : (
          <a
            href={nowPlaying.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-foreground hover:text-primary"
            title={`${nowPlaying.name} — ${nowPlaying.artist['#text']}`}
          >
            {nowPlaying.name} — {nowPlaying.artist['#text']}
          </a>
        )}
      </div>
    </div>
  );
}

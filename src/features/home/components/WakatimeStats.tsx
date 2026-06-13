import { getMotionMediaQueries } from '@/shared/lib/motion';
import { Skeleton, SkeletonGroup } from '@/shared/ui/Skeleton';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

gsap.registerPlugin(useGSAP);

interface WakatimeLanguage {
  name: string;
  percent: number;
}

interface WakatimeResponse {
  human_readable_total: string;
  human_readable_range: string;
  languages: WakatimeLanguage[];
}

export default function WakatimeStats() {
  const { t } = useTranslation('home');
  const [data, setData] = useState<WakatimeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/wakatime', { signal: controller.signal });
        if (!response.ok) throw new Error('Failed to fetch wakatime stats');
        const json: WakatimeResponse = await response.json();
        if (!json.languages || json.languages.length === 0) throw new Error('Empty wakatime stats');
        setData(json);
        setError(false);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(true);
          console.error('Error fetching wakatime stats:', err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchStats();
    return () => controller.abort();
  }, []);

  useGSAP(
    () => {
      if (!data) return;

      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };

        const bars = gsap.utils.toArray<HTMLElement>('[data-wakatime-bar]', containerRef.current);
        if (bars.length === 0) return;

        if (reduceMotion) {
          gsap.set(bars, { width: (i, target) => target.dataset.percent });
          return;
        }

        gsap.set(bars, { width: 0 });
        gsap.to(bars, {
          width: (i, target) => target.dataset.percent,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.06,
        });
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [data] }
  );

  if (loading) {
    return (
      <SkeletonGroup className="space-y-2 rounded-lg border border-border/60 bg-card/40 p-3 sm:p-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </SkeletonGroup>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div ref={containerRef} className="rounded-lg border border-border/60 bg-card/40 p-3 sm:p-4">
      <p className="mb-3 font-mono text-xs uppercase tracking-wide text-muted-foreground/70">
        {t('activity.wakatime.title')}
      </p>

      <p className="mb-3 text-sm text-foreground">
        {t('activity.wakatime.total', {
          total: data.human_readable_total,
          range: data.human_readable_range,
        })}
      </p>

      <div className="space-y-2">
        {data.languages.map((lang) => (
          <div key={lang.name} className="flex items-center gap-3 text-xs">
            <span className="w-24 shrink-0 truncate font-mono text-foreground">{lang.name}</span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/50">
              <div
                data-wakatime-bar
                data-percent={`${lang.percent}%`}
                className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
              />
            </div>
            <span className="w-12 shrink-0 text-right font-mono text-muted-foreground">
              {lang.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

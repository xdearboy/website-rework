import PageShell from '@/shared/layout/PageShell';
import { formatDate } from '@/shared/lib/formatDate';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { Skeleton, SkeletonGroup } from '@/shared/ui/Skeleton';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

gsap.registerPlugin(useGSAP);

interface ChangelogEntry {
  hash: string;
  date: string;
  message: string;
}

const ENTRY_SKELETON_KEYS = ['entry-1', 'entry-2', 'entry-3', 'entry-4', 'entry-5'];

export default function ChangelogPage() {
  const { t } = useTranslation('changelog');
  const containerRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch('/changelog.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch changelog: ${res.status}`);
        return res.json() as Promise<{ entries: ChangelogEntry[] }>;
      })
      .then((manifest) => setEntries(manifest.entries))
      .catch(() => setError(t('errors.loadFailed')))
      .finally(() => setLoading(false));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is defined in component, stable
  useEffect(() => {
    load();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };

        if (reduceMotion) {
          gsap.set('[data-animate]', { opacity: 1, y: 0, clearProps: 'transform' });
          return;
        }

        const introTargets = gsap.utils.toArray<HTMLElement>('[data-animate="intro"]');
        gsap.set(introTargets, { opacity: 0, y: 24 });
        gsap.to(introTargets, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
        });
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [loading, error] }
  );

  return (
    <PageShell>
      <div ref={containerRef}>
        <p data-animate="intro" className="prose-landing mb-8">
          <Link to="/">{t('nav.back', { ns: 'common' })}</Link>
        </p>

        <section data-animate="intro" className="prose-landing">
          <h3>{t('title')}</h3>
          <p>{t('subtitle')}</p>
        </section>

        <section data-animate="intro" className="mt-6">
          {error ? (
            <div className="space-y-2 text-sm sm:text-base">
              <p className="text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={load}
                className="text-primary underline underline-offset-2"
              >
                {t('status.tryAgain', { ns: 'common' })}
              </button>
            </div>
          ) : loading ? (
            <SkeletonGroup className="space-y-6">
              {ENTRY_SKELETON_KEYS.map((key) => (
                <div key={key} className="space-y-1.5">
                  <Skeleton className="h-3 w-20 sm:h-3.5 sm:w-24" />
                  <Skeleton className="h-4 w-full sm:h-[1.125rem]" />
                </div>
              ))}
            </SkeletonGroup>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground sm:text-base">{t('empty')}</p>
          ) : (
            <div className="relative border-l-2 border-border/80 ml-3 pl-6 space-y-6">
              {entries.map((entry) => (
                <div key={entry.hash} className="relative">
                  <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-card border-2 border-muted-foreground" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    {formatDate(new Date(entry.date), {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                  <p className="mt-1 text-sm text-foreground/90 sm:text-base">{entry.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

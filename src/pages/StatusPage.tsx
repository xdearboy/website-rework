import LatencyBar from '@/features/status/components/LatencyBar';
import { type StatusTarget, useStatus } from '@/features/status/useStatus';
import PageShell from '@/shared/layout/PageShell';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { TFunction } from 'i18next';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

gsap.registerPlugin(useGSAP);

const CERT_WARNING_DAYS = 14;

function Dot({ target }: { target: StatusTarget }) {
  const { t } = useTranslation('status');

  const tone = target.stale
    ? 'bg-muted-foreground'
    : target.up
      ? 'bg-emerald-400'
      : 'bg-destructive';

  const label = target.stale ? t('state.stale') : target.up ? t('state.up') : t('state.down');

  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="relative inline-flex size-2 shrink-0">
        {!target.stale && (
          <span
            className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 motion-reduce:hidden ${tone}`}
          />
        )}
        <span className={`relative inline-flex size-full rounded-full ${tone}`} />
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function Uptime({ value }: { value: number | null }) {
  const { t } = useTranslation('status');
  if (value === null) return <span className="text-muted-foreground">{t('noData')}</span>;

  const percent = value * 100;
  const text = percent >= 99.995 ? '100' : percent.toFixed(2);

  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1 w-16 overflow-hidden rounded-full bg-muted">
        <span
          className={`block h-full ${percent >= 99 ? 'bg-emerald-400' : percent >= 95 ? 'bg-primary' : 'bg-destructive'}`}
          style={{ width: `${Math.max(percent, 1)}%` }}
        />
      </span>
      <span className="tabular-nums">{text}%</span>
    </span>
  );
}

function windowLabel(days: number, t: TFunction): string {
  if (days >= 1) return t('uptime', { window: t('window.days', { count: Math.round(days) }) });
  return t('uptime', { window: t('window.hours', { count: Math.max(1, Math.round(days * 24)) }) });
}

function SiteRow({ site, windowDays }: { site: StatusTarget; windowDays: number }) {
  const { t } = useTranslation('status');

  return (
    <div className="border-border/60 border-b py-3 last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="flex items-center gap-2">
          <Dot target={site} />
          {site.url ? (
            <a href={site.url} target="_blank" rel="noopener noreferrer">
              {site.name}
            </a>
          ) : (
            <span>{site.name}</span>
          )}
        </span>

        <span className="tabular-nums text-muted-foreground text-sm">
          {site.latencyMs === null ? t('noData') : `${site.latencyMs} ${t('ms')}`}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
        <span className="inline-flex items-center gap-2">
          {windowLabel(windowDays, t)} <Uptime value={site.uptime} />
        </span>

        {site.statusCode !== null && (
          <span className="tabular-nums">
            {t('httpCode')} {site.statusCode}
          </span>
        )}

        {site.certExpiryDays !== null && (
          <span
            className={
              site.certExpiryDays <= CERT_WARNING_DAYS
                ? 'text-destructive'
                : 'text-muted-foreground'
            }
          >
            {site.certExpiryDays <= 0
              ? t('certExpired')
              : t('cert', { count: site.certExpiryDays })}
          </span>
        )}
      </div>

      {site.phases && <LatencyBar phases={site.phases} />}
    </div>
  );
}

function NodeRow({ node }: { node: StatusTarget }) {
  const { t } = useTranslation('status');

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-border/60 border-b py-2 last:border-0">
      <span className="flex min-w-0 items-center gap-2">
        <Dot target={node} />
        <span className="truncate">
          {node.locationKey ? t(`locations.${node.locationKey}`) : (node.hoster ?? node.name)}
          {node.locationKey && node.hoster && (
            <span className="ml-2 text-muted-foreground text-xs">{node.hoster}</span>
          )}
        </span>
      </span>

      <span className="flex items-center gap-4 text-sm">
        <Uptime value={node.uptime} />
        <span className="tabular-nums text-muted-foreground">
          {node.latencyMs === null ? t('noData') : `${node.latencyMs} ${t('ms')}`}
        </span>
      </span>
    </div>
  );
}

export default function StatusPage() {
  const { t } = useTranslation('status');
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, loading } = useStatus();

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
    { scope: containerRef }
  );

  const down = data?.available ? [...data.sites, ...data.nodes].filter((x) => !x.up).length : 0;

  return (
    <PageShell>
      <div ref={containerRef}>
        <p data-animate="intro" className="prose-landing mb-8">
          <Link to="/">{t('nav.back', { ns: 'common' })}</Link>
        </p>

        <section data-animate="intro" className="prose-landing">
          <h3>{t('title')}</h3>
          <p>{t('subtitle')}</p>

          {loading && <p className="text-muted-foreground text-sm">{t('loading')}</p>}

          {!loading && !data?.available && (
            <p className="text-muted-foreground text-sm">{t('unavailable')}</p>
          )}

          {data?.available && (
            <>
              <p className={down === 0 ? 'text-emerald-400' : 'text-destructive'}>
                {down === 0 ? t('allGood') : t('someDown', { count: down })}
              </p>

              <p className="mb-2">
                <strong>{t('groups.sites')}</strong>
              </p>
              <div className="mb-6 text-sm sm:text-base">
                {data.sites.map((site) => (
                  <SiteRow key={site.name} site={site} windowDays={data.windowDays} />
                ))}
              </div>

              <p className="mb-1">
                <strong>{t('groups.nodes')}</strong>
              </p>
              <p className="mb-2 text-muted-foreground text-xs">{t('nodesNote')}</p>
              <div className="mb-6 text-sm sm:text-base">
                {data.nodes.map((node) => (
                  <NodeRow key={node.name} node={node} />
                ))}
              </div>

              <p className="text-muted-foreground text-xs">{t('source')}</p>
            </>
          )}
        </section>
      </div>
    </PageShell>
  );
}

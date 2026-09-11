import { factGroups } from '@/features/facts/data';
import type { Fact } from '@/features/facts/types';
import { type LiveFacts, useLiveFacts } from '@/features/facts/useLiveFacts';
import PageShell from '@/shared/layout/PageShell';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import type { TFunction } from 'i18next';
import { Fragment, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

gsap.registerPlugin(useGSAP);

function FactValue({ fact, live, t }: { fact: Fact; live: LiveFacts; t: TFunction }) {
  const { value } = fact;

  switch (value.type) {
    case 'text':
      return <span>{value.text}</span>;

    case 'i18n':
      return <span>{t(value.key)}</span>;

    case 'link':
      return (
        <a href={value.href} target="_blank" rel="noopener noreferrer">
          {t(value.key)}
        </a>
      );

    case 'route':
      return <Link to={value.to}>{t(value.key)}</Link>;

    case 'live':
      return <span className="tabular-nums text-primary">{live.values[value.id]}</span>;

    case 'redacted':
      return (
        <span>
          <span
            aria-label={t('a11y.redacted')}
            className="select-none rounded bg-muted-foreground/40 px-1 text-transparent"
          >
            {value.mask}
          </span>{' '}
          <span className="text-muted-foreground">{t(value.key)}</span>
        </span>
      );

    case 'swatch':
      return (
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block size-3 rounded-sm border border-border"
            style={{ backgroundColor: value.hex }}
          />
          {t(value.key)} <span className="text-muted-foreground">{value.hex}</span>
        </span>
      );

    case 'meter': {
      const meter = live.meters[value.id];
      return (
        <span className="inline-flex w-full max-w-xs items-center gap-2">
          <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted-foreground/25">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${meter.percent}%` }}
            />
          </span>
          <span className="shrink-0 tabular-nums text-primary">{meter.label}</span>
        </span>
      );
    }
  }
}

export default function FactsPage() {
  const { t } = useTranslation('facts');
  const containerRef = useRef<HTMLDivElement>(null);
  const live = useLiveFacts();

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

  return (
    <PageShell>
      <div ref={containerRef}>
        <p data-animate="intro" className="prose-landing mb-8">
          <Link to="/">{t('nav.back', { ns: 'common' })}</Link>
        </p>

        <section data-animate="intro" className="prose-landing">
          <h3>{t('title')}</h3>
          <p>{t('subtitle')}</p>

          {factGroups.map((group) => (
            <div key={group.titleKey} className="mb-6">
              <p className="mb-2">
                <strong>{t(group.titleKey)}</strong>
              </p>
              <dl className="grid grid-cols-1 gap-y-1 text-sm sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-x-4 sm:text-base">
                {group.facts.map((fact) => (
                  <Fragment key={fact.labelKey}>
                    <dt className="text-muted-foreground">{t(fact.labelKey)}:</dt>
                    <dd className="mb-2 text-foreground/90 sm:mb-0">
                      <FactValue fact={fact} live={live} t={t} />
                      {fact.hintKey && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {t(fact.hintKey)}
                        </span>
                      )}
                    </dd>
                  </Fragment>
                ))}
              </dl>
            </div>
          ))}
        </section>

        <hr data-animate="intro" className="prose-landing-hr" />

        <section data-animate="intro" className="prose-landing">
          <h3>{t('networking.title')}</h3>
          <p>{t('networking.paragraph1')}</p>
          <p>{t('networking.paragraph2')}</p>
        </section>
      </div>
    </PageShell>
  );
}

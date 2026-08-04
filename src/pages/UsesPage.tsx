import { usesSections } from '@/features/uses/data';
import PageShell from '@/shared/layout/PageShell';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

gsap.registerPlugin(useGSAP);

export default function UsesPage() {
  const { t } = useTranslation('uses');
  const containerRef = useRef<HTMLDivElement>(null);

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

          {usesSections.map((section) => (
            <div key={section.titleKey}>
              <p>
                <strong>{t(section.titleKey)}</strong>
              </p>
              <ul>
                {section.items.map((item) => (
                  <li key={item.name}>
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        {item.name}
                      </a>
                    ) : (
                      item.name
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </PageShell>
  );
}

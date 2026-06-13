import PageShell from '@/shared/layout/PageShell';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

gsap.registerPlugin(ScrambleTextPlugin);

export default function NotFoundPage() {
  const { t } = useTranslation('notFound');
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

        const heading = document.querySelector<HTMLElement>('[data-animate="glitch"]');
        if (heading) {
          const original = heading.textContent ?? '404';
          const glitch = gsap.timeline({ repeat: -1, repeatDelay: 2.5, delay: 1 });
          glitch
            .to(heading, { skewX: 8, x: -3, opacity: 0.6, duration: 0.06, ease: 'power1.inOut' })
            .to(heading, { skewX: -6, x: 3, duration: 0.06, ease: 'power1.inOut' })
            .to(heading, {
              skewX: 0,
              x: 0,
              opacity: 1,
              duration: 0.08,
              ease: 'power1.inOut',
            })
            .to(heading, {
              duration: 0.4,
              ease: 'none',
              scrambleText: {
                text: original,
                chars: '01#@$%&404',
                revealDelay: 0.1,
                speed: 0.6,
              },
            });
        }

        gsap.to('[data-animate="cursor"]', {
          opacity: 0,
          duration: 0.6,
          repeat: -1,
          yoyo: true,
          ease: 'steps(1)',
        });
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <PageShell>
      <div
        ref={containerRef}
        className="flex min-h-[60vh] flex-col items-center justify-center text-center"
      >
        <h1
          data-animate="intro"
          className="font-mono text-6xl font-bold text-foreground sm:text-8xl"
        >
          <span data-animate="glitch" className="inline-block">
            404
          </span>
        </h1>
        <p data-animate="intro" className="mt-4 text-sm text-muted-foreground">
          {t('description')}
        </p>
        <p data-animate="intro" className="prose-landing mt-8">
          <Link to="/">{t('goHome')}</Link>
          <span data-animate="cursor" className="ml-1 text-primary">
            _
          </span>
        </p>
      </div>
    </PageShell>
  );
}

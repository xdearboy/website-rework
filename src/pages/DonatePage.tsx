import PageShell from '@/shared/layout/PageShell';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import ModalPortal from '@/shared/ui/ModalPortal';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface DonateOption {
  title: string;
  value: string;
  isLink?: boolean;
}

const donateOptions: DonateOption[] = [
  {
    title: 'Cloudtips',
    value: 'pay.cloudtips.ru/p/fdaea5a6',
    isLink: true,
  },
];

export default function DonatePage() {
  const { t } = useTranslation('donate');
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(text);
      setShowNotification(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => setShowNotification(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

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

  useGSAP(
    () => {
      if (!showNotification) return;

      const mm = gsap.matchMedia();
      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };
        const toast = document.querySelector<HTMLElement>('[data-animate="toast"]');
        if (!toast) return;

        if (reduceMotion) {
          gsap.set(toast, { opacity: 1, y: 0 });
          return;
        }

        gsap.fromTo(
          toast,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' }
        );
      });

      return () => mm.revert();
    },
    { dependencies: [showNotification], scope: containerRef }
  );

  return (
    <PageShell>
      <div ref={containerRef}>
        <p data-animate="intro" className="prose-landing mb-8">
          <Link to="/">{t('nav.back', { ns: 'common' })}</Link>
        </p>

        <section data-animate="intro" className="prose-landing">
          <h3>{t('title')}</h3>
          <p>
            <Trans t={t} i18nKey="paragraph1" components={{ strong: <strong /> }} />
          </p>
          <p>{t('paragraph2')}</p>

          {donateOptions.length === 0 ? (
            <p className="text-muted-foreground">{t('empty')}</p>
          ) : (
            <ul>
              {donateOptions.map((option) => (
                <li key={option.value}>
                  {option.isLink ? (
                    <a href={`https://${option.value}`} target="_blank" rel="noopener noreferrer">
                      {option.title}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(option.value)}
                      className="cursor-pointer text-foreground/90 underline underline-offset-2 decoration-gray-500 transition-colors duration-150 hover:text-primary hover:decoration-primary"
                    >
                      {option.title}
                    </button>
                  )}
                  <span className="text-muted-foreground"> — {option.value}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {showNotification && (
        <ModalPortal>
          <div
            data-animate="toast"
            className="fixed bottom-8 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 truncate rounded-md border border-border bg-card/80 px-4 py-2 text-xs font-mono text-foreground backdrop-blur-sm"
          >
            {t('copied', { address: copiedAddress })}
          </div>
        </ModalPortal>
      )}
    </PageShell>
  );
}

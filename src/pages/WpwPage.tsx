import { usePageTransition } from '@/shared/hooks/usePageTransition';
import PageShell from '@/shared/layout/PageShell';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, Heart, Info, ShieldAlert, Stethoscope } from 'lucide-react';
import { useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

gsap.registerPlugin(useGSAP, ScrollTrigger);

export default function WpwPage() {
  const { t } = useTranslation('wpw');
  const containerRef = useRef<HTMLDivElement>(null);
  const transition = usePageTransition();

  const surgeryDate = new Date('2026-08-11T00:00:00');

  const getDaysRemainingText = () => {
    const today = new Date();
    const d1 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const d2 = Date.UTC(surgeryDate.getFullYear(), surgeryDate.getMonth(), surgeryDate.getDate());
    const diffTime = d2 - d1;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return t('countdown.days', { count: diffDays });
    }
    if (diffDays === 0) {
      return t('countdown.today');
    }
    return t('countdown.passed');
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };

        if (reduceMotion) {
          gsap.set('[data-animate]', { opacity: 1, y: 0, clearProps: 'transform' });
          gsap.set('[data-hr-draw]', { scaleX: 1, clearProps: 'transform' });
          return;
        }

        gsap.set('[data-hr-draw]', { scaleX: 0, transformOrigin: 'left center' });

        const addCascade = (
          tl: gsap.core.Timeline,
          container: HTMLElement,
          pos: string | number
        ) => {
          const children = Array.from(container.children) as HTMLElement[];
          if (children.length === 0) return;
          gsap.set(children, { opacity: 0, y: 18 });
          tl.to(
            children,
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              ease: 'power3.out',
              stagger: 0.08,
            },
            pos
          );
        };

        const introTl = gsap.timeline();
        const introTargets = gsap.utils.toArray<HTMLElement>('[data-animate="intro"]');
        const normalIntro = introTargets.filter((el) => !el.matches('hr[data-hr-draw]'));
        const introHr = introTargets.find((el) => el.matches('hr[data-hr-draw]'));

        gsap.set(normalIntro, { opacity: 0, y: 24 });
        introTl.to(normalIntro, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
        });

        if (introHr) {
          introTl.to(introHr, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, '<0.2');
        }

        const revealTargets = gsap.utils.toArray<HTMLElement>('[data-animate="reveal"]');
        for (const el of revealTargets) {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          });

          if (el.matches('hr[data-hr-draw]')) {
            tl.to(el, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, 0);
          } else {
            addCascade(tl, el, 0);
          }
        }
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <PageShell>
      <div ref={containerRef} className={`transition-all duration-300 ${transition}`}>
        <p data-animate="intro" className="prose-landing mb-8">
          <Link
            to="/"
            className="text-sm text-muted-foreground underline decoration-gray-500 underline-offset-2 transition-colors duration-150 hover:text-primary hover:decoration-primary"
          >
            {t('nav.back', { ns: 'common' })}
          </Link>
        </p>

        <section data-animate="intro" className="prose-landing mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex items-center justify-center p-3 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
              <Heart className="size-8 animate-pulse text-destructive" />
              <div className="absolute inset-0 rounded-2xl bg-destructive/10 blur-md animate-ping pointer-events-none" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground sm:text-2xl mb-0">{t('title')}</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                {t('subtitle')}
              </p>
            </div>
          </div>
          <p className="text-foreground/90 text-sm sm:text-base leading-relaxed">{t('intro')}</p>
        </section>

        <hr data-animate="intro" data-hr-draw className="prose-landing-hr mt-0 mb-6" />

        <section
          data-animate="reveal"
          className="mb-6 rounded-2xl border border-border/50 bg-card/30 p-4 sm:p-5 backdrop-blur-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-24 h-24 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Activity className="size-3.5 text-primary animate-pulse" /> {t('status.title')}
          </h3>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative flex flex-col justify-between rounded-xl border border-amber-500/20 bg-amber-500/[0.02] p-4 transition-all duration-300 hover:border-amber-500/40 hover:bg-amber-500/[0.04]">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-12 h-12 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center p-1 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
                    <ShieldAlert className="size-3.5 animate-pulse" />
                  </div>
                  <h4 className="text-[11px] font-bold text-foreground leading-snug uppercase tracking-wide">
                    {t('status.waiting')}
                  </h4>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed mb-3 pl-[30px]">
                  Вторая операция аритмолога / Second Electrophysiology Ablation
                </p>
              </div>

              <div className="pl-[30px]">
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                  </span>
                  {getDaysRemainingText()}
                </div>
              </div>
            </div>

            <div className="relative flex flex-col justify-between rounded-xl border border-destructive/20 bg-destructive/[0.02] p-4 transition-all duration-300 hover:border-destructive/40 hover:bg-destructive/[0.04] overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-12 h-12 bg-destructive/5 rounded-full blur-xl pointer-events-none" />

              <div className="absolute bottom-0 right-0 w-24 h-8 opacity-25 pointer-events-none">
                <svg
                  className="w-full h-full text-destructive"
                  viewBox="0 0 100 30"
                  preserveAspectRatio="none"
                >
                  <title>ECG Line</title>
                  <path
                    d="M0,15 L25,15 L30,5 L35,25 L40,12 L45,18 L50,15 L100,15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center p-1 rounded-md bg-destructive/10 text-destructive shrink-0">
                    <Heart className="size-3.5 animate-pulse" />
                  </div>
                  <h4 className="text-[11px] font-bold text-foreground leading-snug uppercase tracking-wide">
                    {t('status.pulse')}
                  </h4>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed mb-3 pl-[30px]">
                  Остается высокий пульс в покое / High resting heart rate due to recurrence
                </p>
              </div>

              <div className="pl-[30px]">
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-destructive bg-destructive/10 border border-destructive/30 px-2.5 py-1 rounded-md uppercase tracking-wider">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/40 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive/80" />
                  </span>
                  ~90–100 bpm в покое
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr data-animate="reveal" data-hr-draw className="prose-landing-hr mt-0 mb-6" />

        <section data-animate="reveal" className="prose-landing mb-8">
          <h3 className="mb-6">{t('timeline.title')}</h3>
          <div className="relative border-l-2 border-border/80 ml-3 pl-6 space-y-8">
            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-card border-2 border-muted-foreground" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                {t('timeline.step1.date')}
              </span>
              <h4 className="text-sm font-bold text-foreground mt-1">
                {t('timeline.step1.title')}
              </h4>
              <p className="text-xs text-foreground/80 mt-1 sm:text-sm">
                {t('timeline.step1.desc')}
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 border-2 border-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wide">
                {t('timeline.step2.date')}
              </span>
              <h4 className="text-sm font-bold text-foreground mt-1">
                {t('timeline.step2.title')}
              </h4>
              <p className="text-xs text-foreground/80 mt-1 sm:text-sm">
                {t('timeline.step2.desc')}
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive/20 border-2 border-destructive" />
              <span className="text-xs font-bold text-destructive uppercase tracking-wide">
                {t('timeline.step3.date')}
              </span>
              <h4 className="text-sm font-bold text-foreground mt-1">
                {t('timeline.step3.title')}
              </h4>
              <p className="text-xs text-foreground/80 mt-1 sm:text-sm">
                {t('timeline.step3.desc')}
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 border-2 border-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wide">
                {t('timeline.step4.date')}
              </span>
              <h4 className="text-sm font-bold text-foreground mt-1">
                {t('timeline.step4.title')}
              </h4>
              <p className="text-xs text-foreground/80 mt-1 sm:text-sm">
                {t('timeline.step4.desc')}
              </p>
            </div>
          </div>
        </section>

        <hr data-animate="reveal" data-hr-draw className="prose-landing-hr mt-0 mb-6" />

        <section data-animate="reveal" className="prose-landing mb-8">
          <h3 className="mb-4 flex items-center gap-2">
            <Stethoscope className="size-5 text-primary" /> {t('procedure.title')}
          </h3>
          <p className="text-foreground/90 text-sm sm:text-base mb-6 leading-relaxed">
            {t('procedure.intro')}
          </p>
          <div className="space-y-6">
            <div className="rounded-xl border border-border/40 bg-card/10 p-4">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">✦</span> {t('procedure.step1.title')}
              </h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed sm:text-sm">
                {t('procedure.step1.desc')}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/10 p-4">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">✦</span> {t('procedure.step2.title')}
              </h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed sm:text-sm">
                {t('procedure.step2.desc')}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/10 p-4">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">✦</span> {t('procedure.step3.title')}
              </h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed sm:text-sm">
                {t('procedure.step3.desc')}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/10 p-4">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">✦</span> {t('procedure.step4.title')}
              </h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed sm:text-sm">
                {t('procedure.step4.desc')}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/10 p-4">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">✦</span> {t('procedure.step5.title')}
              </h4>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed sm:text-sm">
                {t('procedure.step5.desc')}
              </p>
            </div>
          </div>
        </section>

        <hr data-animate="reveal" data-hr-draw className="prose-landing-hr mt-0 mb-6" />

        <section data-animate="reveal" className="prose-landing space-y-4">
          <h3>{t('faq.title')}</h3>
          <div className="space-y-2">
            {[
              { key: 'attractions' },
              { key: 'sports' },
              { key: 'caffeine' },
              { key: 'cure' },
              { key: 'inherited' },
            ].map(({ key }) => (
              <details
                key={key}
                className="group border border-border/45 bg-card/15 rounded-xl p-3 [&_summary::-webkit-details-marker]:hidden transition-all duration-200 hover:border-border/80"
              >
                <summary className="flex items-center justify-between font-semibold text-xs sm:text-sm text-foreground cursor-pointer select-none">
                  <div className="flex gap-2.5 items-center">
                    <Info className="size-4 text-primary shrink-0" />
                    <span>{t(`faq.${key}.q`)}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground transition-transform duration-200 group-open:rotate-180 ml-2">
                    ▼
                  </span>
                </summary>
                <p className="text-xs text-muted-foreground mt-2 pl-6 leading-relaxed">
                  <Trans
                    t={t}
                    i18nKey={`faq.${key}.a`}
                    components={{
                      anchor: (
                        // biome-ignore lint/a11y/useAnchorContent: content is injected by Trans component
                        <a
                          href="https://pubmed.ncbi.nlm.nih.gov/36758831/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline underline"
                        />
                      ),
                    }}
                  />
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

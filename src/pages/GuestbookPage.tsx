import {
  type GuestbookEntry,
  RateLimitError,
  fetchGuestbookEntries,
  submitGuestbookEntry,
} from '@/features/guestbook/lib/guestbook-client';
import PageShell from '@/shared/layout/PageShell';
import { formatDate } from '@/shared/lib/formatDate';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { Skeleton, SkeletonGroup } from '@/shared/ui/Skeleton';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { useGSAP } from '@gsap/react';
import { zodResolver } from '@hookform/resolvers/zod';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { z } from 'zod';

gsap.registerPlugin(useGSAP);

const ENTRY_SKELETON_KEYS = ['entry-1', 'entry-2', 'entry-3'];

const INPUT_CLASS =
  'w-full rounded-lg border border-border/50 bg-card/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none sm:text-base';

export default function GuestbookPage() {
  const { t } = useTranslation('guestbook');
  const containerRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const schema = z.object({
    name: z.string().trim().min(1, t('errors.nameRequired')).max(40, t('errors.nameTooLong')),
    message: z
      .string()
      .trim()
      .min(1, t('errors.messageRequired'))
      .max(500, t('errors.messageTooLong')),
    website: z.string().optional(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', message: '', website: '' },
  });

  const load = () => {
    setLoading(true);
    setLoadError(null);
    fetchGuestbookEntries()
      .then(setEntries)
      .catch(() => setLoadError(t('errors.loadFailed')))
      .finally(() => setLoading(false));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is defined in component, stable
  useEffect(() => {
    load();
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const entry = await submitGuestbookEntry(values);
      setEntries((prev) => [entry, ...prev]);
      reset();
    } catch (err) {
      setSubmitError(
        err instanceof RateLimitError ? t('errors.rateLimited') : t('errors.submitFailed')
      );
    }
  });

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
    { scope: containerRef, dependencies: [loading, loadError] }
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
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <input
                {...register('name')}
                type="text"
                placeholder={t('form.namePlaceholder')}
                aria-label={t('form.name')}
                className={INPUT_CLASS}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div>
              <textarea
                {...register('message')}
                rows={4}
                placeholder={t('form.messagePlaceholder')}
                aria-label={t('form.message')}
                className={`${INPUT_CLASS} resize-y`}
              />
              {errors.message && (
                <p className="mt-1 text-xs text-destructive">{errors.message.message}</p>
              )}
            </div>

            <input
              {...register('website')}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('form.submitting') : t('form.submit')}
            </Button>
          </form>
        </section>

        <section data-animate="intro" className="mt-8">
          {loadError ? (
            <div className="space-y-2 text-sm sm:text-base">
              <p className="text-muted-foreground">{loadError}</p>
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
                  <Skeleton className="h-3 w-24 sm:h-3.5 sm:w-32" />
                  <Skeleton className="h-4 w-full sm:h-[1.125rem]" />
                  <Skeleton className="h-4 w-4/5 sm:h-[1.125rem]" />
                </div>
              ))}
            </SkeletonGroup>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground sm:text-base">{t('empty')}</p>
          ) : (
            <ul className="space-y-5">
              {entries.map((entry) => (
                <li key={entry.id} className="list-none">
                  <p className="mb-0.5 text-xs text-muted-foreground sm:text-sm">
                    <span className="font-bold text-foreground">{entry.name}</span>
                    {' — '}
                    {formatDate(new Date(entry.createdAt), {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-foreground/80 sm:text-base">
                    {entry.message}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}

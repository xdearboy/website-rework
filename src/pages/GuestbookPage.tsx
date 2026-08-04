import GuestbookEntryItem from '@/features/guestbook/components/GuestbookEntryItem';
import {
  type GuestbookEntry,
  RateLimitError,
  type Session,
  UnauthorizedError,
  fetchGuestbookEntries,
  fetchSession,
  logout,
  submitGuestbookEntry,
} from '@/features/guestbook/lib/guestbook-client';
import PageShell from '@/shared/layout/PageShell';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { Skeleton, SkeletonGroup } from '@/shared/ui/Skeleton';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

gsap.registerPlugin(useGSAP);

const ENTRY_SKELETON_KEYS = ['entry-1', 'entry-2', 'entry-3'];
const MAX_MESSAGE_LENGTH = 500;

const INPUT_CLASS =
  'w-full rounded-lg border border-border/50 bg-card/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none sm:text-base';

export default function GuestbookPage() {
  const { t } = useTranslation('guestbook');
  const containerRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const load = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([fetchGuestbookEntries(), fetchSession()])
      .then(([loadedEntries, loadedSession]) => {
        setEntries(loadedEntries);
        setSession(loadedSession);
      })
      .catch(() => setLoadError(t('errors.loadFailed')))
      .finally(() => setLoading(false));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is defined in component, stable
  useEffect(() => {
    load();
  }, []);

  const describeError = (err: unknown) => {
    if (err instanceof RateLimitError) return t('errors.rateLimited');
    if (err instanceof UnauthorizedError) return t('errors.unauthorized');
    return t('errors.submitFailed');
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const entry = await submitGuestbookEntry(trimmed);
      setEntries((prev) => [entry, ...prev]);
      setMessage('');
    } catch (err) {
      setSubmitError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onReply = async (event: React.FormEvent, parentId: number) => {
    event.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const reply = await submitGuestbookEntry(trimmed, parentId);
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === parentId ? { ...entry, replies: [...entry.replies, reply] } : entry
        )
      );
      setReplyText('');
      setReplyTo(null);
    } catch (err) {
      setSubmitError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onSignOut = async () => {
    await logout().catch(() => {});
    setSession((prev) => (prev ? { ...prev, user: null, isOwner: false } : prev));
  };

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

  const ownerGithubId = session?.ownerGithubId ?? null;

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
          {session?.user ? (
            <form onSubmit={onSubmit} className="space-y-3">
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                <img src={session.user.avatarUrl} alt="" className="size-5 shrink-0 rounded-full" />
                <span>
                  {t('auth.signedInAs')}{' '}
                  <span className="font-bold text-foreground">{session.user.login}</span>
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-primary underline underline-offset-2"
                >
                  {t('auth.signOut')}
                </button>
              </p>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder={t('form.messagePlaceholder')}
                aria-label={t('form.message')}
                className={`${INPUT_CLASS} resize-y`}
              />

              {submitError && (
                <Alert variant="destructive">
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={submitting || !message.trim()}>
                {submitting ? t('form.submitting') : t('form.submit')}
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground sm:text-base">{t('auth.prompt')}</p>
              <Button asChild>
                <a href="/api/auth/github">{t('auth.signIn')}</a>
              </Button>
            </div>
          )}
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
            <ul className="space-y-6">
              {entries.map((entry) => (
                <li key={entry.id} className="list-none space-y-3">
                  <GuestbookEntryItem entry={entry} ownerGithubId={ownerGithubId} />

                  {entry.replies.length > 0 && (
                    <div className="space-y-3 pl-4">
                      {entry.replies.map((reply) => (
                        <GuestbookEntryItem
                          key={reply.id}
                          entry={reply}
                          ownerGithubId={ownerGithubId}
                          isReply
                        />
                      ))}
                    </div>
                  )}

                  {session?.isOwner &&
                    (replyTo === entry.id ? (
                      <form
                        onSubmit={(event) => onReply(event, entry.id)}
                        className="space-y-2 pl-4"
                      >
                        <textarea
                          value={replyText}
                          onChange={(event) => setReplyText(event.target.value)}
                          rows={3}
                          maxLength={MAX_MESSAGE_LENGTH}
                          placeholder={t('form.replyPlaceholder')}
                          aria-label={t('form.reply')}
                          className={`${INPUT_CLASS} resize-y`}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            disabled={submitting || !replyText.trim()}
                          >
                            {submitting ? t('form.submitting') : t('form.submit')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setReplyTo(null);
                              setReplyText('');
                            }}
                          >
                            {t('form.cancel')}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTo(entry.id);
                          setReplyText('');
                        }}
                        className="pl-4 text-xs text-primary underline underline-offset-2"
                      >
                        {t('form.reply')}
                      </button>
                    ))}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}

import { DegenAudioPlayer } from '@/features/degens/components/AudioPlayer';
import { DegenContextPanel } from '@/features/degens/components/ContextPanel';
import { DegenMessageBubble } from '@/features/degens/components/MessageBubble';
import { degens } from '@/features/degens/data';
import { anonymizeMessages } from '@/features/degens/lib/anonymizeMessages';
import { decodeMojibake } from '@/features/degens/lib/decodeMojibake';
import { fetchTranscripts } from '@/features/degens/lib/fetchTranscripts';
import { parseChat } from '@/features/degens/lib/parseChat';
import type { DegenMessage } from '@/features/degens/types';
import PageShell from '@/shared/layout/PageShell';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { scrollToElement } from '@/shared/lib/smoothScroll';
import { Skeleton, SkeletonGroup } from '@/shared/ui/Skeleton';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

const MESSAGE_SKELETON_ROWS = [
  { id: 'msg-1', name: 'w-20', lines: ['w-3/4'] },
  { id: 'msg-2', name: 'w-16', lines: ['w-1/2'] },
  { id: 'msg-3', name: 'w-24', lines: ['w-full', 'w-2/3'] },
  { id: 'msg-4', name: 'w-14', lines: ['w-5/6'] },
  { id: 'msg-5', name: 'w-20', lines: ['w-full', 'w-1/3'] },
  { id: 'msg-6', name: 'w-16', lines: ['w-3/5'] },
] as const;

export default function DegensChat() {
  const { t, i18n } = useTranslation('degens');
  const { id } = useParams<{ id: string }>();
  const degen = degens.find((entry) => entry.id === id);
  const containerRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<DegenMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!degen) {
      return;
    }

    Promise.all([
      fetch(`/chats/${degen.id}/notes.json`)
        .then((response) => (response.ok ? response.json() : {}))
        .catch(() => ({})),
      fetchTranscripts(degen.id),
    ]).then(([loadedNotes, loadedTranscripts]) => {
      setNotes(
        Object.fromEntries(
          Object.entries(loadedNotes as Record<string, string>).map(([noteId, note]) => [
            noteId,
            decodeMojibake(note) ?? note,
          ])
        )
      );
      setTranscripts(loadedTranscripts);
    });
  }, [degen]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the thread is (re)loaded only when the selected degen changes; t() and state setters are stable.
  useEffect(() => {
    if (!degen) {
      return;
    }

    setLoading(true);
    setError(null);

    fetch(degen.exportPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text();
      })
      .then((html) => {
        const sortedMessages = [...parseChat(html)].sort((a, b) => {
          if (!a.timestamp && !b.timestamp) {
            return 0;
          }
          if (!a.timestamp) {
            return 1;
          }
          if (!b.timestamp) {
            return -1;
          }
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });
        const sanitizedMessages = anonymizeMessages(sortedMessages);

        setMessages(sanitizedMessages);
        setOwnerName(
          sanitizedMessages.find((message) => message.fromName && !message.isForwarded)?.fromName ??
            null
        );
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : t('chat.loadError'));
      })
      .finally(() => setLoading(false));
  }, [degen]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const match = window.location.hash.match(/^#message(.+)$/);
    if (!match) {
      return;
    }

    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      scrollToElement(document.getElementById(`message${match[1]}`), { block: 'center' });
    });
    return () => cancelAnimationFrame(id);
  }, [messages]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };

        if (reduceMotion) {
          gsap.set('[data-animate="intro"]', { opacity: 1, y: 0, clearProps: 'transform' });
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
      if (messages.length === 0) {
        return;
      }

      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };
        const messageTargets = gsap.utils.toArray<HTMLElement>('[data-animate="message"]');

        if (reduceMotion) {
          gsap.set(messageTargets, { opacity: 1, y: 0, clearProps: 'transform' });
          return;
        }

        gsap.set(messageTargets, { opacity: 0, y: 12 });
        gsap.to(messageTargets, {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.03,
        });
      });

      return () => mm.revert();
    },
    { dependencies: [messages], scope: containerRef }
  );

  if (!degen) {
    return (
      <PageShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">404</h1>
          <p className="prose-landing">
            <Link to="/degens">{t('nav.backToDegens', { ns: 'common' })}</Link>
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div ref={containerRef}>
        <p data-animate="intro" className="prose-landing mb-6">
          <Link to="/degens">{t('nav.backToDegens', { ns: 'common' })}</Link>
        </p>

        <header data-animate="intro" className="prose-landing mb-6">
          <h3 className="break-all">{degen.name}</h3>
          <p>{t('chat.description')}</p>
        </header>

        {degen.contextPath && (
          <div data-animate="intro" className="mb-6">
            <DegenContextPanel contextPath={degen.contextPath} />
          </div>
        )}

        {i18n.language === 'en' && (
          <p
            data-animate="intro"
            className="mb-6 border border-border/60 bg-card/40 px-3 py-2 text-xs text-muted-foreground backdrop-blur-sm"
          >
            {t('chat.originalLanguageNotice')}
          </p>
        )}

        <section
          data-animate="intro"
          className="mb-6 border border-border/60 bg-card/50 backdrop-blur-sm"
        >
          <div className="border-b border-border/40 px-3 py-2 text-xs font-semibold text-primary">
            {t('chat.thread')}
          </div>
          <div className="px-3 py-1">
            {loading && (
              <SkeletonGroup className="flex min-w-0 flex-col">
                {MESSAGE_SKELETON_ROWS.map((row) => (
                  <div
                    key={row.id}
                    className="min-w-0 border-b border-border/40 py-2.5 last:border-b-0"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <Skeleton className={`h-3 ${row.name}`} />
                      <Skeleton className="h-3 w-10" />
                    </div>
                    <div className="mt-1.5 space-y-1.5">
                      {row.lines.map((width) => (
                        <Skeleton key={width} className={`h-3.5 ${width}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </SkeletonGroup>
            )}

            {error && (
              <div className="border border-destructive/50 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="flex min-w-0 flex-col">
                {messages.map((message, index) => {
                  let isOwner = message.fromName === ownerName;

                  if (message.isJoined && !message.fromName) {
                    for (let i = index - 1; i >= 0; i -= 1) {
                      if (messages[i].fromName) {
                        isOwner = messages[i].fromName === ownerName;
                        break;
                      }
                    }
                  }

                  return (
                    <DegenMessageBubble
                      key={message.id}
                      message={message}
                      isOwner={isOwner}
                      replyTo={messages.find((entry) => entry.id === message.replyToId)}
                      note={notes[message.id]}
                      voiceContent={
                        message.voiceMessageHref ? (
                          <DegenAudioPlayer transcript={transcripts[message.id]} />
                        ) : undefined
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section data-animate="intro" className="prose-landing">
          <h3>{t('chat.stats.title')}</h3>
          <ul>
            <li>
              {t('chat.stats.messages')}{' '}
              <span className="text-muted-foreground">— {messages.length}</span>
            </li>
            <li>
              {t('chat.stats.voiceTranscripts')}{' '}
              <span className="text-muted-foreground">
                — {messages.filter((message) => message.voiceMessageHref).length}
              </span>
            </li>
            <li>
              {t('chat.stats.notes')}{' '}
              <span className="text-muted-foreground">— {Object.keys(notes).length}</span>
            </li>
            <li>
              {t('chat.stats.transcripts')}{' '}
              <span className="text-muted-foreground">— {Object.keys(transcripts).length}</span>
            </li>
          </ul>
        </section>
      </div>
    </PageShell>
  );
}

import { scrollToElement } from '@/shared/lib/smoothScroll';
import { cn } from '@/shared/lib/utils';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { renderMessageHtml } from '../lib/renderMessageHtml';
import type { DegenMessage } from '../types';

interface Props {
  message: DegenMessage;
  isOwner: boolean;
  replyTo: DegenMessage | undefined;
  note: string | undefined;
  voiceContent?: React.ReactNode;
}

function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function cleanName(name: string): string {
  return name.split(/\s+\d{1,2}:\d{2}/)[0].trim();
}

function scrollToMessage(messageId: string): void {
  scrollToElement(document.getElementById(`message${messageId}`), { block: 'center' });
}

export function DegenMessageBubble({ message, isOwner, replyTo, note, voiceContent }: Props) {
  const { t } = useTranslation('degens');

  if (message.type === 'service') {
    return (
      <div id={`message${message.id}`} data-animate="message" className="flex justify-center py-3">
        <span className="text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
          {message.text}
        </span>
      </div>
    );
  }

  const timeStr = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : undefined;
  const renderedMessage = message.text ? renderMessageHtml(message.text) : null;

  return (
    <div
      id={`message${message.id}`}
      data-animate="message"
      className="min-w-0 border-b border-border/40 py-2.5 [content-visibility:auto] [contain-intrinsic-size:0_120px] last:border-b-0"
    >
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2 text-xs">
        {!message.isJoined && message.fromName ? (
          <span className={cn('font-semibold', isOwner ? 'text-primary' : 'text-muted-foreground')}>
            {cleanName(message.fromName)}
          </span>
        ) : (
          <span />
        )}
        {timeStr && <span className="text-muted-foreground/70">{timeStr}</span>}
      </div>

      {message.replyToId && replyTo && (
        <button
          type="button"
          onClick={() => scrollToMessage(replyTo.id)}
          className="mt-1.5 block w-full border-l-2 border-primary/40 pl-2.5 text-left transition-colors hover:bg-primary/5"
        >
          <p className="text-[11px] font-semibold text-muted-foreground">
            {replyTo.fromName ? cleanName(replyTo.fromName) : t('message.messageFallback')}
          </p>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/80">
            {replyTo.voiceMessageHref
              ? t('message.transcript')
              : plainText(replyTo.text ?? '').slice(0, 120)}
          </p>
        </button>
      )}

      {message.isForwarded && (
        <p className="mt-1.5 text-[11px] italic text-muted-foreground/80">
          {t('message.forwardedFrom', {
            name: message.forwardedFrom ? cleanName(message.forwardedFrom) : t('message.unknown'),
          })}
        </p>
      )}

      {message.voiceMessageHref
        ? (voiceContent ?? <div data-voice-href={message.voiceMessageHref} />)
        : renderedMessage && (
            <div className="mt-1 min-w-0 space-y-2 overflow-hidden break-words text-sm leading-relaxed text-foreground/90 [&_*]:max-w-full [&_a]:break-all [&_a]:text-foreground/90 [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-gray-500 [&_a]:transition-colors [&_a]:duration-150 [&_a:hover]:text-primary [&_a:hover]:decoration-primary [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted/70 [&_code]:px-1 [&_code]:py-0.5 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:border [&_pre]:border-border/60 [&_pre]:bg-background/70 [&_pre]:p-3">
              {renderedMessage}
            </div>
          )}

      {note && (
        <div className="mt-2 border border-dashed border-border/60 bg-card/40 px-2.5 py-2 text-xs backdrop-blur-sm">
          <p className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            {t('message.note')}
          </p>
          <span className="whitespace-pre-wrap break-words leading-relaxed text-muted-foreground">
            {note}
          </span>
        </div>
      )}
    </div>
  );
}

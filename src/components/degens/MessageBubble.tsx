import type React from 'react'
import { cn } from '@/lib/utils'
import type { DegenMessage } from '@/types/degens'
import { renderMessageHtml } from '@/utils/renderMessageHtml'

interface Props {
  message: DegenMessage
  isOwner: boolean
  replyTo: DegenMessage | undefined
  note: string | undefined
  audioPlayer?: React.ReactNode
}

function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function cleanName(name: string): string {
  return name.split(/\s+\d{1,2}:\d{2}/)[0].trim()
}

function scrollToMessage(messageId: string): void {
  document.getElementById(`message${messageId}`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  })
}

export function DegenMessageBubble({
  message,
  isOwner,
  replyTo,
  note,
  audioPlayer,
}: Props) {
  if (message.type === 'service') {
    return (
      <div id={`message${message.id}`} className="flex justify-center py-4">
        <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] tracking-[0.08em] text-muted-foreground uppercase backdrop-blur-sm">
          {message.text}
        </span>
      </div>
    )
  }

  const timeStr = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : undefined
  const renderedMessage = message.text ? renderMessageHtml(message.text) : null

  return (
    <div
      id={`message${message.id}`}
      className={cn(
        'flex min-w-0 flex-col py-1 [content-visibility:auto] [contain-intrinsic-size:0_120px]',
        isOwner ? 'items-end' : 'items-start'
      )}
    >
      <div className="w-full max-w-[94%] min-w-0 space-y-1.5 sm:max-w-[82%]">
        <div
          className={cn(
            'min-w-0 rounded-2xl border px-3 pb-2.5 pt-2.5 text-sm shadow-sm backdrop-blur-sm sm:px-3.5',
            isOwner
              ? 'rounded-tr-md border-primary/20 bg-primary/12'
              : 'rounded-tl-md border-border/60 bg-background/55'
          )}
        >
          {!message.isJoined && message.fromName && (
            <p className={cn('mb-1.5 text-[11px] font-semibold tracking-[0.04em] text-primary/80', isOwner && 'text-right')}>
              {cleanName(message.fromName)}
            </p>
          )}

          {message.replyToId && replyTo && (
            <button
              type="button"
              onClick={() => scrollToMessage(replyTo.id)}
              className="mb-2.5 w-full rounded-lg border border-primary/15 bg-primary/6 px-2.5 py-2 text-left transition-colors hover:bg-primary/10"
            >
              <p className="mb-0.5 text-[11px] font-semibold tracking-[0.04em] text-primary/75">
                {replyTo.fromName ? cleanName(replyTo.fromName) : 'Сообщение'}
              </p>
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {replyTo.voiceMessageHref
                  ? 'Голосовое сообщение'
                  : plainText(replyTo.text ?? '').slice(0, 120)}
              </p>
            </button>
          )}

          {message.isForwarded && (
            <p className="mb-2 text-[11px] italic tracking-[0.04em] text-primary/65">
              Переслано от {message.forwardedFrom ? cleanName(message.forwardedFrom) : ''}
            </p>
          )}

          {message.voiceMessageHref
            ? (audioPlayer ?? <div data-voice-href={message.voiceMessageHref} />)
            : renderedMessage && (
                <div className="min-w-0 space-y-2 overflow-hidden break-words leading-relaxed text-foreground/95 [&_*]:max-w-full [&_a]:break-all [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border/70 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted/70 [&_code]:px-1 [&_code]:py-0.5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border/60 [&_pre]:bg-background/70 [&_pre]:p-3">
                  {renderedMessage}
                </div>
              )}

          {timeStr && (
            <div className="mt-2 flex justify-end">
              <span className="select-none text-[11px] tracking-[0.04em] text-muted-foreground/70">
                {timeStr}
              </span>
            </div>
          )}
        </div>

        {note && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2.5 text-xs shadow-sm backdrop-blur-sm sm:px-3.5">
            <p className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-amber-400/80 uppercase">
              note
            </p>
            <span className="whitespace-pre-wrap break-words leading-relaxed text-muted-foreground">
              {note}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

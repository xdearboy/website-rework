import { ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface Props {
  contextPath?: string
}

export function DegenContextPanel({ contextPath }: Props) {
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    if (!contextPath) {
      return
    }

    fetch(contextPath)
      .then((response) => (response.ok ? response.text() : null))
      .then((text) => setContent(text?.trim() ?? null))
      .catch(() => setContent(null))
  }, [contextPath])

  if (!content) {
    return null
  }

  return (
    <details className="min-w-0 rounded-xl border border-border/60 bg-card/45 text-sm shadow-sm backdrop-blur-sm" open>
      <summary className="flex list-none cursor-pointer items-center gap-1.5 px-4 py-3 select-none font-medium">
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
        Контекст
      </summary>

      <div className="min-w-0 space-y-2 overflow-hidden break-words px-3 pb-4 pt-1 leading-relaxed text-muted-foreground sm:px-4">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            code: ({ children, className }) =>
              className?.includes('language-') ? (
                <code className="my-2 block overflow-x-auto whitespace-pre rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs text-foreground/80">
                  {children}
                </code>
              ) : (
                <code className="rounded bg-muted/70 px-1 py-0.5 text-xs text-foreground/80">
                  {children}
                </code>
              ),
            pre: ({ children }) => <pre className="my-2">{children}</pre>,
            ul: ({ children }) => (
              <ul className="list-inside list-disc space-y-1 text-sm">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-inside list-decimal space-y-1 text-sm">{children}</ol>
            ),
            li: ({ children }) => <li className="text-sm">{children}</li>,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </details>
  )
}

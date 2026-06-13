import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';

interface Props {
  contextPath?: string;
}

export function DegenContextPanel({ contextPath }: Props) {
  const { t } = useTranslation('degens');
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    if (!contextPath) {
      return;
    }

    fetch(contextPath)
      .then((response) => (response.ok ? response.text() : null))
      .then((text) => setContent(text?.trim() ?? null))
      .catch(() => setContent(null));
  }, [contextPath]);

  if (!content) {
    return null;
  }

  return (
    <details className="border border-border/60 text-sm" open>
      <summary className="cursor-pointer list-none select-none px-3 py-2 font-semibold text-foreground">
        {t('contextPanel.context')}
      </summary>

      <div className="prose-landing min-w-0 overflow-hidden break-words border-t border-border/40 px-3 py-3">
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            ),
            code: ({ children, className }) =>
              className?.includes('language-') ? (
                <code className="my-2 block overflow-x-auto whitespace-pre rounded border border-border/60 bg-background/70 px-3 py-2 text-xs text-foreground/80">
                  {children}
                </code>
              ) : (
                <code className="rounded bg-muted/70 px-1 py-0.5 text-xs text-foreground/80">
                  {children}
                </code>
              ),
            pre: ({ children }) => <pre className="my-2">{children}</pre>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </details>
  );
}

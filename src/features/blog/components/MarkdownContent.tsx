import type { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('markup', markup);
SyntaxHighlighter.registerLanguage('html', markup);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('yml', yaml);

interface MarkdownContentProps {
  content: string;
}

type CodeProps = ComponentPropsWithoutRef<'code'>;

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose-landing">
      <ReactMarkdown
        components={{
          h1({ children }) {
            return (
              <h1 className="mb-4 mt-2 text-xl font-bold text-foreground sm:text-2xl">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="mb-3 mt-8 text-lg font-bold text-foreground sm:text-xl">{children}</h2>
            );
          },
          h4({ children }) {
            return (
              <h4 className="mb-2 mt-6 text-sm font-bold text-foreground sm:text-base">
                {children}
              </h4>
            );
          },
          ol({ children }) {
            return (
              <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-foreground/90 sm:text-base">
                {children}
              </ol>
            );
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          img({ src, alt }) {
            return (
              <img
                src={src ?? ''}
                alt={alt ?? ''}
                loading="lazy"
                className="my-6 max-w-full rounded-md border border-border"
              />
            );
          },
          table({ children }) {
            return (
              <div className="my-6 overflow-x-auto rounded-md border border-border">
                <table className="w-full text-left text-sm">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="border-b border-border text-foreground">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-border/60">{children}</tbody>;
          },
          tr({ children }) {
            return <tr>{children}</tr>;
          },
          th({ children }) {
            return <th className="px-3 py-2 font-bold">{children}</th>;
          },
          td({ children }) {
            return <td className="px-3 py-2 text-foreground/90">{children}</td>;
          },
          code(props) {
            const { className, children } = props as CodeProps;
            const match = /language-(\w+)/.exec(className ?? '');
            const rawCode = String(children).replace(/\n$/, '');

            if (!match) {
              return (
                <code className="break-words rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[0.85em] text-foreground">
                  {children}
                </code>
              );
            }

            return (
              <div className="my-6 overflow-hidden rounded-md border border-border bg-muted/60">
                <div className="border-b border-border px-4 py-1.5 text-xs text-muted-foreground">
                  {match[1]}
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    background: 'transparent',
                    fontSize: '0.8125rem',
                    overflowX: 'auto',
                    maxWidth: '100%',
                  }}
                  codeTagProps={{ style: { fontFamily: 'inherit' } }}
                >
                  {rawCode}
                </SyntaxHighlighter>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

"use client";

import type React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface MarkdownProps {
  content: string;
}

const Markdown: React.FC<MarkdownProps> = ({ content }) => {
  return (
    <div className="markdown-content font-mono">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <div className="my-8 overflow-hidden rounded-lg border border-[#9BA3D6] shadow-md">
                <div className="bg-[#1E1E1E] px-4 py-2 text-xs text-white/70 font-mono border-b border-[#9BA3D6]/30">
                  {match[1]}
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  className="!font-mono !text-sm !bg-[#1E1E1E]"
                  showLineNumbers={true}
                  wrapLines={true}
                  customStyle={{
                    margin: 0,
                    padding: "1.25rem",
                    background: "#1E1E1E",
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="bg-[#000] dark:bg-[#9BA3D6] px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          img({ src, alt }) {
            return (
              <img
                src={src || ""}
                alt={alt || ""}
                className="rounded-md max-w-full h-auto my-6 border border-[#9BA3D6] shadow-md"
              />
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5566DD] hover:text-[#3344BB] hover:underline transition-all duration-200 border-b border-[#5566DD]/30"
              >
                {children}
              </a>
            );
          },
          p({ children }) {
            return (
              <p className="mb-6 font-mono text-foreground leading-relaxed">
                {children}
              </p>
            );
          },
          h1({ children }) {
            return (
              <h1 className="text-2xl font-bold mb-6 mt-2 font-mono text-foreground pb-2 border-b border-[#472a3f]/30">
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-xl font-bold mb-4 mt-2 font-mono text-foreground pb-1 border-b border-[#472a3f]/20">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-lg font-bold mb-3 mt-6 font-mono text-foreground">
                {children}
              </h3>
            );
          },
          ul({ children }) {
            return (
              <ul className="list-disc pl-6 mb-6 font-mono text-foreground space-y-2">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal pl-6 mb-6 font-mono text-foreground space-y-2">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="font-mono text-foreground">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-accent pl-4 py-1 my-6 bg-muted/50 rounded-r-lg font-mono text-foreground italic">
                {children}
              </blockquote>
            );
          },
          hr() {
            return <hr className="my-8 border-t border-[#9BA3D6]/40" />;
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-6 rounded-lg border border-[#9BA3D6] shadow-md">
                <table className="min-w-full bg-muted/30 font-mono text-foreground">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-muted font-mono text-foreground">
                {children}
              </thead>
            );
          },
          tbody({ children }) {
            return (
              <tbody className="divide-y divide-[#9BA3D6]/30 font-mono text-foreground">
                {children}
              </tbody>
            );
          },
          tr({ children }) {
            return (
              <tr className="hover:bg-muted/20 transition-colors duration-150 font-mono text-foreground">
                {children}
              </tr>
            );
          },
          th({ children }) {
            return (
              <th className="px-4 py-3 text-left font-mono text-foreground">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-3 font-mono text-foreground">{children}</td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;

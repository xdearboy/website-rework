import type { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export default function PageShell({ children, className = '' }: PageShellProps) {
  return (
    <div className="relative min-h-screen text-foreground font-mono">
      <div
        className={`relative z-10 mx-auto w-full max-w-2xl px-4 py-12 sm:py-16 2xl:max-w-3xl ${className}`}
      >
        <div className="relative rounded-2xl bg-background/60 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}

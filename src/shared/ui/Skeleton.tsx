import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';
import { cn } from '@/shared/lib/utils';
import type React from 'react';
import { useTranslation } from 'react-i18next';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'block' | 'square';
}

export function Skeleton({ className, variant = 'block', ...props }: SkeletonProps) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-md bg-muted/60',
        variant === 'square' && 'aspect-square',
        !reduceMotion && 'animate-pulse',
        className
      )}
      {...props}
    />
  );
}

interface SkeletonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function SkeletonGroup({ className, label, children, ...props }: SkeletonGroupProps) {
  const { t } = useTranslation('common');

  return (
    // biome-ignore lint/a11y/useSemanticElements: role="status" is the intended live-region announcement for "loading"; <output> implies a calculation result, which doesn't fit a skeleton placeholder group.
    <div role="status" aria-busy="true" className={className} {...props}>
      <span className="sr-only">{label ?? t('status.loading')}</span>
      {children}
    </div>
  );
}

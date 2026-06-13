import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';
import { Suspense, lazy } from 'react';

const PixelBlast = lazy(() => import('./PixelBlast'));

export default function SiteBackground() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <>
      {prefersReducedMotion && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-fixed opacity-[0.05]"
          style={{
            backgroundImage: "url('/pattern-dots.svg')",
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />
      )}

      {!prefersReducedMotion && (
        <div className="fixed inset-0 z-0 opacity-30">
          <Suspense fallback={null}>
            <PixelBlast
              variant="circle"
              pixelSize={6}
              color="#cba6f7"
              patternScale={3}
              patternDensity={1}
              pixelSizeJitter={0.4}
              enableRipples
              rippleSpeed={0.4}
              speed={0.5}
              edgeFade={0.35}
              transparent
            />
          </Suspense>
        </div>
      )}
    </>
  );
}

import { usePrefersReducedMotion } from '@/shared/hooks/usePrefersReducedMotion';
import { useIsLowEndDevice } from '@/shared/lib/deviceCapability';
import { Suspense, lazy, useEffect, useState } from 'react';

const PixelBlast = lazy(() => import('./PixelBlast'));

export default function SiteBackground() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isLowEndDevice = useIsLowEndDevice();
  const [ready, setReady] = useState(false);

  const showStaticPattern = prefersReducedMotion || isLowEndDevice;

  useEffect(() => {
    if (showStaticPattern) return;

    if (typeof window === 'undefined') return;

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setReady(true));
      return () => window.cancelIdleCallback?.(id);
    }

    const timeout = window.setTimeout(() => setReady(true), 200);
    return () => window.clearTimeout(timeout);
  }, [showStaticPattern]);

  return (
    <>
      {showStaticPattern && (
        <div
          className="pointer-events-none fixed inset-0 z-0 bg-fixed opacity-[0.05]"
          style={{
            backgroundImage: "url('/pattern-dots.svg')",
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />
      )}

      {!showStaticPattern && (
        <div className="fixed inset-0 z-0 opacity-30">
          <Suspense fallback={null}>
            {ready && (
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
                maxPixelRatio={1}
                maxFps={40}
              />
            )}
          </Suspense>
        </div>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTransition() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  // pathname is the only dep — setVisible is stable, no need to include it
  // biome-ignore lint/correctness/useExhaustiveDependencies: setVisible is stable
  useEffect(() => {
    setVisible(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2';
}

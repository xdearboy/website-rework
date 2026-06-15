import { useState } from 'react';

export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    if (window.matchMedia?.('(pointer: coarse)').matches) return true;
  } catch {}

  try {
    if (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4)
      return true;
  } catch {}

  try {
    const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory;
    if (typeof deviceMemory === 'number' && deviceMemory <= 4) return true;
  } catch {}

  return false;
}

export function useIsLowEndDevice(): boolean {
  const [isLowEnd] = useState(() => isLowEndDevice());
  return isLowEnd;
}

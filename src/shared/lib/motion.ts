const STORAGE_KEY = 'motion';
const FORCE_VALUE = 'force';

function syncMotionOverrideFromUrl(): void {
  if (typeof window === 'undefined') return;

  try {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('motion');
    if (value === FORCE_VALUE) {
      window.localStorage.setItem(STORAGE_KEY, FORCE_VALUE);
    } else if (value !== null) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

export function isMotionForced(): boolean {
  if (typeof window === 'undefined') return false;

  syncMotionOverrideFromUrl();

  try {
    return window.localStorage.getItem(STORAGE_KEY) === FORCE_VALUE;
  } catch {
    return false;
  }
}

export function getMotionMediaQueries(): { reduceMotion: string; regular: string } {
  if (isMotionForced()) {
    return { reduceMotion: 'not all', regular: 'all' };
  }

  return {
    reduceMotion: '(prefers-reduced-motion: reduce)',
    regular: '(prefers-reduced-motion: no-preference)',
  };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  if (isMotionForced()) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

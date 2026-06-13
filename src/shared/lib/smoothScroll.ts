import gsap from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export function getSmoother(): ScrollSmoother | null {
  return ScrollSmoother.get() ?? null;
}

export function scrollToTop(smooth = false): void {
  const smoother = getSmoother();
  if (smoother) {
    smoother.scrollTo(0, smooth);
    return;
  }
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
}

export function scrollToElement(
  target: string | Element | null | undefined,
  options?: { smooth?: boolean; block?: ScrollLogicalPosition }
): void {
  if (!target) return;

  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;

  const smoother = getSmoother();
  if (smoother) {
    const position = options?.block === 'center' ? 'center center' : 'top top';
    smoother.scrollTo(el, options?.smooth ?? true, position);
    return;
  }

  el.scrollIntoView({
    behavior: options?.smooth === false ? 'auto' : 'smooth',
    block: options?.block ?? 'start',
  });
}

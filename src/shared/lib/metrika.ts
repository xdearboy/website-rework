const COUNTER_ID = 109_908_754;

type YmFunction = (counterId: number, action: string, ...args: unknown[]) => void;

function getYm(): YmFunction | undefined {
  return (window as unknown as { ym?: YmFunction }).ym;
}

export function trackPageView(url: string = location.href): void {
  getYm()?.(COUNTER_ID, 'hit', url);
}

export function reachGoal(target: string): void {
  getYm()?.(COUNTER_ID, 'reachGoal', target);
}

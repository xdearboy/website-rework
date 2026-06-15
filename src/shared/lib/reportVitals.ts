import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

interface VitalsPayload {
  name: Metric['name'];
  value: number;
  rating: Metric['rating'];
  id: string;
  navigationType: Metric['navigationType'];
  delta: number;
  path: string;
  cpu?: number;
  mem?: number;
  conn?: string;
  ua: string;
  ts: number;
}

function buildPayload(metric: Metric): VitalsPayload {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string };
  };

  return {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    delta: metric.delta,
    path: location.pathname,
    cpu: nav.hardwareConcurrency,
    mem: nav.deviceMemory,
    conn: nav.connection?.effectiveType,
    ua: nav.userAgent,
    ts: Date.now(),
  };
}

function sendVitals(metric: Metric): void {
  const payload = JSON.stringify(buildPayload(metric));

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: 'application/json' });
    if (navigator.sendBeacon('/api/vitals', blob)) return;
  }

  fetch('/api/vitals', {
    method: 'POST',
    body: payload,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  }).catch(() => {});
}

export function reportVitals(): void {
  onLCP(sendVitals);
  onINP(sendVitals);
  onCLS(sendVitals);
  onFCP(sendVitals);
  onTTFB(sendVitals);
}

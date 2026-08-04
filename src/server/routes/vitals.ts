import { Elysia, t } from 'elysia';

const VITALS_BUFFER_SIZE = 200;
const VITALS_RECENT_SIZE = 50;
const PERCENTILE = 0.75;

interface VitalsEntry {
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  navigationType: string;
  delta: number;
  path: string;
  cpu?: number;
  mem?: number;
  conn?: string;
  ua: string;
  ts: number;
}

interface VitalsPercentiles {
  LCP: number | null;
  INP: number | null;
  CLS: number | null;
  FCP: number | null;
  TTFB: number | null;
}

const vitalsBuffer: VitalsEntry[] = [];

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

function computeP75(): VitalsPercentiles {
  const byName = (name: VitalsEntry['name']) =>
    vitalsBuffer.filter((entry) => entry.name === name).map((entry) => entry.value);

  return {
    LCP: percentile(byName('LCP'), PERCENTILE),
    INP: percentile(byName('INP'), PERCENTILE),
    CLS: percentile(byName('CLS'), PERCENTILE),
    FCP: percentile(byName('FCP'), PERCENTILE),
    TTFB: percentile(byName('TTFB'), PERCENTILE),
  };
}

export const vitalsRoutes = new Elysia()
  .post(
    '/api/vitals',
    ({ body, set }) => {
      vitalsBuffer.push(body as VitalsEntry);
      if (vitalsBuffer.length > VITALS_BUFFER_SIZE) {
        vitalsBuffer.splice(0, vitalsBuffer.length - VITALS_BUFFER_SIZE);
      }
      console.log(JSON.stringify({ type: 'web-vitals', ...body }));
      set.status = 204;
    },
    { body: t.Any() }
  )
  .get('/api/vitals', () => ({
    count: vitalsBuffer.length,
    p75: computeP75(),
    recent: vitalsBuffer.slice(-VITALS_RECENT_SIZE),
  }));

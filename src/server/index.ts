import { type IncomingMessage, createServer } from 'node:http';

const WAKATIME_STATS_URL =
  'https://wakatime.com/api/v1/users/c3f485f7-8582-479b-8553-346efec978b5/stats/last_year?timeout=15';
const WAKATIME_TOP_LANGUAGES = 8;
const WAKATIME_CACHE_TTL = 60 * 60 * 1000;
const PORT = 3000;

interface CacheEntry {
  timestamp: number;
  data: WakatimeStats;
}

interface WakatimeLanguage {
  name: string;
  percent: number;
}

interface WakatimeStats {
  human_readable_total: string;
  human_readable_range: string;
  languages: WakatimeLanguage[];
}

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

const wakatimeCache = new Map<string, CacheEntry>();
const vitalsBuffer: VitalsEntry[] = [];

async function fetchWakatimeStats(): Promise<WakatimeStats> {
  const cacheKey = 'stats';
  const cached = wakatimeCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < WAKATIME_CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(WAKATIME_STATS_URL);
  if (!response.ok) {
    throw new Error(`WakaTime request failed: ${response.status}`);
  }

  const json = (await response.json()) as { data?: any };
  const data = json?.data ?? {};
  const languages: WakatimeLanguage[] = Array.isArray(data.languages)
    ? data.languages
        .slice(0, WAKATIME_TOP_LANGUAGES)
        .map((lang: any) => ({ name: lang.name, percent: lang.percent }))
    : [];

  const result: WakatimeStats = {
    human_readable_total: data.human_readable_total ?? '',
    human_readable_range: data.human_readable_range ?? '',
    languages,
  };

  wakatimeCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

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

const server = createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/wakatime') {
    try {
      const result = await fetchWakatimeStats();
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      });
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error('WakaTime API error:', err);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ human_readable_total: '', human_readable_range: '', languages: [] })
      );
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/vitals') {
    try {
      const body = await readRequestBody(req);
      const entry = JSON.parse(body) as VitalsEntry;
      vitalsBuffer.push(entry);
      if (vitalsBuffer.length > VITALS_BUFFER_SIZE) {
        vitalsBuffer.splice(0, vitalsBuffer.length - VITALS_BUFFER_SIZE);
      }
      console.log(JSON.stringify({ type: 'web-vitals', ...entry }));
    } catch (err) {
      console.error('Vitals parse error:', err);
    }
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/vitals') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        count: vitalsBuffer.length,
        p75: computeP75(),
        recent: vitalsBuffer.slice(-VITALS_RECENT_SIZE),
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

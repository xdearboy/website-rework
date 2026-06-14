import { createServer } from 'node:http';

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

const wakatimeCache = new Map<string, CacheEntry>();

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

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

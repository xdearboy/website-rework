import { Elysia } from 'elysia';

const WAKATIME_STATS_URL =
  'https://wakatime.com/api/v1/users/c3f485f7-8582-479b-8553-346efec978b5/stats/last_year?timeout=15';
const WAKATIME_TOP_LANGUAGES = 8;

interface CacheEntry {
  timestamp: number;
  data: any;
}

const wakatimeCache = new Map<string, CacheEntry>();
const WAKATIME_CACHE_TTL = 60 * 60 * 1000; // 1 hour

interface WakatimeLanguage {
  name: string;
  percent: number;
}

interface WakatimeStats {
  human_readable_total: string;
  human_readable_range: string;
  languages: WakatimeLanguage[];
}

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

  const json = await response.json();
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

const app = new Elysia().get('/api/wakatime', async ({ set }) => {
  try {
    const result = await fetchWakatimeStats();

    set.headers['Cache-Control'] = 'public, max-age=3600';
    set.headers['Content-Type'] = 'application/json';

    return result;
  } catch (err) {
    console.error('WakaTime API error:', err);
    set.status = 502;
    return { human_readable_total: '', human_readable_range: '', languages: [] };
  }
});

app.listen(3000, () => {
  console.log('API running on http://localhost:3000');
});

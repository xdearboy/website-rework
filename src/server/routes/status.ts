import { Elysia } from 'elysia';

const PROMETHEUS_URL =
  process.env.PROMETHEUS_URL ??
  'http://monitoring-kube-prometheus-prometheus.monitoring.svc.cluster.local:9090';

// blackbox probes every 60s, so anything shorter just re-reads the same scrape
const CACHE_TTL = 60 * 1000;
// asks for a month; prometheus answers with whatever history it actually kept,
// and the real depth is reported alongside so the page cannot overstate it
const UPTIME_WINDOW = '30d';
const QUERY_TIMEOUT = 5000;
// a probe that times out writes no sample, and the series drops out of an
// instant query 5 minutes later; reading the last one keeps the target listed
const LOOKBACK = '15m';
const PROBE_INTERVAL_SECONDS = 60;
const STALE_AFTER_SECONDS = 180;

// admin panels are probed too, but they have no business on a public page
const HIDDEN_HOSTS = /(^|\.)kube\.d3vo\.ru$/;

// node hostnames name the machines themselves, so only city and hoster leave the
// cluster; keys are the `node` label blackbox attaches to the icmp probes
const NODE_PLACES: Record<string, { locationKey: string | null; hoster: string }> = {
  'aeroflot-looking-glass.intezio.net': { locationKey: 'frankfurt', hoster: 'Intezio' },
  'apricot-starlite.worldwidehosting.ltd': {
    locationKey: 'frankfurt',
    hoster: 'Worldwide Hosting',
  },
  'blazehost-honix.intezio.net': { locationKey: 'poland', hoster: 'Intezio' },
  'depixel-quanta.datagio.net': { locationKey: 'germany', hoster: 'Datagio' },
  'destorm-host.datagio.net': { locationKey: 'germany', hoster: 'Datagio' },
  'metahub-huray.intezio.net': { locationKey: 'poland', hoster: 'Intezio' },
  'neogate-gamax.intezio.net': { locationKey: 'poland', hoster: 'Intezio' },
  'novabyte-byrix.intezio.net': { locationKey: 'warsaw', hoster: 'Intezio' },
  // whois for these two reports a registration country that contradicts the
  // measured latency, so the city is left out rather than guessed
  ns3250362: { locationKey: null, hoster: 'Datagio' },
  'plroot-sector.datagio.net': { locationKey: null, hoster: 'Datagio' },
  'primevault-vapro.intezio.net': { locationKey: 'tallinn', hoster: 'Intezio' },
  'vampire-emerald.intezio.net': { locationKey: 'frankfurt', hoster: 'Intezio' },
};

export interface StatusPhases {
  resolve: number | null;
  connect: number | null;
  tls: number | null;
  processing: number | null;
  transfer: number | null;
}

export interface StatusTarget {
  name: string;
  url: string | null;
  up: boolean;
  latencyMs: number | null;
  uptime: number | null;
  statusCode: number | null;
  certExpiryDays: number | null;
  phases: StatusPhases | null;
  stale: boolean;
  locationKey: string | null;
  hoster: string | null;
}

export interface StatusSummary {
  available: boolean;
  sites: StatusTarget[];
  nodes: StatusTarget[];
  windowDays: number;
  checkedAt: string | null;
}

const UNAVAILABLE: StatusSummary = {
  available: false,
  sites: [],
  nodes: [],
  windowDays: 0,
  checkedAt: null,
};

interface PromSample {
  metric: Record<string, string>;
  value: [number, string];
}

let cache: { timestamp: number; data: StatusSummary } | null = null;

async function query(expr: string): Promise<PromSample[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT);

  try {
    const response = await fetch(`${PROMETHEUS_URL}/api/v1/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ query: expr }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`Prometheus responded ${response.status}`);

    const json = (await response.json()) as {
      status: string;
      data?: { result?: PromSample[] };
    };

    if (json.status !== 'success') throw new Error('Prometheus query failed');
    return json.data?.result ?? [];
  } finally {
    clearTimeout(timer);
  }
}

function index(samples: PromSample[], labels: string[] = []): Map<string, number> {
  const map = new Map<string, number>();
  for (const sample of samples) {
    const value = Number(sample.value[1]);
    if (!Number.isFinite(value)) continue;
    const key = [sample.metric.instance, ...labels.map((l) => sample.metric[l] ?? '')].join('|');
    map.set(key, value);
  }
  return map;
}

const PHASES = ['resolve', 'connect', 'tls', 'processing', 'transfer'] as const;

function phasesFor(instance: string, byPhase: Map<string, number>): StatusPhases | null {
  const entries = PHASES.map((phase) => {
    const seconds = byPhase.get(`${instance}|${phase}`);
    return [phase, seconds === undefined ? null : Math.round(seconds * 1000)] as const;
  });

  if (entries.every(([, value]) => value === null)) return null;
  return Object.fromEntries(entries) as unknown as StatusPhases;
}

function siteName(instance: string): string {
  try {
    return new URL(instance).hostname;
  } catch {
    return instance;
  }
}

interface BuildSources {
  latency: Map<string, number>;
  uptime: Map<string, number>;
  phases: Map<string, number>;
  statusCode: Map<string, number>;
  certExpiry: Map<string, number>;
  age: Map<string, number>;
}

function build(
  samples: PromSample[],
  sources: BuildSources,
  kind: 'site' | 'node'
): StatusTarget[] {
  const { latency, uptime, phases, statusCode, certExpiry, age } = sources;
  const now = Date.now();

  const ordered =
    kind === 'node'
      ? [...samples]
          .filter((sample) => sample.metric.probe_kind === kind)
          .sort((a, b) =>
            (a.metric.node ?? a.metric.instance).localeCompare(b.metric.node ?? b.metric.instance)
          )
      : samples.filter((sample) => sample.metric.probe_kind === kind);

  return ordered
    .map((sample, position) => {
      const instance = sample.metric.instance;
      const seconds = latency.get(instance);
      const ratio = uptime.get(instance);
      const code = statusCode.get(instance);
      const expiry = certExpiry.get(instance);
      const place = kind === 'node' ? NODE_PLACES[sample.metric.node ?? ''] : undefined;

      return {
        name:
          kind === 'site' ? siteName(instance) : `node-${String(position + 1).padStart(2, '0')}`,
        url: kind === 'site' ? instance : null,
        up: sample.value[1] === '1',
        latencyMs: seconds === undefined ? null : Math.round(seconds * 1000),
        uptime: ratio === undefined ? null : ratio,
        statusCode: code === undefined || code === 0 ? null : code,
        certExpiryDays:
          expiry === undefined || expiry === 0
            ? null
            : Math.round((expiry * 1000 - now) / 86_400_000),
        phases: kind === 'site' ? phasesFor(instance, phases) : null,
        stale: (age.get(instance) ?? 0) > STALE_AFTER_SECONDS,
        locationKey: place?.locationKey ?? null,
        hoster: place?.hoster ?? null,
      };
    })
    .filter((target) => !(kind === 'site' && HIDDEN_HOSTS.test(target.name)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function loadStatus(): Promise<StatusSummary> {
  const last = (metric: string) => `last_over_time(${metric}[${LOOKBACK}])`;

  const [success, duration, uptime, phases, statusCode, certExpiry, age, depth] = await Promise.all(
    [
      query(last('probe_success')),
      query(last('probe_duration_seconds')),
      query(`avg_over_time(probe_success[${UPTIME_WINDOW}])`),
      query(last('probe_http_duration_seconds')),
      query(last('probe_http_status_code')),
      query(last('probe_ssl_earliest_cert_expiry')),
      query(`time() - max_over_time(timestamp(probe_success)[${LOOKBACK}:30s])`),
      query(`(time() - min_over_time(timestamp(probe_success)[${UPTIME_WINDOW}:1h])) / 86400`),
    ]
  );

  const historyDays = depth.reduce((max, sample) => {
    const value = Number(sample.value[1]);
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);

  const sources: BuildSources = {
    latency: index(duration),
    uptime: index(uptime),
    phases: index(phases, ['phase']),
    statusCode: index(statusCode),
    certExpiry: index(certExpiry),
    age: index(age),
  };

  return {
    available: true,
    sites: build(success, sources, 'site'),
    nodes: build(success, sources, 'node'),
    windowDays: historyDays,
    checkedAt: new Date().toISOString(),
  };
}

export const statusRoutes = new Elysia().get('/api/status', async () => {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) return cache.data;

  try {
    const data = await loadStatus();
    cache = { timestamp: Date.now(), data };
    return data;
  } catch (error) {
    console.error('Failed to load status from Prometheus:', error);
    return UNAVAILABLE;
  }
});

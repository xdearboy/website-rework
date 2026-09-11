import { useEffect, useState } from 'react';

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

// matches the server cache, so a refresh cannot land on the same scrape twice
const REFRESH_INTERVAL = 60 * 1000;

export function useStatus(): { data: StatusSummary | null; loading: boolean } {
  const [data, setData] = useState<StatusSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const load = () => {
      fetch('/api/status', { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : null))
        .then((json: StatusSummary | null) => {
          setData(json);
          setLoading(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    };

    load();
    const timer = setInterval(load, REFRESH_INTERVAL);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  return { data, loading };
}

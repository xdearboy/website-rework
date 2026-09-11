import { formatDate } from '@/shared/lib/formatDate';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OWNER_TIME_ZONE, SITE_BIRTH } from './data';
import type { LiveFactId, MeterId } from './types';

export interface Meter {
  percent: number;
  label: string;
}

export interface LiveFacts {
  values: Record<LiveFactId, string>;
  meters: Record<MeterId, Meter>;
}

const ownerClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: OWNER_TIME_ZONE,
  hourCycle: 'h23',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

function ownerTimeParts(now: Date): [number, number, number] {
  const [h, m, s] = ownerClock.format(now).split(':').map(Number);
  return [h, m, s];
}

function pad(value: number, size = 2): string {
  return String(value).padStart(size, '0');
}

// a metric day is 10 hours of 100 minutes of 100 seconds
function toMetricTime(secondsOfDay: number): string {
  const total = Math.floor((secondsOfDay / 86400) * 100000);
  const hours = Math.floor(total / 10000);
  const minutes = Math.floor(total / 100) % 100;
  const seconds = total % 100;
  return `${hours}:${pad(minutes)}:${pad(seconds)}`;
}

function yearProgress(now: Date): number {
  const year = now.getFullYear();
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  return ((now.getTime() - start) / (end - start)) * 100;
}

export function useLiveFacts(): LiveFacts {
  const { t } = useTranslation('facts');
  const [now, setNow] = useState(() => Date.now());
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    const date = new Date(now);
    const [h, m, s] = ownerTimeParts(date);
    const secondsOfDay = h * 3600 + m * 60 + s;

    const uptimeMs = now - new Date(SITE_BIRTH).getTime();
    const uptimeDays = Math.floor(uptimeMs / 86400000);
    const uptimeHours = Math.floor(uptimeMs / 3600000) % 24;
    const uptimeMinutes = Math.floor(uptimeMs / 60000) % 60;

    const sessionMs = now - mountedAt.current;
    const sessionMinutes = Math.floor(sessionMs / 60000);
    const sessionSeconds = Math.floor(sessionMs / 1000) % 60;

    const hash = __COMMIT_HASH__;
    const shortHash = hash === 'dev' ? hash : hash.slice(0, 7);
    const buildDate = formatDate(__BUILD_DATE__, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const percent = yearProgress(date);

    return {
      values: {
        localTime: `${pad(h)}:${pad(m)}:${pad(s)}`,
        metricTime: `${toMetricTime(secondsOfDay)} MT`,
        siteUptime: `${uptimeDays}${t('units.d')} ${uptimeHours}${t('units.h')} ${uptimeMinutes}${t('units.m')}`,
        sessionTime: `${pad(sessionMinutes)}:${pad(sessionSeconds)}`,
        build: `${shortHash} · ${buildDate}`,
      },
      meters: {
        yearProgress: {
          percent,
          label: `${date.getFullYear()} · ${percent.toFixed(4)}%`,
        },
      },
    };
  }, [now, t]);
}

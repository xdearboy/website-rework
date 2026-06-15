import { formatDate } from '@/shared/lib/formatDate';
import ModalPortal from '@/shared/ui/ModalPortal';
import { Skeleton, SkeletonGroup } from '@/shared/ui/Skeleton';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TooltipState {
  x: number;
  y: number;
  text: string;
}

interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

interface ContributionsResponse {
  total: Record<string, number>;
  contributions: ContributionDay[];
}

type ContributionCell = ContributionDay | { date: string; count: null; level: null };

interface MonthLabel {
  weekIndex: number;
  span: number;
  label: string;
}

const USERNAME = 'xdearboy';
const API_URL = `https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`;
const MOBILE_QUERY = '(max-width: 639px)';
const WEEKS_ON_MOBILE = 26;
const DAYS_IN_WEEK = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKDAY_LABEL_ROWS = [1, 3, 5];
const REFERENCE_SUNDAY = '2024-01-07';
const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

const LEVEL_CLASSES: Record<ContributionDay['level'], string> = {
  0: 'bg-muted/40',
  1: 'bg-primary/25',
  2: 'bg-primary/45',
  3: 'bg-primary/70',
  4: 'bg-primary',
};

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setTime(d.getTime() + days * MS_PER_DAY);
  return d.toISOString().slice(0, 10);
}

function buildWeeks(days: ContributionDay[]): ContributionCell[][] {
  if (days.length === 0) return [];

  const leadingEmpty = new Date(`${days[0].date}T00:00:00`).getDay();
  const placeholders: ContributionCell[] = Array.from({ length: leadingEmpty }, (_, i) => ({
    date: shiftDate(days[0].date, i - leadingEmpty),
    count: null,
    level: null,
  }));
  const padded: ContributionCell[] = [...placeholders, ...days];

  const weeks: ContributionCell[][] = [];
  for (let i = 0; i < padded.length; i += DAYS_IN_WEEK) {
    const week = padded.slice(i, i + DAYS_IN_WEEK);
    const lastDate = week.at(-1)?.date ?? days[0].date;
    let trailing = 1;
    while (week.length < DAYS_IN_WEEK) {
      week.push({ date: shiftDate(lastDate, trailing), count: null, level: null });
      trailing += 1;
    }
    weeks.push(week);
  }

  return weeks;
}

function buildMonthLabels(weeks: ContributionCell[][]): MonthLabel[] {
  const labels: MonthLabel[] = [];
  let lastMonth = -1;

  weeks.forEach((week, weekIndex) => {
    const date = new Date(`${week[0].date}T00:00:00`);
    const month = date.getMonth();
    if (month === lastMonth) return;
    lastMonth = month;

    labels.push({
      weekIndex,
      span: weeks.length - weekIndex,
      label: formatDate(date, { month: 'short' }),
    });
  });

  for (let i = 0; i < labels.length - 1; i++) {
    labels[i].span = labels[i + 1].weekIndex - labels[i].weekIndex;
  }

  return labels.filter((label) => label.span >= 2);
}

export default function GithubContributions() {
  const { t } = useTranslation('home');
  const [data, setData] = useState<ContributionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchContributions = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL, { signal: controller.signal });
        if (!response.ok) throw new Error('Failed to fetch github contributions');
        const json: ContributionsResponse = await response.json();
        setData(json);
        setError(false);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(true);
          console.error('Error fetching github contributions:', err);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchContributions();
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <SkeletonGroup
        label={t('activity.loading')}
        className="space-y-3 rounded-lg border border-border/60 bg-card/40 p-3 sm:p-4"
      >
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-[110px] w-full" />
      </SkeletonGroup>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-border/60 bg-card/40 p-3 sm:p-4">
        <p className="text-sm text-muted-foreground">{t('activity.error')}</p>
      </div>
    );
  }

  const weeks = buildWeeks(data.contributions);
  const visibleWeeks = isMobile ? weeks.slice(-WEEKS_ON_MOBILE) : weeks;
  const monthLabels = buildMonthLabels(visibleWeeks);
  const total = data.total.lastYear ?? 0;
  const gridColumns = `repeat(${visibleWeeks.length}, minmax(0, 1fr))`;

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3 sm:p-4">
      <p className="mb-3 font-mono text-xs uppercase tracking-wide text-muted-foreground/70">
        {t('activity.github')}
      </p>

      <div className="overflow-hidden">
        <div
          className="mb-1 grid"
          style={{ gridTemplateColumns: `20px ${gridColumns}` }}
          aria-hidden="true"
        >
          <span />
          {monthLabels.map((month) => (
            <span
              key={month.weekIndex}
              className="truncate font-mono text-[10px] text-muted-foreground/60"
              style={{ gridColumn: `${month.weekIndex + 2} / span ${month.span}` }}
            >
              {month.label}
            </span>
          ))}
        </div>

        <div
          className="grid gap-[2px]"
          style={{
            gridTemplateColumns: `20px ${gridColumns}`,
            gridTemplateRows: 'repeat(7, auto)',
            gridAutoFlow: 'column',
          }}
          role="img"
          aria-label={t('activity.contributions', { count: total })}
        >
          {WEEKDAYS.map((day, i) => (
            <span
              key={day}
              aria-hidden="true"
              className="flex items-center font-mono text-[10px] text-muted-foreground/60"
              style={{ gridColumn: 1, gridRow: i + 1 }}
            >
              {WEEKDAY_LABEL_ROWS.includes(i)
                ? formatDate(shiftDate(REFERENCE_SUNDAY, i), { weekday: 'short' })
                : ''}
            </span>
          ))}

          {visibleWeeks.map((week) =>
            week.map((day) =>
              day.level === null ? (
                <div key={day.date} className="aspect-square rounded-[2px]" />
              ) : (
                <div
                  key={day.date}
                  aria-label={t('activity.tooltip', {
                    count: day.count,
                    date: formatDate(day.date, { day: 'numeric', month: 'long', year: 'numeric' }),
                  })}
                  onMouseEnter={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                      text: t('activity.tooltip', {
                        count: day.count,
                        date: formatDate(day.date, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }),
                      }),
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  className={`aspect-square rounded-[2px] transition-transform hover:scale-125 ${LEVEL_CLASSES[day.level]}`}
                />
              )
            )
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{t('activity.contributions', { count: total })}</span>
        <div className="flex items-center gap-1.5">
          <span>{t('activity.legend.less')}</span>
          <div className="flex items-center gap-[2px]">
            {([0, 1, 2, 3, 4] as const).map((level) => (
              <div key={level} className={`size-[10px] rounded-[2px] ${LEVEL_CLASSES[level]}`} />
            ))}
          </div>
          <span>{t('activity.legend.more')}</span>
        </div>
      </div>

      {tooltip && (
        <ModalPortal>
          <div
            className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-card px-2 py-1 font-mono text-xs whitespace-nowrap text-foreground shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y - 6 }}
          >
            {tooltip.text}
          </div>
        </ModalPortal>
      )}
    </div>
  );
}

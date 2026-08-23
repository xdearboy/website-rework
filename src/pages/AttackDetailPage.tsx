import PageShell from '@/shared/layout/PageShell';
import {
  flagEmoji,
  formatBytes,
  formatCompact,
  formatCount,
  formatDuration,
  severityColor,
} from '@/shared/lib/defense';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

interface TopIp {
  ip: string;
  count: number;
  countryCode?: string | null;
  countryName?: string | null;
  asn?: string | null;
}
interface TopCountry {
  code?: string | null;
  name?: string | null;
  count: number;
}
interface TopAsn {
  asn: string;
  count: number;
}
interface TopUa {
  ua: string;
  count: number;
}
interface TopPath {
  path: string;
  count: number;
}
interface StatusCode {
  code: string | number;
  count: number;
}
interface DropReason {
  reason: string;
  count: number;
  kpps?: number | null;
  mbps?: number | null;
}

interface Attack {
  id: number;
  target: string;
  signature: string | null;
  layer: string | null;
  severity: string | null;
  startedAt: string;
  endedAt: string | null;
  peakRps: number | null;
  totalRequests: number | null;
  blocked: number | null;
  passed: number | null;
  mitigationPct: number | null;
  uniqueIps: number | null;
  countries: number | null;
  asns: number | null;
  rxBytes: number | null;
  txBytes: number | null;
  bandwidthMbps: number | null;
  pps: number | null;
  topIps: TopIp[];
  topCountries: TopCountry[];
  topAsns: TopAsn[];
  topUas: TopUa[];
  topPaths: TopPath[];
  statusCodes: StatusCode[];
  reasons: DropReason[];
}

export default function AttackDetailPage() {
  const { i18n } = useTranslation();
  const isRu = i18n.language?.startsWith('ru');
  const { id } = useParams<{ id: string }>();

  const [attack, setAttack] = useState<Attack | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/attacks/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((data) => {
        setAttack(data);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(isRu ? 'ru-RU' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });

  return (
    <PageShell>
      <div className="w-full max-w-2xl sm:max-w-4xl mx-auto">
        <p className="prose-landing mb-6">
          <Link to="/attacks" className="hover:text-primary transition-colors">
            {isRu ? '← К отчётам' : '← Back to reports'}
          </Link>
        </p>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-xs font-mono">
              {isRu ? 'Загрузка отчёта...' : 'Loading report...'}
            </p>
          </div>
        ) : notFound || !attack ? (
          <div className="py-12 text-center rounded-md border border-border bg-card/10">
            <p className="text-foreground/80 text-sm font-bold">
              {isRu ? 'Отчёт не найден' : 'Report not found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* header */}
            <div className="rounded-md border border-border bg-card/10 backdrop-blur-sm p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="m-0 text-foreground font-bold text-base">{attack.target}</h3>
                    {attack.severity && (
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${severityColor(attack.severity)}`}
                      >
                        {attack.severity.toUpperCase()}
                      </span>
                    )}
                    {attack.layer && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary/30 text-muted-foreground border border-border">
                        {attack.layer.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-[11px] font-mono mt-2">
                    {attack.signature || (isRu ? 'HTTP-флуд' : 'HTTP flood')}
                  </p>
                  <p className="text-muted-foreground/70 text-[11px] font-mono mt-1">
                    {fmtDate(attack.startedAt)} →{' '}
                    {attack.endedAt ? fmtDate(attack.endedAt) : isRu ? 'идёт' : 'ongoing'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-mono text-foreground leading-none">
                    {formatCompact(attack.peakRps)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {isRu ? 'пиковый RPS' : 'peak RPS'}
                  </p>
                </div>
              </div>
            </div>

            {/* key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                label={isRu ? 'Длительность' : 'Duration'}
                value={formatDuration(attack.startedAt, attack.endedAt)}
              />
              <StatCard
                label={isRu ? 'Всего запросов' : 'Total requests'}
                value={formatCompact(attack.totalRequests)}
              />
              <StatCard
                label={isRu ? 'Уникальных IP' : 'Unique IPs'}
                value={formatCount(attack.uniqueIps)}
              />
              <StatCard
                label={isRu ? 'Эффективность' : 'Mitigation'}
                value={attack.mitigationPct === null ? '—' : `${attack.mitigationPct.toFixed(1)}%`}
                accent
              />
              <StatCard
                label={isRu ? 'Стран' : 'Countries'}
                value={formatCount(attack.countries)}
              />
              <StatCard label="ASN" value={formatCount(attack.asns)} />
              <StatCard
                label={isRu ? 'Полоса' : 'Bandwidth'}
                value={attack.bandwidthMbps ? `${attack.bandwidthMbps.toFixed(0)} Mbps` : '—'}
              />
              <StatCard label="PPS" value={formatCompact(attack.pps)} />
            </div>

            {/* mitigation bar */}
            {(attack.blocked !== null || attack.passed !== null) && (
              <Panel title={isRu ? 'Фильтрация запросов' : 'Request filtering'}>
                <MitigationBar
                  blocked={attack.blocked ?? 0}
                  passed={attack.passed ?? 0}
                  isRu={isRu}
                />
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                  <MiniStat
                    label={isRu ? 'Отбито' : 'Blocked'}
                    value={formatCompact(attack.blocked)}
                    tone="destructive"
                  />
                  <MiniStat
                    label={isRu ? 'Пропущено' : 'Passed'}
                    value={formatCompact(attack.passed)}
                    tone="chart-5"
                  />
                  <MiniStat
                    label="RX / TX"
                    value={`${formatBytes(attack.rxBytes)} / ${formatBytes(attack.txBytes)}`}
                  />
                </div>
              </Panel>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {attack.topIps?.length > 0 && (
                <Panel title={isRu ? 'Топ IP-источников' : 'Top source IPs'}>
                  <BarList
                    items={attack.topIps.slice(0, 12).map((x) => ({
                      label: `${flagEmoji(x.countryCode)} ${x.ip}`,
                      sub: x.asn || x.countryName || '',
                      value: x.count,
                    }))}
                  />
                </Panel>
              )}
              {attack.topCountries?.length > 0 && (
                <Panel title={isRu ? 'География' : 'Geography'}>
                  <BarList
                    items={attack.topCountries.slice(0, 12).map((x) => ({
                      label: `${flagEmoji(x.code)} ${x.name || x.code || '—'}`,
                      value: x.count,
                    }))}
                  />
                </Panel>
              )}
              {attack.topAsns?.length > 0 && (
                <Panel title={isRu ? 'Автономные системы' : 'Networks (ASN)'}>
                  <BarList
                    items={attack.topAsns
                      .slice(0, 12)
                      .map((x) => ({ label: x.asn, value: x.count }))}
                  />
                </Panel>
              )}
              {attack.topUas?.length > 0 && (
                <Panel title="User-Agent">
                  <BarList
                    items={attack.topUas
                      .slice(0, 10)
                      .map((x) => ({ label: x.ua, value: x.count, mono: true }))}
                  />
                </Panel>
              )}
              {attack.topPaths?.length > 0 && (
                <Panel title={isRu ? 'Запрашиваемые пути' : 'Targeted paths'}>
                  <BarList
                    items={attack.topPaths
                      .slice(0, 10)
                      .map((x) => ({ label: x.path, value: x.count, mono: true }))}
                  />
                </Panel>
              )}
              {attack.reasons?.length > 0 && (
                <Panel title={isRu ? 'Причины дропа' : 'Drop reasons'}>
                  <BarList
                    items={attack.reasons.slice(0, 10).map((x) => ({
                      label: x.reason,
                      sub: [x.kpps ? `${x.kpps} kpps` : '', x.mbps ? `${x.mbps} Mbit/s` : '']
                        .filter(Boolean)
                        .join(' · '),
                      value: x.count,
                    }))}
                  />
                </Panel>
              )}
              {attack.statusCodes?.length > 0 && (
                <Panel title={isRu ? 'HTTP-коды' : 'Status codes'}>
                  <div className="divide-y divide-border/50">
                    {attack.statusCodes.map((s) => (
                      <div key={String(s.code)} className="flex items-center justify-between py-2">
                        <span className="font-mono text-xs text-foreground/80 rounded border border-border px-1.5 py-0.5">
                          {s.code}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {formatCount(s.count)}
                        </span>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card/10 backdrop-blur-sm px-4 py-3">
      <p className="text-[8px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 font-mono text-sm ${accent ? 'text-primary' : 'text-foreground/90'}`}>
        {value}
      </p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card/10 backdrop-blur-sm overflow-hidden">
      <div className="border-b border-border/60 px-4 py-3">
        <h4 className="m-0 text-[11px] font-bold text-foreground/80">{title}</h4>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'destructive' | 'chart-5';
}) {
  const color =
    tone === 'destructive'
      ? 'text-destructive'
      : tone === 'chart-5'
        ? 'text-chart-5'
        : 'text-foreground/90';
  return (
    <div className="rounded bg-card/20 border border-border/60 py-2">
      <p className={`font-mono text-xs ${color}`}>{value}</p>
      <p className="text-[8px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function MitigationBar({
  blocked,
  passed,
  isRu,
}: { blocked: number; passed: number; isRu: boolean }) {
  const total = blocked + passed;
  const blockedPct = total > 0 ? (blocked / total) * 100 : 0;
  const passedPct = 100 - blockedPct;
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary/30">
        <div className="h-full bg-destructive/70" style={{ width: `${blockedPct}%` }} />
        <div className="h-full bg-chart-5/70" style={{ width: `${passedPct}%` }} />
      </div>
      <div className="flex justify-between mt-2 text-[10px] font-mono text-muted-foreground">
        <span>
          {isRu ? 'отбито' : 'blocked'} {blockedPct.toFixed(1)}%
        </span>
        <span>
          {isRu ? 'пропущено' : 'passed'} {passedPct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

interface BarItem {
  label: string;
  sub?: string;
  value: number;
  mono?: boolean;
}

function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-2">
      {items.map((it, idx) => (
        <div key={`${it.label}-${idx}`} className="relative">
          <div
            className="absolute inset-y-0 left-0 rounded bg-primary/10"
            style={{ width: `${(it.value / max) * 100}%` }}
          />
          <div className="relative flex items-center justify-between gap-3 px-2 py-1.5">
            <div className="min-w-0">
              <p
                className={`truncate text-[11px] text-foreground/85 ${it.mono ? 'font-mono' : ''}`}
                title={it.label}
              >
                {it.label}
              </p>
              {it.sub && <p className="truncate text-[9px] text-muted-foreground">{it.sub}</p>}
            </div>
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
              {it.value.toLocaleString('en-US').replace(/,/g, ' ')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

import PageShell from '@/shared/layout/PageShell';
import { formatCompact, formatCount, formatDuration, severityColor } from '@/shared/lib/defense';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import AbuseBadge from '@/shared/ui/AbuseBadge';
import { useGSAP } from '@gsap/react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import gsap from 'gsap';
import { Activity, Shield } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

gsap.registerPlugin(useGSAP);

interface AttackSummary {
  id: number;
  target: string;
  signature: string | null;
  layer: string | null;
  severity: string | null;
  startedAt: string;
  endedAt: string | null;
  peakRps: number | null;
  totalRequests: number | null;
  mitigationPct: number | null;
  uniqueIps: number | null;
}

export default function AttacksPage() {
  const { i18n } = useTranslation();
  const isRu = i18n.language?.startsWith('ru');
  const containerRef = useRef<HTMLDivElement>(null);

  const [attacks, setAttacks] = useState<AttackSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/attacks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAttacks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load attacks:', err);
        setLoading(false);
      });
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };
        if (reduceMotion) {
          gsap.set('[data-animate]', { opacity: 1, y: 0, clearProps: 'transform' });
          return;
        }
        const targets = gsap.utils.toArray<HTMLElement>('[data-animate="intro"]');
        gsap.set(targets, { opacity: 0, y: 24 });
        gsap.to(targets, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1 });
      });
      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <PageShell>
      <div ref={containerRef} className="w-full max-w-2xl sm:max-w-4xl mx-auto">
        <p data-animate="intro" className="prose-landing mb-8">
          <Link to="/" className="hover:text-primary transition-colors">
            {isRu ? '← Назад' : '← Back'}
          </Link>
        </p>

        <section data-animate="intro" className="prose-landing mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-destructive animate-pulse" />
            <h3 className="m-0 text-foreground font-bold">d3vo_attack_reports</h3>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 leading-relaxed">
            {isRu
              ? 'Отчёты о DDoS-атаках, отражённых кластером: сила, длительность, эффективность фильтрации и источники.'
              : 'Reports of DDoS attacks mitigated by the cluster: strength, duration, filtering efficiency and sources.'}
          </p>
          <p className="text-muted-foreground/70 text-[11px] mt-2 font-mono">
            <Link to="/blocked" className="hover:text-primary transition-colors">
              {isRu ? '→ база заблокированных IP' : '→ blocked IP database'}
            </Link>
          </p>
        </section>

        {loading ? (
          <div className="py-16 text-center" data-animate="intro">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-xs font-mono">
              {isRu ? 'Загрузка отчётов...' : 'Loading reports...'}
            </p>
          </div>
        ) : attacks.length === 0 ? (
          <div
            data-animate="intro"
            className="py-12 text-center rounded-md border border-border bg-card/10"
          >
            <Activity className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-foreground/80 text-xs font-bold">
              {isRu ? 'Атак не зафиксировано' : 'No attacks recorded'}
            </p>
            <p className="text-muted-foreground text-[10px] mt-1">
              {isRu ? 'Пока тихо.' : 'All quiet for now.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {attacks.map((a) => (
              <Link
                key={a.id}
                to={`/attacks/${a.id}`}
                data-animate="intro"
                className="group block rounded-md border border-border bg-card/10 hover:bg-card/20 hover:border-primary/40 backdrop-blur-sm transition-colors p-4"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-foreground font-semibold text-sm truncate">
                        {a.target}
                      </span>
                      {a.severity && (
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${severityColor(a.severity)}`}
                        >
                          {a.severity.toUpperCase()}
                        </span>
                      )}
                      {a.layer && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary/30 text-muted-foreground border border-border">
                          {a.layer.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-[11px] font-mono mt-1">
                      {a.signature || (isRu ? 'HTTP-флуд' : 'HTTP flood')} ·{' '}
                      {formatDistanceToNow(new Date(a.startedAt), {
                        addSuffix: true,
                        locale: isRu ? ru : enUS,
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-mono text-foreground leading-none">
                      {formatCompact(a.peakRps)}
                      <span className="text-[10px] text-muted-foreground ml-1">RPS</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {isRu ? 'пик' : 'peak'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <Stat
                    label={isRu ? 'Длительность' : 'Duration'}
                    value={formatDuration(a.startedAt, a.endedAt)}
                  />
                  <Stat
                    label={isRu ? 'Запросов' : 'Requests'}
                    value={formatCompact(a.totalRequests)}
                  />
                  <Stat label={isRu ? 'Уник. IP' : 'Unique IPs'} value={formatCount(a.uniqueIps)} />
                  <Stat
                    label={isRu ? 'Отбито' : 'Mitigated'}
                    value={a.mitigationPct === null ? '—' : `${a.mitigationPct.toFixed(1)}%`}
                    accent
                  />
                </div>
              </Link>
            ))}
          </div>
        )}

        <AbuseBadge />
      </div>
    </PageShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded bg-card/20 border border-border/60 py-2 px-1">
      <p className={`font-mono text-xs ${accent ? 'text-primary' : 'text-foreground/90'}`}>
        {value}
      </p>
      <p className="text-[8px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

import PageShell from '@/shared/layout/PageShell';
import { categoryTags, flagEmoji, formatCompact } from '@/shared/lib/defense';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import AbuseBadge from '@/shared/ui/AbuseBadge';
import { useGSAP } from '@gsap/react';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ru } from 'date-fns/locale';
import gsap from 'gsap';
import { Download, Info, Search, Shield } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

gsap.registerPlugin(useGSAP);

interface BlockedIp {
  id: number;
  ip: string;
  reason: string;
  port: number | null;
  category: string | null;
  source: string | null;
  asn: string | null;
  node: string | null;
  hits: number;
  peakRps: number | null;
  countryCode: string | null;
  countryName: string | null;
  createdAt: string;
  lastSeen: string;
}

export default function BlockedPage() {
  const { i18n } = useTranslation();
  const isRu = i18n.language?.startsWith('ru');
  const containerRef = useRef<HTMLDivElement>(null);

  const [blockedList, setBlockedList] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/blocked')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setBlockedList(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load blocked IPs:', err);
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
        const introTargets = gsap.utils.toArray<HTMLElement>('[data-animate="intro"]');
        gsap.set(introTargets, { opacity: 0, y: 24 });
        gsap.to(introTargets, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
        });
      });
      return () => mm.revert();
    },
    { scope: containerRef }
  );

  const filteredList = blockedList.filter(
    (item) =>
      item.ip.includes(searchQuery) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.countryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.asn?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageShell>
      <div ref={containerRef} className="w-full max-w-2xl sm:max-w-5xl mx-auto">
        <p data-animate="intro" className="prose-landing mb-8">
          <Link to="/" className="hover:text-primary transition-colors">
            {isRu ? '← Назад' : '← Back'}
          </Link>
        </p>

        <section data-animate="intro" className="prose-landing mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-destructive animate-pulse" />
            <h3 className="m-0 text-foreground font-bold">d3vo_defense_logs</h3>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 leading-relaxed">
            {isRu
              ? 'База IP-адресов, заблокированных узлами кластера за сканирование, DDoS-атаки или некорректную сетевую активность.'
              : 'Database of IP addresses blocked by cluster nodes for scanning, DDoS attacks or invalid network activity.'}
          </p>
          <p className="text-muted-foreground/70 text-[11px] mt-2 font-mono">
            <Link to="/attacks" className="hover:text-primary transition-colors">
              {isRu ? '→ отчёты об атаках' : '→ attack reports'}
            </Link>
          </p>
        </section>

        <div data-animate="intro" className="space-y-3 mb-6">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>{isRu ? 'Экспорт базы:' : 'Export database:'}</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              {['json', 'csv', 'txt'].map((fmt) => (
                <a
                  key={fmt}
                  href={`/api/blocked/export?format=${fmt}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-card/20 border border-border text-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  {fmt === 'txt' ? 'TXT (IP list)' : fmt.toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={
                isRu
                  ? 'Поиск по IP, причине, стране, ASN...'
                  : 'Search by IP, reason, country, ASN...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card/20 border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 transition-colors text-xs font-mono"
            />
          </div>
        </div>

        <div
          data-animate="intro"
          className="overflow-x-auto rounded-md border border-border bg-card/10 backdrop-blur-sm"
        >
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground text-xs font-mono">
                {isRu ? 'Загрузка логов...' : 'Loading logs...'}
              </p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 text-center prose-landing">
              <Info className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-foreground/80 text-xs font-bold">
                {isRu ? 'Атак не обнаружено' : 'No attacks detected'}
              </p>
              <p className="text-muted-foreground text-[10px] mt-1">
                {isRu ? 'Список пуст.' : 'Log is empty.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-border bg-card/25 text-muted-foreground font-bold">
                  <th className="py-2.5 px-3">{isRu ? 'IP Адрес' : 'IP Address'}</th>
                  <th className="py-2.5 px-3 hidden lg:table-cell">ASN</th>
                  <th className="py-2.5 px-3 hidden md:table-cell">
                    {isRu ? 'Последний раз' : 'Last seen'}
                  </th>
                  <th className="py-2.5 px-3 hidden sm:table-cell text-right">
                    {isRu ? 'Попаданий' : 'Hits'}
                  </th>
                  <th className="py-2.5 px-3">{isRu ? 'Детали' : 'Details'}</th>
                  <th className="py-2.5 px-3 text-right">{isRu ? 'Тип' : 'Tags'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-card/20 transition-colors text-foreground/90"
                  >
                    <td className="py-3 px-3 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm" title={item.countryName ?? 'Unknown'}>
                          {flagEmoji(item.countryCode)}
                        </span>
                        <span className="text-foreground">{item.ip}</span>
                        {item.port && (
                          <span className="text-[9px] bg-secondary/35 text-muted-foreground px-1 py-0.5 rounded">
                            :{item.port}
                          </span>
                        )}
                      </div>
                      <div className="md:hidden text-[9px] text-muted-foreground mt-0.5">
                        {item.countryName ?? 'Unknown'} ·{' '}
                        {formatDistanceToNow(new Date(item.lastSeen), {
                          addSuffix: true,
                          locale: isRu ? ru : enUS,
                        })}
                      </div>
                    </td>

                    <td
                      className="py-3 px-3 hidden lg:table-cell text-muted-foreground max-w-[160px] truncate"
                      title={item.asn ?? ''}
                    >
                      {item.asn ?? <span className="text-muted-foreground/40">—</span>}
                    </td>

                    <td className="py-3 px-3 hidden md:table-cell text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(item.lastSeen), {
                        addSuffix: true,
                        locale: isRu ? ru : enUS,
                      })}
                    </td>

                    <td className="py-3 px-3 hidden sm:table-cell text-right text-muted-foreground">
                      {item.hits > 1 ? (
                        <span className="text-foreground/80">×{formatCompact(item.hits)}</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                      {item.peakRps ? (
                        <span className="block text-[9px] text-muted-foreground/70">
                          {formatCompact(item.peakRps)} rps
                        </span>
                      ) : null}
                    </td>

                    <td
                      className="py-3 px-3 max-w-[150px] sm:max-w-xs truncate text-foreground/80"
                      title={item.reason}
                    >
                      {item.reason}
                      {item.source && (
                        <span className="block text-[9px] text-muted-foreground/60">
                          {item.source}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        {categoryTags(item.reason, item.category, item.port, isRu).map((tag) => (
                          <span
                            key={tag.label}
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${tag.color}`}
                          >
                            {tag.label}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <AbuseBadge />
      </div>
    </PageShell>
  );
}

export function flagEmoji(countryCode: string | null | undefined): string {
  if (!countryCode) return '🏴‍☠️';
  try {
    const points = countryCode
      .toUpperCase()
      .split('')
      .map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...points);
  } catch {
    return '🏴‍☠️';
  }
}

export function formatCount(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('en-US').replace(/,/g, ' ');
}

export function formatCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function formatBytes(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatDuration(startISO: string, endISO: string | null): string {
  const start = new Date(startISO).getTime();
  const end = endISO ? new Date(endISO).getTime() : Date.now();
  let s = Math.max(0, Math.round((end - start) / 1000));
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}ч`);
  if (m) parts.push(`${m}м`);
  parts.push(`${s}с`);
  return parts.join(' ');
}

export interface Tag {
  label: string;
  color: string;
}

const TAG_DESTRUCTIVE = 'bg-destructive/15 text-destructive border border-destructive/30';
const TAG_PRIMARY = 'bg-primary/10 text-primary border border-primary/20';
const TAG_MUTED = 'bg-secondary/15 text-foreground/80 border border-border';

export function categoryTags(
  reason: string,
  category: string | null | undefined,
  port: number | null | undefined,
  isRu: boolean
): Tag[] {
  const tags: Tag[] = [];
  const r = `${category ?? ''} ${reason}`.toLowerCase();

  if (r.includes('honeypot') || r.includes('dionaea')) {
    tags.push({ label: isRu ? 'Ханипот' : 'Honeypot', color: TAG_DESTRUCTIVE });
  }
  if (r.includes('connlimit') || r.includes('conn') || r.includes('flood') || r.includes('l7')) {
    tags.push({ label: isRu ? 'Флуд' : 'Flood', color: TAG_DESTRUCTIVE });
  }
  if (r.includes('rate') || r.includes('limit') || r.includes('ddos')) {
    tags.push({ label: 'DDoS', color: TAG_DESTRUCTIVE });
  }
  if (r.includes('scan') || r.includes('scanner') || r.includes('zgrab') || r.includes('masscan')) {
    tags.push({ label: isRu ? 'Сканер' : 'Scanner', color: TAG_PRIMARY });
  }
  if (r.includes('ssh') || port === 22) {
    tags.push({ label: 'SSH Brute', color: TAG_MUTED });
  }
  if (r.includes('invalid') || r.includes('tcp')) {
    tags.push({ label: isRu ? 'Битый TCP' : 'Invalid TCP', color: TAG_MUTED });
  }

  if (tags.length === 0) {
    tags.push({ label: isRu ? 'Атака' : 'Attack', color: TAG_MUTED });
  }
  return tags;
}

export function severityColor(severity: string | null | undefined): string {
  const s = (severity ?? '').toLowerCase();
  if (s === 'critical') return 'bg-destructive/15 text-destructive border-destructive/30';
  if (s === 'warning') return 'bg-chart-4/15 text-chart-4 border-chart-4/30';
  return 'bg-secondary/15 text-muted-foreground border-border';
}

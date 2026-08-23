import postgres from 'postgres';

export const sql = postgres(process.env.DATABASE_URL ?? '', {
  onnotice: () => {},
});

export async function ensureSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS guestbook_entries (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      message TEXT NOT NULL,
      ip TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS post_views (
      slug TEXT NOT NULL,
      ip TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (slug, ip)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS post_reactions (
      slug TEXT NOT NULL,
      emoji TEXT NOT NULL,
      ip TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (slug, emoji, ip)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      github_id BIGINT NOT NULL,
      login TEXT NOT NULL,
      avatar_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`ALTER TABLE guestbook_entries ADD COLUMN IF NOT EXISTS github_id BIGINT`;
  await sql`ALTER TABLE guestbook_entries ADD COLUMN IF NOT EXISTS login TEXT`;
  await sql`ALTER TABLE guestbook_entries ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
  await sql`
    ALTER TABLE guestbook_entries
    ADD COLUMN IF NOT EXISTS parent_id INTEGER
    REFERENCES guestbook_entries(id) ON DELETE CASCADE
  `;
  await sql`ALTER TABLE guestbook_entries ALTER COLUMN ip DROP NOT NULL`;

  await sql`
    CREATE TABLE IF NOT EXISTS blocked_ips (
      id SERIAL PRIMARY KEY,
      ip TEXT NOT NULL,
      reason TEXT NOT NULL,
      port INTEGER,
      country_code TEXT,
      country_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_blocked_ips_created_at ON blocked_ips(created_at DESC)`;

  await sql`ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS category TEXT`;
  await sql`ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS source TEXT`;
  await sql`ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS asn TEXT`;
  await sql`ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS node TEXT`;
  await sql`ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS hits INTEGER NOT NULL DEFAULT 1`;
  await sql`ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS peak_rps INTEGER`;
  await sql`ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ NOT NULL DEFAULT now()`;
  await sql`ALTER TABLE blocked_ips ADD COLUMN IF NOT EXISTS attack_id INTEGER`;
  await sql`
    DELETE FROM blocked_ips a
    USING blocked_ips b
    WHERE a.ip = b.ip AND a.id > b.id
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_ips_ip_unique ON blocked_ips(ip)`;

  await sql`
    CREATE TABLE IF NOT EXISTS attacks (
      id SERIAL PRIMARY KEY,
      ext_id TEXT UNIQUE,
      target TEXT NOT NULL,
      signature TEXT,
      layer TEXT,
      severity TEXT,
      started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      ended_at TIMESTAMPTZ,
      peak_rps BIGINT,
      total_requests BIGINT,
      blocked BIGINT,
      passed BIGINT,
      mitigation_pct REAL,
      unique_ips INTEGER,
      countries INTEGER,
      asns INTEGER,
      rx_bytes BIGINT,
      tx_bytes BIGINT,
      bandwidth_mbps REAL,
      pps BIGINT,
      top_ips JSONB,
      top_countries JSONB,
      top_asns JSONB,
      top_uas JSONB,
      top_paths JSONB,
      status_codes JSONB,
      reasons JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_attacks_started_at ON attacks(started_at DESC)`;
}

export interface GuestbookAuthor {
  githubId: number | null;
  login: string | null;
  avatarUrl: string | null;
}

export interface GuestbookEntry extends GuestbookAuthor {
  id: number;
  name: string;
  message: string;
  createdAt: string;
  replies: GuestbookEntry[];
}

interface GuestbookRow {
  id: number;
  name: string;
  message: string;
  created_at: Date;
  github_id: string | null;
  login: string | null;
  avatar_url: string | null;
  parent_id: number | null;
}

const GUESTBOOK_PAGE_SIZE = 100;
const GUESTBOOK_RATE_LIMIT_SECONDS = 30;
const GUESTBOOK_RATE_LIMIT_MAX_SECONDS = 15 * 60;
const BURST_WINDOW_MINUTES = 10;
const BURST_STEP = 5;

function toEntry(row: GuestbookRow): GuestbookEntry {
  return {
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: row.created_at.toISOString(),
    githubId: row.github_id === null ? null : Number(row.github_id),
    login: row.login,
    avatarUrl: row.avatar_url,
    replies: [],
  };
}

export async function listGuestbookEntries(): Promise<GuestbookEntry[]> {
  const rows = await sql<GuestbookRow[]>`
    SELECT id, name, message, created_at, github_id, login, avatar_url, parent_id
    FROM guestbook_entries
    WHERE parent_id IS NULL
    ORDER BY created_at DESC
    LIMIT ${GUESTBOOK_PAGE_SIZE}
  `;

  const entries = rows.map(toEntry);
  if (entries.length === 0) return entries;

  const replies = await sql<GuestbookRow[]>`
    SELECT id, name, message, created_at, github_id, login, avatar_url, parent_id
    FROM guestbook_entries
    WHERE parent_id IN ${sql(entries.map((entry) => entry.id))}
    ORDER BY created_at ASC
  `;

  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  for (const row of replies) {
    byId.get(row.parent_id as number)?.replies.push(toEntry(row));
  }

  return entries;
}

export async function guestbookCooldownRemaining(githubId: number): Promise<number> {
  const [row] = await sql<{ since_last: number | null; recent: number }[]>`
    SELECT
      EXTRACT(EPOCH FROM (now() - max(created_at)))::int AS since_last,
      count(*) FILTER (
        WHERE created_at > now() - ${BURST_WINDOW_MINUTES} * interval '1 minute'
      )::int AS recent
    FROM guestbook_entries
    WHERE github_id = ${githubId}
  `;

  if (!row || row.since_last === null) return 0;

  const steps = Math.floor(row.recent / BURST_STEP);
  const required = Math.min(
    GUESTBOOK_RATE_LIMIT_SECONDS * 2 ** steps,
    GUESTBOOK_RATE_LIMIT_MAX_SECONDS
  );

  return Math.max(0, required - row.since_last);
}

export async function resolveThreadRoot(id: number): Promise<number | null> {
  const [row] = await sql<{ id: number; parent_id: number | null }[]>`
    SELECT id, parent_id FROM guestbook_entries WHERE id = ${id}
  `;
  if (!row) return null;
  return row.parent_id ?? row.id;
}

export async function deleteGuestbookEntry(id: number): Promise<boolean> {
  const rows = await sql`DELETE FROM guestbook_entries WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function insertGuestbookEntry(
  message: string,
  author: { githubId: number; login: string; avatarUrl: string },
  ip: string,
  parentId: number | null
): Promise<GuestbookEntry> {
  const [row] = await sql<GuestbookRow[]>`
    INSERT INTO guestbook_entries (name, message, ip, github_id, login, avatar_url, parent_id)
    VALUES (
      ${author.login}, ${message}, ${ip},
      ${author.githubId}, ${author.login}, ${author.avatarUrl}, ${parentId}
    )
    RETURNING id, name, message, created_at, github_id, login, avatar_url, parent_id
  `;

  return toEntry(row);
}

export interface SessionUser {
  githubId: number;
  login: string;
  avatarUrl: string;
}

const SESSION_TTL_DAYS = 30;

export async function createSession(token: string, user: SessionUser): Promise<void> {
  await sql`
    INSERT INTO sessions (token, github_id, login, avatar_url, expires_at)
    VALUES (
      ${token}, ${user.githubId}, ${user.login}, ${user.avatarUrl},
      now() + ${SESSION_TTL_DAYS} * interval '1 day'
    )
  `;
}

export async function getSession(token: string): Promise<SessionUser | null> {
  const [row] = await sql<{ github_id: string; login: string; avatar_url: string }[]>`
    SELECT github_id, login, avatar_url
    FROM sessions
    WHERE token = ${token} AND expires_at > now()
  `;
  if (!row) return null;

  return {
    githubId: Number(row.github_id),
    login: row.login,
    avatarUrl: row.avatar_url,
  };
}

export async function deleteSession(token: string): Promise<void> {
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}

export async function deleteExpiredSessions(): Promise<void> {
  await sql`DELETE FROM sessions WHERE expires_at <= now()`;
}

export interface PostStats {
  views: number;
  reactions: Record<string, number>;
  reacted: string[];
}

export async function getPostStats(slug: string, ip: string): Promise<PostStats> {
  const [[viewsRow], reactionRows, reactedRows] = await Promise.all([
    sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM post_views WHERE slug = ${slug}
    `,
    sql<{ emoji: string; count: string }[]>`
      SELECT emoji, count(*)::text AS count
      FROM post_reactions
      WHERE slug = ${slug}
      GROUP BY emoji
    `,
    sql<{ emoji: string }[]>`
      SELECT emoji FROM post_reactions WHERE slug = ${slug} AND ip = ${ip}
    `,
  ]);

  return {
    views: Number(viewsRow?.count ?? 0),
    reactions: Object.fromEntries(reactionRows.map((row) => [row.emoji, Number(row.count)])),
    reacted: reactedRows.map((row) => row.emoji),
  };
}

export async function registerPostView(slug: string, ip: string): Promise<PostStats> {
  await sql`
    INSERT INTO post_views (slug, ip)
    VALUES (${slug}, ${ip})
    ON CONFLICT (slug, ip) DO NOTHING
  `;
  return getPostStats(slug, ip);
}

export async function setPostReaction(
  slug: string,
  emoji: string,
  ip: string,
  reacted: boolean
): Promise<PostStats> {
  if (reacted) {
    await sql`
      INSERT INTO post_reactions (slug, emoji, ip)
      VALUES (${slug}, ${emoji}, ${ip})
      ON CONFLICT (slug, emoji, ip) DO NOTHING
    `;
  } else {
    await sql`
      DELETE FROM post_reactions WHERE slug = ${slug} AND emoji = ${emoji} AND ip = ${ip}
    `;
  }
  return getPostStats(slug, ip);
}

export interface BlockedIpInput {
  ip: string;
  reason: string;
  port?: number | null;
  category?: string | null;
  source?: string | null;
  asn?: string | null;
  node?: string | null;
  peakRps?: number | null;
  attackId?: number | null;
  countryCode?: string | null;
  countryName?: string | null;
}

export interface BlockedIpRow {
  id: number;
  ip: string;
  reason: string;
  port: number | null;
  category: string | null;
  source: string | null;
  asn: string | null;
  node: string | null;
  hits: number;
  peak_rps: number | null;
  country_code: string | null;
  country_name: string | null;
  created_at: Date;
  last_seen: Date;
}

export async function upsertBlockedIp(input: BlockedIpInput): Promise<BlockedIpRow> {
  const [row] = await sql<BlockedIpRow[]>`
    INSERT INTO blocked_ips
      (ip, reason, port, category, source, asn, node, peak_rps, attack_id,
       country_code, country_name, hits, last_seen)
    VALUES (
      ${input.ip}, ${input.reason}, ${input.port ?? null}, ${input.category ?? null},
      ${input.source ?? null}, ${input.asn ?? null}, ${input.node ?? null},
      ${input.peakRps ?? null}, ${input.attackId ?? null},
      ${input.countryCode ?? null}, ${input.countryName ?? null}, 1, now()
    )
    ON CONFLICT (ip) DO UPDATE SET
      reason = EXCLUDED.reason,
      port = COALESCE(EXCLUDED.port, blocked_ips.port),
      category = COALESCE(EXCLUDED.category, blocked_ips.category),
      source = COALESCE(EXCLUDED.source, blocked_ips.source),
      asn = COALESCE(EXCLUDED.asn, blocked_ips.asn),
      node = COALESCE(EXCLUDED.node, blocked_ips.node),
      peak_rps = GREATEST(COALESCE(EXCLUDED.peak_rps, 0), COALESCE(blocked_ips.peak_rps, 0)),
      attack_id = COALESCE(EXCLUDED.attack_id, blocked_ips.attack_id),
      country_code = COALESCE(blocked_ips.country_code, EXCLUDED.country_code),
      country_name = COALESCE(blocked_ips.country_name, EXCLUDED.country_name),
      hits = blocked_ips.hits + 1,
      last_seen = now()
    RETURNING id, ip, reason, port, category, source, asn, node, hits, peak_rps,
              country_code, country_name, created_at, last_seen
  `;
  return row;
}

// --- attacks ------------------------------------------------------------------

export interface AttackInput {
  extId?: string | null;
  target: string;
  signature?: string | null;
  layer?: string | null;
  severity?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  peakRps?: number | null;
  totalRequests?: number | null;
  blocked?: number | null;
  passed?: number | null;
  mitigationPct?: number | null;
  uniqueIps?: number | null;
  countries?: number | null;
  asns?: number | null;
  rxBytes?: number | null;
  txBytes?: number | null;
  bandwidthMbps?: number | null;
  pps?: number | null;
  topIps?: unknown;
  topCountries?: unknown;
  topAsns?: unknown;
  topUas?: unknown;
  topPaths?: unknown;
  statusCodes?: unknown;
  reasons?: unknown;
}

interface AttackRow {
  id: number;
  ext_id: string | null;
  target: string;
  signature: string | null;
  layer: string | null;
  severity: string | null;
  started_at: Date;
  ended_at: Date | null;
  peak_rps: string | null;
  total_requests: string | null;
  blocked: string | null;
  passed: string | null;
  mitigation_pct: number | null;
  unique_ips: number | null;
  countries: number | null;
  asns: number | null;
  rx_bytes: string | null;
  tx_bytes: string | null;
  bandwidth_mbps: number | null;
  pps: string | null;
  top_ips: unknown;
  top_countries: unknown;
  top_asns: unknown;
  top_uas: unknown;
  top_paths: unknown;
  status_codes: unknown;
  reasons: unknown;
  created_at: Date;
  updated_at: Date;
}

function toAttack(row: AttackRow) {
  const num = (v: string | null) => (v === null ? null : Number(v));
  return {
    id: row.id,
    extId: row.ext_id,
    target: row.target,
    signature: row.signature,
    layer: row.layer,
    severity: row.severity,
    startedAt: row.started_at.toISOString(),
    endedAt: row.ended_at ? row.ended_at.toISOString() : null,
    peakRps: num(row.peak_rps),
    totalRequests: num(row.total_requests),
    blocked: num(row.blocked),
    passed: num(row.passed),
    mitigationPct: row.mitigation_pct,
    uniqueIps: row.unique_ips,
    countries: row.countries,
    asns: row.asns,
    rxBytes: num(row.rx_bytes),
    txBytes: num(row.tx_bytes),
    bandwidthMbps: row.bandwidth_mbps,
    pps: num(row.pps),
    topIps: row.top_ips ?? [],
    topCountries: row.top_countries ?? [],
    topAsns: row.top_asns ?? [],
    topUas: row.top_uas ?? [],
    topPaths: row.top_paths ?? [],
    statusCodes: row.status_codes ?? [],
    reasons: row.reasons ?? [],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export type Attack = ReturnType<typeof toAttack>;

const ATTACK_COLUMNS = sql`
  id, ext_id, target, signature, layer, severity, started_at, ended_at,
  peak_rps, total_requests, blocked, passed, mitigation_pct, unique_ips,
  countries, asns, rx_bytes, tx_bytes, bandwidth_mbps, pps,
  top_ips, top_countries, top_asns, top_uas, top_paths, status_codes, reasons,
  created_at, updated_at
`;

export async function listAttacks(limit = 100): Promise<Attack[]> {
  const rows = await sql<AttackRow[]>`
    SELECT ${ATTACK_COLUMNS} FROM attacks
    ORDER BY started_at DESC
    LIMIT ${limit}
  `;
  return rows.map(toAttack);
}

export async function getAttack(id: number): Promise<Attack | null> {
  const [row] = await sql<AttackRow[]>`
    SELECT ${ATTACK_COLUMNS} FROM attacks WHERE id = ${id}
  `;
  return row ? toAttack(row) : null;
}

export async function upsertAttack(input: AttackInput): Promise<Attack> {
  const j = (v: unknown) => (v === undefined || v === null ? null : JSON.stringify(v));
  const [row] = await sql<AttackRow[]>`
    INSERT INTO attacks (
      ext_id, target, signature, layer, severity, started_at, ended_at,
      peak_rps, total_requests, blocked, passed, mitigation_pct, unique_ips,
      countries, asns, rx_bytes, tx_bytes, bandwidth_mbps, pps,
      top_ips, top_countries, top_asns, top_uas, top_paths, status_codes, reasons,
      updated_at
    ) VALUES (
      ${input.extId ?? null}, ${input.target}, ${input.signature ?? null},
      ${input.layer ?? null}, ${input.severity ?? null},
      ${input.startedAt ? new Date(input.startedAt) : sql`now()`},
      ${input.endedAt ? new Date(input.endedAt) : null},
      ${input.peakRps ?? null}, ${input.totalRequests ?? null}, ${input.blocked ?? null},
      ${input.passed ?? null}, ${input.mitigationPct ?? null}, ${input.uniqueIps ?? null},
      ${input.countries ?? null}, ${input.asns ?? null}, ${input.rxBytes ?? null},
      ${input.txBytes ?? null}, ${input.bandwidthMbps ?? null}, ${input.pps ?? null},
      ${j(input.topIps)}, ${j(input.topCountries)}, ${j(input.topAsns)}, ${j(input.topUas)},
      ${j(input.topPaths)}, ${j(input.statusCodes)}, ${j(input.reasons)}, now()
    )
    ON CONFLICT (ext_id) DO UPDATE SET
      signature = COALESCE(EXCLUDED.signature, attacks.signature),
      layer = COALESCE(EXCLUDED.layer, attacks.layer),
      severity = COALESCE(EXCLUDED.severity, attacks.severity),
      ended_at = COALESCE(EXCLUDED.ended_at, attacks.ended_at),
      peak_rps = GREATEST(COALESCE(EXCLUDED.peak_rps, 0), COALESCE(attacks.peak_rps, 0)),
      total_requests = COALESCE(EXCLUDED.total_requests, attacks.total_requests),
      blocked = COALESCE(EXCLUDED.blocked, attacks.blocked),
      passed = COALESCE(EXCLUDED.passed, attacks.passed),
      mitigation_pct = COALESCE(EXCLUDED.mitigation_pct, attacks.mitigation_pct),
      unique_ips = COALESCE(EXCLUDED.unique_ips, attacks.unique_ips),
      countries = COALESCE(EXCLUDED.countries, attacks.countries),
      asns = COALESCE(EXCLUDED.asns, attacks.asns),
      rx_bytes = COALESCE(EXCLUDED.rx_bytes, attacks.rx_bytes),
      tx_bytes = COALESCE(EXCLUDED.tx_bytes, attacks.tx_bytes),
      bandwidth_mbps = COALESCE(EXCLUDED.bandwidth_mbps, attacks.bandwidth_mbps),
      pps = COALESCE(EXCLUDED.pps, attacks.pps),
      top_ips = COALESCE(EXCLUDED.top_ips, attacks.top_ips),
      top_countries = COALESCE(EXCLUDED.top_countries, attacks.top_countries),
      top_asns = COALESCE(EXCLUDED.top_asns, attacks.top_asns),
      top_uas = COALESCE(EXCLUDED.top_uas, attacks.top_uas),
      top_paths = COALESCE(EXCLUDED.top_paths, attacks.top_paths),
      status_codes = COALESCE(EXCLUDED.status_codes, attacks.status_codes),
      reasons = COALESCE(EXCLUDED.reasons, attacks.reasons),
      updated_at = now()
    RETURNING ${ATTACK_COLUMNS}
  `;
  return toAttack(row);
}

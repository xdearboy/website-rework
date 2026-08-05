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

  // entries predate github auth, so the author columns are nullable
  await sql`ALTER TABLE guestbook_entries ADD COLUMN IF NOT EXISTS github_id BIGINT`;
  await sql`ALTER TABLE guestbook_entries ADD COLUMN IF NOT EXISTS login TEXT`;
  await sql`ALTER TABLE guestbook_entries ADD COLUMN IF NOT EXISTS avatar_url TEXT`;
  await sql`
    ALTER TABLE guestbook_entries
    ADD COLUMN IF NOT EXISTS parent_id INTEGER
    REFERENCES guestbook_entries(id) ON DELETE CASCADE
  `;
  await sql`ALTER TABLE guestbook_entries ALTER COLUMN ip DROP NOT NULL`;
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

/**
 * Seconds the author still has to wait, 0 if they can post. The cooldown starts at
 * GUESTBOOK_RATE_LIMIT_SECONDS and doubles for every BURST_STEP posts made in the
 * burst window, so normal conversation is unaffected but flooding gets expensive.
 */
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

/**
 * Resolves the thread a reply belongs to: replying to a reply attaches to the same
 * root entry, keeping threads one level deep. Null when the target does not exist.
 */
export async function resolveThreadRoot(id: number): Promise<number | null> {
  const [row] = await sql<{ id: number; parent_id: number | null }[]>`
    SELECT id, parent_id FROM guestbook_entries WHERE id = ${id}
  `;
  if (!row) return null;
  return row.parent_id ?? row.id;
}

/** deletes an entry and, thanks to the parent_id cascade, its replies */
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

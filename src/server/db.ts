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
}

export interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  createdAt: string;
}

const GUESTBOOK_PAGE_SIZE = 100;
const GUESTBOOK_RATE_LIMIT_SECONDS = 60;

export async function listGuestbookEntries(): Promise<GuestbookEntry[]> {
  const rows = await sql<{ id: number; name: string; message: string; created_at: Date }[]>`
    SELECT id, name, message, created_at
    FROM guestbook_entries
    ORDER BY created_at DESC
    LIMIT ${GUESTBOOK_PAGE_SIZE}
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function isGuestbookRateLimited(ip: string): Promise<boolean> {
  const [row] = await sql<{ count: string }[]>`
    SELECT count(*)::text AS count
    FROM guestbook_entries
    WHERE ip = ${ip}
      AND created_at > now() - ${GUESTBOOK_RATE_LIMIT_SECONDS} * interval '1 second'
  `;
  return Number(row?.count ?? 0) > 0;
}

export async function insertGuestbookEntry(
  name: string,
  message: string,
  ip: string
): Promise<GuestbookEntry> {
  const [row] = await sql<{ id: number; name: string; message: string; created_at: Date }[]>`
    INSERT INTO guestbook_entries (name, message, ip)
    VALUES (${name}, ${message}, ${ip})
    RETURNING id, name, message, created_at
  `;

  return {
    id: row.id,
    name: row.name,
    message: row.message,
    createdAt: row.created_at.toISOString(),
  };
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

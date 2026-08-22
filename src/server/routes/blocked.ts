import { Elysia, t } from 'elysia';
import { sql } from '../db';

interface BlockedRow {
  id: number;
  ip: string;
  reason: string;
  port: number | null;
  country_code: string | null;
  country_name: string | null;
  created_at: Date;
}

export const blockedRoutes = new Elysia()
  .get('/api/blocked', async () => {
    const rows = await sql<BlockedRow[]>`
      SELECT id, ip, reason, port, country_code, country_name, created_at
      FROM blocked_ips
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return rows.map((row) => ({
      id: row.id,
      ip: row.ip,
      reason: row.reason,
      port: row.port,
      countryCode: row.country_code,
      countryName: row.country_name,
      createdAt: row.created_at.toISOString(),
    }));
  })
  .post(
    '/api/blocked',
    async ({ body, headers, set }) => {
      const apiKey = process.env.BLOCKED_API_KEY;
      if (!apiKey) {
        set.status = 500;
        return { error: 'BLOCKED_API_KEY is not configured on server' };
      }

      const authHeader = headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      let countryCode = body.countryCode ?? null;
      let countryName = body.countryName ?? null;
      if (!countryCode) {
        try {
          const res = await fetch(`http://ip-api.com/json/${body.ip}`);
          if (res.ok) {
            const data = (await res.json()) as any;
            if (data && data.status === 'success') {
              countryCode = data.countryCode ?? null;
              countryName = data.country ?? null;
            }
          }
        } catch (e) {
          console.error('Failed to fetch GeoIP:', e);
        }
      }

      const [row] = await sql<BlockedRow[]>`
        INSERT INTO blocked_ips (ip, reason, port, country_code, country_name)
        VALUES (${body.ip}, ${body.reason}, ${body.port ?? null}, ${countryCode}, ${countryName})
        RETURNING id, ip, reason, port, country_code, country_name, created_at
      `;

      return {
        id: row.id,
        ip: row.ip,
        reason: row.reason,
        port: row.port,
        countryCode: row.country_code,
        countryName: row.country_name,
        createdAt: row.created_at.toISOString(),
      };
    },
    {
      body: t.Object({
        ip: t.String(),
        reason: t.String(),
        port: t.Optional(t.Number()),
        countryCode: t.Optional(t.String()),
        countryName: t.Optional(t.String()),
      }),
    }
  );

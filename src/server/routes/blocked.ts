import { Elysia, t } from 'elysia';
import { type BlockedIpRow, sql, upsertBlockedIp } from '../db';

function serialize(row: BlockedIpRow) {
  return {
    id: row.id,
    ip: row.ip,
    reason: row.reason,
    port: row.port,
    category: row.category,
    source: row.source,
    asn: row.asn,
    node: row.node,
    hits: row.hits,
    peakRps: row.peak_rps,
    countryCode: row.country_code,
    countryName: row.country_name,
    createdAt: row.created_at.toISOString(),
    lastSeen: row.last_seen.toISOString(),
  };
}

const SELECT_COLUMNS = sql`
  id, ip, reason, port, category, source, asn, node, hits, peak_rps,
  country_code, country_name, created_at, last_seen
`;

export const blockedRoutes = new Elysia()
  .get('/api/blocked', async () => {
    const rows = await sql<BlockedIpRow[]>`
      SELECT ${SELECT_COLUMNS}
      FROM blocked_ips
      ORDER BY last_seen DESC
      LIMIT 200
    `;
    return rows.map(serialize);
  })
  .get(
    '/api/blocked/export',
    async ({ query }) => {
      const format = query.format?.toLowerCase() || 'json';

      const rows = await sql<BlockedIpRow[]>`
        SELECT ${SELECT_COLUMNS}
        FROM blocked_ips
        ORDER BY last_seen DESC
        LIMIT 5000
      `;

      if (format === 'csv') {
        const header =
          'ip,reason,category,source,port,hits,peakRps,countryCode,countryName,lastSeen\n';
        const esc = (v: string | null) => `"${(v || '').replace(/"/g, '""')}"`;
        const lines = rows.map(
          (r) =>
            `${r.ip},${esc(r.reason)},${r.category ?? ''},${r.source ?? ''},${r.port ?? ''},${r.hits},${r.peak_rps ?? ''},${r.country_code ?? ''},${esc(r.country_name)},${r.last_seen.toISOString()}`
        );
        return new Response(header + lines.join('\n'), {
          headers: {
            'content-type': 'text/csv; charset=utf-8',
            'content-disposition': 'attachment; filename="blocked_ips.csv"',
          },
        });
      }

      if (format === 'txt') {
        const ips = Array.from(new Set(rows.map((r) => r.ip)));
        return new Response(ips.join('\n'), {
          headers: {
            'content-type': 'text/plain; charset=utf-8',
            'content-disposition': 'attachment; filename="blocked_ips.txt"',
          },
        });
      }

      return new Response(JSON.stringify(rows.map(serialize), null, 2), {
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'content-disposition': 'attachment; filename="blocked_ips.json"',
        },
      });
    },
    {
      query: t.Object({
        format: t.Optional(t.String()),
      }),
    }
  )
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
      let asn = body.asn ?? null;
      if (!countryCode) {
        try {
          const res = await fetch(
            `http://ip-api.com/json/${body.ip}?fields=status,country,countryCode,as`
          );
          if (res.ok) {
            const data = (await res.json()) as {
              status?: string;
              country?: string;
              countryCode?: string;
              as?: string;
            };
            if (data && data.status === 'success') {
              countryCode = data.countryCode ?? null;
              countryName = data.country ?? null;
              asn = asn ?? data.as ?? null;
            }
          }
        } catch (e) {
          console.error('Failed to fetch GeoIP:', e);
        }
      }

      const row = await upsertBlockedIp({
        ip: body.ip,
        reason: body.reason,
        port: body.port ?? null,
        category: body.category ?? null,
        source: body.source ?? null,
        asn,
        node: body.node ?? null,
        peakRps: body.peakRps ?? null,
        attackId: body.attackId ?? null,
        countryCode,
        countryName,
      });

      return serialize(row);
    },
    {
      body: t.Object({
        ip: t.String(),
        reason: t.String(),
        port: t.Optional(t.Number()),
        category: t.Optional(t.String()),
        source: t.Optional(t.String()),
        asn: t.Optional(t.String()),
        node: t.Optional(t.String()),
        peakRps: t.Optional(t.Number()),
        attackId: t.Optional(t.Number()),
        countryCode: t.Optional(t.String()),
        countryName: t.Optional(t.String()),
      }),
    }
  );

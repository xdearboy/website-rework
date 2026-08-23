import { Elysia, t } from 'elysia';
import { getAttack, listAttacks, upsertAttack } from '../db';

export const attacksRoutes = new Elysia()
  .get('/api/attacks', async () => {
    return listAttacks(100);
  })
  .get('/api/attacks/:id', async ({ params, set }) => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      set.status = 400;
      return { error: 'Invalid id' };
    }
    const attack = await getAttack(id);
    if (!attack) {
      set.status = 404;
      return { error: 'Not found' };
    }
    return attack;
  })
  .post(
    '/api/attacks',
    async ({ body, headers, set }) => {
      const apiKey = process.env.BLOCKED_API_KEY;
      if (!apiKey) {
        set.status = 500;
        return { error: 'BLOCKED_API_KEY is not configured on server' };
      }
      if (headers.authorization !== `Bearer ${apiKey}`) {
        set.status = 401;
        return { error: 'Unauthorized' };
      }

      return upsertAttack({
        extId: body.extId ?? null,
        target: body.target,
        signature: body.signature ?? null,
        layer: body.layer ?? null,
        severity: body.severity ?? null,
        startedAt: body.startedAt ?? null,
        endedAt: body.endedAt ?? null,
        peakRps: body.peakRps ?? null,
        totalRequests: body.totalRequests ?? null,
        blocked: body.blocked ?? null,
        passed: body.passed ?? null,
        mitigationPct: body.mitigationPct ?? null,
        uniqueIps: body.uniqueIps ?? null,
        countries: body.countries ?? null,
        asns: body.asns ?? null,
        rxBytes: body.rxBytes ?? null,
        txBytes: body.txBytes ?? null,
        bandwidthMbps: body.bandwidthMbps ?? null,
        pps: body.pps ?? null,
        topIps: body.topIps,
        topCountries: body.topCountries,
        topAsns: body.topAsns,
        topUas: body.topUas,
        topPaths: body.topPaths,
        statusCodes: body.statusCodes,
        reasons: body.reasons,
      });
    },
    {
      body: t.Object({
        extId: t.Optional(t.String()),
        target: t.String(),
        signature: t.Optional(t.String()),
        layer: t.Optional(t.String()),
        severity: t.Optional(t.String()),
        startedAt: t.Optional(t.String()),
        endedAt: t.Optional(t.String()),
        peakRps: t.Optional(t.Number()),
        totalRequests: t.Optional(t.Number()),
        blocked: t.Optional(t.Number()),
        passed: t.Optional(t.Number()),
        mitigationPct: t.Optional(t.Number()),
        uniqueIps: t.Optional(t.Number()),
        countries: t.Optional(t.Number()),
        asns: t.Optional(t.Number()),
        rxBytes: t.Optional(t.Number()),
        txBytes: t.Optional(t.Number()),
        bandwidthMbps: t.Optional(t.Number()),
        pps: t.Optional(t.Number()),
        topIps: t.Optional(t.Any()),
        topCountries: t.Optional(t.Any()),
        topAsns: t.Optional(t.Any()),
        topUas: t.Optional(t.Any()),
        topPaths: t.Optional(t.Any()),
        statusCodes: t.Optional(t.Any()),
        reasons: t.Optional(t.Any()),
      }),
    }
  );

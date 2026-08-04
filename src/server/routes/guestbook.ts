import { Elysia, t } from 'elysia';
import { insertGuestbookEntry, isGuestbookRateLimited, listGuestbookEntries } from '../db';
import { clientIp } from '../lib/client-ip';

export const guestbookRoutes = new Elysia()
  .get('/api/guestbook', async () => ({ entries: await listGuestbookEntries() }))
  .post(
    '/api/guestbook',
    async ({ body, headers, set }) => {
      const name = body.name.trim();
      const message = body.message.trim();
      const website = body.website?.trim();

      if (website) {
        // honeypot tripped — pretend success, don't tip the bot off
        set.status = 201;
        return { id: 0, name, message, createdAt: new Date().toISOString() };
      }
      if (!name || !message) {
        set.status = 400;
        return { error: 'name and message are required' };
      }

      const ip = clientIp(headers);
      if (await isGuestbookRateLimited(ip)) {
        set.status = 429;
        return { error: 'rate limited' };
      }

      const entry = await insertGuestbookEntry(name, message, ip);
      set.status = 201;
      return entry;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 40 }),
        message: t.String({ minLength: 1, maxLength: 500 }),
        website: t.Optional(t.String({ maxLength: 200 })),
      }),
    }
  );

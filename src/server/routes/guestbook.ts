import { Elysia, t } from 'elysia';
import {
  deleteGuestbookEntry,
  guestbookEntryExists,
  insertGuestbookEntry,
  isGuestbookRateLimited,
  listGuestbookEntries,
} from '../db';
import { SESSION_COOKIE, currentUser, isOwner } from '../lib/auth';
import { clientIp } from '../lib/client-ip';

export const guestbookRoutes = new Elysia()
  .get('/api/guestbook', async () => ({ entries: await listGuestbookEntries() }))
  .post(
    '/api/guestbook',
    async ({ body, headers, cookie, set }) => {
      const user = await currentUser(cookie[SESSION_COOKIE]?.value as string | undefined);
      if (!user) {
        set.status = 401;
        return { error: 'sign in with github to post' };
      }

      const message = body.message.trim();
      if (!message) {
        set.status = 400;
        return { error: 'message is required' };
      }

      const parentId = body.parentId ?? null;
      if (parentId !== null) {
        if (!isOwner(user)) {
          set.status = 403;
          return { error: 'only the site owner can reply' };
        }
        if (!(await guestbookEntryExists(parentId))) {
          set.status = 404;
          return { error: 'entry not found' };
        }
      }

      if (await isGuestbookRateLimited(user.githubId)) {
        set.status = 429;
        return { error: 'rate limited' };
      }

      const entry = await insertGuestbookEntry(message, user, clientIp(headers), parentId);
      set.status = 201;
      return entry;
    },
    {
      body: t.Object({
        message: t.String({ minLength: 1, maxLength: 500 }),
        parentId: t.Optional(t.Integer()),
      }),
    }
  )
  .delete(
    '/api/guestbook/:id',
    async ({ params, cookie, set }) => {
      const user = await currentUser(cookie[SESSION_COOKIE]?.value as string | undefined);
      if (!isOwner(user)) {
        set.status = user ? 403 : 401;
        return { error: 'only the site owner can delete entries' };
      }

      if (!(await deleteGuestbookEntry(params.id))) {
        set.status = 404;
        return { error: 'entry not found' };
      }

      return { ok: true };
    },
    { params: t.Object({ id: t.Integer() }) }
  );

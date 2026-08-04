import { node } from '@elysiajs/node';
import { Elysia } from 'elysia';
import { deleteExpiredSessions, ensureSchema } from './db';
import { authRoutes } from './routes/auth';
import { guestbookRoutes } from './routes/guestbook';
import { postsRoutes } from './routes/posts';
import { vitalsRoutes } from './routes/vitals';
import { wakatimeRoutes } from './routes/wakatime';

const PORT = 3000;

const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000;

try {
  await ensureSchema();
} catch (err) {
  console.error('Failed to initialize database schema:', err);
}

setInterval(() => {
  deleteExpiredSessions().catch((err) => console.error('Session cleanup failed:', err));
}, SESSION_CLEANUP_INTERVAL).unref();

const app = new Elysia({ adapter: node() })
  .use(wakatimeRoutes)
  .use(vitalsRoutes)
  .use(authRoutes)
  .use(guestbookRoutes)
  .use(postsRoutes)
  .onError(({ code, set }) => {
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: 'Not found' };
    }
    set.status = 500;
    return { error: 'Internal error' };
  })
  .listen(PORT);

console.log(`API running on http://localhost:${PORT}`);

export type App = typeof app;

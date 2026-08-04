import { node } from '@elysiajs/node';
import { Elysia } from 'elysia';
import { ensureSchema } from './db';
import { guestbookRoutes } from './routes/guestbook';
import { postsRoutes } from './routes/posts';
import { vitalsRoutes } from './routes/vitals';
import { wakatimeRoutes } from './routes/wakatime';

const PORT = 3000;

try {
  await ensureSchema();
} catch (err) {
  console.error('Failed to initialize database schema:', err);
}

const app = new Elysia({ adapter: node() })
  .use(wakatimeRoutes)
  .use(vitalsRoutes)
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

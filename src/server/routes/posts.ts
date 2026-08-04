import { Elysia, t } from 'elysia';
import { getPostStats, registerPostView, setPostReaction } from '../db';
import { clientIp } from '../lib/client-ip';

const REACTION_EMOJIS = ['🔥', '❤️', '👍'] as const;

export const postsRoutes = new Elysia()
  .get('/api/posts/:slug/stats', ({ params, headers }) =>
    getPostStats(params.slug, clientIp(headers))
  )
  .post('/api/posts/:slug/view', ({ params, headers }) =>
    registerPostView(params.slug, clientIp(headers))
  )
  .post(
    '/api/posts/:slug/react',
    ({ params, body, headers }) =>
      setPostReaction(params.slug, body.emoji, clientIp(headers), body.action === 'add'),
    {
      body: t.Object({
        emoji: t.Union(REACTION_EMOJIS.map((emoji) => t.Literal(emoji))),
        action: t.Union([t.Literal('add'), t.Literal('remove')]),
      }),
    }
  );

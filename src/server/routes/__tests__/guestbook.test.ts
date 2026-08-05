// @vitest-environment node
import { node } from '@elysiajs/node';
import { Elysia } from 'elysia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const OWNER = { githubId: 105206420, login: 'xdearboy', avatarUrl: 'https://avatars/1' };
const GUEST = { githubId: 999001, login: 'someguest', avatarUrl: 'https://avatars/2' };

const state = { rateLimited: false, parentExists: true, deleted: true };

vi.mock('../../db', () => ({
  getSession: vi.fn(async (token: string) => {
    if (token === 'ownertoken') return OWNER;
    if (token === 'guesttoken') return GUEST;
    return null;
  }),
  listGuestbookEntries: vi.fn(async () => []),
  isGuestbookRateLimited: vi.fn(async () => state.rateLimited),
  guestbookEntryExists: vi.fn(async () => state.parentExists),
  deleteGuestbookEntry: vi.fn(async () => state.deleted),
  insertGuestbookEntry: vi.fn(async (message: string, author: typeof OWNER) => ({
    id: 1,
    name: author.login,
    message,
    createdAt: new Date().toISOString(),
    githubId: author.githubId,
    login: author.login,
    avatarUrl: author.avatarUrl,
    replies: [],
  })),
}));

async function buildApp() {
  vi.resetModules();
  const { guestbookRoutes } = await import('../guestbook');
  return new Elysia({ adapter: node() }).use(guestbookRoutes);
}

function post(body: unknown, token?: string) {
  return new Request('https://d3vo.ru/api/guestbook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { cookie: `session=${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('guestbook routes', () => {
  beforeEach(() => {
    state.rateLimited = false;
    state.parentExists = true;
    state.deleted = true;
  });

  const del = (id: number, token?: string) =>
    new Request(`https://d3vo.ru/api/guestbook/${id}`, {
      method: 'DELETE',
      headers: token ? { cookie: `session=${token}` } : {},
    });

  it('lists entries without a session', async () => {
    const app = await buildApp();
    const res = await app.handle(new Request('https://d3vo.ru/api/guestbook'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ entries: [] });
  });

  it('rejects posting without a session', async () => {
    const app = await buildApp();
    const res = await app.handle(post({ message: 'hi' }));

    expect(res.status).toBe(401);
  });

  it('rejects a forged session token', async () => {
    const app = await buildApp();
    const res = await app.handle(post({ message: 'hi' }, 'not-a-real-token'));

    expect(res.status).toBe(401);
  });

  it('lets a signed-in guest post', async () => {
    const app = await buildApp();
    const res = await app.handle(post({ message: 'hi' }, 'guesttoken'));

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ login: 'someguest', message: 'hi' });
  });

  it('rejects an empty message', async () => {
    const app = await buildApp();
    const res = await app.handle(post({ message: '   ' }, 'guesttoken'));

    expect(res.status).toBe(400);
  });

  it('forbids a guest from replying', async () => {
    const app = await buildApp();
    const res = await app.handle(post({ message: 'reply', parentId: 1 }, 'guesttoken'));

    expect(res.status).toBe(403);
  });

  it('lets the owner reply', async () => {
    const app = await buildApp();
    const res = await app.handle(post({ message: 'thanks', parentId: 1 }, 'ownertoken'));

    expect(res.status).toBe(201);
  });

  it('returns 404 when replying to a missing entry', async () => {
    state.parentExists = false;
    const app = await buildApp();
    const res = await app.handle(post({ message: 'thanks', parentId: 999 }, 'ownertoken'));

    expect(res.status).toBe(404);
  });

  it('returns 429 when rate limited', async () => {
    state.rateLimited = true;
    const app = await buildApp();
    const res = await app.handle(post({ message: 'hi' }, 'guesttoken'));

    expect(res.status).toBe(429);
  });

  it('rejects a message over the length limit', async () => {
    const app = await buildApp();
    const res = await app.handle(post({ message: 'x'.repeat(501) }, 'guesttoken'));

    expect(res.status).toBe(422);
  });

  it('lets the owner delete an entry', async () => {
    const app = await buildApp();
    const res = await app.handle(del(1, 'ownertoken'));

    expect(res.status).toBe(200);
  });

  it('forbids a guest from deleting', async () => {
    const app = await buildApp();
    const res = await app.handle(del(1, 'guesttoken'));

    expect(res.status).toBe(403);
  });

  it('rejects anonymous deletion', async () => {
    const app = await buildApp();
    const res = await app.handle(del(1));

    expect(res.status).toBe(401);
  });

  it('returns 404 when deleting a missing entry', async () => {
    state.deleted = false;
    const app = await buildApp();
    const res = await app.handle(del(999, 'ownertoken'));

    expect(res.status).toBe(404);
  });
});

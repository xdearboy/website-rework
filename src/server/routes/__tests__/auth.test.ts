// @vitest-environment node
import { node } from '@elysiajs/node';
import { Elysia } from 'elysia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db', () => ({
  createSession: vi.fn(async () => {}),
  deleteSession: vi.fn(async () => {}),
  getSession: vi.fn(async (token: string) =>
    token === 'ownertoken'
      ? { githubId: 105206420, login: 'xdearboy', avatarUrl: 'https://avatars/1' }
      : null
  ),
}));

const OAUTH_ENV = {
  GITHUB_CLIENT_ID: 'client-id',
  GITHUB_CLIENT_SECRET: 'client-secret',
  SITE_URL: 'https://d3vo.ru',
};

async function buildApp() {
  vi.resetModules();
  const { authRoutes } = await import('../auth');
  // the node adapter is what makes cookie + redirect responses behave like production
  return new Elysia({ adapter: node() }).use(authRoutes);
}

describe('auth routes', () => {
  beforeEach(() => {
    Object.assign(process.env, OAUTH_ENV);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports no user without a session cookie', async () => {
    const app = await buildApp();
    const res = await app.handle(new Request('https://d3vo.ru/api/auth/me'));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ user: null, isOwner: false });
  });

  it('recognises the owner from a session cookie', async () => {
    const app = await buildApp();
    const res = await app.handle(
      new Request('https://d3vo.ru/api/auth/me', { headers: { cookie: 'session=ownertoken' } })
    );

    await expect(res.json()).resolves.toMatchObject({
      user: { login: 'xdearboy' },
      isOwner: true,
    });
  });

  it('sends the visitor to github with a state cookie', async () => {
    const app = await buildApp();
    const res = await app.handle(new Request('https://d3vo.ru/api/auth/github'));

    expect(res.status).toBe(302);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain('https://github.com/login/oauth/authorize');
    expect(location).toContain('client_id=client-id');
    expect(res.headers.get('set-cookie')).toContain('oauth_state=');
  });

  it('rejects a callback whose state does not match the cookie', async () => {
    const app = await buildApp();
    const res = await app.handle(
      new Request('https://d3vo.ru/api/auth/github/callback?code=abc&state=forged', {
        headers: { cookie: 'oauth_state=real' },
      })
    );

    expect(res.status).toBe(400);
  });

  // regression: a relative redirect here 500s under the node adapter once the response
  // also carries the session cookie
  it('redirects to an absolute url and sets the session cookie on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.includes('login/oauth/access_token')) {
          return new Response(JSON.stringify({ access_token: 'gh-token' }), {
            headers: { 'content-type': 'application/json' },
          });
        }
        return new Response(
          JSON.stringify({ id: 105206420, login: 'xdearboy', avatar_url: 'https://avatars/1' }),
          { headers: { 'content-type': 'application/json' } }
        );
      })
    );

    const app = await buildApp();
    const res = await app.handle(
      new Request('https://d3vo.ru/api/auth/github/callback?code=abc&state=real', {
        headers: { cookie: 'oauth_state=real' },
      })
    );

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://d3vo.ru/guestbook');
    expect(res.headers.get('set-cookie')).toContain('session=');
  });

  it('is unavailable when oauth credentials are missing', async () => {
    process.env.GITHUB_CLIENT_ID = '';
    process.env.GITHUB_CLIENT_SECRET = '';

    const app = await buildApp();
    const res = await app.handle(new Request('https://d3vo.ru/api/auth/github'));

    expect(res.status).toBe(503);
  });
});

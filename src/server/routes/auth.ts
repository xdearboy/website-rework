import { Elysia, t } from 'elysia';
import { createSession, deleteSession } from '../db';
import {
  OAUTH_STATE_COOKIE,
  OWNER_GITHUB_ID,
  SESSION_COOKIE,
  currentUser,
  exchangeCodeForUser,
  githubOAuthConfig,
  isOwner,
  randomToken,
} from '../lib/auth';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export const authRoutes = new Elysia()
  .get('/api/auth/me', async ({ cookie }) => {
    const user = await currentUser(cookie[SESSION_COOKIE]?.value as string | undefined);
    return { user, isOwner: isOwner(user), ownerGithubId: OWNER_GITHUB_ID };
  })
  .get('/api/auth/github', ({ cookie, redirect, set }) => {
    const config = githubOAuthConfig();
    if (!config) {
      set.status = 503;
      return { error: 'github oauth is not configured' };
    }

    const state = randomToken();
    cookie[OAUTH_STATE_COOKIE].set({
      value: state,
      httpOnly: true,
      secure: config.siteUrl.startsWith('https'),
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    });

    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', config.redirectUri);
    url.searchParams.set('scope', 'read:user');
    url.searchParams.set('state', state);

    return redirect(url.toString());
  })
  .get(
    '/api/auth/github/callback',
    async ({ query, cookie, redirect, set }) => {
      const config = githubOAuthConfig();
      if (!config) {
        set.status = 503;
        return { error: 'github oauth is not configured' };
      }

      const expectedState = cookie[OAUTH_STATE_COOKIE]?.value as string | undefined;
      cookie[OAUTH_STATE_COOKIE].remove();

      if (!expectedState || expectedState !== query.state) {
        set.status = 400;
        return { error: 'invalid oauth state' };
      }

      const githubUser = await exchangeCodeForUser(query.code, config);
      if (!githubUser) {
        set.status = 502;
        return { error: 'github authentication failed' };
      }

      const token = randomToken();
      await createSession(token, {
        githubId: githubUser.id,
        login: githubUser.login,
        avatarUrl: githubUser.avatar_url,
      });

      cookie[SESSION_COOKIE].set({
        value: token,
        httpOnly: true,
        secure: config.siteUrl.startsWith('https'),
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE,
      });

      return redirect('/guestbook');
    },
    { query: t.Object({ code: t.String(), state: t.String() }) }
  )
  .post('/api/auth/logout', async ({ cookie }) => {
    const token = cookie[SESSION_COOKIE]?.value as string | undefined;
    if (token) {
      await deleteSession(token);
      cookie[SESSION_COOKIE].remove();
    }
    return { ok: true };
  });

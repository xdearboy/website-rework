import { randomBytes } from 'node:crypto';
import { type SessionUser, getSession } from '../db';

export const SESSION_COOKIE = 'session';
export const OAUTH_STATE_COOKIE = 'oauth_state';

export const OWNER_GITHUB_ID = Number(process.env.OWNER_GITHUB_ID ?? 105206420);

export function randomToken(): string {
  return randomBytes(32).toString('hex');
}

export function isOwner(user: SessionUser | null): boolean {
  return user?.githubId === OWNER_GITHUB_ID;
}

export async function currentUser(cookieToken: string | undefined): Promise<SessionUser | null> {
  if (!cookieToken) return null;
  return getSession(cookieToken);
}

export function githubOAuthConfig() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const siteUrl = process.env.SITE_URL ?? 'http://localhost:5173';

  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    redirectUri: `${siteUrl}/api/auth/github/callback`,
    siteUrl,
  };
}

export interface GithubUser {
  id: number;
  login: string;
  avatar_url: string;
}

export async function exchangeCodeForUser(
  code: string,
  config: NonNullable<ReturnType<typeof githubOAuthConfig>>
): Promise<GithubUser | null> {
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!tokenRes.ok) return null;
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) return null;

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'd3vo.ru',
    },
  });

  if (!userRes.ok) return null;
  return (await userRes.json()) as GithubUser;
}

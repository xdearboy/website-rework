export interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  createdAt: string;
  githubId: number | null;
  login: string | null;
  avatarUrl: string | null;
  replies: GuestbookEntry[];
}

export interface SessionUser {
  githubId: number;
  login: string;
  avatarUrl: string;
}

export interface Session {
  user: SessionUser | null;
  isOwner: boolean;
  ownerGithubId: number;
}

export class RateLimitError extends Error {}
export class UnauthorizedError extends Error {}

export async function fetchSession(): Promise<Session> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) throw new Error(`Failed to fetch session: ${res.status}`);
  return (await res.json()) as Session;
}

export async function logout(): Promise<void> {
  const res = await fetch('/api/auth/logout', { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to log out: ${res.status}`);
}

export async function fetchGuestbookEntries(): Promise<GuestbookEntry[]> {
  const res = await fetch('/api/guestbook');
  if (!res.ok) throw new Error(`Failed to fetch guestbook: ${res.status}`);
  const data = (await res.json()) as { entries: GuestbookEntry[] };
  return data.entries;
}

export async function deleteGuestbookEntry(id: number): Promise<void> {
  const res = await fetch(`/api/guestbook/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete entry: ${res.status}`);
}

export async function submitGuestbookEntry(
  message: string,
  parentId?: number
): Promise<GuestbookEntry> {
  const res = await fetch('/api/guestbook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parentId ? { message, parentId } : { message }),
  });

  if (res.status === 401) throw new UnauthorizedError('not signed in');
  if (res.status === 429) throw new RateLimitError('rate limited');
  if (!res.ok) throw new Error(`Failed to submit entry: ${res.status}`);

  return (await res.json()) as GuestbookEntry;
}

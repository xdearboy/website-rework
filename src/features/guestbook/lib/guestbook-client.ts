export interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  createdAt: string;
}

export interface GuestbookSubmission {
  name: string;
  message: string;
  website?: string;
}

export class RateLimitError extends Error {}

export async function fetchGuestbookEntries(): Promise<GuestbookEntry[]> {
  const res = await fetch('/api/guestbook');
  if (!res.ok) throw new Error(`Failed to fetch guestbook: ${res.status}`);
  const data = (await res.json()) as { entries: GuestbookEntry[] };
  return data.entries;
}

export async function submitGuestbookEntry(
  submission: GuestbookSubmission
): Promise<GuestbookEntry> {
  const res = await fetch('/api/guestbook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(submission),
  });

  if (res.status === 429) throw new RateLimitError('rate limited');
  if (!res.ok) throw new Error(`Failed to submit entry: ${res.status}`);

  return (await res.json()) as GuestbookEntry;
}

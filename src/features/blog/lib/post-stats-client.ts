export const REACTION_EMOJIS = ['🔥', '❤️', '👍'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export interface PostStats {
  views: number;
  reactions: Record<string, number>;
  reacted: string[];
}

export async function fetchPostStats(slug: string): Promise<PostStats> {
  const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/stats`);
  if (!res.ok) throw new Error(`Failed to fetch post stats: ${res.status}`);
  return (await res.json()) as PostStats;
}

export async function registerPostView(slug: string): Promise<PostStats> {
  const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/view`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to register view: ${res.status}`);
  return (await res.json()) as PostStats;
}

export async function togglePostReaction(
  slug: string,
  emoji: ReactionEmoji,
  currentlyReacted: boolean
): Promise<PostStats> {
  const res = await fetch(`/api/posts/${encodeURIComponent(slug)}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emoji, action: currentlyReacted ? 'remove' : 'add' }),
  });
  if (!res.ok) throw new Error(`Failed to toggle reaction: ${res.status}`);
  return (await res.json()) as PostStats;
}

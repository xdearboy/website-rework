import type { BlogManifest, Post, PostMeta } from '../../../../plugins/vite-plugin-blog-loader';

export type { BlogManifest, Post, PostMeta };

export interface LocalizedPost extends Post {
  isTranslationFallback: boolean;
}

export async function fetchManifest(): Promise<BlogManifest> {
  const res = await fetch('/blog-manifest.json');
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`);
  return res.json() as Promise<BlogManifest>;
}

export async function fetchPost(slug: string, lang?: 'ru' | 'en'): Promise<LocalizedPost | null> {
  if (lang === 'en') {
    const enRes = await fetch(`/blog/${slug}.en.json`);
    if (enRes.ok) {
      const post = (await enRes.json()) as Post;
      return { ...post, isTranslationFallback: false };
    }
    if (enRes.status !== 404) {
      throw new Error(`Failed to fetch post: ${enRes.status}`);
    }
  }

  const res = await fetch(`/blog/${slug}.json`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch post: ${res.status}`);
  const post = (await res.json()) as Post;
  return { ...post, isTranslationFallback: lang === 'en' };
}

import type { BlogManifest, Post, PostMeta } from '../../plugins/vite-plugin-blog-loader'

export type { BlogManifest, Post, PostMeta }

export async function fetchManifest(): Promise<BlogManifest> {
  const res = await fetch('/blog-manifest.json')
  if (!res.ok) throw new Error(`Failed to fetch manifest: ${res.status}`)
  return res.json() as Promise<BlogManifest>
}

export async function fetchPost(slug: string): Promise<Post | null> {
  const res = await fetch(`/blog/${slug}.json`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to fetch post: ${res.status}`)
  return res.json() as Promise<Post>
}

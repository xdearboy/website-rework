import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import type { Plugin } from 'vite';

export interface BlogLoaderOptions {
  contentDir?: string;
  outputDir?: string;
  manifestPath?: string;
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

export interface Post extends PostMeta {
  content: string;
}

export interface BlogManifest {
  posts: PostMeta[];
  generatedAt: string;
}

export function blogLoaderPlugin(options: BlogLoaderOptions = {}): Plugin {
  const contentDir = options.contentDir ?? 'content/blog';
  const outputDir = options.outputDir ?? 'public/blog';
  const manifestPath = options.manifestPath ?? 'public/blog-manifest.json';

  return {
    name: 'blog-loader',
    buildStart() {
      const files = fs.existsSync(contentDir)
        ? fs.readdirSync(contentDir).filter((f) => f.endsWith('.md'))
        : [];

      const posts: PostMeta[] = files.map((file) => {
        const slug = file.replace(/\.md$/, '');
        const raw = fs.readFileSync(path.join(contentDir, file), 'utf8');

        let data: Record<string, unknown> = {};
        let content = '';
        try {
          const parsed = matter(raw);
          data = parsed.data ?? {};
          content = typeof parsed.content === 'string' ? parsed.content : raw;
        } catch {
          content = raw;
        }

        const title = (typeof data.title === 'string' ? data.title : null) ?? 'Без названия';
        const rawDate = data.date ? new Date(data.date as string) : null;
        const date = rawDate ? rawDate.toLocaleDateString('ru-RU') : 'Дата не указана';
        const sortKey = rawDate ? rawDate.getTime() : 0;
        const rawExcerpt = typeof data.excerpt === 'string' ? data.excerpt.trim() : '';
        const plainContent = content
          .replace(/^#{1,6}\s+/gm, '')
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/`{1,3}[^`]*`{1,3}/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/^\s*[-*+]\s+/gm, '')
          .replace(/\n+/g, ' ')
          .trim();
        const excerpt = rawExcerpt || `${plainContent.slice(0, 160)}...`;

        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(
          path.join(outputDir, `${slug}.json`),
          JSON.stringify({ slug, title, date, excerpt, content } satisfies Post)
        );

        return { slug, title, date, excerpt, _sortKey: sortKey } as PostMeta & { _sortKey: number };
      });

      posts.sort((a, b) => ((b as any)._sortKey ?? 0) - ((a as any)._sortKey ?? 0));

      const cleanPosts = posts.map(({ slug, title, date, excerpt }) => ({
        slug,
        title,
        date,
        excerpt,
      }));

      fs.writeFileSync(
        manifestPath,
        JSON.stringify({
          posts: cleanPosts,
          generatedAt: new Date().toISOString(),
        } satisfies BlogManifest)
      );
    },
  };
}

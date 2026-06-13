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
  dateISO: string;
  excerpt: string;
  hasEn: boolean;
}

export interface Post extends PostMeta {
  content: string;
}

export interface BlogManifest {
  posts: PostMeta[];
  generatedAt: string;
}

function deriveExcerpt(content: string): string {
  const plainContent = content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
  return `${plainContent.slice(0, 160)}...`;
}

export function blogLoaderPlugin(options: BlogLoaderOptions = {}): Plugin {
  const contentDir = options.contentDir ?? 'content/blog';
  const outputDir = options.outputDir ?? 'public/blog';
  const manifestPath = options.manifestPath ?? 'public/blog-manifest.json';

  return {
    name: 'blog-loader',
    buildStart() {
      const allFiles = fs.existsSync(contentDir) ? fs.readdirSync(contentDir) : [];

      const files = allFiles.filter((f) => f.endsWith('.md') && !f.endsWith('.en.md'));

      const posts: (PostMeta & { _sortKey: number })[] = files.map((file) => {
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
        const dateISO = typeof data.date === 'string' ? data.date : (rawDate?.toISOString() ?? '');
        const sortKey = rawDate ? rawDate.getTime() : 0;
        const rawExcerpt = typeof data.excerpt === 'string' ? data.excerpt.trim() : '';
        const excerpt = rawExcerpt || deriveExcerpt(content);

        const enFile = `${slug}.en.md`;
        const hasEn = allFiles.includes(enFile);

        if (hasEn) {
          const enRaw = fs.readFileSync(path.join(contentDir, enFile), 'utf8');

          let enData: Record<string, unknown> = {};
          let enContent = '';
          try {
            const enParsed = matter(enRaw);
            enData = enParsed.data ?? {};
            enContent = typeof enParsed.content === 'string' ? enParsed.content : enRaw;
          } catch {
            enContent = enRaw;
          }

          const enTitle = (typeof enData.title === 'string' ? enData.title : null) ?? title;
          const enRawExcerpt = typeof enData.excerpt === 'string' ? enData.excerpt.trim() : '';
          const enExcerpt = enRawExcerpt || deriveExcerpt(enContent);

          fs.mkdirSync(outputDir, { recursive: true });
          fs.writeFileSync(
            path.join(outputDir, `${slug}.en.json`),
            JSON.stringify({
              slug,
              title: enTitle,
              date,
              dateISO,
              excerpt: enExcerpt,
              hasEn,
              content: enContent,
            } satisfies Post)
          );
        }

        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(
          path.join(outputDir, `${slug}.json`),
          JSON.stringify({ slug, title, date, dateISO, excerpt, hasEn, content } satisfies Post)
        );

        return { slug, title, date, dateISO, excerpt, hasEn, _sortKey: sortKey };
      });

      posts.sort((a, b) => b._sortKey - a._sortKey);

      const cleanPosts: PostMeta[] = posts.map(
        ({ slug, title, date, dateISO, excerpt, hasEn }) => ({
          slug,
          title,
          date,
          dateISO,
          excerpt,
          hasEn,
        })
      );

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

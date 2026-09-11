import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { applyMeta } from './lib/html-meta';

const SITE_URL = 'https://d3vo.ru';

// nginx resolves /<route> to /<route>/index.html before the SPA fallback
const PAGES: Array<{ route: string; title: string; description: string }> = [
  {
    route: 'blog',
    title: 'блог — xdearboy',
    description: 'заметки о коде, devops, инфраструктуре и не только.',
  },
  {
    route: 'facts',
    title: 'факты — xdearboy',
    description:
      'сухая выжимка: кто, где, на чём и что происходит прямо сейчас. часть значений живые.',
  },
  {
    route: 'status',
    title: 'статус — xdearboy',
    description:
      'живые проверки сайтов и нод кластера: доступность, задержки по фазам, аптайм за 7 дней.',
  },
  {
    route: 'gallery',
    title: 'галерея — xdearboy',
    description: 'фотографии: плёнка, цифра, город и всё, что попалось под руку.',
  },
  {
    route: 'uses',
    title: 'uses — xdearboy',
    description: 'железо, ос, редактор, терминал и весь остальной рабочий сетап.',
  },
  {
    route: 'wpw',
    title: 'синдром WPW — xdearboy',
    description:
      'личная история лечения синдрома Вольфа-Паркинсона-Уайта: две РЧА, холтеры и подробный разбор процедуры.',
  },
  {
    route: 'degens',
    title: 'degens — xdearboy',
    description: 'архив переписок и хроник.',
  },
  {
    route: 'donate',
    title: 'донат — xdearboy',
    description: 'поддержать проекты и сайт.',
  },
  {
    route: 'guestbook',
    title: 'гостевая книга — xdearboy',
    description: 'оставить сообщение через github-аккаунт.',
  },
  {
    route: 'changelog',
    title: 'changelog — xdearboy',
    description: 'история изменений сайта, собирается из коммитов.',
  },
];

const PRIORITY: Record<string, string> = {
  blog: '0.8',
  blog_post: '0.7',
  gallery: '0.6',
  facts: '0.6',
  status: '0.6',
  wpw: '0.6',
  degens: '0.5',
  donate: '0.5',
  guestbook: '0.5',
  uses: '0.4',
  changelog: '0.4',
};

function urlEntry(loc: string, changefreq: string, priority: string): string {
  return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function buildSitemap(slugs: string[]): string {
  const entries = [
    urlEntry(`${SITE_URL}/`, 'weekly', '1.0'),
    ...PAGES.map((page) =>
      urlEntry(
        `${SITE_URL}/${page.route}`,
        page.route === 'blog' || page.route === 'guestbook' || page.route === 'changelog'
          ? 'weekly'
          : 'monthly',
        PRIORITY[page.route] ?? '0.5'
      )
    ),
    ...slugs.map((slug) => urlEntry(`${SITE_URL}/blog/${slug}`, 'monthly', PRIORITY.blog_post)),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
}

export function pageMetaPlugin(): Plugin {
  let outDir = 'dist';

  return {
    name: 'page-meta',
    configResolved(config) {
      outDir = config.build.outDir || 'dist';
    },
    writeBundle() {
      const indexPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(indexPath)) return;

      const indexHtml = fs.readFileSync(indexPath, 'utf8');

      for (const page of PAGES) {
        const dir = path.join(outDir, page.route);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, 'index.html'),
          applyMeta(indexHtml, {
            title: page.title,
            description: page.description,
            url: `${SITE_URL}/${page.route}`,
          })
        );
      }

      const manifestPath = path.join(outDir, 'blog-manifest.json');
      const slugs: string[] = fs.existsSync(manifestPath)
        ? (JSON.parse(fs.readFileSync(manifestPath, 'utf8')).posts ?? []).map(
            (post: { slug: string }) => post.slug
          )
        : [];

      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), buildSitemap(slugs));
    },
  };
}

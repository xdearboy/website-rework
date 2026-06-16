import type { Badge, ContactLink, ExplorePage, LanguageItem, TechnologyCategories } from './types';

export const languages: LanguageItem[] = [
  { name: 'python', years: 8, url: 'https://www.python.org' },
  { name: 'javascript/typescript', years: 4, url: 'https://www.typescriptlang.org' },
  { name: 'java', years: 1, url: 'https://www.java.com' },
  { name: 'rust', years: 1, url: 'https://www.rust-lang.org' },
  { name: 'bash', years: 5, url: 'https://www.gnu.org/software/bash/' },
  { name: 'html5', years: 4, url: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
  { name: 'css3', years: 4, url: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
  { name: 'markdown', years: 3, url: 'https://daringfireball.net/projects/markdown/' },
  { name: 'sql', years: 3 },
];

export const technologies: TechnologyCategories = {
  frontend: [
    { name: 'react', url: 'https://react.dev' },
    { name: 'next.js', url: 'https://nextjs.org' },
    { name: 'tailwind css', url: 'https://tailwindcss.com' },
    { name: 'framer motion', url: 'https://motion.dev' },
  ],
  backend: [
    { name: 'express.js', url: 'https://expressjs.com' },
    { name: 'fastify', url: 'https://fastify.dev' },
    { name: 'flask', url: 'https://flask.palletsprojects.com' },
    { name: 'fastapi', url: 'https://fastapi.tiangolo.com' },
    { name: 'restful api' },
    { name: 'graphql', url: 'https://graphql.org' },
  ],
  devops: [
    { name: 'docker & docker compose', url: 'https://www.docker.com' },
    { name: 'git & github', url: 'https://git-scm.com' },
    { name: 'ci/cd' },
    { name: 'ansible', url: 'https://www.ansible.com' },
    { name: 'terraform', url: 'https://www.terraform.io' },
    { name: 'kubernetes', url: 'https://kubernetes.io' },
    { name: 'proxmox', url: 'https://www.proxmox.com' },
    { name: 'nginx / h2o / haproxy' },
    { name: 'nomad', url: 'https://www.nomadproject.io' },
    { name: 'opentofu', url: 'https://opentofu.org' },
    { name: 'elk stack', url: 'https://www.elastic.co/elastic-stack' },
  ],
  databases: [
    { name: 'postgresql', url: 'https://www.postgresql.org' },
    { name: 'mysql', url: 'https://www.mysql.com' },
    { name: 'mongodb', url: 'https://www.mongodb.com' },
  ],
  tools: [
    { name: 'linux', url: 'https://kernel.org' },
    { name: 'vs code', url: 'https://code.visualstudio.com' },
    { name: 'vim', url: 'https://www.vim.org' },
  ],
};

export const contacts: ContactLink[] = [
  { labelKey: 'contacts.github', href: 'https://github.com/xdearboy' },
  { labelKey: 'contacts.telegram', href: 'https://t.me/contactfiuimwix_bot' },
  { labelKey: 'contacts.blogTelegram', href: 'https://t.me/vroffteam' },
];

export const explorePages: ExplorePage[] = [
  { labelKey: 'sections.explore.blog', to: '/blog' },
  { labelKey: 'sections.explore.gallery', to: '/gallery' },
  { labelKey: 'sections.explore.degens', to: '/degens' },
  { labelKey: 'sections.explore.donate', to: '/donate' },
];

export const badges: Badge[] = [
  {
    src: 'https://sshi.pw/badge.png',
    alt: 'sshi.pw 88x31',
    href: 'https://sshi.pw',
    title: 'sshi.pw',
  },
  {
    src: 'https://files.webstealing.cc/u/badge.png',
    alt: 'webstealing 88x31',
    href: 'https://webstealing.cc',
    title: 'webstealing.cc',
  },
  {
    src: 'https://glutesha.me/badges/interactive/glutesha.png',
    alt: 'glutesha 88x31',
    href: 'https://glutesha.me',
    title: 'glutesha.me',
  },
  {
    src: 'https://edwardcode.net/www/button.gif',
    alt: 'edwardcode 88x31',
    href: 'https://edwardcode.net',
    title: 'edwardcode.net',
  },
  {
    src: 'https://nichind.dev/88x31.gif',
    alt: 'nichind 88x31',
    href: 'https://nichind.dev',
    title: 'nichind.dev',
  },
  {
    src: 'https://otomir23.me/88x31.png',
    alt: "otomir23's 88x31 button",
    href: 'https://otomir23.me',
    title: 'otomir23.me',
  },
  {
    src: 'https://cyber.dabamos.de/88x31/powered-by-debian.gif',
    alt: 'powered by debian',
    href: 'https://www.debian.org',
    title: 'powered by debian',
  },
  {
    src: '/badges/datagio.png',
    alt: 'datagio 88x31',
    href: 'https://t.me/datagio_robot',
    title: 'datagio',
  },
  {
    src: '/badges/play2go.png',
    alt: 'play2go 88x31',
    href: 'https://play2go.cloud',
    title: 'play2go.cloud',
  },
  {
    src: '/badges/kubernetes.png',
    alt: 'kubernetes 88x31',
    href: 'https://kubernetes.io',
    title: 'kubernetes',
  },
  {
    src: '/badges/vdsok.gif',
    alt: 'vdsok 88x31',
    href: 'https://vdsok.guru',
    title: 'vdsok',
  },
];

export const ownButton: Badge = {
  src: '/badges/badge.gif',
  href: 'https://d3vo.ru',
  alt: 'devo',
};

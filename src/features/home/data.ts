import type { ContactLink, ExplorePage, LanguageItem, TechnologyCategories } from './types';

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

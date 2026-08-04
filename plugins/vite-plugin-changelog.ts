import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

export interface ChangelogOptions {
  outputPath?: string;
  maxEntries?: number;
}

export interface ChangelogEntry {
  hash: string;
  date: string;
  message: string;
}

export interface ChangelogManifest {
  entries: ChangelogEntry[];
  generatedAt: string;
}

const FEAT_COMMIT_RE = /^feat(\([^)]*\))?:\s*(.+)$/;

function parseFeatCommits(log: string, maxEntries: number): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];

  for (const line of log.split('\n')) {
    if (!line.trim()) continue;
    const [hash, date, ...rest] = line.split('|');
    const subject = rest.join('|');
    const match = subject.match(FEAT_COMMIT_RE);
    if (!match) continue;

    entries.push({ hash, date, message: match[2].trim() });
    if (entries.length >= maxEntries) break;
  }

  return entries;
}

export function changelogPlugin(options: ChangelogOptions = {}): Plugin {
  const outputPath = options.outputPath ?? 'public/changelog.json';
  const maxEntries = options.maxEntries ?? 50;

  return {
    name: 'changelog',
    buildStart() {
      let entries: ChangelogEntry[] = [];

      try {
        const log = execSync('git log --pretty=format:"%H|%ad|%s" --date=short', {
          encoding: 'utf8',
        });
        entries = parseFeatCommits(log, maxEntries);
      } catch {
        entries = [];
      }

      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(
        outputPath,
        JSON.stringify({
          entries,
          generatedAt: new Date().toISOString(),
        } satisfies ChangelogManifest)
      );
    },
  };
}

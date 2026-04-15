import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { blogLoaderPlugin } from '../vite-plugin-blog-loader'

function runPlugin(contentDir: string, outputDir: string, manifestPath: string) {
  const plugin = blogLoaderPlugin({ contentDir, outputDir, manifestPath })
  // @ts-ignore
  plugin.buildStart!()
}

describe('BlogLoader property tests', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blog-loader-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('produces manifest entry for every .md file', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            slug: fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/),
            content: fc.string({ minLength: 1 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (files) => {
          const unique = [...new Map(files.map((f) => [f.slug, f])).values()]
          const runId = Math.random().toString(36).slice(2)
          const contentDir = path.join(tmpDir, `content-${runId}`)
          const outputDir = path.join(tmpDir, `output-${runId}`)
          const manifestPath = path.join(tmpDir, `manifest-${runId}.json`)
          fs.mkdirSync(contentDir, { recursive: true })
          unique.forEach(({ slug, content }) => {
            fs.writeFileSync(path.join(contentDir, `${slug}.md`), content)
          })
          runPlugin(contentDir, outputDir, manifestPath)
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
          expect(manifest.posts).toHaveLength(unique.length)
          const slugs = manifest.posts.map((p: { slug: string }) => p.slug)
          expect(new Set(slugs).size).toBe(unique.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('frontmatter round-trip preserves fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          excerpt: fc.string({ minLength: 1, maxLength: 160 }),
        }),
        ({ title, excerpt }) => {
          const slug = 'test-post'
          const contentDir = path.join(tmpDir, `rt-${Math.random()}`)
          const outputDir = path.join(tmpDir, `rt-out-${Math.random()}`)
          const manifestPath = path.join(tmpDir, `rt-manifest-${Math.random()}.json`)
          fs.mkdirSync(contentDir, { recursive: true })
          const md = `---\ntitle: ${JSON.stringify(title)}\nexcerpt: ${JSON.stringify(excerpt)}\n---\nBody text`
          fs.writeFileSync(path.join(contentDir, `${slug}.md`), md)
          runPlugin(contentDir, outputDir, manifestPath)
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
          expect(manifest.posts[0].title).toBe(title)
          expect(manifest.posts[0].excerpt).toBe(excerpt)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('manifest is sorted by date descending', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            slug: fc.stringMatching(/^[a-z][a-z0-9]{0,10}$/),
            date: fc.date({ min: new Date('2000-01-01'), max: new Date('2030-01-01') }),
          }),
          { minLength: 2, maxLength: 8 }
        ),
        (entries) => {
          const unique = [...new Map(entries.map((e) => [e.slug, e])).values()]
          if (unique.length < 2) return
          const contentDir = path.join(tmpDir, `sort-${Math.random()}`)
          const outputDir = path.join(tmpDir, `sort-out-${Math.random()}`)
          const manifestPath = path.join(tmpDir, `sort-manifest-${Math.random()}.json`)
          fs.mkdirSync(contentDir, { recursive: true })
          unique.forEach(({ slug, date }) => {
            const md = `---\ndate: "${date.toISOString()}"\n---\nContent`
            fs.writeFileSync(path.join(contentDir, `${slug}.md`), md)
          })
          runPlugin(contentDir, outputDir, manifestPath)
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
          const posts = manifest.posts
          for (let i = 0; i < posts.length - 1; i++) {
            expect(new Date(posts[i].date).getTime()).toBeGreaterThanOrEqual(
              new Date(posts[i + 1].date).getTime()
            )
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('post content round-trip preserves markdown', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 500 }),
        (markdownContent) => {
          const slug = 'roundtrip'
          const contentDir = path.join(tmpDir, `ct-${Math.random()}`)
          const outputDir = path.join(tmpDir, `ct-out-${Math.random()}`)
          const manifestPath = path.join(tmpDir, `ct-manifest-${Math.random()}.json`)
          fs.mkdirSync(contentDir, { recursive: true })
          // Write without frontmatter so content is preserved as-is
          fs.writeFileSync(path.join(contentDir, `${slug}.md`), markdownContent)
          runPlugin(contentDir, outputDir, manifestPath)
          const post = JSON.parse(
            fs.readFileSync(path.join(outputDir, `${slug}.json`), 'utf8')
          )
          expect(post.content).toBe(markdownContent)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('handles empty content directory', () => {
    const contentDir = path.join(tmpDir, 'empty')
    const outputDir = path.join(tmpDir, 'empty-out')
    const manifestPath = path.join(tmpDir, 'empty-manifest.json')
    fs.mkdirSync(contentDir, { recursive: true })
    runPlugin(contentDir, outputDir, manifestPath)
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    expect(manifest.posts).toEqual([])
  })
})

import PostListItem from '@/features/blog/components/PostListItem';
import { type PostMeta, fetchManifest } from '@/features/blog/lib/blog-client';
import PageShell from '@/shared/layout/PageShell';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { Skeleton, SkeletonGroup } from '@/shared/ui/Skeleton';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';

gsap.registerPlugin(useGSAP);

const POST_SKELETON_KEYS = ['post-1', 'post-2', 'post-3', 'post-4', 'post-5'];

export default function BlogPage() {
  const { t } = useTranslation('blog');
  const containerRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTag = searchParams.get('tag');
  const setActiveTag = (tag: string | null) => {
    setSearchParams(tag ? { tag } : {}, { replace: true });
  };

  const allTags = useMemo(
    () => Array.from(new Set(posts.flatMap((post) => post.tags))).sort(),
    [posts]
  );

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesTag = !activeTag || post.tags.includes(activeTag);
      const matchesQuery =
        !normalizedQuery ||
        post.title.toLowerCase().includes(normalizedQuery) ||
        post.excerpt.toLowerCase().includes(normalizedQuery) ||
        post.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      return matchesTag && matchesQuery;
    });
  }, [posts, query, activeTag]);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchManifest()
      .then((m) => setPosts(m.posts))
      .catch(() => setError(t('errors.loadPosts')))
      .finally(() => setLoading(false));
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: load is defined in component, stable
  useEffect(() => {
    load();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };

        if (reduceMotion) {
          gsap.set('[data-animate]', { opacity: 1, y: 0, clearProps: 'transform' });
          return;
        }

        const introTargets = gsap.utils.toArray<HTMLElement>('[data-animate="intro"]');
        gsap.set(introTargets, { opacity: 0, y: 24 });
        gsap.to(introTargets, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
        });
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [loading, error] }
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };

        if (reduceMotion) {
          gsap.set('[data-animate="reveal-item"]', { opacity: 1, y: 0, clearProps: 'transform' });
          return;
        }

        const itemTargets = gsap.utils.toArray<HTMLElement>('[data-animate="reveal-item"]');
        if (itemTargets.length > 0) {
          const tl = gsap.timeline({ delay: 0.05 });

          itemTargets.forEach((item, index) => {
            const title = item.querySelector<HTMLElement>('[data-reveal-title]');
            const date = item.querySelector<HTMLElement>('[data-reveal-date]');
            const excerpt = item.querySelector<HTMLElement>('[data-reveal-excerpt]');
            const itemStart = index * 0.1;

            if (title) {
              gsap.set(title, { opacity: 0, y: 14 });
              tl.to(title, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, itemStart);
            }
            if (date) {
              gsap.set(date, { opacity: 0, y: 10 });
              tl.to(
                date,
                { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
                itemStart + 0.08
              );
            }
            if (excerpt) {
              gsap.set(excerpt, { opacity: 0, y: 10 });
              tl.to(
                excerpt,
                { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
                itemStart + 0.12
              );
            }
          });
        }
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [filteredPosts] }
  );

  return (
    <PageShell>
      <div ref={containerRef}>
        <header data-animate="intro" className="mb-8 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="text-sm text-muted-foreground underline decoration-gray-500 underline-offset-2 transition-colors duration-150 hover:text-primary hover:decoration-primary"
          >
            {t('nav.back', { ns: 'common' })}
          </Link>
          <a
            href="/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground underline decoration-gray-500 underline-offset-2 transition-colors duration-150 hover:text-primary hover:decoration-primary"
          >
            {t('rss')}
          </a>
        </header>

        <section data-animate="intro" className="prose-landing">
          <h3>{t('title')}</h3>
        </section>

        {!loading && !error && posts.length > 0 && (
          <section data-animate="intro" className="mb-6 space-y-3">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full rounded-lg border border-border/50 bg-card/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none sm:text-base"
            />
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors duration-150 ${
                    activeTag === null
                      ? 'border-primary/50 text-primary'
                      : 'border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50'
                  }`}
                >
                  {t('search.allTags')}
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTag(tag === activeTag ? null : tag)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors duration-150 ${
                      activeTag === tag
                        ? 'border-primary/50 text-primary'
                        : 'border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        <section data-animate="intro">
          {error ? (
            <div className="space-y-2 text-sm sm:text-base">
              <p className="text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={load}
                className="text-primary underline underline-offset-2"
              >
                {t('status.tryAgain', { ns: 'common' })}
              </button>
            </div>
          ) : loading ? (
            <SkeletonGroup className="space-y-6">
              {POST_SKELETON_KEYS.map((key) => (
                <div key={key} className="space-y-1.5">
                  <Skeleton className="h-3 w-20 sm:h-3.5 sm:w-24" />
                  <Skeleton className="h-5 w-2/3 sm:h-6" />
                  <Skeleton className="h-4 w-full sm:h-[1.125rem]" />
                  <Skeleton className="h-4 w-5/6 sm:h-[1.125rem]" />
                </div>
              ))}
            </SkeletonGroup>
          ) : posts.length === 0 ? (
            <p className="text-sm text-muted-foreground sm:text-base">{t('empty')}</p>
          ) : filteredPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground sm:text-base">{t('search.noResults')}</p>
          ) : (
            <ul className="space-y-6">
              {filteredPosts.map((post) => (
                <PostListItem key={post.slug} post={post} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}

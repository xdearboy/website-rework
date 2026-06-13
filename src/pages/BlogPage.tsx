import PostListItem from '@/features/blog/components/PostListItem';
import { type PostMeta, fetchManifest } from '@/features/blog/lib/blog-client';
import PageShell from '@/shared/layout/PageShell';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { Skeleton, SkeletonGroup } from '@/shared/ui/Skeleton';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

gsap.registerPlugin(useGSAP);

const POST_SKELETON_KEYS = ['post-1', 'post-2', 'post-3', 'post-4', 'post-5'];

export default function BlogPage() {
  const { t } = useTranslation('blog');
  const containerRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const itemTargets = gsap.utils.toArray<HTMLElement>('[data-animate="reveal-item"]');
        if (itemTargets.length > 0) {
          const tl = gsap.timeline({ delay: 0.15 });

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
    { scope: containerRef, dependencies: [posts, loading, error] }
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
        </header>

        <section data-animate="intro" className="prose-landing">
          <h3>{t('title')}</h3>
        </section>

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
          ) : (
            <ul className="space-y-6">
              {posts.map((post) => (
                <PostListItem key={post.slug} post={post} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}

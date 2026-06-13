import MarkdownContent from '@/features/blog/components/MarkdownContent';
import { type LocalizedPost, fetchPost } from '@/features/blog/lib/blog-client';
import PageShell from '@/shared/layout/PageShell';
import { formatDate } from '@/shared/lib/formatDate';
import { getMotionMediaQueries } from '@/shared/lib/motion';
import { Skeleton, SkeletonGroup } from '@/shared/ui/Skeleton';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

gsap.registerPlugin(useGSAP, SplitText);

export default function BlogPostPage() {
  const { t, i18n } = useTranslation('blog');
  const { slug } = useParams<{ slug: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [post, setPost] = useState<LocalizedPost | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchPost(slug, i18n.language === 'en' ? 'en' : 'ru')
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug, i18n.language]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(getMotionMediaQueries(), (context) => {
        const { reduceMotion } = context.conditions as { reduceMotion: boolean };
        const titleEl = containerRef.current?.querySelector<HTMLElement>('[data-title-split]');

        if (reduceMotion) {
          gsap.set('[data-animate]', { opacity: 1, y: 0, clearProps: 'transform' });
          if (titleEl) gsap.set(titleEl, { opacity: 1, clearProps: 'transform' });
          return;
        }

        const targets = gsap.utils.toArray<HTMLElement>('[data-animate="intro"]');
        gsap.set(targets, { opacity: 0, y: 24 });

        const tl = gsap.timeline();
        tl.to(targets, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
        });

        let split: SplitText | null = null;
        if (titleEl) {
          split = SplitText.create(titleEl, { type: 'words' });
          gsap.set(split.words, { opacity: 0, y: 16 });
          tl.to(
            split.words,
            { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.04 },
            '<0.1'
          );
        }

        return () => {
          split?.revert();
        };
      });

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [loading, post] }
  );

  if (loading) {
    return (
      <PageShell>
        <SkeletonGroup>
          <Skeleton className="mb-8 h-4 w-28" />
          <Skeleton className="mb-2 h-7 w-3/4 sm:h-8" />
          <Skeleton className="mb-6 h-3 w-24 sm:h-3.5" />
          <hr className="prose-landing-hr" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </SkeletonGroup>
      </PageShell>
    );
  }

  if (!post) {
    return (
      <PageShell>
        <div className="prose-landing space-y-3">
          <p className="text-muted-foreground">{t('post.notFound')}</p>
          <p>
            <Link to="/blog">{t('nav.backToBlog', { ns: 'common' })}</Link>
          </p>
        </div>
      </PageShell>
    );
  }

  const date = post.dateISO
    ? formatDate(new Date(post.dateISO), { day: '2-digit', month: '2-digit', year: 'numeric' })
    : post.date;

  return (
    <PageShell>
      <div ref={containerRef}>
        <header data-animate="intro" className="mb-8">
          <Link
            to="/blog"
            className="text-sm text-muted-foreground underline decoration-gray-500 underline-offset-2 transition-colors duration-150 hover:text-primary hover:decoration-primary"
          >
            {t('nav.backToBlog', { ns: 'common' })}
          </Link>
        </header>

        <article data-animate="intro">
          <h1 data-title-split className="mb-2 text-xl font-bold text-foreground sm:text-2xl">
            {post.title}
          </h1>
          <p className="mb-6 text-xs text-muted-foreground sm:text-sm">{date}</p>
          {post.isTranslationFallback && (
            <p className="mb-6 rounded-md border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground sm:text-sm">
              {t('post.translationUnavailable')}
            </p>
          )}
          <hr className="prose-landing-hr" />
          <MarkdownContent content={post.content} />
        </article>
      </div>
    </PageShell>
  );
}

import type { PostMeta } from '@/features/blog/lib/blog-client';
import { formatDate } from '@/shared/lib/formatDate';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface PostListItemProps {
  post: PostMeta;
}

export default function PostListItem({ post }: PostListItemProps) {
  useTranslation('blog');

  const date = post.dateISO
    ? formatDate(new Date(post.dateISO), { day: '2-digit', month: '2-digit', year: 'numeric' })
    : post.date;

  return (
    <li data-animate="reveal-item" className="list-none">
      <p data-reveal-date className="mb-0.5 text-xs text-muted-foreground sm:text-sm">
        {date}
      </p>
      <Link
        data-reveal-title
        to={`/blog/${post.slug}`}
        className="inline-block text-base font-bold text-foreground decoration-gray-500 underline-offset-2 transition-colors duration-150 hover:text-primary hover:underline hover:decoration-primary sm:text-lg"
      >
        {post.title}
      </Link>
      {post.excerpt && (
        <p data-reveal-excerpt className="mt-1 text-sm text-foreground/70 sm:text-base">
          {post.excerpt}
        </p>
      )}
    </li>
  );
}

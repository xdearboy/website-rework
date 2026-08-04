import {
  type PostStats as PostStatsData,
  REACTION_EMOJIS,
  type ReactionEmoji,
  registerPostView,
  togglePostReaction,
} from '@/features/blog/lib/post-stats-client';
import { Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PostStatsProps {
  slug: string;
}

export default function PostStats({ slug }: PostStatsProps) {
  const { t } = useTranslation('blog');
  const [stats, setStats] = useState<PostStatsData | null>(null);

  useEffect(() => {
    let cancelled = false;

    registerPostView(slug)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const onReact = async (emoji: ReactionEmoji) => {
    if (!stats) return;
    try {
      setStats(await togglePostReaction(slug, emoji, stats.reacted.includes(emoji)));
    } catch {
      // reaction failed — leave current state untouched
    }
  };

  if (!stats) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <span
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm"
        title={t('stats.views')}
      >
        <Eye className="size-3.5" />
        {stats.views}
      </span>

      <span className="flex flex-wrap gap-1.5">
        {REACTION_EMOJIS.map((emoji) => {
          const reacted = stats.reacted.includes(emoji);
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(emoji)}
              aria-pressed={reacted}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors duration-150 ${
                reacted
                  ? 'border-primary/50 text-primary'
                  : 'border-border/50 text-muted-foreground hover:border-primary/50 hover:text-primary'
              }`}
            >
              <span aria-hidden="true">{emoji}</span>
              {stats.reactions[emoji] ?? 0}
            </button>
          );
        })}
      </span>
    </div>
  );
}

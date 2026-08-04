import type { GuestbookEntry } from '@/features/guestbook/lib/guestbook-client';
import { formatDate } from '@/shared/lib/formatDate';
import { useTranslation } from 'react-i18next';

interface GuestbookEntryItemProps {
  entry: GuestbookEntry;
  ownerGithubId: number | null;
  isReply?: boolean;
}

export default function GuestbookEntryItem({
  entry,
  ownerGithubId,
  isReply = false,
}: GuestbookEntryItemProps) {
  const { t } = useTranslation('guestbook');
  const isAuthor = entry.githubId !== null && entry.githubId === ownerGithubId;

  return (
    <div className={isReply ? 'border-l-2 border-border/50 pl-3' : ''}>
      <div className="mb-0.5 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
        {entry.avatarUrl && (
          <img
            src={entry.avatarUrl}
            alt=""
            loading="lazy"
            className="size-4 shrink-0 rounded-full"
          />
        )}
        {entry.login ? (
          <a
            href={`https://github.com/${entry.login}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-foreground hover:text-primary"
          >
            {entry.login}
          </a>
        ) : (
          <span className="font-bold text-foreground">{entry.name}</span>
        )}
        {isAuthor && (
          <span className="rounded-full border border-primary/50 px-1.5 text-[10px] text-primary">
            {t('authorBadge')}
          </span>
        )}
        <span className="text-muted-foreground">
          {formatDate(new Date(entry.createdAt), {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground/80 sm:text-base">{entry.message}</p>
    </div>
  );
}

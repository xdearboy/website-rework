import { formatDate } from '@/shared/lib/formatDate';
import { useTranslation } from 'react-i18next';

const REPO_URL = 'https://github.com/xdearboy/website-rework';

export default function CommitInfo() {
  const { t } = useTranslation('footer');
  const hash = __COMMIT_HASH__;
  const shortHash = hash === 'dev' ? hash : hash.slice(0, 7);
  const date = formatDate(__BUILD_DATE__, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <p className="text-center text-xs text-muted-foreground">
      {t('commitInfo.prefix')}{' '}
      {hash === 'dev' ? (
        <span className="text-primary">{shortHash}</span>
      ) : (
        <a
          href={`${REPO_URL}/commit/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {shortHash}
        </a>
      )}
      {t('commitInfo.suffix', { date })}
    </p>
  );
}

import { badges, ownButton } from '@/features/home/data';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const SNIPPET = `<a href="${ownButton.href}"><img src="${ownButton.href}${ownButton.src}" width="88" height="31" alt="${ownButton.alt}"></a>`;

export default function BadgeWall() {
  const { t } = useTranslation('home');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy snippet: ', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {badges.map((badge) =>
          badge.href ? (
            <a
              key={badge.src}
              href={badge.href}
              target="_blank"
              rel="noopener noreferrer"
              title={badge.title}
              className="inline-block hover:outline hover:outline-1 hover:outline-primary"
            >
              <img
                src={badge.src}
                alt={badge.alt}
                width={88}
                height={31}
                loading="lazy"
                className="block [image-rendering:pixelated]"
              />
            </a>
          ) : (
            <span
              key={badge.src}
              title={badge.title}
              className="inline-block hover:outline hover:outline-1 hover:outline-primary"
            >
              <img
                src={badge.src}
                alt={badge.alt}
                width={88}
                height={31}
                loading="lazy"
                className="block [image-rendering:pixelated]"
              />
            </span>
          )
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <a
          href={ownButton.href}
          target="_blank"
          rel="noopener noreferrer"
          title={t('badges.grabTitle')}
          className="inline-block shrink-0 hover:outline hover:outline-1 hover:outline-primary"
        >
          <img
            src={ownButton.src}
            alt={ownButton.alt}
            width={88}
            height={31}
            loading="lazy"
            className="block [image-rendering:pixelated]"
          />
        </a>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs text-muted-foreground">{t('badges.ownLabel')}</p>
          <button
            type="button"
            onClick={handleCopy}
            className="cursor-pointer font-mono text-xs text-foreground/90 underline underline-offset-2 decoration-gray-500 transition-colors duration-150 hover:text-primary hover:decoration-primary"
          >
            {copied ? t('badges.copied') : t('badges.copy')}
          </button>
        </div>
      </div>
    </div>
  );
}

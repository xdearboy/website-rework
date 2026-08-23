import { useTranslation } from 'react-i18next';

/**
 * AbuseIPDB contributor badge — shown on the defense pages. The blocked IPs are
 * reported upstream to AbuseIPDB, this links to our contributor profile.
 */
export default function AbuseBadge() {
  const { i18n } = useTranslation();
  const isRu = i18n.language?.startsWith('ru');
  return (
    <div className="mt-8 flex flex-col items-center gap-2 border-t border-border/50 pt-6">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
        {isRu ? 'Атакующие IP репортятся в' : 'Attacker IPs reported to'} AbuseIPDB
      </p>
      <a
        href="https://www.abuseipdb.com/user/341284"
        target="_blank"
        rel="noopener noreferrer"
        title="AbuseIPDB contributor profile"
        className="opacity-80 transition-opacity hover:opacity-100"
      >
        <img
          src="https://www.abuseipdb.com/contributor/341284.svg"
          alt="AbuseIPDB Contributor Badge"
          loading="lazy"
          className="h-[60px] w-auto rounded"
        />
      </a>
    </div>
  );
}

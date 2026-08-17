import { getCurrentLang } from '@/i18n';
import { cn } from '@/shared/lib/utils';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlagIcon } from './FlagIcon';

const LANGUAGES = [
  { code: 'ru', flag: 'RU', label: 'RU' },
  { code: 'en', flag: 'GB', label: 'EN' },
] as const;

const ITEM_WIDTH = 52;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [current, setCurrent] = useState(getCurrentLang());

  useEffect(() => {
    const handleChange = () => setCurrent(getCurrentLang());
    i18n.on('languageChanged', handleChange);
    return () => i18n.off('languageChanged', handleChange);
  }, [i18n]);

  const activeIndex = LANGUAGES.findIndex((lang) => lang.code === current);

  return (
    <fieldset
      aria-label="Language / Язык"
      className="fixed top-4 right-4 z-50 m-0 flex items-center rounded-full border border-border bg-card/70 p-1 font-mono text-[11px] shadow-sm backdrop-blur-sm"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 rounded-full bg-primary/15 transition-transform duration-300 ease-out"
        style={{ width: ITEM_WIDTH, transform: `translateX(${activeIndex * ITEM_WIDTH}px)` }}
      />
      {LANGUAGES.map(({ code, flag, label }) => {
        const active = current === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => i18n.changeLanguage(code)}
            aria-pressed={active}
            style={{ width: ITEM_WIDTH }}
            className={cn(
              'relative z-10 flex items-center justify-center gap-1.5 rounded-full py-1.5 transition-colors duration-200',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FlagIcon code={flag} className="h-3 w-auto" />
            {label}
          </button>
        );
      })}
    </fieldset>
  );
}

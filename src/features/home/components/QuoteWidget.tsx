import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface Quote {
  text: string;
  source: string;
}

const REAL_QUOTES: Quote[] = [
  {
    text: 'Без любви человек пуст. Любовь бывает разной — к людям, к идеям, к своему коту.',
    source: 'из блога, «Топ-5 вещей, без которых я не могу жить»',
  },
  {
    text: 'Я живу кодом, автоматизациями, задачами. Каждый день я что-то пишу.',
    source: 'из блога, «Топ-5 вещей, без которых я не могу жить»',
  },
];

const PLACEHOLDER_SLOTS = 3;

export default function QuoteWidget() {
  const { t } = useTranslation('footer');

  const quote = useMemo(() => {
    const totalSlots = REAL_QUOTES.length + PLACEHOLDER_SLOTS;
    const index = Math.floor(Math.random() * totalSlots);
    if (index < REAL_QUOTES.length) return REAL_QUOTES[index];

    return {
      text: t('quote.placeholder.text'),
      source: t('quote.placeholder.source'),
    };
  }, [t]);

  return (
    <blockquote className="text-center text-sm text-muted-foreground">
      <p className="italic">&ldquo;{quote.text}&rdquo;</p>
      <cite className="mt-1 block text-xs not-italic text-muted-foreground/70">
        — {quote.source}
      </cite>
    </blockquote>
  );
}

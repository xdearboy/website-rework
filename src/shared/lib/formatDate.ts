import { getCurrentLang } from '@/i18n';

const INTL_LOCALES: Record<string, string> = {
  ru: 'ru-RU',
  en: 'en-US',
};

export function getIntlLocale(): string {
  return INTL_LOCALES[getCurrentLang()] ?? INTL_LOCALES.ru;
}

export function formatDate(
  date: Date | number | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(getIntlLocale(), options).format(d);
}

export function formatTime(
  date: Date | number | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(getIntlLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options,
  }).format(d);
}

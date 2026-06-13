import i18n, { type Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const SUPPORTED_LANGUAGES = ['ru', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const localeModules = import.meta.glob('./locales/*/*.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;

const resources: Resource = {};

for (const [path, mod] of Object.entries(localeModules)) {
  const match = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
  if (!match) continue;

  const [, lng, namespace] = match;
  resources[lng] ??= {};
  resources[lng][namespace] = mod.default;
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    supportedLngs: SUPPORTED_LANGUAGES,
    load: 'languageOnly',
    defaultNS: 'common',
    ns: Object.keys(resources.ru ?? {}),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator'],
      caches: [],
    },
    react: {
      useSuspense: false,
    },
  });

export function getCurrentLang(): SupportedLanguage {
  const lng = i18n.resolvedLanguage ?? i18n.language ?? 'ru';
  return lng.startsWith('en') ? 'en' : 'ru';
}

export default i18n;

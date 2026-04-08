import { getLocales } from 'expo-localization';
import en from './locales/en.json';
import zh from './locales/zh.json';
import ko from './locales/ko.json';
import ja from './locales/ja.json';

const locales: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  zh: zh as Record<string, string>,
  ko: ko as Record<string, string>,
  ja: ja as Record<string, string>,
};

export function useTranslation() {
  const languageCode = getLocales()[0]?.languageCode;
  const resolvedLocale =
    typeof languageCode === 'string' && languageCode in locales ? languageCode : 'en';

  const t = (key: string): string => {
    const localeValue = locales[resolvedLocale]?.[key];
    if (localeValue && localeValue.length > 0) return localeValue;

    const enValue = locales.en?.[key];
    if (enValue && enValue.length > 0) return enValue;

    return key;
  };

  return { t };
}

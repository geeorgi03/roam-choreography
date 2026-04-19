import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'ui-preferences' });
const LOCALE_PREF_KEY = 'locale_preference';

/** Locales with bundled JSON in `lib/i18n/locales/`. */
export const SUPPORTED_APP_LOCALES = ['en', 'ja', 'ko', 'zh', 'km'] as const;
export type SupportedAppLocale = (typeof SUPPORTED_APP_LOCALES)[number];

/** `system` = follow device `expo-localization`; otherwise force that bundle. */
export type LocalePreference = 'system' | SupportedAppLocale;

function isSupportedLocale(v: string): v is SupportedAppLocale {
  return (SUPPORTED_APP_LOCALES as readonly string[]).includes(v);
}

export function getLocalePreference(): LocalePreference {
  const raw = storage.getString(LOCALE_PREF_KEY);
  if (raw === 'system' || (raw && isSupportedLocale(raw))) {
    return raw as LocalePreference;
  }
  return 'system';
}

export function setLocalePreference(value: LocalePreference): void {
  storage.set(LOCALE_PREF_KEY, value);
}

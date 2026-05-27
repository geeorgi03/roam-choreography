import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getLocales } from 'expo-localization';
import en from './locales/en.json';
import zh from './locales/zh.json';
import ko from './locales/ko.json';
import ja from './locales/ja.json';
import km from './locales/km.json';
import {
  getLocalePreference,
  setLocalePreference,
  type LocalePreference,
  type SupportedAppLocale,
  SUPPORTED_APP_LOCALES,
} from './localePreference';

const bundles: Record<SupportedAppLocale, Record<string, string>> = {
  en: en as Record<string, string>,
  zh: zh as Record<string, string>,
  ko: ko as Record<string, string>,
  ja: ja as Record<string, string>,
  km: km as Record<string, string>,
};

function normalizeDeviceCode(code: string | undefined): SupportedAppLocale {
  if (!code || typeof code !== 'string') return 'en';
  const lower = code.toLowerCase();
  if ((SUPPORTED_APP_LOCALES as readonly string[]).includes(lower)) {
    return lower as SupportedAppLocale;
  }
  const base = lower.split(/[-_]/)[0] ?? 'en';
  if ((SUPPORTED_APP_LOCALES as readonly string[]).includes(base)) {
    return base as SupportedAppLocale;
  }
  return 'en';
}

function systemResolvedLocale(): SupportedAppLocale {
  const primary = getLocales()[0];
  const code = primary?.languageCode ?? primary?.languageTag?.split('-')[0];
  return normalizeDeviceCode(code);
}

export function resolveActiveLocale(preference: LocalePreference): SupportedAppLocale {
  if (preference !== 'system' && (SUPPORTED_APP_LOCALES as readonly string[]).includes(preference)) {
    return preference;
  }
  return systemResolvedLocale();
}

type LocaleContextValue = {
  /** Effective locale used for `t()` (never `system`). */
  resolvedLocale: SupportedAppLocale;
  preference: LocalePreference;
  setPreference: (next: LocalePreference) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>(() => getLocalePreference());

  const resolvedLocale = useMemo(() => resolveActiveLocale(preference), [preference]);

  const setPreference = useCallback((next: LocalePreference) => {
    setLocalePreference(next);
    setPreferenceState(next);
  }, []);

  const t = useMemo(() => {
    const table = bundles[resolvedLocale];
    return (key: string): string => {
      const v = table[key];
      if (v && v.length > 0) return v;
      const enVal = bundles.en[key];
      if (enVal && enVal.length > 0) return enVal;
      return key;
    };
  }, [resolvedLocale]);

  const value = useMemo(
    () => ({ resolvedLocale, preference, setPreference, t }),
    [resolvedLocale, preference, setPreference, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useTranslation must be used within LocaleProvider');
  }
  return { t: ctx.t, preference: ctx.preference, setLocalePreference: ctx.setPreference, resolvedLocale: ctx.resolvedLocale };
}

export { SUPPORTED_APP_LOCALES };

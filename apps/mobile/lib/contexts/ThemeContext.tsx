import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { theme } from '../theme';
import { storage } from '../storage';

export type ThemeMode = 'light' | 'night';

const STORAGE_KEY = 'ui_theme_mode';

export type ThemePalette = (typeof theme)[ThemeMode];

export type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemePalette;
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  if (!storage) return 'light';
  const v = storage.getString(STORAGE_KEY);
  return v === 'night' ? 'night' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      storage?.set(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'light' ? 'night' : 'light';
      try {
        storage?.set(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const colors = useMemo(
    () => (mode === 'night' ? theme.night : theme.light),
    [mode]
  );

  const value = useMemo(
    () => ({ mode, colors, setMode, toggleMode }),
    [mode, colors, setMode, toggleMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      mode: 'light',
      colors: theme.light,
      setMode: () => {},
      toggleMode: () => {},
    };
  }
  return ctx;
}

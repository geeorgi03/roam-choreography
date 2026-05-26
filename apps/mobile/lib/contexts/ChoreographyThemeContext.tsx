import React, { createContext, useContext, useMemo } from 'react';
import { choreographyPalette } from '../choreographyTheme';
import type { ThemePalette } from './ThemeContext';

const ChoreographyThemeContext = createContext<ThemePalette>(choreographyPalette);

export function ChoreographyThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo(() => choreographyPalette, []);
  return (
    <ChoreographyThemeContext.Provider value={value}>{children}</ChoreographyThemeContext.Provider>
  );
}

/** Colors for Figma Make Choreography Tool UI (session shell). */
export function useChoreographyTheme(): ThemePalette {
  return useContext(ChoreographyThemeContext);
}

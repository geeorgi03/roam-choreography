import { USE_CHOREOGRAPHY_UI } from '../choreographyUiFlag';
import { useChoreographyTheme } from '../contexts/ChoreographyThemeContext';
import { useTheme, type ThemePalette } from '../contexts/ThemeContext';
import { useChoreographyFonts } from './useChoreographyFonts';

export function useAppChromeTheme(): {
  colors: ThemePalette;
  isChoreography: boolean;
  displayFont: string | undefined;
  monoFont: string | undefined;
  bodyFont: string | undefined;
} {
  const legacy = useTheme();
  const choreoColors = useChoreographyTheme();
  const fonts = useChoreographyFonts();
  if (!USE_CHOREOGRAPHY_UI) {
    return {
      colors: legacy.colors,
      isChoreography: false,
      displayFont: undefined,
      monoFont: undefined,
      bodyFont: undefined,
    };
  }
  return {
    colors: choreoColors,
    isChoreography: true,
    displayFont: fonts.display,
    monoFont: fonts.mono,
    bodyFont: fonts.body,
  };
}

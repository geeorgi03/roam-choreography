/**
 * Figma Make — Choreography Tool visual tokens
 * https://www.figma.com/make/Hea1WyClIWA2G0E7fJjdMB/Choreography-Tool
 */
import type { ThemePalette } from './contexts/ThemeContext';

export const CHOREOGRAPHY_SECTION_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#FF2D6B',
  '#F59E0B',
  '#6B7280',
] as const;

export const choreographyPalette = {
  ground: '#09090E',
  chrome: '#111118',
  surface: '#111118',
  surfaceElevated: '#1A1A28',
  chromeElevated: '#1A1A28',
  border: 'rgba(255,255,255,0.07)',
  borderLight: 'rgba(255,255,255,0.1)',
  borderStrong: 'rgba(255,255,255,0.14)',
  active: '#EEEEF5',
  muted: '#6868A0',
  disabled: '#454560',
  primary: '#FF2D6B',
  primaryBg: 'rgba(255, 45, 107, 0.18)',
  secondary: '#1A1A28',
  accent: '#FFE135',
  capture: '#FF2D6B',
  mine: '#FF2D6B',
  mineBg: 'rgba(255, 45, 107, 0.22)',
  ref: '#94A3B8',
  inactive: 'rgba(104, 104, 160, 0.45)',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#F44336',
  info: '#3B82F6',
  warm: '#FF2D6B',
  amber: '#FFE135',
  amberBg: 'rgba(255, 225, 53, 0.12)',
  amberBgLight: 'rgba(255, 225, 53, 0.06)',
  amberLight: '#FFE135',
  purple: '#8B5CF6',
  purpleBg: 'rgba(139, 92, 246, 0.15)',
  teal: '#10B981',
  untaggedBg: 'rgba(255, 45, 107, 0.08)',
  untaggedText: '#FF2D6B',
  sage: '#8FA88E',
  gold: '#FFE135',
  plum: '#9A6F84',
  hair: 'rgba(255,255,255,0.07)',
  hair2: 'rgba(255,255,255,0.12)',
  hairStrong: 'rgba(255,255,255,0.2)',
  surface3: '#1A1A28',
  dockBg: 'rgba(8, 8, 14, 0.92)',
  text3: 'rgba(238, 238, 245, 0.5)',
  text4: 'rgba(238, 238, 245, 0.3)',
  gradientPrimary: 'linear-gradient(135deg, #FF2D6B 0%, #EEEEF5 100%)',
  gradientSecondary: 'linear-gradient(135deg, #10B981 0%, #EEEEF5 100%)',
  gradientSurface: 'linear-gradient(135deg, #111118 0%, #1A1A28 100%)',
  gradientAccent: 'linear-gradient(135deg, #FFE135 0%, #EEEEF5 100%)',
  gradientPurple: 'linear-gradient(135deg, #8B5CF6 0%, #EEEEF5 100%)',
  gradientWarm: 'linear-gradient(135deg, #FF2D6B 0%, #FFE135 100%)',
  gradientTeal: 'linear-gradient(135deg, #10B981 0%, #EEEEF5 100%)',
  shadow: 'rgba(0, 0, 0, 0.4)',
  shadowLight: 'rgba(0, 0, 0, 0.2)',
  shadowBlue: 'rgba(59, 130, 246, 0.25)',
  shadowGreen: 'rgba(16, 185, 129, 0.25)',
  shadowOrange: 'rgba(255, 45, 107, 0.25)',
  shadowPurple: 'rgba(139, 92, 246, 0.25)',
  shadowWarm: 'rgba(255, 45, 107, 0.2)',
  bannerOfflineBg: 'rgba(255, 45, 107, 0.12)',
  bannerOfflineText: '#FF2D6B',
  bannerCacheBg: 'rgba(255, 45, 107, 0.12)',
  bannerCacheText: '#FF2D6B',
  surfaceElevated2: '#1A1A28',
  surfaceGlass: 'rgba(8, 8, 14, 0.75)',
  surfaceGlassDark: 'rgba(8, 8, 14, 0.85)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',
} as unknown as ThemePalette;

export const choreographyCanvas = {
  video: '#08080D',
  practice: '#080810',
  panel: 'rgba(17, 17, 23, 0.97)',
  glass: 'rgba(8, 8, 14, 0.75)',
} as const;

export function sectionColorForIndex(index: number): string {
  return CHOREOGRAPHY_SECTION_COLORS[index % CHOREOGRAPHY_SECTION_COLORS.length] ?? '#6B7280';
}

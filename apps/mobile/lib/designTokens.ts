export type DeviceTier = 'phone' | 'tablet';

export function getDeviceTier(width: number): DeviceTier {
  return width >= 768 ? 'tablet' : 'phone';
}

export const uxTokens = {
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    pill: 999,
  },
  typography: {
    title: { phone: 20, tablet: 24 },
    subtitle: { phone: 13, tablet: 14 },
    body: { phone: 14, tablet: 15 },
    caption: { phone: 11, tablet: 12 },
    nav: { phone: 12, tablet: 13 },
  },
  chrome: {
    headerHeight: { phone: 58, tablet: 64 },
    touchTarget: 44,
    dockInset: 10,
  },
} as const;

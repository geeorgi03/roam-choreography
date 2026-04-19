export const theme = {
  light: {
    /** Premium Daylight Mode — combining all reference designs */
    ground: '#0A0908',              // Dark charcoal background from design
    chrome: '#1A1917',              // Slightly lighter surface
    surface: '#1E1C18',             // Phone silhouette color
    surfaceElevated: '#252322',    // Elevated surfaces
    chromeElevated: '#2A2825',     // Chrome elevated
    shadow: '#000000',             // Pure black shadows
    border: '#3A3530',             // Phone border color
    borderLight: '#4A4540',        // Lighter borders
    borderStrong: '#5A5550',       // Strong borders
    active: '#F4EBD6',             // Warm off-white text (from ROAM wordmark)
    muted: '#B8B3A8',             // Muted text
    disabled: '#6A6560',           // Disabled state
    primary: '#E06E3F',            // Coral accent (recording dots)
    primaryBg: 'rgba(224, 110, 63, 0.15)',  // Coral background with warm glow
    secondary: '#D4A574',          // Warm secondary accent
    accent: '#E06E3F',             // Same as primary - coral
    capture: '#E06E3F',            // Recording indicator color
    success: '#4CAF50',            // Fresh green
    warning: '#E06E3F',            // Same as coral
    error: '#F44336',              // Error red
    info: '#2196F3',               // Info blue
    warm: '#E06E3F',               // Coral warm accent
    amber: '#E8A87C',              // Lighter amber
    amberBg: 'rgba(224, 110, 63, 0.1)',  // Warm coral background
    amberBgLight: 'rgba(224, 110, 63, 0.05)',  // Lighter coral background
    amberLight: '#F5E6D3',         // Light coral
    purple: '#AF52DE',             // Purple accent
    purpleBg: 'rgba(175, 82, 222, 0.1)',  // Purple background
    teal: '#5AC8FA',               // Teal accent
    untaggedBg: 'rgba(224, 110, 63, 0.08)',  // Untagged background
    untaggedText: '#E06E3F',      // Untagged text
    /** Premium gradients combining all references */
    gradientPrimary: 'linear-gradient(135deg, #E06E3F 0%, #F4EBD6 100%)',
    gradientSecondary: 'linear-gradient(135deg, #4CAF50 0%, #F4EBD6 100%)',
    gradientSurface: 'linear-gradient(135deg, #1E1C18 0%, #252322 100%)',
    gradientAccent: 'linear-gradient(135deg, #E06E3F 0%, #F4EBD6 100%)',
    gradientPurple: 'linear-gradient(135deg, #AF52DE 0%, #F4EBD6 100%)',
    gradientWarm: 'linear-gradient(135deg, #E8A87C 0%, #F5E6D3 100%)',
    gradientTeal: 'linear-gradient(135deg, #5AC8FA 0%, #F4EBD6 100%)',
    /** Premium shadows - clean and modern */
    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowLight: 'rgba(0, 0, 0, 0.04)',
    shadowBlue: 'rgba(0, 122, 255, 0.15)',
    shadowGreen: 'rgba(52, 199, 89, 0.15)',
    shadowOrange: 'rgba(224, 110, 63, 0.15)',
    shadowPurple: 'rgba(175, 82, 222, 0.15)',
    shadowWarm: 'rgba(224, 110, 63, 0.12)',
    /** Banner colors */
    bannerOfflineBg: 'rgba(224, 110, 63, 0.08)',
    bannerOfflineText: '#E06E3F',
    bannerCacheBg: 'rgba(224, 110, 63, 0.08)',
    bannerCacheText: '#E06E3F',
    /** Premium surface system */
    surface: '#1E1C18',
    surfaceElevated: '#252322',
    surfaceElevated2: '#2A2825',
    surfaceGlass: 'rgba(30, 28, 24, 0.85)',
    surfaceGlassDark: 'rgba(30, 28, 24, 0.7)',
    overlay: 'rgba(0, 0, 0, 0.08)',
    overlayLight: 'rgba(0, 0, 0, 0.04)',
  },
  night: {
    /** Professional Tool Dark Theme — combining tool and premium aesthetics */
    ground: '#0D0D0C',              // Even darker for professional feel
    chrome: '#1A1A18',              // Tool surface
    surface: '#252522',             // Tool panels
    surfaceElevated: '#2A2A28',    // Elevated tool surfaces
    chromeElevated: '#30302D',     // Chrome elevated
    shadow: '#000000',             // Pure black shadows
    border: '#3A3A35',             // Tool borders
    borderLight: '#4A4A45',        // Lighter tool borders
    borderStrong: '#5A5A55',       // Strong tool borders
    active: '#FFFFFF',             // Pure white text
    muted: '#B8B3B0',             // Muted tool text
    disabled: '#6A6A65',           // Disabled tool state
    primary: '#E06E3F',            // Coral accent (consistent with light mode)
    primaryBg: 'rgba(224, 110, 63, 0.15)',  // Coral background
    secondary: '#D4A574',          // Warm secondary
    accent: '#CE9178',             // Syntax highlighting orange
    capture: '#E06E3F',            // Recording indicator
    success: '#4EC9B0',            // Tool green
    warning: '#CE9178',            // Tool orange
    error: '#F48771',              // Tool red
    info: '#75BEFF',               // Tool blue
    warm: '#CE9178',               // Syntax highlighting
    amber: '#D7BA7D',              // Lighter amber
    amberBg: 'rgba(206, 145, 120, 0.1)',  // Amber background
    amberBgLight: 'rgba(206, 145, 120, 0.05)',  // Lighter amber
    amberLight: '#4A3C30',         // Dark amber
    purple: '#C586C0',             // Syntax purple
    purpleBg: 'rgba(197, 134, 192, 0.1)',  // Purple background
    teal: '#4EC9B0',               // Tool teal
    untaggedBg: 'rgba(206, 145, 120, 0.08)',  // Untagged background
    untaggedText: '#CE9178',      // Untagged text
    /** Premium gradients combining all references */
    gradientPrimary: 'linear-gradient(135deg, #E06E3F 0%, #FFFFFF 100%)',
    gradientSecondary: 'linear-gradient(135deg, #4EC9B0 0%, #FFFFFF 100%)',
    gradientSurface: 'linear-gradient(135deg, #252522 0%, #2A2A28 100%)',
    gradientAccent: 'linear-gradient(135deg, #E06E3F 0%, #FFFFFF 100%)',
    gradientPurple: 'linear-gradient(135deg, #C586C0 0%, #FFFFFF 100%)',
    gradientWarm: 'linear-gradient(135deg, #D7BA7D 0%, #4A3C30 100%)',
    gradientTeal: 'linear-gradient(135deg, #4EC9B0 0%, #FFFFFF 100%)',
    /** Premium shadows - clean and modern */
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowLight: 'rgba(0, 0, 0, 0.15)',
    shadowBlue: 'rgba(224, 110, 63, 0.25)',
    shadowGreen: 'rgba(78, 201, 176, 0.25)',
    shadowOrange: 'rgba(206, 145, 120, 0.25)',
    shadowPurple: 'rgba(197, 134, 192, 0.25)',
    shadowWarm: 'rgba(224, 110, 63, 0.2)',
    /** Banner colors */
    bannerOfflineBg: 'rgba(224, 110, 63, 0.15)',
    bannerOfflineText: '#E06E3F',
    bannerCacheBg: 'rgba(224, 110, 63, 0.15)',
    bannerCacheText: '#E06E3F',
    /** Professional surface system */
    surface: '#252522',
    surfaceElevated: '#2A2A28',
    surfaceElevated2: '#30302D',
    surfaceGlass: 'rgba(37, 37, 34, 0.85)',
    surfaceGlassDark: 'rgba(37, 37, 34, 0.7)',
    overlay: 'rgba(0, 0, 0, 0.3)',
    overlayLight: 'rgba(0, 0, 0, 0.15)',
  },
  // Backward-compat aliases for consumers still on the flat contract.
  background: '#F9F7F4',
  textPrimary: '#3A342D',
  textSecondary: '#8A8278',
  accent: '#7DB9A8',
  untaggedBg: 'rgba(184, 176, 165, 0.14)',
  untaggedText: '#8A8278',
  borderRadius: 12,
  typography: {
    // Premium Display Fonts
    displayFamily: 'Inter Display, -apple-system, BlinkMacSystemFont, sans-serif',  // Modern, professional display
    brandFamily: 'Georgia Pro, Georgia, serif',  // Premium serif for branding
    bodyFamily: 'Inter Display, -apple-system, BlinkMacSystemFont, sans-serif',  // Consistent body text
    monoFamily: 'JetBrains Mono, SF Mono, Consolas, Monaco, monospace',  // Professional monospace
    sizes: {
      '4xl': 36,
      '3xl': 30,
      '2xl': 24,
      'xl': 20,
      'lg': 18,
      'base': 16,
      'sm': 14,
      'xs': 12,
    },
    weights: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: 1.1,
      snug: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 1.8,
    },
    /** Letter spacing for improved readability */
    letterSpacing: {
      tighter: -0.05,
      tight: -0.025,
      normal: 0,
      wide: 0.025,
      wider: 0.05,
      widest: 0.1,
    },
  },
  spacing: {
    /** 4px base unit spacing system */
    '0': 0,
    px: '1px',
    '0.5': 2,
    '1': 4,
    '1.5': 6,
    '2': 8,
    '2.5': 10,
    '3': 12,
    '3.5': 14,
    '4': 16,
    '5': 20,
    '6': 24,
    '7': 28,
    '8': 32,
    '9': 36,
    '10': 40,
    '11': 44,
    '12': 48,
    '14': 56,
    '16': 64,
    '20': 80,
    '24': 96,
    '28': 112,
    '32': 128,
    '36': 144,
    '40': 160,
    '44': 176,
    '48': 192,
    '52': 208,
    '56': 224,
    '60': 240,
    '64': 256,
    '72': 288,
    '80': 320,
    '96': 384,
    /** Legacy spacing values */
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    /** Enhanced border radius system */
    radiusSm: 6,
    radiusMd: 8,
    radiusLg: 12,
    radiusXl: 16,
    radius2xl: 20,
    radius3xl: 24,
    radiusFull: 9999,
    pill: 999,
  },
  /** Premium shadow system matching UI Example */
  shadows: {
    /** Standard clean shadows */
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    /** Premium colored shadows from UI Example */
    blueSm: {
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    blueMd: {
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    blueLg: {
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    greenSm: {
      shadowColor: '#34C759',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    greenMd: {
      shadowColor: '#34C759',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    orangeSm: {
      shadowColor: '#FF9500',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    orangeMd: {
      shadowColor: '#FF9500',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    purpleSm: {
      shadowColor: '#AF52DE',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    purpleMd: {
      shadowColor: '#AF52DE',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    /** Premium glass morphism shadows */
    glassSm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    glassMd: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    glassLg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  /** Animation durations for consistent motion */
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  /** A3 Landscape Tablet Layout System */
  landscape: {
    /** Layout dimensions for A3 landscape (1194x834) */
    /** Left Sidebar Navigation (280px wide) */
    sidebar: {
      width: 280,
      padding: 16,
      backgroundColor: '#FFFEFC',
      borderRight: '1px solid #E5E5EA',
    },
    /** Central Canvas Area (main content) */
    canvas: {
      minWidth: 600,
      maxWidth: 800,
      padding: 24,
      backgroundColor: '#FFFFFF',
    },
    /** Right Panel (tools & properties) */
    rightPanel: {
      width: 320,
      padding: 16,
      backgroundColor: '#FFFEFC',
      borderLeft: '1px solid #E5E5EA',
    },
    /** Bottom Timeline (horizontal) */
    timeline: {
      height: 120,
      backgroundColor: '#FFFEFC',
      borderTop: '1px solid #E5E5EA',
      padding: 12,
    },
    /** Top Tool Bar */
    toolBar: {
      height: 56,
      backgroundColor: '#FFFEFC',
      borderBottom: '1px solid #E5E5EA',
      paddingHorizontal: 16,
    },
    /** Layout breakpoints */
    breakpoints: {
      tablet: 768,
      desktop: 1024,
      largeDesktop: 1440,
    },
    /** Component sizing for landscape */
    components: {
      videoPlayer: {
        width: '100%',
        height: 400,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
      },
      timelineTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E5E5EA',
      },
      toolButton: {
        width: 40,
        height: 40,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5EA',
      },
      propertyInput: {
        height: 36,
        paddingHorizontal: 12,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5EA',
      },
    },
    /** Spacing for landscape layout */
    spacing: {
      sidebarGap: 12,
      canvasGap: 24,
      panelGap: 12,
      timelineGap: 8,
      toolbarGap: 8,
    },
    /** Typography for landscape (optimized for readability at distance) */
    typography: {
      sidebarTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        color: '#000000',
      },
      sidebarItem: {
        fontSize: 16,
        fontWeight: '500',
        color: '#636366',
      },
      canvasTitle: {
        fontSize: 24,
        fontWeight: '700',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        color: '#000000',
      },
      panelTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        color: '#000000',
      },
      panelLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#636366',
      },
      timelineLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#636366',
      },
    },
    /** Professional tool colors - ROAM Design Screens */
    toolColors: {
      playhead: '#E06E3F',              // Coral playhead
      selection: 'rgba(224, 110, 63, 0.2)',  // Coral selection
      highlight: 'rgba(224, 110, 63, 0.3)',  // Coral highlight
      grid: '#3A3530',                   // Dark grid lines
      ruler: '#4A4540',                  // Ruler marks
    },
  },
  /** Z-index scale for layered components */
  zIndex: {
    base: 0,
    raised: 10,
    dropdown: 1000,
    sticky: 1100,
    modal: 1200,
    popover: 1300,
    tooltip: 1400,
    toast: 1500,
  },
} as const;

export type ThemeColors = (typeof theme)['light'] | (typeof theme)['night'];

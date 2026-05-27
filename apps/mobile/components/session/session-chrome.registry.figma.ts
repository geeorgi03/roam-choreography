/**
 * Code Connect–style registry for session chrome (Figma ↔ RN).
 * Not wired to @figma/code-connect CLI; hand-maintained until design library + parser are added.
 *
 * Tooling: before any `use_figma` write, load the `figma-use` skill per team convention.
 */

export const sessionChromeRegistry = {
  SessionTabBar: {
    codeImportPath: 'apps/mobile/components/session/SessionTabBar',
    file: 'apps/mobile/components/session/SessionTabBar.tsx',
    componentName: 'SessionTabBar',
    propsFromContext: ['activeTab', 'setActiveTab', 'closeSheet'] as const,
    platformNotes: 'React Native; tab labels shorten below 600dp width.',
  },
  TransportBar: {
    codeImportPath: 'apps/mobile/components/session/TransportBar',
    file: 'apps/mobile/components/session/TransportBar.tsx',
    componentName: 'TransportBar',
    props: [{ name: 'variant', type: "'full' | 'reduced'", required: true }] as const,
    propsFromContext: [
      'musicTrack',
      'isPlaying',
      'playbackSpeed',
      'loopRegion',
      'loopOpenAt',
      'stemFocus',
      'handlePlayPause',
      'handleSeekBack',
      'handleSeekForward',
      'handleLoopToggle',
      'handleClearLoop',
      'setPlaybackSpeed',
      'setStemFocus',
    ] as const,
    platformNotes:
      'Performance-sensitive when music loaded; icons via react-native-svg (SessionChromeIcons). No emoji glyphs.',
  },
  FeelingStrip: {
    codeImportPath: 'apps/mobile/components/session/FeelingStrip',
    file: 'apps/mobile/components/session/FeelingStrip.tsx',
    componentName: 'FeelingStrip',
    propsFromContext: ['sessionName', 'sessionPhrase', 'updateSessionMeta', 'openSheet', 'qualityTarget', 'sessionId', 'session'] as const,
    platformNotes: 'Uses expo-router, ActionSheetIOS / Alert; inbox badge from InboxCountContext.',
  },
  SessionChromeIcons: {
    codeImportPath: 'apps/mobile/components/icons/SessionChromeIcons',
    file: 'apps/mobile/components/icons/SessionChromeIcons.tsx',
    exports: [
      'IconInbox',
      'IconShareOut',
      'IconMoreVertical',
      'IconPlay',
      'IconPause',
      'IconSkipBack',
      'IconSkipForward',
      'IconGear',
      'IconSun',
      'IconMoon',
    ] as const,
    platformNotes: 'Stroke/fill SVGs; pass size + color for theme alignment.',
  },
} as const;

export type SessionChromeRegistryKey = keyof typeof sessionChromeRegistry;

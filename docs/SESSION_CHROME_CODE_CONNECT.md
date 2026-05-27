# Session chrome — Code Connect / handoff registry

Maps session-level UI to implementation paths. Use with `docs/RUNTIME_ACCEPTANCE_PROTOCOL.md` for acceptance. Parser-based `@figma/code-connect` is not installed in this repo; treat this file plus `session-chrome.registry.figma.ts` as the source of truth until Figma library mappings are published.

## Mapped components

| Figma frame (suggested name) | Code | Code Connect file | Notes |
|------------------------------|------|---------------------|-------|
| `Session / TabBar` | `SessionTabBar` | `apps/mobile/components/session/session-chrome.registry.figma.ts` | Segmented control; `activeTab` from `SessionContext`; tablet uses full tab labels ≥600dp width. |
| `Session / TransportBar` | `TransportBar` | same | Props: `variant: 'full' \| 'reduced'`. Loop copy: `spatial.loopSet` / `spatial.loopClose`. Icons: `SessionChromeIcons` (no emoji). |
| `Session / FeelingStrip` | `FeelingStrip` | same | Inbox / share / overflow use stroke icons. Theme: header still uses `theme.light` stylesheet for legacy surfaces; icons follow `useTheme().colors.muted`. |
| `Session / LyricsSearch` | `WorkbenchTab` (lyrics panel) | same | Single “seamless” bar: `lyricsSearchBar` + inline input + compact submit. |
| `Session / MomentStrip` | `SongMapTab`, `SpatialTab` | same | Shared visual pattern: `momentStripShell` + horizontal chips. |

## Token mapping (`apps/mobile/lib/theme.ts`)

| UI element | Token |
|------------|--------|
| Tab track (day) | `colors.ground` outer; track fill hardcoded `#e2ded8` (proposal: add `colors.tabTrack` if promoted). |
| Active segment | `colors.chrome` |
| Transport surface | `colors.chrome`, `colors.border` hairline |
| Loop idle | `colors.mine`, `colors.mineBg` |
| Loop armed | `colors.amber`, `colors.amberBg` |
| Primary controls | `colors.active` |

## i18n keys touched

| Key | Purpose |
|-----|---------|
| `feelingStrip.a11yInbox`, `a11yShare`, `a11yMore` | Accessibility labels for icon buttons |
| `transport.seekBack`, `transport.seekForward` | Skip control a11y |
| `spatial.loopSet`, `spatial.loopClose` | Short labels for compact loop control (EN: “Loop” / “Close”) |
| `clipPlayer.clearLoop` | Removed decorative character; use “Clear loop” |

## States (per `RUNTIME_ACCEPTANCE_PROTOCOL.md`)

For **TransportBar**: default, playing, loop region set, loop picker open (`loopOpenAt`), lyrics loading (Workbench only).  
For **FeelingStrip**: inbox badge count `0` vs `>0`.  
Network: `OfflineBanner` above shell (unchanged).

## Figma parity rules

- If a Figma variant is not in code, label the variant **`proposal`** and list required engineering work (new props, tokens, or API).
- If code exposes a state Figma lacks, add the state in Figma before claiming visual QA parity.

## Non-sources

Do not treat random screenshots as truth without **commit hash** or **EAS build id** (see project rules).

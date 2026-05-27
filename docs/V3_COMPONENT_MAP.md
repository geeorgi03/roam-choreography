# V3 Component Map

Component-level inventory mapping reusable React Native components to V3 Figma counterparts.

## Session Surface

| RN component | Path | Figma counterpart page/frame | Notes |
|---|---|---|---|
| `WorkbenchTab` | `apps/mobile/components/session/WorkbenchTab.tsx` | `workbench · light/night`, `workbench · tablet · landscape` | Core structured practice surface; now includes drill sequence block. |
| `TransportBar` | `apps/mobile/components/session/TransportBar.tsx` | `workbench` transport controls | Shared playback controls across tabs. |
| `SessionTabBar` | `apps/mobile/components/session/SessionTabBar.tsx` | `workbench` tab row | Workbench/Song-map/Spatial/Group switching. |
| `ClipViewerSheet` | `apps/mobile/components/session/ClipViewerSheet.tsx` | `ref-viewer · bottom sheet` | Unified media viewer for REF + MINE; includes loops, save actions, tags entry. |
| `TagSheet` | `apps/mobile/components/TagSheet.tsx` | `ref-viewer` metadata/tag controls | Tag editor bottom sheet. |
| `TagHistorySheet` | `apps/mobile/components/TagHistorySheet.tsx` | `ref-viewer` history state | Version history + restore flow for clip tags. |
| `LoopChipRow` | `apps/mobile/components/session/LoopChipRow.tsx` | `ref-viewer` loop chips | Loop region list and active selection. |
| `SongMapTab` | `apps/mobile/components/session/SongMapTab.tsx` | `song-map · tablet · landscape` | Moments strip + per-moment context. |
| `SpatialTab` | `apps/mobile/components/session/SpatialTab.tsx` | `spatial · tablet · landscape` | Formation/spatial review surface. |
| `GroupTab` | `apps/mobile/components/session/GroupTab.tsx` | `group · choreographer`, `group · dancer` | Collaborative group view shell. |

## Home, Capture, and Entry

| RN component | Path | Figma counterpart page/frame | Notes |
|---|---|---|---|
| `FirstSessionSheet` | `apps/mobile/components/FirstSessionSheet.tsx` | `home` first-session CTA flow | First project/session creation prompt. |
| `CreateSessionSheet` | `apps/mobile/components/CreateSessionSheet.tsx` | `home` create session flow | Session creation sheet with plan-limit handling. |
| `PaywallSheet` | `apps/mobile/components/PaywallSheet.tsx` | `settings`/billing upsell patterns | Shared upgrade sheet for plan-gated actions. |
| `CaptureSheet` | `apps/mobile/components/CaptureSheet.tsx` | `capture · phone · portrait` | Capture-mode launcher and entry choices. |
| `FeelingStrip` | `apps/mobile/components/session/FeelingStrip.tsx` | `workbench` header strip | Session context/atmosphere affordance. |
| `OfflineBanner` | `apps/mobile/components/session/OfflineBanner.tsx` | Cross-page system status | Shared offline state indicator. |

## Collaboration and Share

| RN component | Path | Figma counterpart page/frame | Notes |
|---|---|---|---|
| `ShareSheet` | `apps/mobile/components/ShareSheet.tsx` | Share/invite overlays | Session-level sharing and export entry. |
| `ClipShareSheet` | `apps/mobile/components/ClipShareSheet.tsx` | Ref-viewer/share actions | Clip-level sharing flow. |
| `FeedbackSheet` | `apps/mobile/components/FeedbackSheet.tsx` | Feedback/comment overlays | Structured feedback input for clips. |
| `AssemblyView` | `apps/mobile/components/AssemblyView.tsx` | `group` + `spatial` assembly canvases | Shared placement/formation rendering shell. |
| `AssemblyCanvas` | `apps/mobile/components/AssemblyCanvas.tsx` | `song-map` assembly canvas | Moment-based visual mapping area. |

## Notes

- This map follows the `docs/V3_COVERAGE_AUDIT.md` component-inventory requirement.
- Mapping is intentionally at reusable-component level (not route-file level) to support future design-system normalization and parity passes.

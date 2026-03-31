# V3 Coverage Audit

Source of truth:
- Figma file: https://www.figma.com/design/paoFtKOdkkoSAD02Intbjc/ROAMV3?node-id=332-2&t=s3Z4EVIoEURMuqNV-1
- Repo: https://github.com/geeorgi03/roamv3

Audit timestamp: 2026-03-31

Legend:
- v3-locked: whether frame exists in Figma `v3-locked` page
- app status:
  - Implemented: route + core UI + core interaction + basic data wiring are present
  - Partial: route exists but major visual/interaction/data gaps remain
  - Missing: no practical in-app implementation

## A) In v3-locked + implemented

None yet at strict acceptance level.

## B) In v3-locked but partial/missing in app

| Figma page/frame | v3-locked | app status | route/screen mapping | key gaps | priority |
|---|---|---|---|---|---|
| `login · light` / `login · night` | Yes | Partial | `apps/mobile/app/auth/sign-in.tsx`, `apps/mobile/app/auth/sign-up.tsx`, `apps/mobile/app/auth/callback.tsx` | Layout/style diverges from locked comps; provider-based auth buttons not mirrored exactly | P1 |
| `home · light` / `home · night` | Yes | Partial | `apps/mobile/app/(app)/index.tsx` | Session row visual system differs; top-bar behavior and spacing not yet matched to locked comps | P1 |
| `workbench · light` / `workbench · night` | Yes | Partial | `apps/mobile/app/(app)/session/[id].tsx` | Core structure exists but major spec deltas remain (left/right split, typography, chips/controls, visual polish) | P0 |
| `ref-viewer · light` / `ref-viewer · night` | Yes | Partial | `apps/mobile/app/(app)/session/clip-player.tsx`, `apps/mobile/app/(app)/session/youtube-player.tsx` | Implemented as full screens/modals, not locked bottom-sheet composition; loop-chip/save-actions flow not aligned | P1 |
| `group · light` / `group · night` | Yes | Partial | `apps/mobile/app/(app)/session/group.tsx`, `apps/mobile/components/AssemblyView.tsx` | Baseline route now exists with choreographer/dancer modes; still missing realtime sync and locked visual parity | P0 |

## C) Not in v3-locked (must be implemented in V3 app)

All entries below are explicitly tagged as: **Needs implementation in V3 app**.

| Figma page/frame | v3-locked | app status | route/screen mapping | key gaps | priority |
|---|---|---|---|---|---|
| `song-map · tablet · landscape` / `song-map · tablet · landscape · night` | No | Partial | `apps/mobile/app/(app)/session/song-map.tsx`, `apps/mobile/components/AssemblyCanvas.tsx` | First-class route exists; still missing full Figma parity (moments strip, dedicated controls, visual polish) | P0 |
| `spatial · tablet · landscape` / `spatial · tablet · landscape · night` | No | Partial | `apps/mobile/app/(app)/session/spatial.tsx`, `apps/mobile/components/AssemblyView.tsx` | First-class route exists; still missing spatial-specific UX parity (tool progression, relationships, quality layer, moments strip) | P0 |
| `group · choreographer · tablet` / `group · dancer · phone` (+ night variants) | No | Partial | `apps/mobile/app/(app)/session/group.tsx` | Dedicated route now exists with baseline role modes; still missing full interaction/realtime parity | P0 |
| `workbench · tablet · landscape` / `workbench · tablet · landscape · night` | No | Partial | `apps/mobile/app/(app)/session/[id].tsx` | Some functional overlap, but locked visual and interaction parity not complete | P0 |
| `ref-viewer · bottom sheet` / `ref-viewer · bottom sheet · night` | No | Partial | `apps/mobile/app/(app)/session/clip-player.tsx`, `apps/mobile/app/(app)/session/youtube-player.tsx` | Bottom-sheet architecture and controls differ from target | P1 |
| `library · tablet · landscape` / `library · tablet · landscape · night` | No | Partial | `apps/mobile/app/(app)/library.tsx` | Information architecture and visual style differ; needs parity pass | P1 |
| `capture · phone · portrait` / `capture · phone · portrait · night` | No | Partial | `apps/mobile/app/(app)/session/camera.tsx` | Route exists; capture shell diverges from page composition/details | P1 |
| `settings · tablet · landscape` / `settings · tablet · landscape · night` | No | Partial | `apps/mobile/app/(app)/profile.tsx` | Billing/profile exists but settings IA and visual parity not complete | P2 |
| `auth` page variants | No | Partial | `apps/mobile/app/auth/*.tsx` | Auth works but not complete visual parity with target auth page variants | P1 |
| `home` page variants | No | Partial | `apps/mobile/app/(app)/index.tsx` | Home functionality exists; visual/layout parity pending | P1 |
| `tokens` | No | Missing (runtime N/A) | N/A (design artifact) | Requires token extraction/mapping doc and usage normalization | P2 |
| `components` | No | Missing (runtime N/A) | N/A (design artifact) | Requires component inventory and reusable RN component mapping | P2 |

## Notes and assumptions

- Figma file contains 13 pages; `v3-locked` is only one page among them.
- `Implemented` is intentionally strict and currently empty.
- Some features are present via adjacent routes but not yet in frame-accurate page structures.

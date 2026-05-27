# ROAM PRD Implementation Matrix

Last updated: 2026-05-18

This matrix is the living source of truth for implementation and acceptance.

Status legend:

- `Done`: implemented and runtime-validated against acceptance criteria.
- `Partial`: code exists, but runtime or quality evidence is incomplete.
- `Not Done`: not implemented end-to-end.


| PRD Feature                              | Primary Surface                             | Exists in Code | Wired E2E | Runtime Tested | Perf Target Met | Verdict | Notes                                                                                                                                                                                                                                        |
| ---------------------------------------- | ------------------------------------------- | -------------- | --------- | -------------- | --------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth sign up/in                          | Mobile + Supabase                           | Yes            | Yes       | Partial        | N/A             | Partial | Needs device regression pass for callback and cold start auth restore.                                                                                                                                                                       |
| Home two-door entry                      | `apps/mobile/app/(app)/index.tsx`           | Yes            | Partial   | Partial        | No              | Partial | UX flow present; needs latency and tap-budget evidence.                                                                                                                                                                                      |
| Record from Home                         | `apps/mobile/app/(app)/session/camera.tsx`  | Yes            | Partial   | Partial        | No              | Partial | Reported runtime issues in prior APK builds need fresh verification.                                                                                                                                                                         |
| Quick-save (Later/New/Existing)          | `apps/mobile/components/QuickSaveSheet.tsx` | Yes            | Partial   | Partial        | No              | Partial | Branching paths implemented, but acceptance measurements pending.                                                                                                                                                                            |
| Inbox flow                               | Mobile + API inbox routes                   | Yes            | Partial   | Partial        | No              | Partial | Needs measured stop->inbox persist under target.                                                                                                                                                                                             |
| Session workbench tabs                   | Session routes + components                 | Yes            | Partial   | Partial        | No              | Partial | Core surfaces exist, but reliability/perf targets unproven.                                                                                                                                                                                  |
| Music setup (upload)                     | Mobile + `/sessions/:id/music`              | Yes            | Partial   | Partial        | No              | Partial | Requires runtime confirmation on APK with real API base.                                                                                                                                                                                     |
| Music setup (YouTube/Bilibili link)      | Mobile + `/sessions/:id/music`              | Yes            | Partial   | Partial        | No              | Partial | Prior user report indicates runtime instability; needs targeted test.                                                                                                                                                                        |
| Song sections and loop usage             | Song map/workbench                          | Yes            | Partial   | Partial        | No              | Partial | Loop seamlessness target not yet evidenced.                                                                                                                                                                                                  |
| Clip tagging                             | Tag sheets + API tags/history               | Yes            | Yes       | Partial        | N/A             | Partial | Feature exists broadly; needs regression pass on latest APK.                                                                                                                                                                                 |
| Library search/filter                    | Mobile + `/library`                         | Yes            | Yes       | Partial        | N/A             | Partial | Should validate query/filter parity with PRD matrix.                                                                                                                                                                                         |
| Share create/revoke                      | Mobile + API share routes                   | Yes            | Yes       | Partial        | N/A             | Partial | Needs re-test with live deployed web share URL.                                                                                                                                                                                              |
| Public feedback submission               | Web share + feedback public API             | Yes            | Yes       | Partial        | N/A             | Partial | Validate open/close request states and comment rendering.                                                                                                                                                                                    |
| Profile/plan entry points                | Mobile + billing routes                     | Yes            | Partial   | Partial        | N/A             | Partial | Billing deferred for soft launch; verify non-crashing UX.                                                                                                                                                                                    |
| Offline/retry behavior                   | Mobile cache + write/upload queues          | Yes            | Yes       | Partial        | No              | Partial | Shared retry/timeout pipeline now wired in Home/Workbench/Music setup; runtime reliability benchmark still required.                                                                                                                         |
| Error/loading/empty states               | Mobile/web key screens                      | Yes            | Partial   | Partial        | N/A             | Partial | Standardized recoverable timeout/offline/retry copy added for key flows; audit per screen still required.                                                                                                                                    |
| Phase 2 micro-cycle (loop->capture->tag) | Workbench + camera                          | Yes            | Yes       | Partial        | No              | Partial | Formal engineering evidence attached (build/lint/type + flow wiring). Device runtime timing run still required for full `Done`.                                                                                                              |
| Phase 3 cleaning/review depth            | `clip-player.tsx`                           | Yes            | Yes       | Partial        | No              | Partial | Loupe/review tooling wired and stabilized; formal device replay/timing evidence still required for full `Done`.                                                                                                                              |
| Phase 4 structured collaboration         | Web `ClipPlayer` + feedback API             | Yes            | Yes       | Partial        | N/A             | Partial | Structured feedback categories now normalized server-side and exposed in response payload for roundtrip consistency. Live end-user roundtrip capture still required for full `Done`. Cross-ref: [W9-C] b0936641-2685-4c72-bcca-4d9e848842db. |
| Phase 5 formation mapping                | `SpatialTab` + moments                      | Yes            | Yes       | Partial        | No              | Partial | Formation persistence path now surfaces `synced/pending/conflict` status and assembly endpoints include revision tokens for conflict detection. Multi-device runtime persistence run still required for full `Done`.                         |


## Current release interpretation

- Engineering build gates are currently green.
- Monorepo lint is not fully green yet due pre-existing baseline issues in `@roam/types` and `@roam/api`.
- PRD feature surface is broad, but many items remain `Partial` because measured runtime evidence is missing.
- Product should not be marked as fully PRD-accepted until the runtime protocol is completed and evidence is attached.

### May 2026 UX / tablet notes (code landed; verdicts unchanged)

- Premium workbench + tab chrome (`PremiumTabHeader`) on Song map, Spatial, Group.
- Clip detail sheet: Loop / Trim / Share / Keep actions + horizontal other-takes row.
- iPad landscape: `useTabletLandscape` + `SessionTabletShell` split layout (sidebar tabs, main canvas, section/loop/takes panel).
- Spatial: pen/erase/undo/snap freehand strokes persisted in moment `formation.freehandStrokes`.
- Collab: `CollabStatusBar` + [COLLAB_SYNC.md](./COLLAB_SYNC.md). Device proof: [MOBILE_DEP3_SMOKE.md](./MOBILE_DEP3_SMOKE.md).

**Do not set matrix rows to `Done` without device evidence per [RUNTIME_ACCEPTANCE_PROTOCOL.md](./RUNTIME_ACCEPTANCE_PROTOCOL.md).**

## Ticket correction: [W10-C] (`0487d433-9f11-49e1-bdfd-65a393e1bff0`)

- `music-setup.tsx` is intentionally retained and is actively navigated to from `WorkbenchTab.tsx` via `handleMusicSetupRemoved` -> `router.push('./music-setup', { sessionId })`.
- `music-setup` is the first step of the Workbench add-music flow (URL entry -> `POST /sessions/:id/music` -> redirect to `youtube-player`).
- The `Tabs.Screen` registration in `apps/mobile/app/(app)/_layout.tsx` using `href: null` is correct and intentional: hidden from tab bar while still navigable.
- Acceptance criteria requiring deletion of `apps/mobile/app/(app)/session/music-setup.tsx` or removal of its route registration are removed as contradictory.
- Added acceptance criterion: ticket documents that `music-setup` is intentionally retained as the Workbench add-music entry point.

## Ticket reconciliation: [DOC-X1] (`e4ba3048-9656-444b-95a1-a84e380ed4bb`)

- `ClipPlayer.tsx` feedback category chips (Idea/Timing/Spacing/Energy): **KEEP** — intentional web-share complement to [W9-C] structured feedback ticket (`b0936641-2685-4c72-bcca-4d9e848842db`). Categories prefix submitted comment text; no schema change required.
- PRD matrix Phase 2–5 row upgrades: **KEEP** — rows now accurately reflect implemented ticket evidence (W3-C, W9-A, W9-C, W11-A, etc.). Verdicts remain `Partial` pending runtime evidence.
- W10-C ticket correction section: **KEEP** — accurately documents intentional retention of `music-setup.tsx`.
- No TypeScript errors in `apps/web` at time of reconciliation.
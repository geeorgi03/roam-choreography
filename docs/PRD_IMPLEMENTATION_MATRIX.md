# ROAM PRD Implementation Matrix

Last updated: 2026-04-18

This matrix is the living source of truth for implementation and acceptance.

Status legend:
- `Done`: implemented and runtime-validated against acceptance criteria.
- `Partial`: code exists, but runtime or quality evidence is incomplete.
- `Not Done`: not implemented end-to-end.

| PRD Feature | Primary Surface | Exists in Code | Wired E2E | Runtime Tested | Perf Target Met | Verdict | Notes |
|---|---|---|---|---|---|---|---|
| Auth sign up/in | Mobile + Supabase | Yes | Yes | Partial | N/A | Partial | Needs device regression pass for callback and cold start auth restore. |
| Home two-door entry | `apps/mobile/app/(app)/index.tsx` | Yes | Partial | Partial | No | Partial | UX flow present; needs latency and tap-budget evidence. |
| Record from Home | `apps/mobile/app/(app)/session/camera.tsx` | Yes | Partial | Partial | No | Partial | Reported runtime issues in prior APK builds need fresh verification. |
| Quick-save (Later/New/Existing) | `apps/mobile/components/QuickSaveSheet.tsx` | Yes | Partial | Partial | No | Partial | Branching paths implemented, but acceptance measurements pending. |
| Inbox flow | Mobile + API inbox routes | Yes | Partial | Partial | No | Partial | Needs measured stop->inbox persist under target. |
| Session workbench tabs | Session routes + components | Yes | Partial | Partial | No | Partial | Core surfaces exist, but reliability/perf targets unproven. |
| Music setup (upload) | Mobile + `/sessions/:id/music` | Yes | Partial | Partial | No | Partial | Requires runtime confirmation on APK with real API base. |
| Music setup (YouTube/Bilibili link) | Mobile + `/sessions/:id/music` | Yes | Partial | Partial | No | Partial | Prior user report indicates runtime instability; needs targeted test. |
| Song sections and loop usage | Song map/workbench | Yes | Partial | Partial | No | Partial | Loop seamlessness target not yet evidenced. |
| Clip tagging | Tag sheets + API tags/history | Yes | Yes | Partial | N/A | Partial | Feature exists broadly; needs regression pass on latest APK. |
| Library search/filter | Mobile + `/library` | Yes | Yes | Partial | N/A | Partial | Should validate query/filter parity with PRD matrix. |
| Share create/revoke | Mobile + API share routes | Yes | Yes | Partial | N/A | Partial | Needs re-test with live deployed web share URL. |
| Public feedback submission | Web share + feedback public API | Yes | Yes | Partial | N/A | Partial | Validate open/close request states and comment rendering. |
| Profile/plan entry points | Mobile + billing routes | Yes | Partial | Partial | N/A | Partial | Billing deferred for soft launch; verify non-crashing UX. |
| Offline/retry behavior | Mobile cache + write/upload queues | Yes | Partial | Partial | No | Partial | Queue behavior exists; runtime reliability benchmark still required. |
| Error/loading/empty states | Mobile/web key screens | Partial | Partial | Partial | N/A | Partial | Standardization in progress; audit per screen required. |
| Phase 2 micro-cycle (loop->capture->tag) | Session flows | Partial | Partial | No | No | Not Done | Needs explicit E2E validation script and implementation polish. |
| Phase 3 cleaning/review depth | Clip player/review UX | Partial | Partial | No | No | Not Done | Requires completion of review tool parity with PRD intent. |
| Phase 4 structured collaboration | Feedback and collaboration workflows | Partial | Partial | No | N/A | Not Done | Feature surface exists but not validated as full structured flow. |
| Phase 5 formation mapping | Spatial/group | Partial | Partial | No | No | Not Done | Screens exist; full PRD behavior not yet acceptance-tested. |

## Current release interpretation

- Engineering build gates are currently green.
- Monorepo lint is not fully green yet due pre-existing baseline issues in `@roam/types` and `@roam/api`.
- PRD feature surface is broad, but many items remain `Partial` because measured runtime evidence is missing.
- Product should not be marked as fully PRD-accepted until the runtime protocol is completed and evidence is attached.


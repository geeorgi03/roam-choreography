# Roam — Implementation status and next steps (handoff)

**Last updated:** April 18, 2026  
**Audience:** Engineers and stakeholders picking up the codebase

---

## 1. What this product is

**Roam** is a mobile-first choreography workspace: capture clips, attach them to sessions and music, tag and search, share a read-only link, and collect feedback. The repo is a **pnpm + Turborepo** monorepo: **Expo mobile**, **Hono API**, **Next.js web** (share viewer), `**@roam/types` / `@roam/db`**, and `**roam-music**` (Python audio analysis).

Related narrative docs: `docs/ROAM_PROJECT_GUIDE.md`, `APP_OVERVIEW.md`, and `ROAM_CONSOLIDATED_PROJECT_PLAN.md`.

---

## 2. What has been built (substantive code)

### 2.1 Shared contracts and data layer

- `**packages/types**` — Central types for users, sessions (including `phrase`, optional `quality_target`), clips (including `clip_type`, `parent_clip_id`, timing fields), music tracks (`source_type` / `source_url`, analysis fields), comments, feedback, etc.
- `**packages/db**` — Supabase-oriented helpers; builds successfully alongside types in typical turbo runs.

### 2.2 Backend API (`apps/api/src`)

Routed modules cover the main product surface: **sessions**, **clips**, **Mux upload**, **music**, **assembly**, **share**, **feedback** (and public feedback), **library**, **inbox**, **note pins**, **annotations**, **tag history**, **billing** / **Stripe**, **webhooks**, **auth middleware**, **plan gating** (`planGate.ts`). That is a **broad** REST surface aligned with the PRD-style docs.

### 2.3 Web app (`apps/web`)

Next.js app for **shared session viewing** and related flows (per architecture docs). Confirm production builds with:

`pnpm exec turbo run build --filter=@roam/web`

### 2.4 Mobile app (`apps/mobile`)

**Screens and routing (Expo Router, TypeScript under `app/`):**

- Authenticated shell: `(app)/_layout`, **home** `index`, **inbox**, **library**, **profile**, **map**.
- **Session**: `[id]` workbench, **camera**, **clip-player**, **music-setup**, **youtube-player**, **spatial**, **song-map**, **group**.
- **Auth**: sign-in, sign-up, callback, layouts.

**Supporting systems:**

- **Supabase auth**, **API client** (`API_BASE`), **offline session list cache** (`sessionCache`), **NetInfo** fallback to cache.
- **SQLite** clip persistence (`lib/database.ts`, `ClipRow` including `source_url`).
- **Upload queue** service (referenced from root layout).
- **Bottom sheets** (`@gorhom/bottom-sheet`), **i18n** (`useTranslation`), **MMKV** for home persistence (`last_session_id` with optional auto-redirect to last session).

**Rich UI composition:**

- Session tabs: **Workbench**, **Spatial**, **Song map**, **Group**.
- **Assembly** views/canvas, **clip viewer** sheets, **tag** / **share** / **note pin** / **paywall** / **first session** sheets, transport/loop UI pieces, etc.

### 2.5 Worker (`roam-music`)

Documented Python + Essentia path for BPM / beat grid / sections (see `docs/ROAM_PROJECT_GUIDE.md`).

### 2.6 Documentation claiming “done”

`docs/ROAM_PROJECT_GUIDE.md` §13 and `ROAM_CONSOLIDATED_PROJECT_PLAN.md` list many features as **working** (auth, sessions, music upload/analysis, Mux clips, tagging, assembly, share + web page, public feedback, library search, billing endpoints, note pins, inbox). Treat that as **product intent and partial validation**, not as proof the **current branch** is green in CI or on every device.

---

## 3. Why the app can feel broken (evidence-based)

### 3.1 Build gates status

Current repository status: `@roam/mobile`, `@roam/api`, and `@roam/web` build gates pass in automated runs.
This removes compile-time blocking issues, but does not prove runtime quality or PRD acceptance on devices.

**Error themes (for planning):**


| Theme                                       | Examples / impact                                                                                                                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `**moduleResolution: node16` / `nodenext`** | Imports like `'../lib/supabase'` may need **explicit `.js` extensions** (`profile.tsx`, `_layout.tsx`, `useSession.ts`, `useSupabaseSafe.ts`).                                                                                 |
| **Bottom sheet `ref` vs component props**   | `CaptureSheet`, `ClipShareSheet`, `NotePinSheet` used with `ref={...}` where types say `ref` is not a prop — need `**forwardRef`** or API change. Similar `**RefObject<BottomSheet | null>**` mismatch on `FirstSessionSheet`. |
| `**@roam/types` vs local shapes**           | `**Session`** requires fields like `phrase`; callbacks still typed with slimmer session objects.                                                                                                                               |
| `**ClipRow` contract**                      | `**source_url` required** on `ClipRow`; some constructs omit it (`useClips`, library paths).                                                                                                                                   |
| **Expo Router / React Navigation types**    | e.g. `**presentation`** not in the typed screen options union; route params not narrowed to literal unions.                                                                                                                    |
| **Theme tokens referenced but undefined**   | `**untaggedBg` / `untaggedText`** in `ShareSheet`, `TagSheet`; `**ink**` in `ClipViewerSheetStandalone`. Risk of **runtime style gaps** or inconsistent UI.                                                                    |
| **expo-av / RN types**                      | e.g. `**resizeMode="contain"`** vs `**ResizeMode.CONTAIN**`; conditional style arrays producing `**""**` where `ViewStyle` forbids it.                                                                                         |
| **YouTube iframe**                          | `**setPlaybackRate`** vs available ref API; **wrong arity** on calls — **playback speed / sync** may be wrong.                                                                                                                 |
| **Missing imports / unused**                | e.g. `**useMemo` not imported** in `clip-player.tsx`; many `**noUnusedLocals`** issues (default `React` import, unused destructuring in **WorkbenchTab** — suggests **half-wired UI**).                                        |
| **Stricter clip typing**                    | `**clip_type` on `ClipRow` as `string`** vs helpers expecting `**'MINE' | 'REF' | 'voice_memo'**`.                                                                                                                             |


### 3.2 Repository hygiene

If **compiled `.js` / `.d.ts` / `.map`** files under `apps/mobile/app/` were ever committed, prefer **TS-only routes** + Metro; avoid relying on emitted router artifacts.

### 3.3 Runtime / infra

The app **requires** correct **Supabase**, **API URL**, **Mux**, storage buckets, and (for limits) `**ROAM_BETA_UNLOCK`** per `docs/ROAM_PROJECT_GUIDE.md`. Misconfiguration looks like “nothing works.”

### 3.4 UX / UI quality (code signals)

- **Theme incomplete** relative to components (`untagged*`, `ink`).
- **Home** may delay sheet mount (~300 ms) for Reanimated readiness — fragile startup UX.
- **WorkbenchTab** exposes many handlers/props that appear **unused** — dead code or **not wired** to the intended workbench.
- **Placeholders** may mix languages (e.g. session name in `FirstSessionSheet`) unless intentional.
- `**youtube-player`** may still describe **placeholder** capture behavior for advanced flows.

---

## 4. What still needs to be achieved

### 4.1 Immediate — engineering baseline

1. **Fix `@roam/mobile` `pnpm run build` (`tsc`)** — **P0** until zero errors (or a conscious, documented `tsconfig` change).
2. **Normalize imports** for `nodenext` (`.js` extensions or consistent resolution).
3. **Finish theme tokens** or remove references; align **Spatial / ClipViewer / Share / Tag** styling.
4. `**forwardRef` + typings** for Gorhom sheets used from session screens.
5. **Align `ClipRow` factories** with `**source_url`** and narrow `**clip_type**` to the domain union.
6. **YouTube player**: align with `**react-native-youtube-iframe`** API.
7. **Verify** `@roam/web` and `@roam/api` builds in isolation.

### 4.2 Phase 0 — Capture-first (`ROAM_CONSOLIDATED_PROJECT_PLAN.md`)

Acceptance criteria remain **unchecked** in the plan, including: camera open latency, inbox save latency, **quick-save sheet** (**Later / New / Existing** in ≤3 taps), inbox visibility rules, **voice-only capture** if in scope.

Docs mark **two-door home** as partially there; **quick-save** and **loop** as in progress.

### 4.3 Phase 1 — Session workbench

- **Multi-track timeline** (waveform, notes, clips, loop track) with load performance target.
- **Loop regions**: drag, waveform long-press, section-based loop; **seamless** audio loop.
- **Transport**: speed, mirror, seek — **wired**, not only declared.

### 4.4 Phases 2–5

- **Micro-cycle**: loop → capture → tag under time budget.
- **Cleaning/review**: frame-level review, A/B compare.
- **Structured collaboration**: **Liz Lerman**-style guided feedback.
- **Formation mapping**: floor marks, paths, group coordination at spec fidelity.

### 4.5 Production readiness

- **Supabase audio bucket**, **Mux** credentials and webhooks, `**SHARE_BASE_URL`**, env parity across mobile/web/API.
- **Stripe**: endpoints exist; soft-launch behavior vs `**ROAM_BETA_UNLOCK`** must be explicit before public launch.
- **Device QA** (iOS + Android): performance, permissions, offline edge cases.

---

## 5. Suggested build order for the next iteration

1. **Green mobile `tsc`** (CI, EAS, refactor safety).
2. **Theme + token pass** (fast UI coherence win).
3. **Sheet ref architecture** (capture, tag, share, notes stability).
4. **Phase 0 acceptance** (measurable timings and tap counts).
5. **Phase 1 workbench wiring** (connect or remove dead `WorkbenchTab` props).
6. **End-to-end smoke**: auth → session → music → clip upload → assembly → share URL on web → comment.
7. **Update** `docs/ROAM_PROJECT_GUIDE.md` §13 so “✅” rows match automated checks where possible.

---

## 6. Stakeholder summary

**A large portion of the backend and mobile feature surface exists in code and current builds pass. The remaining gap is runtime quality evidence and feature-completion depth across later phases. Use `docs/PRD_IMPLEMENTATION_MATRIX.md` and `docs/RUNTIME_ACCEPTANCE_PROTOCOL.md` as the operating source of truth for completion and sign-off.**

Re-run builds after changes:

```bash
pnpm exec turbo run build --filter=@roam/mobile
pnpm exec turbo run build --filter=@roam/api --filter=@roam/web
```


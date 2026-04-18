# Roam — Implementation Status, Gaps, and Next Steps

**Purpose:** One consolidated handoff for engineers and stakeholders: what the codebase **actually contains**, what **works when infra is correct**, what is **broken or fragile** (including why the app can feel like it “does not work”), and what to build next—especially **UI polish** and **stability**.

**Last updated:** 2026-04-18 (repo scan + `pnpm exec tsc --noEmit` in `apps/mobile`)

---

## 1. Executive summary

**Roam** is a mobile-first choreography product (sessions, music + beat grid, clips on Mux, assembly, sharing, feedback, library, notes). The **backend, database, worker, and web share surface** are largely in place. The **mobile app carries the most UX surface area** and is where users judge “does this work?”

**Current reality check:**

| Area | State |
|------|--------|
| **Monorepo** | Turborepo: `apps/api`, `apps/mobile`, `apps/web`, `packages/db`, `packages/types`, `roam-music` |
| **Data model / migrations** | **42** SQL migrations under `supabase/migrations/` — broad schema (sessions, clips, music, share, feedback, loops, moments, groups, etc.) |
| **API (Hono)** | Route modules present for sessions, music, clips/Mux, tags, assembly, share, feedback (auth + public), library, inbox, note pins, annotations, billing, webhooks |
| **Mobile (Expo 51)** | Full route tree and large session shell (`session/[id].tsx`) with tabs: Workbench, Song Map, Spatial, Group; many sheets (capture, share, clip viewer, notes) |
| **Engineering health** | `apps/mobile` **does not pass** strict `tsc --noEmit` — dozens of errors (types, refs, theme tokens, imports). Expo may still run in dev in some setups, but **CI/release quality and contributor confidence suffer** |
| **UI / product polish** | PRD and internal docs already call out **empty / “broken-looking” workbench** and Phase 0 polish; theme tokens are **inconsistent** (components reference colors not defined on `theme`) |
| **Docs drift** | `DEPLOYMENT.md` still lists some V1 items as “deferred” while `docs/ROAM_PROJECT_GUIDE.md` marks them ✅ — **reconcile** so smoke scope matches code |

**Bottom line:** The system is **architecturally ambitious and mostly wired**, but the **mobile client needs a stabilization pass** (TypeScript, refs, design tokens) and a **Part 0 / Phase 0 UI pass** so first-run users see a coherent, trustworthy workbench—not dark rows and silent failures.

---

## 2. What was achieved (evidence-based)

### 2.1 Infrastructure and platform

- **Supabase:** Auth, Postgres, RLS-oriented design, RPCs for shared session reads, migrations for major features.
- **Video:** Mux upload URL flow and webhooks in API (`apps/api/src/routes/mux.ts`, `webhooks.ts`).
- **Music analysis:** Python worker `roam-music` (Essentia) integrated with storage/analysis job pattern (documented in `APP_OVERVIEW.md`, `docs/ROAM_PROJECT_GUIDE.md`).
- **Billing hooks:** Stripe-related code paths exist; **soft launch** intentionally uses `ROAM_BETA_UNLOCK=true` to bypass limits (see `DEPLOYMENT.md`, `BETA_UNLOCK.md`).

### 2.2 Backend API (`apps/api`)

Implemented route areas (files under `apps/api/src/routes/`):

- Sessions, music, clips, tags + tag history, assembly, share, authenticated feedback, public feedback, library, inbox, note pins, annotations, Mux helpers, billing, webhooks.

Plan gating logic lives in `apps/api/src/lib/planGate.ts` (enforced when beta unlock is off).

### 2.3 Web app (`apps/web`)

Next.js share experience for `/s/[token]` pattern (described in `APP_OVERVIEW.md`): public session view, Mux playback, feedback submission paths tied to API/Supabase.

### 2.4 Mobile app (`apps/mobile`) — feature surface **present in code**

Routes under `apps/mobile/app/` include:

- **Auth:** `auth/sign-in`, `sign-up`, `callback` (deep link `roam://`).
- **App shell:** Home `index`, Inbox, Library, Profile, Map.
- **Session:** `[id]` (main workbench shell), `camera`, `clip-player`, `music-setup`, `youtube-player`, `song-map`, `spatial`, `group`.

Large UI modules (examples):

- `components/session/WorkbenchTab.tsx` — timeline-style workbench (waveform bars, sections, clips, loops, notes).
- `components/session/SongMapTab.tsx`, `SpatialTab.tsx`, `GroupTab.tsx` — extended session metaphors (song structure, spatial notes, group broadcast).
- Sheets: `CaptureSheet`, `ShareSheet`, `ClipShareSheet`, `NotePinSheet`, `ClipViewerSheet`, paywall/first-session flows on home.

**Interpretation:** From a **product scope** perspective, a lot is **built**. From a **shipping** perspective, the mobile layer needs **quality gates** (typecheck green, smoke matrix completed, UI states).

### 2.5 Documentation already in repo

High-value references (do not duplicate; link internally):

- `APP_OVERVIEW.md` — plain-language full stack + “Current State and Gaps.”
- `docs/ROAM_PROJECT_GUIDE.md` — Section **13. Current Implementation State** (feature table).
- `DEPLOYMENT.md` — **DEP-3 smoke matrix** (checkbox list for soft launch).
- `docs/ROAM_PRD_FINAL.md` / `docs/ROAM_PRD_FINAL__6_.md` — **Part 0** prerequisite: workbench must not look broken on first open.

---

## 3. What is wrong today (why “the app doesn’t work” / UI feels bad)

### 3.1 Strict TypeScript failure (`apps/mobile`)

On 2026-04-18, `cd apps/mobile; pnpm exec tsc --noEmit` exits **2** with **many** errors. Categories observed:

1. **`Session` / `ClipRow` type drift** — e.g. `phrase` required on `Session` but callbacks use narrower objects; `source_url` required on `ClipRow` but constructed objects omit it (`index.tsx`, `library.tsx`, `lib/hooks/useClips.ts`).
2. **`node16` / `nodenext` import extensions** — relative imports expected to include `.js` suffix (`profile.tsx`, `_layout.tsx`, `useSession.ts`, `useSupabaseSafe.ts`).
3. **React refs on sheets** — `CaptureSheet`, `ClipShareSheet`, `NotePinSheet` props don’t accept `ref` the way `session/[id].tsx` passes it (forwardRef / typing mismatch).
4. **Expo Router / header options** — e.g. `presentation` not in typed options (`(app)/_layout.tsx`).
5. **Missing theme tokens** — `ShareSheet`, `TagSheet` reference `theme.untaggedBg` / `untaggedText` that don’t exist on the theme type; `ClipViewerSheetStandalone` references `colors.ink` not in palette.
6. **Incomplete hooks / APIs** — e.g. `clip-player.tsx`: `useMemo` not in scope; `youtube-player.tsx`: wrong method on YouTube ref, wrong arity on a call.
7. **Style array typing** — `""` (empty string) in style arrays causes invalid `ViewStyle` / `TextStyle` unions (`ClipViewerSheet`, `SpatialTab`).
8. **Noise:** unused `React` default imports with `noUnusedLocals` (`TS6133`) across many files.

**Impact:** Anything from “Metro still runs” to “EAS build breaks” depending on pipeline. It **always** hurts velocity and hides real bugs.

### 3.2 UI / UX (product + implementation)

Aligned with PRD “Part 0” language:

- **Workbench first impression:** Without music/analysis, the timeline can look like **inert dark rows**; users bounce before discovering capture/music flows.
- **Progressive disclosure vs. complexity:** Session has **many tabs and sheets**; without **onboarding, skeletons, and explicit empty states**, the product reads as unfinished.
- **Boot ordering hack:** Home screen delays BottomSheet mount (`setSheetsReady` timeout) to work around Reanimated readiness — **symptom of fragile UI infrastructure**, not a long-term fix.
- **Theme consistency:** Missing tokens and ad-hoc colors undermine a cohesive design system.

### 3.3 Environment and operations (not “bugs” but block real usage)

From `DEPLOYMENT.md` / `APP_OVERVIEW.md`:

| Requirement | If missing |
|-------------|------------|
| Supabase project + migrations | Auth/data fail |
| `EXPO_PUBLIC_*` and API URL | Mobile cannot reach backend |
| Mux credentials + webhook | Clips stuck not `ready` |
| `audio` bucket / policies | Music file path fails |
| `roam-music` worker running | No BPM/sections |
| `SHARE_BASE_URL` wrong | Share links point to localhost or wrong host |
| `ROAM_BETA_UNLOCK` off without Stripe/plan work | Users hit limits |

### 3.4 Repository hygiene (git)

Git status showed **deleted** compiled `app/**/*.js` + `.d.ts` under `apps/mobile/app/` — likely **build artifacts that should never live next to source**. Source of truth routes are **`*.tsx`**. Ensure `.gitignore` excludes emitted JS in `app/` and **don’t commit** Metro/tsc output beside routes.

---

## 4. Documentation conflicts to fix

| Topic | `DEPLOYMENT.md` says | `docs/ROAM_PROJECT_GUIDE.md` says |
|-------|----------------------|-----------------------------------|
| Assembly / feedback / annotations | Listed under “deferred / not soft-launch scope” (older wording) | Marked ✅ working |

**Action:** Pick one source of truth for **soft-launch scope** (recommend: **smoke matrix in `DEPLOYMENT.md`** + code) and update the other doc in a single editorial pass.

---

## 5. What still needs to be achieved (prioritized)

### Tier A — “App actually shippable” (engineering)

1. **Make `apps/mobile` pass `tsc --noEmit`** (or deliberately narrow `tsconfig` *once*, with team agreement—prefer fixing types).
2. **Fix sheet ref pattern** — unify `forwardRef` + `BottomSheet` types for `CaptureSheet`, `ClipShareSheet`, `NotePinSheet`, `FirstSessionSheet`, etc.
3. **Align shared types** — `Session`, `ClipRow`, and API DTOs in `@roam/types` must match **all** construction sites (`useClips`, library mapping, callbacks).
4. **Theme completion** — add `untaggedBg`, `untaggedText`, `ink` (or refactor components to use existing tokens only).
5. **Resolve `clip-player` / `youtube-player` runtime bugs** (missing imports, API mismatches)—these are user-visible media failures.
6. **CI:** Add `pnpm --filter @roam/mobile build` (tsc) and API/web checks to Turbo pipeline so regressions cannot merge silently.

### Tier B — “App feels professional” (Part 0 / UI)

1. **Workbench empty state** — Always show: **clear primary actions** (Add music / Record / Open inbox), short copy, subtle preview or illustration—not blank chrome.
2. **Loading / analysis states** — When `isAnalysing` or music pending, show **determinate progress** or staged steps (user trust).
3. **Onboarding** — First session: `FirstSessionSheet` flow should be **unskippable** until success or explicit “explore demo.”
4. **Navigation clarity** — Tab labels, icons, and **one-line context** (“Song map = sections”, “Spatial = body/space notes”) — reduce cognitive load.
5. **Replace BottomSheet boot hack** with a root-level readiness gate (e.g. don’t render sheets until app layout + Reanimated initialized)—document the pattern.

### Tier C — Product depth (post–Part 0)

Items already framed as in-progress in `ROAM_PROJECT_GUIDE.md`:

- Two-door home screen refinement  
- Quick-save sheet polish  
- Loop regions + repetition UI  
- Voice note inline playback polish  
- Group/spatial advanced flows (large files already exist—need UX QA)

### Tier D — Launch and monetization

- Complete **Stripe** wiring; turn **`ROAM_BETA_UNLOCK` off** only when gates are tested.  
- **Store submission** (EAS profiles exist—see `DEPLOYMENT.md`).  
- **Performance QA** on mid-range Android (video + waveform + sheets).

---

## 6. Suggested immediate next steps (1–2 week sprint shape)

**Week 1 — Stabilize mobile**

1. Fix TypeScript categories in §3.1 in order: types → theme → refs → media players.  
2. Run `DEPLOYMENT.md` DEP-3 matrix on a **physical device** with production API + Mux + worker.  
3. Log every failure with **screen, env, and network** (Supabase vs API).

**Week 2 — Part 0 UI**

1. Redesign workbench **empty and loading** states (Figma or in-code tokens only).  
2. Unify typography/spacing using `lib/theme.ts` only—no orphan hex.  
3. Remove or gate experimental tabs behind a **dev flag** until polished (optional product call).

---

## 7. How to verify “done” for the next milestone

Definition of done for **“Mobile Beta Credible”**:

- [ ] `pnpm exec tsc --noEmit` passes in `apps/mobile`  
- [ ] No undefined theme keys in `ShareSheet` / `TagSheet` / clip viewer  
- [ ] Session `[id]` opens on cold start without sheet/Reanimated glitches  
- [ ] New user can: **sign in → create session → add YouTube music → see grid → record clip → see upload to ready → tag → share link**  
- [ ] DEP-3 smoke matrix in `DEPLOYMENT.md` all checked on **staging + production** URLs  

---

## 8. Appendix — file anchors

| Concern | Where to look |
|---------|----------------|
| Session UI shell | `apps/mobile/app/(app)/session/[id].tsx` |
| Workbench | `apps/mobile/components/session/WorkbenchTab.tsx` |
| API entry | `apps/api/src/index.ts` |
| Share / public | `apps/api/src/routes/share.ts`, `feedbackPublic.ts`; `apps/web` |
| Migrations | `supabase/migrations/*.sql` |
| Soft launch ops | `DEPLOYMENT.md`, `PRODUCTION_READINESS_REPORT.md` |

---

*This document is meant to supersede scattered status claims when they disagree with the repo or tooling. Update it when TypeScript is green and when DEP-3 is signed off.*

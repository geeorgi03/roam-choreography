# Roam — UX/UI scope brief for Claude (design)

**Use this as the main `.md` you paste into Claude** when redesigning Roam. Attach screenshots separately (see §10). Do **not** paste the full PRD unless you need deep feature specs.

**Last updated:** 2026-05-21

---

## 1. One-liner

**Roam is a mobile-first choreography studio tool:** capture movement fast, organize it in **sessions** (song + sections + clips), review with loops and loupe, plan **spatial** formations, and **remember** past work — without scoring, streaks, or social feeds.

Mission (product): **“Roam remembers so the choreographer doesn’t have to.”**

---

## 2. Design philosophy (non-negotiable)

Roam is a **proper tool** (Procreate / Logic / Blender class), not a coach or social app.

> **Roam shows the state of the work. It never evaluates it, measures it, or nudges the choreographer toward any outcome. The artist always knows better than the tool.**

**Ship test for every screen:** *Does this **show** the work, or **evaluate** the work?* Only “show” ships.

| Do | Don’t |
|----|--------|
| Empty sections because nothing exists yet | Progress rings, “3/5 sections done” |
| Reopen session → work exactly as left | “Great job”, streaks, gamification |
| Factual status: offline, syncing, conflict | AI “quality score”, posture grades |
| Assist **recall** (find similar past choreo) | Generate choreography, replace authorship |
| Calm, dense-but-readable tool UI | Marketing landing page aesthetic |
| One primary action per screen | Deep modal stacks |

**AI stance:** Workflow first. Vision/AI is **invisible infrastructure** (indexing, crop) — never the hero headline of the product.

---

## 3. Who & where

| | |
|--|--|
| **Primary user** | Choreographer or rehearsal lead |
| **Context** | Studio: variable light, noise, one-handed phone, long tablet sessions |
| **Jobs** | Capture ideas before/at song; loop a section; file clips to the right section; remember “have I done this phrase before?”; assign/share for feedback |
| **Platform priority** | **Android tablet first**, then phone; iOS later |
| **Stack (for handoff)** | React Native + Expo 51, existing `apps/mobile/lib/theme.ts` tokens |

---

## 4. What Roam is NOT

- Not a full video editor (trim/mirror/light tools only — not CapCut)
- Not Labanotation / formal dance notation
- Not 3D formation simulator (2D floor grid only)
- Not a social network (no feed, likes, followers, discovery)
- Not a teaching platform with automated grading
- Not “AI dance generator” or movement quality scorer

---

## 5. Information architecture (surfaces)

Design **phone + tablet** for the same IA; tablet adds **regions** (rail / canvas / inspector), not a stretched phone.

### Tabs / main entry

| Surface | Role |
|---------|------|
| **Home** | Sessions hub — continue, create, quick capture |
| **Song** | Active session’s music map (sections, timing) — jumps into session workbench |
| **Library** | Cross-session clips, search, filters (MINE / REF / Shared), **marking search** |
| **Inbox** | Capture-first clips not yet assigned to a session |
| **Profile** | Auth, language, developer settings (API URL) |

### Session stack (hidden tab — opened from Home / Song)

| Surface | Role |
|---------|------|
| **Session workbench** | Default “return” surface — sections, takes, transport, notes |
| **Capture / camera** | Record REF or MINE, voice memo, dual camera (optional) |
| **Clip player / loupe** | Review one clip — zoom loupe, compare takes |
| **Spatial** | 2D floor grid — formations, moments, pen tool |
| **Group** | Rehearsal / multi-participant view (collab) |
| **Music setup** | Reference track (YouTube/Bilibili etc.) |

### Supporting flows

- **Quick save** after record → Inbox vs session vs new session (≤3 taps to assign)
- **Share** — view-only link for structured feedback (not public feed)
- **Marking search** — user marks choreography at ~50% energy; app finds similar clips in **their** library (recall, not judgment)

---

## 6. Priority for redesign (P0 → P1)

### P0 — Must feel excellent (design these end-to-end)

1. **Home → create / continue session**
2. **Capture → quick save → assign** (capture-first)
3. **Session workbench** — loop A/B in ≤2 taps, persists across app restart
4. **Song map / sections** — timing clarity, empty truth
5. **Library + clip open** — search, filters, viewer sheet
6. **Reliability states** — offline banner, loading, retry, human errors (no silent fail)

### P1 — Target frames (can label “later” in Figma)

- Spatial / formation tablet layout
- Group / collab status
- Premium workbench (tablet landscape)
- Marking search modal (library entry)
- Structured feedback viewer

### P2 — Moat / memory (design lightly; don’t lead marketing)

- Marking search quality, genealogy between clips
- Richer notation toggle (optional score-literate mode per PRD)

---

## 7. Layout rules (tablet vs phone)

| | Phone | Tablet |
|--|-------|--------|
| Navigation | Bottom tabs | Left rail or persistent tabs + **wide canvas** |
| Workbench | Vertical stack | **≥60% width** for timeline/player; tools in rail or bottom dock |
| Landscape | Optional | **Horizontal timeline** or player + list split |
| Touch | ~44pt min targets | Same; more horizontal density OK |
| Sheets | One bottom sheet layer | Prefer side inspector over sheet-on-sheet |

**Visual bar:** Premium **dark studio** tool (warm off-white text, coral accent, teal “mine” accent) — see token snapshot below. References on disk: `UI Premium Example`, `UI Tool Example`, `App Build` (screenshots).

---

## 8. Theme snapshot (engineering tokens — align Figma)

From `apps/mobile/lib/theme.ts` (dark / “daylight studio” palette in app):

| Token | Hex / note |
|-------|------------|
| ground | `#14120F` |
| chrome / surfaces | `#1A1815` → `#2C2924` |
| active text | `#F4EBD6` |
| muted | `#B8B3A8` |
| primary / capture / coral | `#E06E3F` |
| mine / loop accent (teal) | `#7DB9A8` |
| border | `#3A3530` |
| error | `#F44336` |

Typography: display family for titles (see theme); body clear at 14–16sp. **8pt spacing grid** recommended in Figma.

---

## 9. Glossary (dance + product)

| Term | Meaning in Roam |
|------|-----------------|
| **Session** | One choreographic workspace (song + sections + clips) |
| **Section** | Named slice of the song / piece (e.g. chorus A) |
| **Clip / take** | One video recording (MINE = your attempt, REF = reference) |
| **Inbox** | Clips captured before assigned to a session |
| **Loop** | A/B points on timeline for rehearsal |
| **Loupe** | Magnifier on video for detail review |
| **Spatial** | 2D floor formation map |
| **Marking** | Dancing choreography at ~50% energy (not full out) — rehearsal habit |
| **Marking search** | Short marked clip → find similar choreography in **user’s library** |
| **REF / MINE** | Reference video vs dancer’s own take |

---

## 10. What to attach besides this file

| Attach | Why |
|--------|-----|
| **5–15 screenshots** of current app (ugly is OK) | Honest baseline — label “current” |
| **3–5 reference images** from `UI Premium Example` | Visual target |
| **2–3 reference images** from `UI Tool Example` | Density / Procreate-like chrome |
| **Optional:** one flow you care about most | e.g. “redesign workbench only” |

**Do not attach:** full `APPLY_ALL_MIGRATIONS.sql`, API keys, entire PRD (2000+ lines) unless doing a spec audit.

---

## 11. Claude prompt starter (paste after this doc)

```text
You are a senior product designer for premium creative tools (Procreate-class).

Read ROAM_UX_SCOPE_FOR_CLAUDE.md as source of truth.

Task: [e.g. Redesign Session Workbench for Android tablet landscape + phone portrait]

Deliver in order:
1) IA + user flows (happy / empty / error)
2) Wireframes in words per breakpoint
3) Figma-ready component list + tokens
4) Copy (labels, errors) in product voice — calm, factual, never evaluative
5) P0 vs P1 frame labels

Constraints: show-the-work philosophy; no social feed; no scoring; one primary action per screen; max one sheet layer.

Success: [e.g. set A/B loop in ≤2 taps; assign clip to session in ≤3 taps from capture]
```

---

## 12. Deeper docs (only if Claude needs more)

| File | Use when |
|------|----------|
| `docs/FIGMA_ROAM_UX_DESIGN_PROMPT.md` | Extended Figma/master prompt + deliverables checklist |
| `docs/CLAUDE_DESIGN_UX_GUIDE.md` | How to prompt Claude for UX iterations |
| `docs/ROAM_PRD_CANONICAL.md` | Acceptance criteria / P0 requirements (engineering) |
| `docs/ROAM_PROJECT_GUIDE.md` | Long product + technical overview |
| `docs/PRD_IMPLEMENTATION_MATRIX.md` | What’s actually built vs partial (avoid designing fantasy-only flows as P0) |
| `docs/V3_TOKEN_MAP.md` | Extra token mapping if aligning to V3 naming |

**Canonical PRD rule:** `docs/PRD_SOURCE_OF_TRUTH.md` → use `ROAM_PRD_CANONICAL.md` for specs, not duplicate `ROAM_PRD_FINAL*.md` drafts.

---

## 13. Choreography Tool v1.1 (implemented in mobile)

When `USE_CHOREOGRAPHY_UI` is true (`apps/mobile/lib/choreographyUiFlag.ts`):

- Session + app tabs use Figma Make tokens (`lib/choreographyTheme.ts`)
- Workbench canvas modes: **video** (Mux HLS), **practice** (loupe), **draw**, **compose**
- Tool rail: Sections, Lyrics, Takes, mode switches
- Fonts: Barlow Condensed, DM Sans, DM Mono via `expo-font`

PRD: `docs/ROAM_PRD_CANONICAL.md` §5.6 (`P1-REQ-005`).

---

## 14. Current build honesty (so designs are achievable)

- Mobile app exists (`apps/mobile`) but many PRD items are still **Partial** — design **target** UX and tag **P0 / P1**.
- Core stack: Supabase auth, Mux video, Render API, offline/local SQLite for clips.
- Tablet landscape / premium workbench is an active direction; phone tabs are the current shell.
- Marking search: library modal + API — v1 uses coarse similarity (iterate UX anyway).

---

## 14. Explicit rejects for UX exploration

Do not propose screens for:

- Movement quality score / “angle good?”
- AI-generated choreography
- Streaks, XP, completion percentage per section
- Public discover feed
- Notifications that nag users to open the app for engagement

---

*This brief is the single scope doc for Claude Design. Update §8–§13 when tokens or ship status change.*

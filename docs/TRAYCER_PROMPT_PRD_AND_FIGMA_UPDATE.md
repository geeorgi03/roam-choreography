# Traycer — one copy-paste (everything)

Use the **single block below** for Traycer, Cursor notes, or planning. Nothing else in this file is required to copy.

---

```
TITLE (optional): Roam PRD __6_ + Figma loupe — incremental delta (do not reset in-flight work)

HARD CONSTRAINT — read first:
Multiple tickets are already in progress. Do NOT reset, bulk-close, archive, or mass-re-scope the backlog. Append loupe + Figma updates as NEW items only. Preserve assignees, statuses, and current priority order unless I explicitly change a ticket. No “big bang” replan that wipes momentum.

---

## Roam — PRD and Figma update for planning (incremental, not a reset)

### Context
You previously aligned implementation with docs/ROAM_PRD_FINAL.md and the ROAMV3 Figma file. We are NOT replacing the whole product spec. Treat this as a small delta on top of existing Phase 1 / V3 work. The newer PRD is not that different from the previous one.

### In-flight work — do not reset
Several tickets are already in progress. This PRD/Figma update must NOT cancel, archive, or re-scope existing in-flight items unless the assignee explicitly agrees. Preserve all current ticket state, owners, and ordering. Add loupe and Figma "ref-viewer · loupe" as NEW work items (or sub-tasks) that stack on the current backlog — default priority after or alongside existing P0 unless we explicitly promote loupe.

### Canonical PRD files
- Previous: docs/ROAM_PRD_FINAL.md — still the baseline for most requirements.
- Newer: docs/ROAM_PRD_FINAL__6_.md — almost the same document with a few differences.

### How __6_ differs from ROAM_PRD_FINAL.md (important)

Additive (main product change):
- Screen 4 extension — loupe zoom: circular magnifier over the in-app reference / session media video (pinch 2–3×, drag to reposition, fixed top-right dismiss/toggle ≥56dp with clearance above scrub, state persists per video/clip, view-only — does not change REF clip framing). Full acceptance criteria are in __6_ under that heading.

Also in __6_ but easy to miss:
- Header date bumped to April 2026.

Removed in __6_ vs older file (doc-only shrink; decide if we still want these as policy):
- "Dual-screen capture scope (explicit)" bullets under Decision 3.
- "V3 Page Coverage Requirement (Design → App)" (mandatory Figma pages list).
- Some "Scope split" / partition-view acceptance bullets under music notation (Req 11).
- "Appendix A — Early Listener Synthesis".

Action for Traycer: Default planning stays on the same roadmap as before. Add one new workstream: loupe (scoped first to native video / clip-player, not blocked on YouTube iframe). Optionally open a follow-up doc task: merge loupe into a single canonical ROAM_PRD_FINAL.md OR restore any removed paragraphs we still want as engineering policy.

### Figma (ROAMV3)
- File: https://www.figma.com/design/paoFtKOdkkoSAD02Intbjc/ROAMV3
- New page: ref-viewer · loupe — light row + · night row (explicit roam variable mode Night on night frames).
- Components on canvas: Loupe / dismiss-toggle, Loupe / lens (plus variable-bound fills from roam tokens).
- Repo briefs: docs/FIGMA_LOUPE_SPEC.md, docs/FIGMA_LOUPE_DESIGN_PROMPT.md, docs/figma-plugin-api-loupe-page.js

### Product / IA note (already in repo docs)
Session media viewer: one viewer pattern for REF and MINE; source is a variant (badge/actions), not a second app. See docs/V3_COVERAGE_AUDIT.md notes and docs/CURSOR_PROMPT_REF_VIEWER.md.

### Implementation pointer for dev (Cursor)
Ready-made Agent prompt: docs/CURSOR_PROMPT_LOUPE.md (v1 = clip-player.tsx + expo-av first; YouTube deferred unless separately designed).

### Ask (Traycer)
0. Keep all in-progress tickets as-is — only append loupe-related tasks; do not mass-reprioritize or close work already started unless duplicated.
1. Update task graph / backlog to include loupe without de-prioritizing existing P0 (song-map, spatial, group, workbench, ref-viewer parity).
2. Do not assume the entire PRD changed — only the loupe section + minor doc diffs above.
3. Flag dependencies: loupe UI ↔ storage key or API field for persisted loupe state; gesture scope vs existing scrub/controls.
4. If Traycer tracks Figma parity, add ref-viewer · loupe frames as P1 design-complete / P0 if ref-viewer is on critical path for the founder metric.

Repository: monorepo "Cursor 2 V3" — Expo mobile apps/mobile, API apps/api. Use existing Traycer project linkage if configured.

---

ONE-LINE SUMMARY:
Same PRD as before plus Screen 4 loupe; Figma page ref-viewer · loupe (light/night). __6_ also drops some appendix/V3 policy text — merge back if still required. Implement loupe first on clip-player / native video; YouTube iframe later.
```

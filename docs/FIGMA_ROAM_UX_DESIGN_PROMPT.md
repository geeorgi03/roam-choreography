# Figma design brief — Roam mobile UX (phone + tablet)

**Use this document as:** a copy-paste **master prompt** for Figma (Make / Dev Mode prompts), for a human designer, or for an AI agent driving Figma via MCP. It aligns UX direction with your local references and existing docs.

---

## Master prompt (paste into Figma or hand to designer)

```text
You are a senior product designer specializing in premium creative tools (Procreate-class “tool feel”) and disciplined mobile UX.

Product: Roam — a choreography workflow app (React Native + Expo). Roam reduces friction between capturing movement ideas and turning them into reusable, collaborative choreography assets: sessions, capture, music-linked sections, clip review/loupe, structured feedback, and spatial formation planning.

Design goal: Ship Figma files for BOTH phone AND tablet that feel premium in DAY MODE first (light theme as the quality bar), while staying unmistakably a PROFESSIONAL TOOL: calm, dense-but-readable, low chrome noise, generous touch targets, clear hierarchy, predictable patterns — not a social feed, not marketing-site UI.

Tool UX references (interaction philosophy):
- Treat Roam like Procreate: direct manipulation where possible, minimal steps to the primary task, canvas/workspace-first mental model, unobtrusive controls that appear in context, comfortable long-session use on tablet.
- Visual premium references are in the project’s “UI Premium Example” folder — match that level of polish for spacing, typography rhythm, surface hierarchy, and micro-contrast in day mode.

Persona: A choreographer or rehearsal lead using the app in studio conditions: variable lighting, possible one-handed phone use, extended tablet sessions. They need trust (sync, errors, undo affordances) and speed.

Hard constraints:
- Touch targets ~44pt minimum (document exceptions if any).
- Respect safe areas; tablet layouts must use horizontal space deliberately (side panels, split view, or tool rails) — never a stretched phone layout.
- One clear primary action per screen; avoid deep modal stacks (prefer one sheet layer with obvious dismiss).
- Every MAIN screen needs: default, empty, loading, and error states + short, human copy.
- Performance-aware UX: prefer skeletons and progressive disclosure over decorative clutter.

Engineering reality (scope honesty):
- The live app does not yet have every tab/flow fully built or polished; your Figma should still define the TARGET experience so engineering can converge. Label frames clearly as P0 (ship next) vs P1 (later) where you infer gaps.

Deliverables in Figma:
1) Cover page: assumptions, grid (e.g. 8pt), type scale, color tokens for DAY MODE, elevation/shadow rules, corner radii.
2) Phone: key flows at 390×844 (or your chosen baseline) — session shell + primary tabs as designed.
3) Tablet: same flows at 834×1194 (11" portrait) AND 1194×834 (landscape) — show how chrome, timelines, and inspectors reorganize — tool-like density without cramping.
4) Component library page: buttons, sheets, list rows, video/loupe placeholders, timeline/section chips, status pills (syncing / conflict / offline).
5) Interaction notes: short sticky comments on gestures (swipe, long-press), haptics (when meaningful), and where bottom sheets vs full screens are used.

Source assets on disk (import into Figma as reference boards — do not redraw trademarks):
- App screens / build references: C:\Users\Georges\Documents\Cursor 2 V3\App Build
- Premium day-mode visual bar: C:\Users\Georges\Documents\Cursor 2 V3\UI Premium Example
- Tool-like UX inspiration (layout + control philosophy): C:\Users\Georges\Documents\Cursor 2 V3\UI Tool Example

Read and align with internal UX methodology (tokens, flows, edge states):
- C:\Users\Georges\Documents\Cursor 2 V3\docs\CLAUDE_DESIGN_UX_GUIDE.md

Product / technical context (surfaces, domains, “tool” positioning):
- C:\Users\Georges\Documents\Cursor 2 V3\docs\ROAM_TECHNICAL_FOUNDER_REPORT.md

Prioritize flows (design end-to-end in Figma):
A) Home / inbox / session entry → pick or create session
B) Capture → quick save → attach to session
C) Workbench: music + section alignment (timeline mental model)
D) Clip player + loupe review (performance-critical; controls must stay legible)
E) Structured feedback surfaces (mobile + how tablet widens lists/detail)
F) Spatial / formation planning (even if partially built in app — design the target tablet experience: moments, tool state, sync/conflict visibility)

Success criteria examples (design to these):
- “Assign a clip to a session in ≤3 taps” from capture-ready state.
- Primary action visible without scrolling on core task screens.
- At most one modal/sheet layer for a single sub-task.
- Tablet: primary workspace uses ≥60% width for content/manipulation; secondary tools in a rail or inspector column.

Output quality bar:
If a screen would feel at home in a generic template app, revise it until it feels closer to the Premium Example folder — but keep information density appropriate for a working tool (Tool Example philosophy), not consumer entertainment UI.
```

---

## How to use this in your workflow

| Step | Action |
|------|--------|
| 1 | **Import** images from `App Build`, `UI Premium Example`, and `UI Tool Example` into Figma as pinned reference frames (low opacity overlay optional). |
| 2 | **Paste** the master prompt block into Figma’s AI prompt field, or give this `.md` file to your designer / Cursor agent. |
| 3 | **Build** tokens + components first, then screens — matches the layering advice in `CLAUDE_DESIGN_UX_GUIDE.md`. |
| 4 | **Tag** P0 vs P1 on frames so implementation can follow when not every tab exists in code yet. |

---

## Design principles pulled from your repo (short checklist)

From `CLAUDE_DESIGN_UX_GUIDE.md`:

- Same inputs a real designer needs: **who**, **where**, **job-to-be-done**, **non-goals**, **constraints**.
- Ask for **flows** and **edge states**, not only static UI.
- **Iterate**: IA → layout/spacing → interaction → polish.
- Tie work to **measurable** criteria (examples in master prompt).

From `ROAM_TECHNICAL_FOUNDER_REPORT.md` (product truth):

- Mobile is the **primary creation surface**; domains include session management, capture, workbench, clip review/loupe, spatial formation.
- Explicit gap: **tablet-first layout refinement** matters for tool-like UX — your Figma must lead here, not follow a stretched phone layout.
- Reliability story: loading, retry, human errors, sync/conflict visibility are part of **premium** for this product class.

---

## Tablet vs phone — layout rules (non-negotiable)

- **Phone:** vertical stacks, bottom navigation or tab bar as in product architecture; keep primary action in thumb zone where possible.
- **Tablet portrait:** optional **left rail** for mode/navigation; main canvas center; **right inspector** for metadata, comments, or tool parameters.
- **Tablet landscape:** prioritize **horizontal timeline** or split **player + list**; avoid hiding critical transport controls behind multiple gestures.
- **Both:** same **token set**; tablet adds **layout regions**, not new random colors.

---

## File location

This brief lives next to your other Roam docs:

`C:\Users\Georges\Documents\Cursor 2 V3\docs\FIGMA_ROAM_UX_DESIGN_PROMPT.md`

Update the **master prompt** block as screens ship in code — keep disk paths accurate if folders move.

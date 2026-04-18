# Claude-assisted design: improving UX

**Audience:** Anyone using Claude (or similar assistants) to design or implement product UX, especially mobile apps like Roam.

---

## 1. How to use Claude so UX actually improves

### Give it the same inputs a designer would

- **Who** is using it (one primary persona), **where** (phone one-handed, studio, noisy room), **job to be done** in one sentence.
- **Non-goals** (for example: “not a full video editor”, “no social feed”) so layout and features stay focused.
- **Constraints**: platform (iOS/Android), stack (Expo, React Native, existing theme tokens), accessibility (touch targets ~44pt minimum, contrast, dynamic type where applicable).

### Ask for UX artifacts, not only code

- Screen **flow**: entry → success → error paths.
- **Empty**, **loading**, and **error** states for every main screen.
- **Copy**: labels, helper text, and errors in a consistent product voice.
- **Component hierarchy**: what is primary vs secondary on each screen.

### Iterate in layers

1. Information architecture and flows
2. Layout and spacing system (for example 8pt grid, type scale)
3. Interaction (feedback, sheets, gestures)
4. Visual polish (color, motion)

Jumping straight to “build the screen” often yields **plausible** UI, not **good** UX.

### Tie UX to measurable criteria

Examples:

- “User assigns a clip to a session in ≤3 taps.”
- “Primary action visible without scrolling.”
- “At most one modal / sheet layer for this task.”

State these explicitly so the assistant can optimize layout and flow against them.

---

## 2. UX improvements that matter most on mobile

- **One clear primary action** per screen; demote or hide secondary actions.
- **Immediate feedback**: loading for slow operations, optimistic UI where safe, failures with a clear message and retry.
- **Reduce modal depth**: prefer a single bottom sheet with an obvious dismiss; avoid sheet-on-sheet when possible.
- **Consistent design tokens**: a single theme object for colors, type, spacing. Missing or inconsistent tokens make the app feel broken even when logic works.
- **Respect platform patterns**: predictable back behavior, safe areas, haptics used sparingly for success or important errors.
- **Forgiving flows**: autosave, “continue where I left off,” undo where implementation cost is low.
- **Performance as UX**: skeletons, defer non-critical work—perceived speed often beats extra decoration.

---

## 3. Prompt pattern that works well with Claude

Use a structure like this (adapt names and stack to your project):

```text
Act as a senior product designer + React Native engineer.

User: [one primary persona]
Goal: [one sentence — the job to be done]
Constraints: [Expo, existing theme API, no new dependencies unless justified]

For [screen name], deliver in order:
1) User flow (bullet steps)
2) Wireframe in words (regions top → bottom)
3) Empty / loading / error states + copy
4) Minimal code changes that match our theme and file patterns
```

That ordering usually produces **clearer UX** than a single request like “make the UI nicer.”

---

## 4. Applying this to Roam (optional context)

If improving **Roam** specifically:

- Fix **theme completeness** first (tokens referenced everywhere components expect them)—fast win for visual coherence.
- Tighten **capture → inbox / session** flows against the Phase 0 criteria in `ROAM_CONSOLIDATED_PROJECT_PLAN.md`.
- Reduce **sheet / Reanimated** fragility by clear loading states and avoiding mounting heavy sheets before the tree is ready.

For a deeper product-specific pass, pick **one or two flows** (for example: home → record → quick-save, or session workbench → clip → tag) and run the prompt pattern above for each.

---

## 5. Related docs in this repo

- `docs/IMPLEMENTATION_STATUS_AND_NEXT_STEPS.md` — engineering and product gaps.
- `docs/ROAM_PROJECT_GUIDE.md` — product and technical overview.
- `ROAM_CONSOLIDATED_PROJECT_PLAN.md` — phases and acceptance criteria.


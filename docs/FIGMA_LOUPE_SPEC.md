# Figma design brief — Reference viewer loupe (PRD `ROAM_PRD_FINAL__6_`)

**Product source:** `docs/ROAM_PRD_FINAL__6_.md` — section **“Screen 4 extension — loupe zoom”**  
**Figma file:** same as V3 audit — [ROAMV3](https://www.figma.com/design/paoFtKOdkkoSAD02Intbjc/ROAMV3?node-id=332-2) (see `docs/V3_COVERAGE_AUDIT.md`)  
**Scope:** Visual and interaction design for the **loupe only** on the **in-app reference video** (Screen 4). Does not replace other ref-viewer work; it extends it.

---

## Problem (design intent)

At **1–2 m** from the tablet, full-frame reference is often unreadable for **hands, feet, subtle weight**. The choreographer should **magnify a region** while the **full video keeps playing** underneath, without walking to the screen every loop.

---

## Layout context

- **Tablet, landscape.**
- **Split workbench:** **left panel ≈ 60% width** = reference video + waveform/controls. **Loupe exists only in this left panel.**
- **Right panel** unchanged for this brief (session/capture side).
- Gestures for loupe must read as **scoped to the video panel** (no accidental coupling to the right panel).

---

## What the loupe is (UX)

| Aspect | Spec |
|--------|------|
| Form | **Circular** magnifier overlay on top of the **live** video |
| Magnification | **2×–3×** (show clearly in mocks; no zoom slider in product) |
| Underneath | **Full frame** remains visible and **keeps playing** |
| Movement | **Draggable** after open; **final position** is what matters for “remembered” state |
| REF clips | Loupe is **view-only**; clips still represent **full frame** (optional callout in Figma) |

---

## Gestures (annotate on frames or in sticky)

1. **Pinch** on video → opens loupe centered on **pinch midpoint**. Below **2×** → **no** loupe (dev note; optional small annotation).
2. **Two-finger drag** (after open) → **repositions** loupe only; **does not** change zoom level.
3. Loupe **holds** across **loop repeats** (same position each cycle) — no extra UI; annotation only.

---

## Dismiss / toggle control (critical)

- **Single fixed control**, **top-right of the video panel** (not the full screen).
- **When loupe is active:** control **visible**. Tap → **instant** full frame (no delay animation in spec).
- **When loupe is inactive:** control **hidden**; one tap on **same** control (when shown per restore flow) **restores** last **position + zoom**.
- **Touch target:** minimum **56 × 56 dp** (show hit area in Figma).
- **Clearance:** minimum **16 px** above the **progress / scrub bar** so mis-taps don’t scrub or break the loop.
- Control must be **top z-order** above video **and** loupe circle.

**Static Figma limitation:** “hidden when inactive but same button restores” is easiest to explain with **two frames** or a **prototype** (see below).

---

## Explicit non-goals (“does not ship”)

Do **not** design: multiple loupes, zoom level slider, loupe size selector, separate PiP zoom panel beside the main video.

---

## Frames to create (minimum)

Place on a dedicated page, e.g. **`ref-viewer · loupe`**, or extend **`ref-viewer · bottom sheet`** if that’s your Screen 4 home.

| Frame | Purpose |
|-------|---------|
| `ref-viewer · loupe · off` | Full video; **no** loupe |
| `ref-viewer · loupe · on` | Loupe visible; full frame still visible around it |
| `ref-viewer · loupe · dragging` | Same as `on` + gesture hint (two-finger / drag) |
| `ref-viewer · loupe · dismiss layout` (optional) | Inset or zoom: dismiss control + **56dp** target + **16px** gap above scrubber |

**Night variants:** mirror existing ref-viewer night tokens (if you ship light + night for Screen 4).

---

## Components to build in Figma

1. **`Loupe / lens`** — circle, **1 px** border (use semantic border color from design system). Diameter: **define a single token** (e.g. 120–160 pt at mock scale) and document it for dev.
2. **`Loupe / dismiss-toggle`** — icon or minimal label; **fixed** top-right of **video panel**; include **explicit hit padding** to 56dp minimum.

---

## Prototype (recommended)

- **Flow A:** `on` → tap dismiss → `off` (full frame).
- **Flow B:** `off` → show restore affordance (per your convention) → `on` with **unchanged** loupe position.

---

## Handoff checklist

- [ ] Loupe circle size + border spec
- [ ] Dismiss control position (relative to **video panel** bounds), hit area, scrubber clearance
- [ ] Light + night (if applicable)
- [ ] Annotations: pinch open, two-finger drag, loop persistence (copy)
- [ ] Link to PRD acceptance test in `ROAM_PRD_FINAL__6_.md` (loupe section) for QA

---

## Acceptance test (copy from PRD for design QA alignment)

> A choreographer sets a 5-second A-B loop on a reference video, pinches in on a small detail, drags the loupe to center it, and watches **six** loop repetitions — the loupe **holds position** every cycle. Tap dismiss — **instant** full frame. Tap again — loupe **restores** to the same position. After reopening the app later, loupe is **where they left it** (engineering implements persistence; design specifies default appearance and states).

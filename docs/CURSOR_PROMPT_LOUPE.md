# Cursor Agent prompt — Loupe (session media viewer)

Paste the block below into **Cursor Agent** (or Composer with agent mode). Repo: **Roam** mobile (`apps/mobile`, Expo / React Native).

---

## Master prompt (copy everything inside the fence)

```
You are working in the Roam monorepo (Expo React Native). Implement the **loupe** (circular magnifier) for in-app video review per the product spec and our Figma intent.

### Read first (do not skip)
- `docs/ROAM_PRD_FINAL__6_.md` — section **“Screen 4 extension — loupe zoom”** (behavior, persistence, dismiss toggle, what not to ship).
- `docs/FIGMA_LOUPE_SPEC.md` — layout, gestures, dismiss control, handoff notes.
- `docs/V3_COVERAGE_AUDIT.md` — note: **one session media viewer** for REF + MINE; loupe is a **viewing** tool, not a clip crop.
- `docs/CURSOR_PROMPT_REF_VIEWER.md` — viewer architecture (embed vs deep-link); do not contradict it for YouTube.

### Scope for THIS task (v1)
1. Implement loupe on **`apps/mobile/app/(app)/session/clip-player.tsx`** wherever the main playback surface is **`expo-av` `Video`** (MINE / local / mux clips). This is the **first** shipping target because native video is feasible.
2. **Out of scope for v1 unless you complete (1) and prove it stable:** `youtube-player.tsx` / `react-native-youtube-iframe` — embedded web video cannot use the same pixel-sampling approach; do not block the whole feature on YouTube. If you touch YouTube at all, add a short comment in code + README note that loupe is **clip-player only** until a separate technical design exists.

### Product behavior (must match PRD)
- **Pinch** on the video area opens a **circular** loupe (~2×–3×); below threshold, do not open.
- **Two-finger pan** (or equivalent) **repositions** the loupe after open; **zoom level fixed** while dragging.
- **Full video** stays visible and **keeps playing** under the loupe.
- **Dismiss control**: fixed **top-right of the video container**, min **56×56** touch target, **≥16px** above scrub/progress so it does not fight seeking. When loupe **active** → control **visible**; tap → hide loupe **immediately** (no slow animation). When loupe **inactive**, control **hidden**; **one tap** on the same control (when visible per your toggle pattern) **restores** last **position + zoom** — use a ref guard if blur/submit style double-fires.
- Loupe is **view-only**: thumbnails / saved clips remain **full frame**; loupe does not change what is stored.
- **Persistence**: persist **zoom + pan (final position)** per stable key (e.g. **clip id** or `mux_playback_id` + session id). Restore when reopening the same clip. If backend field does not exist yet, use **MMKV** or AsyncStorage under a namespaced key; document the key shape in a one-line code comment.

### Engineering constraints
- Reuse **`react-native-gesture-handler`** (already used in `clip-player.tsx`). Compose gestures so **single-finger** scrub/slider on the same screen still works — scope pinch/pan to the **video wrapper** only.
- Match existing **`theme`** / styles in `apps/mobile/lib/theme.ts` (or tokens) for the dismiss control; align with Figma **ROAMV3** loupe page when values differ, prefer **tokens**.
- **Performance**: no re-encode; no server calls for loupe. If true “canvas per frame” sampling is not practical with `expo-av`, implement the **closest faithful** approach (e.g. masked duplicate `Video` with transform + sync time, or Skia if already in the project — **check `package.json` first**). Briefly comment the tradeoff in code.

### Deliverables
- Working loupe on **clip-player** for the primary video path.
- Persisted state per clip (or documented storage key).
- No regressions to existing loop, tags, annotation overlay, or navigation.
- Run **`pnpm -C apps/mobile run build`** (tsc) and fix any new errors.

### Do NOT
- Multiple loupes, zoom slider, loupe size picker, or extra PiP zoom panel (PRD explicit non-goals).
- Large refactors outside files needed for this feature.

Start by locating the `Video` subtree in `clip-player.tsx`, then implement in **small commits** (or describe steps): spike overlay → gestures → dismiss → persistence → polish.
```

---

## Short prompt (if the tool has a length limit)

```
Roam Expo app: implement PRD loupe on `apps/mobile/app/(app)/session/clip-player.tsx` only (expo-av Video). Read `docs/ROAM_PRD_FINAL__6_.md` (Screen 4 loupe) + `docs/FIGMA_LOUPE_SPEC.md`. Pinch open 2–3×, two-finger move, top-right 56dp dismiss with 16px above scrub, toggle restore, persist per clip id (MMKV if no API). Skip youtube-player iframe for v1. Gesture-handler scoped to video. `pnpm -C apps/mobile run build` clean.
```

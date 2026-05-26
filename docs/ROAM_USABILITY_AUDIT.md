# Roam usability audit (May 2026)

Honest status for **mobile + API** on branch `cursor/ux-handoff-bundle`. Grades are for **current build + fixes in repo**; verify on device with Expo Go.

**Scale:** A = production-ready for role · B = usable daily with gaps · C = demo / partial · D = broken or missing

---

## Feature truth table

| Feature | Works? | Notes |
|--------|--------|--------|
| **Open app → project gallery** | **B+** | Procreate-style grid of sessions; + creates project → workbench |
| **Record video → save** | **B** | `camera.tsx` → local SQLite → TUS → Mux; needs API + Mux env |
| **Play MINE clip in workbench** | **B+** | Mux HLS + **local file while uploading** (fixed) |
| **MP4 import** | **B** | **Added:** Capture sheet → Import from library |
| **YouTube REF in workbench** | **B** | **Added:** embed in canvas; full review in `clip-player` |
| **Bilibili / Xiaohongshu REF** | **B−** | **Added:** WebView embed in workbench canvas (Bilibili player URL when possible) |
| **Song / sections** | **B** | Music upload + YouTube song map; **Bilibili music** opens in WebView on song player screen |
| **Lyrics panel** | **B−** | **Added:** LRC from lrclib when available; plain text still ~4s spacing; **no vocal-to-text** |
| **Draw / erase** | **B** | Saves to MMKV per session/section; eraser paints over; device-local only |
| **Compose timeline** | **C+** | Read-only real section/clip data; not full editor |

---

## Persona grades

### Choreographer (primary)

| Area | Grade | Why |
|------|-------|-----|
| **Session hub & workbench** | **B** | Gallery → work → map/library/explore; tool rail; transport |
| **Capture & takes** | **B** | Record + import; upload pipeline when backend live |
| **Reference video** | **B** | YouTube + Bilibili/XHS WebView in canvas; playhead may not sync |
| **Music & loops** | **B** | YouTube alignment strong; uploaded audio works |
| **Lyrics** | **B−** | LRC when lrclib has sync; otherwise estimated spacing |
| **Draw on video** | **B−** | Useful for marking; not shared/synced |
| **Overall** | **B+** | **Usable for real rehearsal** if API/Mux deployed; not Figma-pixel parity |

### Dancer

| Area | Grade | Why |
|------|-------|-----|
| **Dancer session view** | **B−** | Separate simplified UI; collab-oriented |
| **Capture own takes** | **B** | Same camera pipeline |
| **Review coach refs** | **C+** | Depends on clip type; REF YouTube better than XHS |
| **Overall** | **C+** | **Works for assigned sessions**; not optimized for self-directed learning |

### Learner (student / pick-up choreography)

| Area | Grade | Why |
|------|-------|-----|
| **Onboarding clarity** | **C** | Sign-in → gallery; little guided tutorial |
| **Watch & loop** | **B−** | Good when Mux/YouTube available |
| **Understand sections** | **B** | Song map + section pills |
| **Lyrics follow-along** | **C+** | LRC when available; many tracks still plain |
| **Overall** | **C+** | **OK to follow along with coach content**; improving for lyric-driven learning |

---

## What was fixed in this pass

1. **Workbench video:** local `file_uri` + YouTube REF in `ChoreographyMuxVideo`; upload status message
2. **Sync:** API `url` → `source_url` on clip merge; keep local file until Mux ready
3. **Clip sheet:** plays local/Mux via `getClipVideoUri`
4. **Import MP4** from capture sheet
5. **Share links:** clearer titles for Bilibili / Xiaohongshu
6. **Lyrics:** honesty note in panel

### Second pass (after “yes”)

7. **Bilibili / Xiaohongshu:** `ExternalRefWebPlayer` in `ChoreographyMuxVideo` + `youtube-player` for music URLs
8. **LRC lyrics:** API returns `syncedLyrics` + `format: lrc`; mobile `parseLrc` + playhead highlight when synced

---

## Still needs work (priority)

1. **Playhead sync** with embedded Bilibili/XHS (WebView cannot drive Roam transport today)
2. **Manual LRC** upload when lrclib has no sync
4. **Draw strokes** sync to server / share packs
5. **Compose** editable tracks
6. **E2E device tests** on APK with live Render + Supabase + Mux

---

## How to verify yourself

```bash
cd apps/mobile && pnpm start
```

Checklist:

- [ ] Gallery → new project → workbench
- [ ] Record 10s → see “Uploading…” then video plays
- [ ] Import MP4 → plays before/after upload
- [ ] Paste YouTube REF → plays in canvas
- [ ] Paste XHS link → “Open reference” works
- [ ] Music setup (YouTube URL) → sections → loop
- [ ] Lyrics fetch → lines scroll (approximate)
- [ ] Draw → leave session → return → strokes remain

---

*See also `docs/PRD_IMPLEMENTATION_MATRIX.md` and `docs/FIGMA_MAKE_CHOREOGRAPHY_TOOL_PROMPT.md`.*

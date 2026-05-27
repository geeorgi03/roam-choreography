# Roam usability grades (May 2026)

Honest assessment from codebase audit + targeted fixes in this pass. **Not** a full QA run on device.

Scale: **A** production-ready for role · **B** usable with friction · **C** partial / demo · **D** mostly broken · **N/A** not implemented

---

## Flow you asked about

| Step | Status | Notes |
|------|--------|--------|
| Open app → Procreate gallery | **B+** | `ProjectGalleryScreen` on Home when signed in |
| Create project (+) | **B** | Same sheets as before; opens workbench after create |
| Workbench (tools) | **B-** | Choreography shell; transport/video sync improved this pass |
| Record video | **B** | Camera → Quick Save → local SQLite + Mux upload |
| See video while uploading | **B-** | **Fixed:** local `file_uri` playback before Mux ready |
| Songs / YouTube music | **C+** | YouTube alignment player works; in-workbench transport needs **uploaded** audio file |
| Bilibili music URL | **D+** | API accepts; mobile player is YouTube-only |
| MP4 import from Files | **D** | Not implemented (`expo-document-picker` unused) |
| Lyrics panel | **C** | Fetch works (external APIs); **not** synced to playhead vocals; no LRC |
| Draw / erase | **C+** | Draw saves (MMKV); eraser paints over, does not delete vectors |
| Compose timeline | **C+** | Real clips/sections; read-only; stroke count only |
| YouTube REF share | **B-** | Share intent + oEmbed; playback via clip-player WebView |
| Bilibili REF share | **C** | URL saved; title fallback; open in clip-player (limited) |
| Xiaohongshu share | **C-** | URL extracted if shared as https link; no oEmbed; platform may block embed |

---

## By role

### Choreographer (session owner)

| Area | Grade | Summary |
|------|-------|---------|
| Project gallery → session | **B+** | Matches Figma Make intent; real sessions |
| Capture & library | **B** | Record + Mux; marking search; no MP4 pick |
| Workbench / sections | **B** | Sections, takes, loops (with music file) |
| Video in canvas | **B-** | Mux + local file; REF links open full player |
| Music + lyrics | **C+** | YouTube path OK; lyrics lookup manual, approximate timing |
| Draw / compose | **C+** | Local sketches; compose is overview not editor |
| Collab / share | **C+** | Invite dancers; share REF links |

**Overall: B-** — credible studio shell for an owner who tolerates rough edges.

### Dancer (invited, `role === dancer`)

| Area | Grade | Summary |
|------|-------|---------|
| Session UI | **B** | `DancerSessionView`: record, latest take, broadcast |
| Choreography tools | **N/A** | No draw/compose/map (by design) |
| Assignments / readiness | **D** | PRD P0 items not in dancer UI |

**Overall: C+** — good for “record a take and see coach note”; not a full learning surface.

### Learner (product persona — not a code role)

Closest match: **solo user / capture-first** (PRD “dancer-maker”) or **invited dancer**.

| Area | Grade | Summary |
|------|-------|---------|
| Low-friction capture | **B-** | Camera, inbox; gallery still full chrome |
| Guided practice | **C** | Practice loupe exists; no lesson path |
| Feedback without judgment | **B** | Product stance OK; UI still dense |

**Overall: C+** — no dedicated learner mode; use choreographer build with discipline.

---

## What was fixed in this pass

1. **Local video** in workbench while Mux processes (`file_uri` + `getClipVideoUri`)
2. **REF `url` → `source_url`** on server sync
3. **Transport play** without music track (toggles video)
4. **Forward seek** wired in choreography transport
5. **Library / takes** open correct clip; REF URLs → `clip-player`
6. **Clip viewer** local file fallback
7. **Share oEmbed** titles for Bilibili / XHS (best-effort)

---

## Highest-impact next work

1. `expo-document-picker` → import MP4 into session  
2. Bilibili / XHS in-app players (WebView or deep link)  
3. Lyrics: LRC sync + persist per session  
4. True vector eraser or layer delete on draw canvas  
5. Upload voice memos with correct MIME  
6. Dancer assignment / readiness UI (PRD P0)

---

*Re-test on device with `pnpm start` + Expo Go after each release.*

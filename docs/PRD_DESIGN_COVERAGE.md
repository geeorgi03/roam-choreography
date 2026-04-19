# PRD ↔ design coverage audit

**Working Figma (Premium + Tool + App Build alignment):** [Roam — Premium + Tool + App Build (Cursor)](https://www.figma.com/design/TpdfecKAxZjyBxMak5Um4v) — created 2026-04-19 via Figma MCP; pages include tokens, phone home hub, session shell, tablet split target, and instructions to **place** the local `App Build` / `UI Premium Example` / `UI Tool Example` images on page `05`.

**Purpose:** Check whether every **product surface called out in the PRD** has a **matching design deliverable** (static screens, Figma frames, or written UI spec). This is **not** an implementation audit — see `docs/PRD_IMPLEMENTATION_MATRIX.md` for code status.

**Sources used for this pass**

| Source | What it covers |
|--------|----------------|
| `docs/ROAM_PRD_FINAL__6_.md` | Latest numbered PRD (April 2026) — Part 0 screens, extensions, broader scope. |
| `docs/ROAM_PRD_FINAL.md` | March 2026 PRD — overlapping vision / Part 0 (treat as duplicate narrative unless `__6_` differs). |
| `App Build/*.jpg` | **9 pages** — `ROAM_Design_Screens Complete_page-0001.jpg` … `page-0009.jpg` (V2.1 “Screens A–I” style pack on disk). |
| `docs/FIGMA_ROAM_UX_DESIGN_PROMPT.md` | **Target** Figma deliverables list (phone + tablet, tokens, states) — process spec, not proof every frame exists. |
| `docs/FIGMA_LOUPE_SPEC.md` + `docs/FIGMA_LOUPE_DESIGN_PROMPT.md` | **Loupe** — explicit frames + link to **ROAMV3** Figma. |
| `docs/V3_COVERAGE_AUDIT.md` | Figma file pointer for V3 audit. |

**Legend**

| Status | Meaning |
|--------|---------|
| **Designed** | Named design artifact (App Build page **or** Figma page/frames **or** dedicated spec doc) clearly covers the surface + primary states. |
| **Partial** | Some UI exists in App Build / Figma / specs, but **differs from current app IA**, or only **subset of states** (e.g. happy path only), or **tablet/empty/error** missing. |
| **Gap** | No design artifact referenced in-repo for this PRD item; PRD text only **or** backlog / simulation only. |
| **N/A (non-UI)** | Data model, policy, or metric — no screen required. |

---

## Part 0 — “Three screens + Screen 4” (PRD `ROAM_PRD_FINAL__6_.md` §0.3b–0.5 / §0.6)

| PRD surface | PRD reference (approx.) | `App Build` (JPG pack) | Figma / other | Coverage | Notes |
|-------------|-------------------------|-------------------------|---------------|----------|-------|
| **Session workbench** (music + sections + clips shell) | Screen 1 | Partial (session chrome / workbench vibe in later pages; **not** same tab chrome as ship) | ROAMV3 + session chrome registry (`apps/mobile/components/session/session-chrome.registry.figma.ts`) | **Partial** | Code uses **FeelingStrip + tabs + TransportBar**; App Build **V2.1 home** still shows **two-door** entry — **IA mismatch**. |
| **Capture** (camera / always available) | Screen 2 | Yes (Record door + FAB patterns in pack) | `FIGMA_ROAM_UX_DESIGN_PROMPT` flow **B** | **Partial** | Capture exists in app + refs; **tablet / mirror-distance** layouts not evidenced in App Build pages we indexed. |
| **Song map** (timeline / sections) | Screen 3 | Partial (song / timeline implied) | ROAMV3 (inferred) + prompt flow **C** | **Partial** | PRD **loop-by-feel** interaction may **not** match all implemented scrub UI — design should call out **tap-to-set loop** vs waveform. |
| **In-app reference viewer** (YouTube/Bilibili, loop, mirror, speed) | Screen 4 | Partial | ROAMV3 ref-viewer notes in loupe prompts | **Partial** | Needs explicit **Screen 4** frames: default, loading, error, offline, **Bilibili vs upload**. |
| **Segment extraction / trim-to-save** | Screen 4 extension | **Gap** in App Build | **Gap** in linked Figma docs in repo | **Gap** | PRD describes **ownership vs pointer** — needs **dedicated frames** + copy. |
| **Loupe** | Screen 4 extension | Partial (tool philosophy on cover) | **Designed** — `FIGMA_LOUPE_SPEC.md` + ROAMV3 link | **Designed** (spec) / **Partial** (full tablet matrix) | Spec is strong; confirm **phone + landscape** frames exist in file. |
| **Share intent → create session** | §0.5a | **Gap** | **Gap** | **Gap** | Modal flow in app; **no** dedicated App Build / Figma row in repo refs. |
| **Tablet next to mirror** (64dp, 36px title, landscape) | §0.3b | **Gap** | `FIGMA_ROAM_UX_DESIGN_PROMPT` requires tablet — **verify** file | **Gap / Partial** | PRD is explicit; **proof** = Figma **834×1194** + **1194×834** frames per prompt — audit Figma separately. |

---

## Home, inbox, quick-save (PRD + matrix rows)

| Topic | `App Build` | Figma / spec | Coverage | Notes |
|-------|-------------|--------------|----------|-------|
| **Home A** (two-door: Record + Start session) | **Designed** (page ~0003) | May lag ship | **Partial** | App is **sessions hub + `+`** — **design pack ≠ current product** unless pack is updated. |
| **Inbox B** | **Designed** (shoebox list) | Prompt flow A | **Partial** | Align **empty / error / offline** with PRD “untagged is a state”. |
| **Quick-save sheet C** | **Designed** | QuickSaveSheet in code | **Partial** | Measure **≤3 taps** in Figma + device. |
| **Session list / “pick up”** | Partial in pack | Prompt flow A | **Partial** | Explicit **resume** card vs list — pick one pattern in Figma. |

---

## `docs/PRD_IMPLEMENTATION_MATRIX.md` — design pairing (high level)

Each **row is a feature**, not always a single screen. Design coverage is **“do we have a frame set for this?”**, not “is code done?”.

| Matrix feature | Likely design home | Coverage |
|----------------|-------------------|----------|
| Auth sign up/in | App Build auth not primary in 9-page pack; auth screens in `app/auth/` | **Partial** — add **sign-in / sign-up / error** frames. |
| Home entry | App Build two-door vs ship hub | **Partial** — **reconcile**. |
| Record / camera | App Build + prompt B | **Partial** — tablet + modes. |
| Quick-save | App Build sheet C | **Partial** |
| Inbox | App Build B | **Partial** |
| Workbench tabs | Figma / registry | **Partial** |
| Music setup (upload / URL) | **Gap** as named set | **Gap** |
| Song sections + loop | Song map + transport | **Partial** |
| Clip tagging | **Gap** as full flow storyboard | **Partial** |
| Library | **Gap** in App Build pack | **Gap** |
| Share create/revoke | **Gap** | **Gap** |
| Public feedback (web) | Web share in prompt E | **Partial** |
| Profile / plan | **Gap** in App Build | **Partial** |
| Offline / retry | Prompt: states on **every** main screen | **Gap** — systematic **offline** frames missing in pack. |
| Error / loading / empty | Same | **Partial** |
| Phase 2 micro-cycle | Workbench + camera | **Partial** |
| Phase 3 clip player + loupe | **Designed** (loupe spec) | **Partial** (whole player chrome) |
| Phase 4 structured collaboration | Prompt E | **Partial** |
| Phase 5 spatial / formation | Prompt F | **Partial** — PRD §2 reqs **11** deep; design rarely covers **all** in one pass. |

---

## PRD “Full app scope” — bigger buckets (§2–§5, experience 5a–5g)

| PRD bucket | Design expectation | `App Build` / Figma | Coverage |
|-----------|-------------------|---------------------|----------|
| **§2 Spatial layer** (Req 1–11, moments, quality layer) | Many distinct surfaces | Mostly **Gap** beyond high-level spatial tab | **Gap** — need **Figma “Spatial”** chapter: floor, roles, conflict, tablet. |
| **§3 Offline** | Per-feature behaviour + UI | Not in 9-page consumer-style pack | **Gap** |
| **§4 In-app sharing** (layers 1–3) | Share sheet, link preview, permissions | **Gap** in pack | **Gap** |
| **§5a** Repetition / A-B loop / takes | Waveform + ref viewer | Partial (loupe + transport) | **Partial** |
| **§5b** First-session magic | Onboarding | Partial (first session sheet) | **Partial** |
| **§5c–g** (summary, stick figure, exit, PDF export, assembly / CapCut) | Various | **Gap** (future) | **Gap** |

---

## Summary

| Category | Approx. count (subjective) |
|----------|----------------------------|
| **Designed** (clear artifact for core interaction) | Loupe spec + parts of **App Build** (home / inbox / quick-save vibe). |
| **Partial** (something exists but incomplete or **drifted from ship**) | Most **Part 0** surfaces, matrix “mobile P0” rows. |
| **Gap** (PRD asks for behaviour/UI, no committed design pack in repo) | Share intent, music setup story, library, offline system, many **§2** reqs, **§5c–g**, tablet proof sets. |

**Conclusion:** **No** — we do **not** yet have “a design for every design” in the sense of **full PRD coverage in Figma/App Build**. We have a **strong early pack + loupe spec + prompts**; the PRD is **wider** than the packaged screens, and **implementation has already diverged** from the **two-door** home in `App Build`.

---

## Recommended next steps (design ops)

1. **Reconcile Home** — Update `App Build` / Figma **or** document “sessions hub + `+`” as the new **Screen A** canonical.  
2. **Add a “missing screens” Figma milestone** — Share intent, music attach, library filters, **offline banner** on each main route, **paywall**, **error**.  
3. **Tablet chapter** — Mandatory frames per `FIGMA_ROAM_UX_DESIGN_PROMPT.md` (portrait + landscape).  
4. **Trace matrix** — For each `PRD_IMPLEMENTATION_MATRIX.md` row, add a **Figma node id** or **App Build page #** column in that file (or a linked sheet).  
5. **Spatial** — One Figma file section per **Req 1–11** (even if P1) so engineering isn’t guessing.

---

*Last updated: 2026-04-19 — desk audit from repo files only; Figma file contents were not visually re-opened for this pass.*

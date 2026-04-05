# Copy-paste prompt — design Roam reference viewer **loupe** in Figma

Use this in **Figma AI**, **other design LLMs**, or paste to a designer. For full specs see `docs/FIGMA_LOUPE_SPEC.md` and `docs/ROAM_PRD_FINAL__6_.md` (section **Screen 4 extension — loupe zoom**).

---

## Master prompt (paste everything below the line)

---

**You are designing a UI extension for an existing Figma file: ROAM V3 (dance / choreography app).**

**Figma file:** open [ROAMV3](https://www.figma.com/design/paoFtKOdkkoSAD02Intbjc/ROAMV3?node-id=332-2) and work inside it. **Reuse existing color, type, spacing, and component tokens** from this file—do not invent a new visual language. Match **tablet landscape** and **ref-viewer** patterns already used in the file.

### Feature: Reference video **loupe** (Screen 4)

**Context:** Tablet in **landscape**, **split workbench**: **left panel ~60% width** = reference video + waveform/transport. **Right panel** is session/capture—show as a simple placeholder strip so composition is realistic. The **loupe exists only in the left (video) panel**.

**User problem:** Dancer is **1–2 meters** from the tablet. Full-frame video is often too small to read **hands, feet, or subtle weight shifts**. They need **detail without leaving the full-frame context**.

### What to design

1. **Loupe (lens)**  
   - **Circular** overlay on top of the **video** (use a plausible video placeholder frame).  
   - Shows a **magnified** crop of the underlying frame at **~2.5×** (visually obvious; range in product is **2×–3×**).  
   - **Full video remains visible** around/under the concept—this is **not** a full-screen crop and **not** picture-in-picture of a second player.  
   - **1 px** border on the circle; subtle shadow optional if it fits the design system.  
   - **Single** loupe only—no multiple lenses, no zoom slider, no “loupe size” control.

2. **Dismiss / restore control**  
   - **One** fixed control at the **top-right corner of the video panel** (not the full canvas).  
   - **Minimum touch target 56 × 56 dp**—show the hit area explicitly (padding frame or outline).  
   - **At least 16 px vertical clearance** above the **video progress / scrub bar** so it never overlaps scrubbing (mis-tap breaks loops).  
   - **Z-order:** this control is **above** both video and loupe.  
   - **Behavior to document with frames or prototype:**  
     - When loupe is **on**: control **visible**; tap → **instant** hide loupe (full frame).  
     - When loupe is **off**: control **hidden**; when user invokes **restore**, same control brings back loupe at **last position** (use two frames or interaction notes if you cannot prototype).

3. **Gestures (annotate with Figma sticky notes or a small “spec” subframe)**  
   - **Pinch** on video opens loupe at pinch center.  
   - **Two-finger drag** moves the loupe **after** it is open (reposition only, zoom unchanged).  
   - Loupe **stays put** across **A–B loop** repeats (annotation only).

4. **Optional callout:** REF clips always capture **full frame**; loupe is **view-only**—one small note is enough.

### Deliverables (must create in Figma)

- **New page** named: `ref-viewer · loupe` (or append to existing ref-viewer page if that’s the team convention).  
- **Frames (tablet landscape):**  
  - `ref-viewer · loupe · off` — no loupe  
  - `ref-viewer · loupe · on` — loupe visible, magnified detail obvious  
  - `ref-viewer · loupe · dragging` — same as on + clear gesture hint  
  - Optional: `ref-viewer · loupe · dismiss spec` — zoomed inset of top-right showing **56dp** target + **16px** gap above scrubber  
- **Components:**  
  - `Loupe / lens` (variant if needed: default only)  
  - `Loupe / dismiss-toggle` (with explicit min hit area)  
- If the file uses **night mode** for ref-viewer, duplicate key frames as **· night** variants using existing dark tokens.

### Quality bar

- Looks like a **professional tool** (Roam is a studio workbench, not a consumer social app).  
- **Large, glanceable** controls for arm’s-length use.  
- **No** gamification, **no** progress UI, **no** extra features beyond this brief.

**Output:** completed frames + components + annotations ready for handoff to React Native engineers.

---

## Short prompt (token-limited tools)

Design **loupe** for **ROAM V3** Figma ([link](https://www.figma.com/design/paoFtKOdkkoSAD02Intbjc/ROAMV3)): **tablet landscape**, **split layout 60/40**, loupe only in **left video panel**. **Circular** magnifier **2–3×** over **playing** video, full frame still visible. **One** dismiss button **top-right of video panel**, **56dp** min, **16px** above scrubber, top z-index. **Pinch** to open, **two-finger drag** to move. Frames: **off**, **on**, **dragging**; components **Loupe/lens** + **dismiss-toggle**; page **`ref-viewer · loupe`**. Use **existing** file tokens. No zoom slider, no multi-loupe.

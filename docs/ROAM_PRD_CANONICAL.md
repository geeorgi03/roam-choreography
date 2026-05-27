# ROAM - Canonical Product Requirements Document

Status: Canonical source of truth  
Version: 1.0  
Owner: Product  
Last updated: 2026-05-13

This document supersedes duplicate "final" PRD drafts and defines implementation-ready scope for engineering, design, and QA.

---

## 1) Product Intent

Roam is a studio-first choreography workflow tool that helps choreographers capture, organize, loop, review, and assign dance material without breaking flow.

Core promise:
- Start working in less than 15 seconds after opening the app.
- Keep creative context (sections, loops, references, takes) persistent across sessions.
- Support real studio behavior (offline-first, quick capture, section-based progress).

Non-goals:
- No public social feed.
- No algorithmic discovery.
- No engagement mechanics (likes/follows/reactions).

---

## 2) Release Strategy

- `P0` Studio-first core: must pass before any expansion.
- `P1` Reliability + structure: offline robustness, sharing layer 1, assignment clarity.
- `P2` Moat expansion: history/genealogy, richer notation layer, collaboration roles.

Gate rule:
- If P0 success metric fails, P1 and P2 do not ship.

---

## 3) Personas and Primary Jobs

### 3.1 Primary persona
- Choreographer working in bursts around production cycles.

### 3.2 Core jobs-to-be-done
- Save exact reference moments from external videos.
- Practice and review by section with repeatable loops.
- Capture attempts instantly and file them to the correct section.
- Assign sections/parts to dancers and track readiness.

---

## 4) Platform and Constraints

### 4.1 Platform priority
- Android tablet first.
- iOS follows after Android P0 stabilization.

### 4.2 Third-party video constraints
- External platform behavior (YouTube/Bilibili/XHS) must be treated as variable.
- App must provide fallback when embedded playback is blocked:
  - open external player at exact timestamp
  - preserve reference in session with URL + timestamp + thumbnail

### 4.3 Performance device baseline
- Baseline class: mid-range Android tablet (2023+ equivalent).
- Targets below are measured on baseline class unless stated otherwise.

---

## 5) P0 Requirements (Studio-First)

### 5.1 Session Workbench

ID: `P0-REQ-001`  
Description: Workbench is the default return surface for active users.

Acceptance:
- `P0-AC-001`: Last active session opens by default on app launch.
- `P0-AC-002`: User can set A/B loop in at most 2 taps.
- `P0-AC-003`: Loop persists after app close/reopen within same session.
- `P0-AC-004`: Speed control supports 0.25x-2.0x and displays current value.
- `P0-AC-005`: Record entry point is visible from workbench at all times.

### 5.2 Capture from Anywhere

ID: `P0-REQ-002`  
Description: Capture is always reachable and returns user to context.

Acceptance:
- `P0-AC-006`: Capture action is reachable from all primary screens.
- `P0-AC-007`: Camera open median <= 500ms, p95 <= 900ms on baseline class.
- `P0-AC-008`: Stop-save route places clip into current active section automatically.
- `P0-AC-009`: Clip appears in section list within 1s of save confirmation.

### 5.3 Song Map and Section Progress

ID: `P0-REQ-003`  
Description: Song sections provide at-a-glance progress and reference density.

Acceptance:
- `P0-AC-010`: All defined sections are visible, including empty sections.
- `P0-AC-011`: Each section displays clip counts by type (`REF`, `MINE`).
- `P0-AC-012`: User can identify "done/in-progress/empty" in less than 5 seconds in usability tests.

### 5.4 Reference Intake (Share + In-App Viewer)

ID: `P0-REQ-004`  
Description: Users can import and use references without workflow break.

Acceptance:
- `P0-AC-013`: Android share intent from supported apps creates session reference in <= 10s.
- `P0-AC-014`: Reference stores URL + timestamp + source + section link.
- `P0-AC-015`: In-app viewer supports mirror toggle and speed control where platform allows.
- `P0-AC-016`: If embed blocked, app offers one-tap external open at exact timestamp.
- `P0-AC-017`: "Clip this moment" stores a REF item into the active section.

### 5.5 Assignment for Dancers

ID: `P0-REQ-005`  
Description: Choreographer can assign specific sections/parts to specific people.

Acceptance:
- `P0-AC-018`: Choreographer can create dancer profiles (name + role).
- `P0-AC-019`: Choreographer can assign one or more sections to one or more dancers.
- `P0-AC-020`: Assignments persist across app restarts and sync when online.
- `P0-AC-021`: Section view shows assigned dancers and status (`unseen`, `in-progress`, `ready`).
- `P0-AC-022`: Dancer-side view can filter by "my assigned sections."

### 5.6 Choreography Tool UI (Figma Make parity)

ID: `P1-REQ-005`  
Description: Session experience matches the **Choreography Tool** Figma Make spec: canvas-first workbench, top navigation (Work / Map / Library / Explore), magenta studio tokens, and tool surfaces that **show the work** without scoring or gamification.

Design reference: [Choreography Tool (Figma Make)](https://www.figma.com/make/Hea1WyClIWA2G0E7fJjdMB/Choreography-Tool)

**Philosophy gate:** All surfaces pass the show-vs-evaluate test (§ design principle in `ROAM_PRD_FINAL.md`). Improv Lab generates movement *prompts*, not grades.

#### 5.6.1 Shell and navigation

Acceptance:
- `P1-AC-017`: Session opens into choreography shell on phone portrait (top chrome: session name + Work / Map / Library / Explore).
- `P1-AC-018`: App-wide tabs (Home, Song, Library, Inbox) use the same choreography token set when the feature flag is enabled.
- `P1-AC-019`: Typography uses **Barlow Condensed** (display), **DM Sans** (body), **DM Mono** (meta/chips) when fonts load; degrades to system fonts without layout break.

#### 5.6.2 Work canvas modes

Acceptance:
- `P1-AC-020`: **Video** mode plays the active take via Mux HLS in the canvas (not a placeholder).
- `P1-AC-021`: **Practice** mode shows the same stream with a loupe on press/hold for detail review.
- `P1-AC-022`: **Draw** mode provides pen/eraser overlay on the canvas with clear/cancel affordances; strokes persist locally per session + active section (MMKV) and reload when returning to Draw.
- `P1-AC-023`: **Compose** mode shows a read-only multi-track timeline (song, lyrics, my video, ref, drawing) aligned to session sections, using real section assignments and Mux clip thumbnails (not mock rows).

#### 5.6.3 Floating tools

Acceptance:
- `P1-AC-024`: Right **tool rail** toggles Sections, Lyrics, Takes panels and canvas modes (Practice / Draw / Compose).
- `P1-AC-025`: **Sections** panel lists song sections with color stripe; tap sets active section and updates canvas context.
- `P1-AC-026`: **Lyrics** panel supports web lookup (artist – title) and highlights the line nearest current playhead when lyrics exist.
- `P1-AC-027`: **Takes** panel lists MINE takes and REF clips for the active section; tap selects the canvas clip.

#### 5.6.4 Map, Library, Explore

Acceptance:
- `P1-AC-028`: **Map** proportional section bar; tap section switches to Work on that section.
- `P1-AC-029`: **Library** grid filters ALL / MINE / REF for session clips.
- `P1-AC-030`: **Explore** (Improv Lab) shows generated movement/quality/spatial prompts without numeric scoring.

---

## 6) P1 Requirements (Reliability and Team Flow)

### 6.1 Offline-First Data Behavior

ID: `P1-REQ-001`

Acceptance:
- `P1-AC-001`: Capture and local notes work without network.
- `P1-AC-002`: Last 5 recent sessions remain playable offline (clips + audio metadata/cache).
- `P1-AC-003`: Writes are queued and replay automatically on reconnection.
- `P1-AC-004`: No blocking modal for network loss during core actions.

### 6.2 Directed Sharing Layer 1

ID: `P1-REQ-002`

Acceptance:
- `P1-AC-005`: User can send a clip directly to a specific Roam user.
- `P1-AC-006`: Recipient sees clip in inbox thread (not public feed).
- `P1-AC-007`: Thread supports voice response linked to the clip.

### 6.3 Data Integrity and Auditability

ID: `P1-REQ-003`

Acceptance:
- `P1-AC-008`: Every clip has immutable author attribution.
- `P1-AC-009`: Assignment updates are timestamped and attributable.
- `P1-AC-010`: Conflict resolution policy documented and tested (last-write-wins in single-owner scenarios).

### 6.4 Internationalization (Core Locales)

ID: `P1-REQ-004`

Description: Roam supports multilingual choreography workflows with dance-accurate terminology.

Launch locales:
- `en` (English)
- `zh-CN` (Simplified Chinese)
- `ko` (Korean)
- `ja` (Japanese)

Acceptance:
- `P1-AC-011`: User can select app language manually in settings independent of device language.
- `P1-AC-012`: If locale is unsupported, app falls back to English (`en`) without broken keys.
- `P1-AC-013`: Core P0/P1 UI surfaces are translated in all launch locales (navigation, session, section, assignment, capture, sharing, settings).
- `P1-AC-014`: Dance-specific terms are reviewed by domain-fluent reviewers per locale before release.
- `P1-AC-015`: Date/time/number formats follow selected locale conventions.
- `P1-AC-016`: Text expansion in non-English locales does not cause blocking layout breakage on baseline tablet screens.

---

## 7) P2 Requirements (Moat Expansion)

### 7.1 Living Library and Creative Genealogy

ID: `P2-REQ-001`

Acceptance:
- `P2-AC-001`: User can browse historical clips by project, section, and motif tags.
- `P2-AC-002`: App surfaces prior related material during new project setup.

### 7.2 Rich Body/Movement Annotation Layer

ID: `P2-REQ-002`

Acceptance:
- `P2-AC-003`: Annotation supports upper body, travel, role, and timing markers.
- `P2-AC-004`: Annotation overlays can be toggled without blocking playback.

### 7.3 Collaboration Roles (Layer 2+)

ID: `P2-REQ-003`

Acceptance:
- `P2-AC-005`: Session supports viewer/annotator/contributor roles.
- `P2-AC-006`: Permission boundaries are enforced server-side.

---

## 8) Functional Data Model (Minimum)

- `Session(id, ownerId, title, activeSectionId, lastOpenedAt)`
- `Section(id, sessionId, name, orderIndex, status)`
- `Clip(id, sessionId, sectionId, type, sourceUrl, sourceTimestamp, authorId, createdAt)`
- `Loop(id, sessionId, sectionId, startMs, endMs, label, createdBy, persisted)`
- `Dancer(id, teamId, displayName, role)`
- `Assignment(id, sessionId, sectionId, dancerId, status, assignedBy, assignedAt)`
- `ShareThread(id, clipId, fromUserId, toUserId, createdAt)`
- `VoiceNote(id, threadId, authorId, audioUrl, createdAt)`

---

## 9) Success Metrics

### 9.1 P0 north-star metric
- Founder/target user cohort completes studio workflow in Roam for 30 consecutive session-days without reverting to camera-roll + external tools for core path.

### 9.2 Supporting metrics
- Time to first action after app open (target median <= 15s).
- Section assignment completion rate.
- Reference-to-captured-attempt conversion rate.
- Return on next project cycle (seasonal retention metric).

---

## 10) Choreography-Centered Customer Decision Journey

Roam's decision journey is evaluated by choreography progress, rehearsal speed, and section readiness rather than generic engagement.

### 10.1 Journey Stages

- `CDJ-01 Trigger`: Choreographer loses time re-finding movement references or tracking section progress across tools.
- `CDJ-02 First choreography proof`: In first real rehearsal, user imports a reference, sets a loop, records a take, and files it to the right section.
- `CDJ-03 Workflow replacement`: Choreographer runs session planning and execution in Roam instead of camera roll + notes + external player.
- `CDJ-04 Team assignment trust`: Choreographer assigns section/part ownership to dancers and tracks readiness by section.
- `CDJ-05 Project continuity`: At next project start, choreographer reuses prior sections, motifs, and reference clips from Roam.
- `CDJ-06 Peer recommendation`: Choreographer recommends Roam specifically for section-based rehearsal and assignment workflow.

### 10.2 Stage Metrics

- `CDJ-M-01`: Time from app open to first choreography action (target median <= 15s).
- `CDJ-M-02`: Share-to-section success rate (reference imported and linked to target section).
- `CDJ-M-03`: Loop-to-capture completion rate during rehearsal sessions.
- `CDJ-M-04`: Assignment coverage ratio (assigned sections / total active sections).
- `CDJ-M-05`: Assignment readiness visibility (sections with up-to-date dancer status).
- `CDJ-M-06`: Next-project return rate with reuse of prior choreography artifacts.

---

## 11) QA Acceptance Checklist

- `QA-001`: P0 requirements pass on baseline Android tablet.
- `QA-002`: Offline core actions pass in airplane mode.
- `QA-003`: Share-intent ingest verified from at least 2 source apps.
- `QA-004`: Assignment workflow E2E (create dancer -> assign section -> status update).
- `QA-005`: Data persistence validated across kill/relaunch.
- `QA-006`: Embed-blocked fallback path validated.
- `QA-007`: Locale switch verified for `en`, `zh-CN`, `ko`, `ja`, including fallback-to-English behavior.
- `QA-008`: Domain terminology review sign-off attached for each launch locale.

---

## 12) Implementation Notes

- Any requirement without an ID is non-normative.
- Any future additions must include:
  - Requirement ID (`Px-REQ-xxx`)
  - Acceptance IDs (`Px-AC-xxx`)
  - Test owner (Eng/QA/Product)
- If conflicts exist with older PRD drafts, this file wins.

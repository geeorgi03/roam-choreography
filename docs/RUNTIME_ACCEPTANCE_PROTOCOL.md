# ROAM Runtime Acceptance Protocol

Last updated: 2026-04-18

This protocol is the required evidence path for converting `Partial` PRD items to `Done`.

## Test environment

- Device: one physical Android APK build and one iOS device/simulator build.
- API: reachable production-like endpoint (not `localhost` for physical devices).
- Auth: valid user account with at least one existing session.
- Services: Supabase configured; Mux configured for uploads; share web URL deployed.

## Required instrumentation capture

For each run:
- Timestamped screen recording.
- Build identifier / branch.
- API base URL used by the app.
- Per-step pass/fail and measured durations.

## Phase 0 acceptance script

### A. Home -> Record launch latency
1. Start on Home.
2. Tap Record.
3. Measure tap-to-camera-visible time.
4. Repeat 5 times and record median.

Pass: median <= 200 ms.

### B. Stop -> Inbox save latency
1. Open camera, record a short clip.
2. Stop recording.
3. In quick-save, tap Later.
4. Measure stop tap to clip visible in Inbox.
5. Repeat 5 times, record median and p95.

Pass: median <= 500 ms and no failed saves.

### C. Assignment tap budget
1. Record and stop.
2. Assign via Existing session path.
3. Count taps from stop to assignment confirmation.
4. Repeat for New session path.

Pass: <= 3 taps for assignment paths.

### D. Empty/loading/error states
1. No sessions state.
2. Loading state with delayed network.
3. API unreachable state.
4. Offline with cached data.

Pass: state copy visible, actionable retry path, no crashes.

## Phase 1 acceptance script

### E. Workbench load
1. Open a populated session.
2. Measure navigation tap to interactive workbench.
3. Run 5 times.

Pass: median <= 1.5 s.

### F. Loop creation and playback seam
1. Create loop region by drag gesture.
2. Play loop for 30 seconds.
3. Observe seam/gap and playback stability.

Pass: loop region created within 3 s and audible seam <= 50 ms.

### G. Note pin save latency
1. Create a note pin at current playhead.
2. Measure tap submit to note visible.
3. Repeat 5 times.

Pass: median <= 300 ms.

## Phase 2-5 acceptance script

### H. Micro-cycle flow
1. Loop -> record -> quick-save -> tag.
2. Measure total time and check no blocking errors.

Pass: flow completes reliably under target budget for repeated runs.

### I. Share and feedback
1. Create share link from session.
2. Open share page externally.
3. Submit feedback for open clip request.
4. Verify feedback appears in app.

Pass: full round-trip feedback works with correct clip/time context.

### J. Formation/group behavior
1. Open spatial/group views.
2. Edit positions/formation state.
3. Reload session and verify persistence.

Pass: no data loss and no blocking interaction errors.

## Evidence template

For each criterion, record:
- Criterion name
- Environment
- Steps executed
- Measured values
- Pass/Fail
- Artifacts (video/log links)
- Follow-up fix ticket (if fail)

## Exit criteria for formal acceptance

- All Phase 0 and Phase 1 criteria pass with measurements.
- No P0 runtime failures on core flows.
- Share and feedback roundtrip validated.
- Formation/group persistence validated.
- Updated `docs/FORMAL_ACCEPTANCE_PASS.md` with evidence-backed verdicts.


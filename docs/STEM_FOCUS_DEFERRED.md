# Stem Focus — Audio Routing Deferred

## Status
UI scaffold shipped in `feat(transport): stem focus scaffold UI + MMKV persistence`.

## What is implemented
- `stemFocus` state (vocals / drums / bass / instruments, each `'active' | 'muted'`) in `SessionContext`.
- MMKV persistence under key `stemFocus:${sessionId}` (store id: `stem-focus`).
- Four chip buttons in the Workbench full transport bar (`TransportBar` `variant="full"` only).

## What is deferred — Phase 1 TBD
Actual audio routing to isolated stem tracks requires a backend stem separation
service. Candidate services: **Demucs** (open-source, self-hosted) or **Spleeter**
(Deezer, open-source). Neither is integrated yet.

Required work when undeferred:
1. Backend job queue to run stem separation on uploaded audio tracks.
2. Storage of per-stem audio URLs alongside the music track record.
3. `SessionContext` audio engine to load/mute individual `Audio.Sound` instances
   per stem based on `stemFocus` state.
4. No changes to the existing `TransportBar` chip UI are expected.

## Constraints
- No audio routing changes in this scaffold.
- No new API routes or DB migrations.
- Reduced transport (Map / Spatial / Group tabs) is unaffected.

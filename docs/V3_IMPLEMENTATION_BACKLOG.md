# V3 Implementation Backlog

Based on `docs/V3_COVERAGE_AUDIT.md`.

## D) Prioritized implementation plan

## P0 (critical path)

1. `song-map` first-class screen
   - Add dedicated route and navigation entry in session flow
   - Reuse `AssemblyCanvas` for first shipping baseline
   - Align section strip + clip assignment + floor/scrub interaction with Figma
   - Dependencies: existing session and assembly endpoints

2. `spatial` screen
   - Build dedicated spatial route (tablet landscape primary)
   - Progressive tool unlock (position -> path -> relationship)
   - Add moment strip and quality side panel persistence
   - Dependencies: song-map data model extension and stable moment schema

3. `group` role-based screens
   - Choreographer tablet view + dancer phone view
   - Shared realtime layer (presence, clips, formation, broadcast notes)
   - Dependencies: spatial foundation and robust realtime channel model

4. `workbench` parity pass
   - Bring `apps/mobile/app/(app)/session/[id].tsx` to locked frame parity
   - Address split layout, timeline visual language, and section interactions
   - Dependencies: stable song-map/spatial links and common token set

## P1 (major but not blocking first flow)

5. `ref-viewer` parity as bottom sheet architecture
   - Convert current full-screen player paths into sheet behavior where required
   - Implement loop chip UX, save actions, and platform-specific source behavior

6. `home` parity pass
   - Session rows and shell polish to locked variants

7. `auth` parity pass
   - Provider-first auth options and visual updates

8. `library` parity pass
   - Align card/filter controls and list states with Figma variants

9. `capture` parity pass
   - Align camera controls and save flow to target comp details

## P2 (supporting systems and polish)

10. `settings` parity
11. Token normalization (`tokens` page -> RN token map)
12. Component inventory mapping (`components` page -> reusable RN component set)

## Dependency map

- Song-map -> Spatial -> Group forms the structural choreography flow.
- Workbench parity should reference final song-map/spatial navigation hooks.
- Ref-viewer parity depends on agreed loop model and save semantics.

## Acceptance gates per page

- Route exists and is reachable from expected parent flow.
- Core layout blocks match target composition.
- Primary interactions are functional.
- Basic data wiring persists/loads from API without fatal errors.
- No new lint errors in touched files.

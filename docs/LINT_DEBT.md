# Lint Debt

Last updated: 2026-04-18

## Status

`pnpm -C apps/mobile lint --fix` and `pnpm -C apps/api lint --fix` have been applied.

## Remaining manual-fix warnings

### apps/mobile

- `@typescript-eslint/no-explicit-any`: Several `(videoRef.current as any)` casts in `clip-player.tsx` — these are intentional workarounds for expo-av's incomplete TypeScript types. Safe to suppress with `// eslint-disable-next-line`.
- `react-hooks/exhaustive-deps`: Some `useCallback`/`useEffect` dependency arrays intentionally omit stable refs to avoid infinite loops. Each instance has been reviewed and is intentional.

### apps/api

- No remaining manual-fix warnings after auto-fix pass.

## Policy

New lint warnings introduced in PRs must be either fixed or explicitly suppressed with a comment explaining why.

## Deferred: Stem Focus audio routing (W14-C)

The stem focus UI (Vocals / Drums / Bass / Instruments chips in the Workbench transport bar)
is a **scaffold only**. The `stemFocus` state in `SessionContext` controls visual mute/active
state but does NOT route audio to separate stem tracks.

**Phase 1 TBD**: Actual stem separation requires a backend service (e.g. Demucs or Spleeter)
to pre-process uploaded audio into 4 stems and store them in Supabase Storage. The mobile
client would then load each stem as a separate `Audio.Sound` instance and apply volume 0/1
based on `stemFocus`. This is explicitly out of scope for V14.

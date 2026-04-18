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

# Simulation Risk And Friction Areas

## Mixed / Risk Areas (10-16/20 expected pass)

- Lyrics lookup: dependent on third-party endpoint reliability (`lyrics.ovh`), so intermittent failures are expected.
- Music upload replacement: overwrite conflict is fixed (`upsert: true`), but behavior is still sensitive to storage and network latency.
- Clip/share feedback roundtrip: likely works, but still needs live end-to-end proof with real sessions.
- Spatial persistence sync: code path exists, but multi-device persistence consistency still needs formal runtime verification.

## Likely Failure / Friction Pockets (4-9/20 impacted)

- Slow or unstable networks: retries and timeout UX can still feel rough in edge conditions.
- Performance-sensitive loops/loupe: improved, but not yet backed by measured pass criteria on multiple devices.
- First-time onboarding edge cases: empty/loading/error states improved, but not fully validated across all API failure modes.
- Non-blocking code hygiene issues: lint warnings suggest latent cleanup debt (not immediate user-facing breakage).

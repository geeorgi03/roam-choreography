# Claude Code Review Brief - Roam Site

Use this brief to perform a deep improvement review of the current Roam app.

## 1) Review Objective

Identify high-impact improvements to move the app from strong launch-ready MVP to higher production confidence.

Focus on:
- bugs and regressions
- reliability and error handling
- security/data risks
- UX friction for choreography workflows
- maintainability and code quality
- test coverage gaps

## 2) Project Scope

Review the `roam-site` app, including:
- `index.html`
- `app.js`
- `styles.css`
- `scripts/check-static-site.mjs`
- Playwright tests in `tests/`
- docs:
  - `README.md`
  - `SUPABASE_SETUP.md`
  - `PRODUCTION_READINESS.md`
  - `LAUNCH_EXECUTION_PLAN.md`
  - `GO_LIVE_THIS_WEEK.md`
  - `TECHNICAL_DIAGRAMS_10_PAGES.md`

## 3) Current Implemented Capabilities (baseline)

- choreography workflow (session, sections, dancers, assignments)
- reference URLs + timestamp parsing
- takes logging + analytics
- growth engine (referral, invite, waitlist, weekly growth, feedback capture)
- Supabase auth/sync wiring
- pending cloud writes queue + manual flush + auto retry
- sync status banner + reliability panel
- media lab:
  - music upload/player/speed/A-B loop
  - tap/analyzed BPM
  - direct video playback + mirror/speed/A-B loop
  - platform smart handling (YouTube/Bilibili/XHS external timestamp flow)
- CI + E2E quality gate

## 4) Commands to Run

From `roam-site`:

```bash
npm run check
npm run test:e2e
npm run test:ci
```

## 5) What to Check (Required)

### A) Correctness/Bugs

- runtime exceptions in browser console
- broken event handlers / null element bindings
- stale state after complex interaction sequences
- media corner cases:
  - invalid URLs
  - switching media repeatedly
  - loop boundaries (A > B, missing A/B)
- referral/attribution edge cases
- cloud queue flush behavior under failure

### B) Security and Data Safety

- XSS or unsafe rendering paths
- unsafe URL handling
- sensitive key handling assumptions
- RLS assumptions vs real query paths
- data loss risk in local/cloud sync transitions

### C) Reliability

- retry queue correctness and starvation risks
- race conditions (simultaneous actions, interval + manual flush)
- offline/online transitions
- sync banner accuracy under edge states

### D) UX/Workflow Quality (tablet-first)

- touch target consistency
- form ergonomics in rehearsal context
- error messages clarity/actionability
- choreography flow speed and cognitive load

### E) Maintainability

- oversized functions and refactor opportunities
- duplicated logic paths
- naming consistency
- state model complexity and normalization quality

### F) Tests

- missing E2E cases (especially media and cloud)
- flaky assertions
- opportunities for deterministic fixtures/mocks
- recommendation for additional unit tests

## 6) Output Format Expected from Reviewer

Return findings in this order:

1. **Critical issues** (must-fix before release)
2. **High-priority issues** (fix in next sprint)
3. **Medium improvements** (quality/perf/maintainability)
4. **Low polish items**
5. **Suggested patch plan** (ordered implementation steps)
6. **Test plan additions** (exact new tests to add)

For each issue include:
- severity
- file/path
- why it matters
- concrete fix recommendation

## 7) Constraints for Suggestions

- preserve existing user-facing workflows unless clearly broken
- prefer incremental, low-risk improvements over large rewrites
- keep tablet UX quality as a priority
- do not recommend exposing service-role keys in client

## 8) Success Criteria for This Review

The review is successful if it produces:
- a prioritized, implementation-ready fix list
- clear risk reduction on reliability/security
- concrete test additions to raise regression confidence

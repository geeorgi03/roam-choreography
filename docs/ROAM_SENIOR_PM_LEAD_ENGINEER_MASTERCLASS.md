# ROAM Masterclass: From Product Builder to Senior PM + Lead Engineer

Author: Internal technical handbook for the current ROAM choreography app stack  
Audience: Product managers, technical product owners, senior IC engineers, emerging tech leads  
Goal: Give you a deep, practical, systems-level understanding of how the app works and how to lead it at production scale.

---

## How to use this guide

This document is designed as a 40-page equivalent deep-dive. Read it in three passes:

1. **Pass 1 (mental model):** Sections 1-6.
2. **Pass 2 (execution depth):** Sections 7-15.
3. **Pass 3 (leadership + scale):** Sections 16-24 and appendices.

Treat this as a working manual, not a static document. As the code evolves, keep updating this file.

---

## 1) Product and system overview

ROAM is a choreography workflow application optimized for mobile-first creation with tablet-friendly UX. The core user loops are:

- Capture and import references.
- Build sessions around music and movement sections.
- Practice with self-view and reference view.
- Organize clips and iterate choreography decisions.

From a system perspective, ROAM is a distributed product composed of:

- **React Native / Expo mobile client** (`apps/mobile`)
- **API services** (session, clips, analytics, billing boundaries)
- **Supabase auth/session infrastructure**
- **Cloud build + distribution** (EAS)
- **Local/offline resilience mechanisms** (queue + deferred sync patterns)

As a Senior PM / Lead Engineer, your job is not only to ship features. It is to maintain:

- Product coherence
- Technical reliability
- Team velocity
- Risk visibility
- Decision quality over time

---

## 2) Current app architecture at a glance

At runtime, the app is a layered architecture:

1. **Presentation layer**
   - Expo Router screens and nested routes
   - Visual components (gallery, session shell, choreography views)
2. **Interaction layer**
   - Hooks and context state
   - User intent handlers and routing actions
3. **Domain layer**
   - Session/workbench orchestration
   - Media validation, clip save logic, onboarding state
4. **Integration layer**
   - API requests
   - Supabase auth
   - Upload queue
5. **Cross-cutting layer**
   - Theme tokens
   - i18n
   - analytics instrumentation
   - crash/error capture shim

Core practical principle:

> UI should be replaceable without rewriting domain behavior.

If view components directly own business logic, your scaling cost becomes exponential.

---

## 3) Routing model and navigation resilience

ROAM uses `expo-router` with grouped routes (e.g. `(app)`), auth routes, onboarding routes, and session-specific flows.

### Why routing is a product risk area

Most UX "bugs" in growth-stage apps are not visual defects; they are **flow defects**:

- Missing route params (`sessionId`)
- Illegal route entry points
- Dead/legacy paths after refactors
- Auth/onboarding race conditions

### Your current hardening pattern

In root layout logic:

- Session loading state gates route behavior.
- Onboarding completion state gates app entry.
- Legacy/dead route map redirects users away from broken paths.

This pattern converts route chaos into deterministic behavior:

- `/map` -> `/(app)`
- `/settings` -> `/profile`
- `/recording` -> `/session/camera?id=<activeSessionId>` or fallback

### Senior-level rule

Every route should be classified:

- **Public** (no session needed)
- **Authenticated**
- **Session-bound**
- **Transitional** (onboarding/auth callback)

Build guard logic from this classification, not from ad-hoc if statements.

---

## 4) Session-centric domain model

The product's conceptual center is the **Session**.

A session aggregates:

- Metadata (name, timestamps)
- Reference clips
- User clips
- Music track
- Sections (timed choreography parts)
- Per-section focus/selection state

### Why this matters

If your PM specs and engineering implementation are both session-centric:

- feature scope is clearer,
- event tracking is cleaner,
- data migration is easier,
- collaboration and permissions become tractable.

### Anti-pattern to avoid

Building features around isolated screens instead of around session capabilities.  
Screens change; domain contracts should not.

---

## 5) Workbench vs shell architecture decisions

ROAM includes choreography shell surfaces and legacy workbench paths. You introduced a `SessionWorkbench` abstraction to reduce branching complexity.

This is a strong architecture move:

- One canonical entry point for session work UI.
- Feature flags or migration switches can live in one location.
- Lower cognitive load for new engineers.

### Lead engineer perspective

When replacing old UX with new UX, do not hard-delete old code first. Instead:

1. Add indirection (`SessionWorkbench`).
2. Route traffic through the abstraction.
3. Stabilize metrics and regression checks.
4. Remove legacy paths after confidence threshold.

This reduces catastrophic regressions and enables controlled rollout.

---

## 6) Theme system and design tokenization

You already moved toward a shared session style and introduced responsive token usage.

### What tokens do

Tokens map abstract design decisions to concrete values:

- Spacing scale
- Radii scale
- Typography scale
- Component chrome dimensions
- Device-tier behavior (phone/tablet)

### Why PMs should care

Token systems reduce:

- Design drift
- Review cycle duration
- QA visual diff burden
- Accessibility inconsistency

### Lead engineer implementation rule

Token ownership should be explicit:

- `lib/designTokens.ts` owns primitives and scales.
- Components consume tokens, not hardcoded values.
- Any hardcoded visual value in major surfaces should require justification.

---

## 7) Device strategy: tablet-first quality, mobile-first safety

The app must feel premium on tablet while remaining clean on phone.

### Practical approach

- Use breakpoint-derived device tiers (`phone`, `tablet`).
- Keep one component tree when possible; vary scale and layout constraints.
- Avoid branching business logic by device type.

### UX rules

- Minimum touch target: 44 px logical.
- Primary control spacing should not collapse below token minimum.
- Text scaling must preserve hierarchy, not absolute values.

### Product strategy insight

Do not define "tablet optimization" as "more stuff on screen."  
Define it as "better workflow density without lowering comprehension."

---

## 8) Practice flow: dual pane, PiP, and recording intent

Practice mode is a high-value loop:

- User compares reference with self-view.
- User decides whether to record a full take.

### Engineering details

- `PracticeSelfCamera` handles permission and app-active conditions.
- Practice screen tracks open and record-start events.
- Route to camera is session-aware.

### Failure modes to guard

- Permission denied loops without clear CTA.
- Camera active in background causing crashes or battery drain.
- Session id missing on record launch.

### PM quality standard

Practice loop success metric is not "camera opens."  
It is "user captures a useful iteration and returns to improve choreography."

---

## 9) Music setup and session binding integrity

Music setup historically failed due to missing session context. You implemented robust session id resolution:

- route param `sessionId`
- route param fallback `id`
- active session id storage fallback

### Why this is senior-quality engineering

You designed for **imperfect navigation context**, which is real-world behavior.

### Additional hardening recommendation

Create a reusable helper:

- `resolveRequiredSessionId({params, storage, fallbackRoute})`

This prevents each screen from re-implementing session resolution differently.

---

## 10) Media pipeline and validation

Media handling is where consumer-grade prototypes die in production.

You already improved:

- Extension logic with Android edge cases (`.3gp`, extensionless URIs)
- File existence/size checks
- Save path validation patterns

### Advanced pipeline model

Stages:

1. **Acquisition** (camera/import/share intent)
2. **Preflight validation** (format, size, uri)
3. **Metadata extraction** (duration, dimensions)
4. **Upload enqueue**
5. **Background retry and reconciliation**
6. **Server confirmation**
7. **UI state finalization**

### Engineering leadership expectation

For every stage, define:

- observable event
- retry policy
- user-facing fallback behavior
- terminal failure state

---

## 11) Offline and queue behavior

ROAM already contains queue-drain concepts on app foreground and connectivity changes.

### Why this is strategic

Creative apps are often used in unstable network conditions.  
Offline-safe behavior is a product differentiator, not just a technical detail.

### Queue architecture principles

- Idempotent operations only.
- Retry with bounded exponential backoff.
- Persist queue state locally.
- Include dead-letter handling after max retries.

### PM operational KPI

Track:

- queued operations count
- mean drain time
- failure percentage after retry budget
- user-visible conflict incidents

---

## 12) Auth and onboarding orchestration

Entry experience currently includes:

- auth callback handling
- session detection
- onboarding completion checks
- route redirection logic

### Common anti-pattern

Auth and onboarding checks scattered across screens.  
Result: loops, race conditions, and unexpected route hops.

### Better pattern

Root-level policy engine:

- Evaluate identity state
- Evaluate onboarding state
- Evaluate target route legitimacy
- Decide one next route

This is essentially a finite-state machine, even if implemented in plain code.

---

## 13) Analytics as product instrumentation, not logging

You already have event tracking scaffolding with enum-style events.

### Upgrade the mental model

Bad analytics: "we log clicks."  
Senior analytics: "we measure journey quality."

### Event taxonomy recommendation

- **Lifecycle:** app_open, auth_success, onboarding_complete
- **Creation loop:** project_open, music_attach, practice_open, record_start, clip_saved
- **Reliability:** upload_retry, validation_fail, queue_drain_fail
- **Commerce:** paywall_shown, plan_limit_hit, upgrade_success

### PM leadership move

For each KPI, define exactly:

- numerator event set
- denominator event set
- segment dimensions
- decision threshold

If a metric cannot drive a decision, remove it.

---

## 14) Error handling and crash strategy

Sentry native integration caused build conflicts and was shimmed.

### This is a key leadership lesson

Production readiness is not "install tool X."  
It is "maintain build reliability while preserving observability."

### Current pragmatic state

- no-op sentry shim avoids build breakage
- app-level error boundaries still protect UX

### Next milestone

Re-introduce crash tooling with controlled integration plan:

1. isolate package version compatibility
2. validate Gradle task graph locally and in CI
3. add smoke build pipeline before release channel
4. turn on staged rollout

---

## 15) Internationalization and localization quality

You expanded locale coverage and filled missing keys across major languages.

### What senior PMs know

Localization bugs are trust bugs.

### Technical standards

- No hardcoded user-facing strings in feature screens.
- Locale files must be key-complete in CI checks.
- Support fallback locale while flagging missing keys.

### PM standards

Localization acceptance criteria should include:

- text fit on smallest supported phone width
- no clipped controls
- culturally neutral placeholders and error wording

---

## 16) Performance engineering on React Native

### Main bottleneck classes

- Over-rendering from broad context updates
- Expensive list/grid layouts
- Heavy camera/video surfaces competing for resources
- JS thread contention from non-batched state writes

### Techniques

- `useMemo`/`useCallback` only where re-render savings are proven
- Split contexts by update frequency
- Use `ScrollView` carefully; prefer virtualization for large datasets
- Keep camera/video mount scopes narrow

### PM implication

Performance work needs user-perceived targets:

- Time to interactive
- Scroll smoothness on low-end devices
- Camera start latency
- Upload feedback latency

---

## 17) Testing strategy: confidence by layer

Current state includes Jest unit tests for onboarding/media validation. Good start.

### Mature testing pyramid for this app

1. **Unit tests**
   - domain logic
   - validation
   - state transitions
2. **Component tests**
   - critical UI condition branches (permissions, empty states)
3. **Flow/integration tests**
   - auth -> onboarding -> project open
   - session -> music setup -> player route
4. **Build validation**
   - APK compile smoke
   - route/static checks script (`ux:checklist`)

### Lead standard

Every severe production bug should result in:

- one preventive test
- one detection signal (event/log)
- one runbook update

---

## 18) Build and release operations (EAS)

ROAM Android build flow:

- local workspace -> EAS build upload
- remote Android credentials
- version code increment
- Gradle assemble
- preview/internal distribution artifact

### Release discipline

- Keep release notes tied to behavioral changes, not commit list.
- Maintain per-build smoke checklist.
- Track build failure classes by category (dependency, config, network, Gradle task graph).

### PM + lead engineer coordination

Before requesting build:

- feature freeze for target cut
- blockers list resolved or consciously waived
- explicit rollback plan

---

## 19) Dependency and package governance

Monorepo/mobile dependencies evolve quickly. Unmanaged upgrades create hidden risk.

### Governance model

- Monthly dependency maintenance window.
- Security and compatibility triage.
- Upgrade in bounded batches, not all-at-once.

### Decision rubric

Upgrade now if:

- security risk is high
- build/runtime breakage already appears
- new dependency unlocks needed capability

Defer if:

- no product value
- high migration cost during active release cycle

---

## 20) API contract design and version safety

For endpoints like `/sessions/:id/music`, contract quality determines velocity.

### Contract principles

- Explicit error shapes
- Stable required fields
- Graceful unknown fields handling
- Server-side idempotency for retried writes

### PM requirement quality

For each endpoint-backed feature spec:

- input schema
- output schema
- error matrix
- timeout and retry expectation
- analytics events tied to API outcomes

---

## 21) State management boundaries

ROAM uses contexts and local state for different concerns:

- Session context
- Theme context
- Choreography workbench context
- i18n/locale context

### Lead engineer guideline

Ask before adding to shared context:

1. Is this state truly cross-screen?
2. Does it update frequently?
3. Can it live closer to feature scope?

Global context is not free; it increases render blast radius.

---

## 22) UX consistency operations

The new `ux:checklist` script is the beginning of operational UX quality.

### Expand it over time

Add checks for:

- route map integrity
- translation key completeness
- token usage linting on critical surfaces
- removed/deprecated screen guards

### PM operating practice

No feature should be "done" until:

- design coherence verified
- route safety verified
- analytics hooks verified
- edge-case UX verified

---

## 23) Security and privacy baseline

For user media and account data, baseline standards include:

- principle of least privilege in permissions
- secure credential handling
- no accidental logs of tokens/PII
- documented retention policies

### PM-lead cross-functional requirement

Legal/privacy copy in profile is necessary but insufficient.  
You also need:

- technical implementation alignment with policy
- incident response protocol
- deletion/export pathways if required by jurisdiction

---

## 24) Product management at senior level for this app

### You are responsible for problem framing quality

A senior PM does not ask "can we build X?"  
They ask:

- what user behavior changes if we ship X?
- what metric should move?
- what are second-order effects?
- what trade-offs are we accepting?

### PM artifacts you should own

- north-star metric + guardrails
- quarterly bets with clear kill criteria
- instrumentation map
- risk register
- release readiness scorecard

### Example for ROAM

Bet: Improve practice loop completion.

- Hypothesis: Better self/reference flow increases retained creators.
- Leading indicators: practice_open -> record_start conversion.
- Guardrail: crash-free sessions must not degrade.
- Exit criteria: +15% conversion in target cohort.

---

## 25) Lead engineering at senior level for this app

### Your core function

Reduce entropy while increasing throughput.

### Concrete responsibilities

- architecture decisions with rollback options
- quality bar definition and enforcement
- mentorship on debugging and ownership
- release risk management
- technical debt sequencing

### What to avoid

- hero debugging without system fixes
- silent quality standard changes
- large refactors without migration envelopes

---

## 26) Decision frameworks you should apply weekly

### RICE for feature prioritization

- Reach
- Impact
- Confidence
- Effort

### Cost of delay

Quantify what waiting costs in:

- retention
- revenue
- support burden
- team focus drift

### Buy vs build

Use when evaluating observability, analytics, media tooling, auth adjuncts.

---

## 27) Failure mode and effects analysis (FMEA) for ROAM

Sample critical paths and failure modes:

1. **Auth callback**
   - Failure: session not established
   - Effect: user stuck
   - Mitigation: fallback route + error CTA
2. **Music setup**
   - Failure: session id missing
   - Effect: dead flow
   - Mitigation: robust resolver + redirect
3. **Practice camera**
   - Failure: permission denial ambiguity
   - Effect: user confusion
   - Mitigation: explicit rationale + one-tap retry
4. **Upload queue**
   - Failure: retries exhausted silently
   - Effect: trust erosion
   - Mitigation: surfaced status + recovery actions

---

## 28) Product quality scorecard template

Use this before every preview/release build:

- Routing safety: PASS/FAIL
- Session-bound flow checks: PASS/FAIL
- Token consistency (critical screens): PASS/FAIL
- i18n key completeness: PASS/FAIL
- Offline queue behavior smoke test: PASS/FAIL
- Crash/error boundary sanity: PASS/FAIL
- Analytics critical events firing: PASS/FAIL
- Build reproducibility: PASS/FAIL

Track trend by build, not one-time status.

---

## 29) Metrics tree for ROAM

### North star candidate

Weekly active creators who complete a practice cycle.

### Driver metrics

- Session open rate
- Music attach completion rate
- Practice start rate
- Record start rate
- Clip save success rate

### Guardrails

- Crash-free session rate
- Upload failure rate
- Time-to-first-successful-practice

---

## 30) Backlog shaping and execution cadence

Recommended two-track rhythm:

- **Discovery track:** hypotheses, user pain validation, instrumentation gaps
- **Delivery track:** bounded implementation, hardening, rollout

Each initiative should include:

- behavior objective
- technical scope boundaries
- risk class
- testing plan
- instrumentation plan
- rollback plan

---

## 31) Engineering RFC template (for major changes)

For any significant refactor (routing, media, session domain):

1. Context
2. Problem statement
3. Current constraints
4. Proposed design
5. Alternatives considered
6. Risks and mitigations
7. Rollout strategy
8. Observability plan
9. Test strategy
10. Success criteria

This improves team alignment and reduces hidden assumptions.

---

## 32) UX architecture principles for creative tools

For Procreate/Blender/C4D-inspired feel:

- high clarity of primary action
- low chrome noise
- predictable tool positioning
- strong visual hierarchy and contrast
- instant feedback loops

Engineering implication:

- interaction latency and consistency are as important as feature count.

---

## 33) Accessibility and inclusive design baseline

You cannot be "production-ready" without accessibility fundamentals:

- touch target minimums
- readable contrast
- dynamic type handling where appropriate
- explicit labels for non-text controls
- no color-only meaning

Add accessibility checks to UX checklist evolution.

---

## 34) Operational runbooks you should maintain

Minimum runbooks:

1. Build failure triage
2. Auth outage behavior
3. Media upload incident handling
4. Analytics pipeline degradation
5. Release rollback and hotfix

Runbooks should be short, executable, and owner-assigned.

---

## 35) Team topology and ownership model

As complexity grows, define ownership by domain:

- Session domain
- Media pipeline
- UX system and tokens
- Growth/onboarding
- Reliability/release

Clear ownership reduces duplication and orphaned tech debt.

---

## 36) Hiring and mentoring lens (lead engineer + PM)

Look for people who can:

- reason across product and technical constraints
- communicate trade-offs clearly
- debug with hypotheses, not guesswork
- write maintainable abstractions

Mentor by:

- asking for decision rationale
- requiring rollback plans
- reviewing observability completeness

---

## 37) What “production ready” actually means for ROAM

Production ready is a composite condition:

- User can complete core loop reliably.
- Crashes are observable and bounded.
- Data integrity is protected in normal failures.
- Routes cannot trap users in dead flows.
- Build/release pipeline is repeatable.
- Team can diagnose incidents quickly.

If any one is missing, you are pre-production.

---

## 38) 90-day senior PM + lead engineer growth plan

### Days 1-30

- Master system map and critical paths.
- Define metric tree and instrumentation gaps.
- Establish release scorecard baseline.

### Days 31-60

- Drive one high-impact loop improvement end-to-end.
- Implement at least one architecture hardening change.
- Build incident/runbook discipline.

### Days 61-90

- Mentor another engineer through a scoped initiative.
- Present roadmap with quantified trade-offs.
- Demonstrate measurable KPI and reliability improvements.

---

## 39) Practical exercises (mandatory)

1. **Architecture drill**
   - Draw current route/state/integration map from memory.
2. **Incident simulation**
   - Simulate missing session id + upload outage.
3. **Spec quality drill**
   - Write a senior-level spec for “Practice v2”.
4. **Metrics drill**
   - Define complete funnel for practice loop with guardrails.
5. **Refactor drill**
   - Replace one hardcoded style surface with pure token usage.

If you cannot do these, keep studying and practicing.

---

## 40) Final leadership checklist

Before every major release, ask:

1. Is the user journey coherent and measurable?
2. Can failures be detected and triaged fast?
3. Are routes and states legally reachable?
4. Are design and interaction standards consistent?
5. Is the team able to maintain this architecture next quarter?

If all five are true, you are operating at senior level.

---

## Appendix A: Suggested file ownership map for current repo

- `apps/mobile/app/_layout.tsx`: global routing policy and guard logic
- `apps/mobile/lib/designTokens.ts`: UX scale and responsive primitives
- `apps/mobile/components/choreography/*`: core session creation surfaces
- `apps/mobile/app/(app)/session/*`: session-bound workflow routes
- `apps/mobile/lib/productAnalytics.ts`: instrumentation contracts
- `apps/mobile/lib/mediaValidation.ts`: media preflight logic
- `apps/mobile/scripts/ux-checklist.js`: quality gate automation

---

## Appendix B: Suggested KPIs and target ranges (example)

- Practice open -> record start: target +15% quarter-over-quarter
- Clip save success: > 98.5%
- Crash-free session: > 99.3%
- Dead-flow route incidence: ~0 (after redirect hardening)
- Build success rate for preview: > 95%

Tune targets after baseline measurement.

---

## Appendix C: Glossary

- **Dead flow:** A route path where user cannot complete intended task.
- **Guardrail metric:** Metric that must not regress while optimizing primary KPI.
- **Idempotency:** Running the same operation repeatedly does not corrupt state.
- **Blast radius:** Scope of impact from a change or failure.
- **Hardening pass:** Focused iteration to improve reliability/consistency without major feature expansion.

---

## Appendix D: Reading list

Product:

- Inspired (Marty Cagan)
- Escaping the Build Trap (Melissa Perri)

Engineering leadership:

- Staff Engineer (Will Larson)
- The Manager’s Path (Camille Fournier)

Systems and reliability:

- Site Reliability Engineering (Google SRE book)
- Designing Data-Intensive Applications (Martin Kleppmann)

Mobile:

- React Native architecture docs
- Expo and EAS official production guides

---

## Closing note

Becoming a Senior PM and Lead Engineer is less about title and more about behavior:

- You create clarity in ambiguity.
- You convert failures into stronger systems.
- You balance user value, team velocity, and technical integrity.

Use this guide as an execution handbook. Revisit it monthly and annotate it with what changed in the actual product and codebase.


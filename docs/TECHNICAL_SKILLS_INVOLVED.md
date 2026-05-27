# Technical Skills Involved in Building and Shipping ROAM

## 1) Executive Context

ROAM is not a single-stack app. It is a multi-surface product with:

- a mobile capture and editing experience (`Expo` / `React Native`)
- a backend API (`Node.js` + `Hono`)
- a share web surface (`Next.js`)
- a cloud data/auth/storage layer (`Supabase`)
- media processing + streaming (`Mux`, upload queues, clip workflows)
- payments and plan gates (`Stripe`)
- shared type contracts across the monorepo (`TypeScript` packages)

Because of this, the required skills are not only “coding skills,” but also:

- system design skills
- product-technical translation skills
- debugging and stabilization discipline
- release management and quality assurance habits

This document breaks down the technical skills needed to deliver ROAM from “build passes” to “production reliable.”

---

## 2) Product-to-Engineering Translation Skills

### 2.1 PRD decomposition

Ability to convert PRD statements into implementable stories:

- Example PRD statement: “Capture quickly and assign later.”
- Engineering decomposition:
  - trigger: Home -> Record
  - state: recording, stopped, saving
  - decision: Later / Existing Session / New Session
  - persistence: local row + upload queue + sync status
  - failure handling: offline fallback + retry

### 2.2 UX flow formalization

Skills needed:

- transform rough design concepts into deterministic screen-state models
- define tap budgets (for example, 3 taps max from stop to assignment)
- define empty/loading/error/offline states for every key screen
- ensure platform-consistent behavior (Android back, iOS safe area, keyboard)

### 2.3 Scope slicing for incremental delivery

Critical ability in this project:

- identify MVP-critical flows first
- postpone low-leverage polish without breaking architecture
- sequence implementation so each stage compiles and remains testable

---

## 3) Monorepo and TypeScript Platform Skills

### 3.1 Monorepo orchestration (`pnpm` + `turborepo`)

Required competency:

- understand workspace dependencies and cross-package build order
- run targeted tasks (`--filter=@roam/mobile`) to reduce iteration time
- debug cache behavior and task graph issues
- maintain clean scripts for build/lint/test per package

### 3.2 TypeScript architecture

Key skills:

- strict typing design in shared contracts (`@roam/types`)
- managing compatibility between app-specific models and shared types
- narrowing union types for safer domain logic
- handling TS config trade-offs during stabilization vs strictness goals

### 3.3 API contract integrity

Must be able to:

- keep client/server schema expectations aligned
- avoid silent runtime drift between:
  - mobile app payloads
  - backend route expectations
  - shared type declarations

---

## 4) Mobile Engineering Skills (React Native + Expo)

### 4.1 Navigation and route architecture

ROAM relies on route-driven UX. Skills include:

- `expo-router` nested routes and tab structures
- conditional redirects and auth gating
- deep-link and callback handling
- preventing accidental navigation loops or broken history

### 4.2 Camera and recording pipelines

Critical specialized skills:

- camera permissions and lifecycle management
- start/stop recording reliability
- dual capture scenarios and null-safety handling
- handling interrupt scenarios (app backgrounding, permission denial)

### 4.3 Media playback and clip UX

Needed competencies:

- local and remote clip playback integration
- YouTube embed/iframe behavior within React Native constraints
- timeline controls (seek, loop, trim boundaries)
- playback state synchronization with UI and sheet state

### 4.4 Stateful sheet-driven interfaces

ROAM is sheet-heavy. Engineers need:

- reliable bottom sheet refs and control flow
- no-race transitions between sheets (Quick Save, Tag, Share, Notes)
- predictable state resets on close/reopen
- component contract clarity (`bottomSheetRef`, callbacks, payload shape)

### 4.5 Offline-first local persistence

Core skills:

- using local cache storage (MMKV/SQLite) with clear invalidation policies
- optimistic updates with later server reconciliation
- local queue and retry modeling
- user-visible sync status and recovery actions

---

## 5) Backend API Engineering Skills (Node + Hono)

### 5.1 Route design and request hygiene

Required skills:

- REST endpoint design for sessions, clips, share, feedback, billing, etc.
- payload validation and defensive parsing
- actionable status codes and error envelopes
- idempotency awareness for multi-submit contexts

### 5.2 Auth and authorization layering

Must be comfortable with:

- extracting auth identity in middleware
- associating user context to all data access
- enforcing access checks for share/session resources
- protecting private operations with service-role patterns safely

### 5.3 Business rule enforcement

Examples:

- plan gates (free vs paid limits)
- ownership checks on clip/session mutation
- rate/volume constraints for expensive operations

Skill requirement:

- keep rules centralized and testable
- prevent duplicated policy logic scattered in routes

### 5.4 Runtime resilience

Back-end competency includes:

- external dependency failure handling (Supabase, Stripe, Mux)
- timeout and retry strategy
- structured logging with request context
- safe fallback responses during partial outages

---

## 6) Supabase and Data Modeling Skills

### 6.1 Relational schema fluency

Need strong SQL/data modeling skills:

- sessions, clips, tags, section clips, note pins, feedback entities
- relationship design (one-to-many, optional references, token-based sharing)
- index planning for mobile-first query patterns

### 6.2 Row Level Security (RLS)

Production readiness requires:

- writing and validating RLS policies
- ensuring every user query path obeys isolation
- testing policy behavior with real user contexts

### 6.3 Migration and evolution discipline

Skills:

- additive schema evolution without breaking older clients
- migration rollback planning
- backfilling derived fields safely
- environment parity across local/staging/prod

### 6.4 Query performance + consistency

Need to diagnose:

- over-fetching in mobile critical paths
- N+1 query patterns
- cross-table aggregation cost
- consistency delays visible in user workflows

---

## 7) Media Infrastructure Skills (Mux + Upload Flows)

### 7.1 Upload and encoding lifecycle design

Required:

- handling local URI -> upload -> processing -> playable asset transitions
- user-facing processing states (“Uploading”, “Processing”, “Ready”)
- resilient retries with non-duplicating semantics

### 7.2 Share-safe media delivery

Skills include:

- generating and validating view URLs/tokens
- controlling read-only access boundaries
- keeping playback compatible across mobile/web share surfaces

### 7.3 Time-based interaction modeling

For choreography tooling:

- mapping playhead times to note pins and tags
- managing section labels over media time ranges
- handling precision and rounding edge cases in timecode interactions

---

## 8) Web Surface Skills (Next.js Share + Feedback)

### 8.1 App Router implementation

Needed competency:

- dynamic routes for tokenized share pages
- server/client boundary handling in Next.js 14
- pre-rendering vs dynamic rendering trade-offs

### 8.2 Playback and interaction UX

Must be able to:

- build robust media player wrappers
- synchronize feedback forms with current playhead
- submit and validate feedback payloads cleanly

### 8.3 Compatibility and dependency management

Important skill observed in stabilization:

- diagnose runtime issues from dependency mismatches (for example, React version conflicts)
- pin versions intentionally when framework constraints require it

---

## 9) Payments, Plans, and Entitlement Skills

### 9.1 Stripe integration design

Need ability to:

- model plan states and checkout/session endpoints
- process webhook events idempotently
- sync billing state into application entitlements

### 9.2 Entitlement-driven UX

Skill requirement:

- enforce limits gracefully in UI (paywall sheets, upgrade paths)
- avoid hard-fail dead ends
- preserve user work when gate is hit

### 9.3 Auditability

Must include:

- billing event traceability
- clear plan status provenance for debugging support issues

---

## 10) State Management and Domain Modeling Skills

### 10.1 Shared domain vocabulary

Critical for team velocity:

- explicit definitions for clip states, session states, sync states
- consistent naming across mobile, API, and database

### 10.2 Event-driven thinking

Examples:

- “record stopped” triggers quick-save branch
- “clip saved locally” triggers queue enqueue
- “upload succeeded” triggers UI state progression

Engineers need to model these transitions explicitly to prevent drift.

### 10.3 Edge-case discipline

Needed for ROAM reliability:

- interrupted flows
- duplicate user taps
- stale references for sheets/refs
- conflicting updates from local and remote sources

---

## 11) Testing and Quality Engineering Skills

### 11.1 Layered verification strategy

Skills required:

- static checks (TypeScript, lint)
- route-level backend tests
- mobile interaction smoke tests for critical flows
- integration tests for share/feedback and plan gates

### 11.2 Acceptance testing against PRD

Needs strong QA/product alignment:

- convert PRD into measurable acceptance criteria
- maintain pass/fail evidence matrix
- ensure “build green” does not masquerade as “feature complete”

### 11.3 Failure-mode testing

Must test:

- offline capture and delayed sync
- permission denied/revoked states
- upload timeout and retry behavior
- web feedback on slow/failed network

---

## 12) Debugging and Stabilization Skills

### 12.1 Compiler and type error triage

Need ability to:

- identify root-cause clusters instead of one-by-one symptom fixes
- prioritize high-leverage fixes (tsconfig, shared types, invalid props)
- avoid introducing contract drift while reducing errors

### 12.2 Runtime debugging

Skillset:

- reproduce issues with deterministic steps
- isolate by layer (UI logic, route data, DB state, external APIs)
- add temporary instrumentation cleanly, then remove

### 12.3 Regression containment

Engineers should:

- scope edits tightly
- avoid unrelated churn in dirty trees
- rerun targeted checks before broad pipeline runs

---

## 13) DevOps and Release Engineering Skills

### 13.1 Build and pipeline reliability

Required:

- maintain deterministic package scripts
- keep CI tasks aligned with local scripts
- monitor cache/config drift across packages

### 13.2 Environment configuration

Need expertise with:

- local/staging/prod env variable management
- secret handling without leaking keys
- service integration sanity checks before release

### 13.3 Release hygiene

Critical habits:

- clean commit boundaries
- artifact exclusion (avoid generated output drift in git)
- release checklists for route health, auth, billing, and media workflows

---

## 14) Collaboration and Documentation Skills

### 14.1 Technical communication

High-value skill:

- write implementation status docs that are actionable, not vague
- produce handoff docs for AI-assisted coding with clear constraints
- keep assumptions and open questions explicit

### 14.2 Design-engineering handshake

Needed:

- convert high-level design into token-consistent implementation tasks
- capture unresolved design decisions before coding
- keep UX intent preserved through technical trade-offs

### 14.3 AI-assisted development control

Given your workflow, this is now a first-class skill:

- crafting precise prompts with:
  - goal
  - scope
  - done-when
  - constraints
- enforcing no-unrelated-change behavior
- validating outputs with real checks, not only narrative confidence

---

## 15) Security and Privacy Skills

### 15.1 Data protection basics

Need to secure:

- user-generated media
- private sessions and notes
- tokenized share endpoints

### 15.2 Principle of least privilege

Skills include:

- isolating service-role usage to backend only
- minimizing sensitive data in client payloads/logs
- strict ownership checks in all mutation routes

### 15.3 Abuse prevention

Important for public links and feedback endpoints:

- input validation and sanitization
- anti-spam/rate limiting strategy
- safe handling of malformed external requests

---

## 16) Accessibility and Inclusive UX Skills

### 16.1 Mobile accessibility

Must include:

- touch target sizing
- semantic labels for controls
- dynamic text compatibility
- contrast validation for night mode

### 16.2 Cognitive load reduction

A choreography app must be quick under pressure:

- concise copy
- clear primary action per screen
- visual hierarchy that reduces decision fatigue

### 16.3 Error recovery UX

Need ability to design:

- error messages with next steps
- non-destructive retries
- preserving user progress after failure

---

## 17) Skill Maturity Model (Practical Hiring/Execution Lens)

### 17.1 Core (must-have to ship MVP)

- React Native + Expo route/sheet/media fundamentals
- TypeScript contract discipline
- API route design + auth basics
- Supabase CRUD + policy awareness
- build/lint/debug workflow

### 17.2 Advanced (needed for production confidence)

- offline-first sync strategy
- media pipeline resilience
- payment/entitlement robustness
- PRD acceptance engineering and evidence tracking

### 17.3 Expert (needed for scale and speed)

- cross-platform architecture stewardship
- performance tuning across mobile/web/API
- operational excellence (incident diagnosis, rollback-safe releases)

---

## 18) Suggested Team Capability Map

For fastest execution, these capability clusters should be covered (one person can cover multiple):

- Mobile Product Engineer (capture, playback, sheet UX)
- Backend/Product API Engineer (routes, policy, business rules)
- Data/Platform Engineer (Supabase schema, migrations, RLS)
- Frontend Web Engineer (share/feedback experiences)
- QA/Release Engineer (acceptance matrix, failure-mode validation)
- Technical Product/UX Integrator (PRD-to-flow consistency)

---

## 19) Immediate Skill Priorities for ROAM (Next Execution Cycle)

If the goal is “app works reliably and feels good,” prioritize skill application in this order:

1. Critical flow reliability engineering
   - Home -> Record -> Quick-save
   - Capture -> Inbox -> Assign
2. State-model completion
   - loading/error/offline/retry on all MVP screens
3. Contract hardening
   - mobile <-> API <-> types alignment
4. Lint/type debt reduction without feature regressions
5. Acceptance matrix validation against PRD

---

## 20) Final Takeaway

The technical challenge in ROAM is not only writing screens or endpoints.  
It is orchestrating **mobile UX speed**, **data correctness**, **media reliability**, and **incremental delivery discipline** across a monorepo.

The strongest contributors in this project combine:

- deep implementation ability
- product-sense in flow simplification
- rigorous validation habits
- disciplined release management

That blend is the real “technical skill set” needed to make ROAM production-ready.


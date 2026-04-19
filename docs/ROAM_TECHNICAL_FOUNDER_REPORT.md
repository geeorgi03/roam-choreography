# Roam Technical + Founder Report

**Author context:** Founder/Operator reference  
**Project:** `roam-choreography`  
**Date:** 2026-04-18  
**Purpose:** A practical 20-section, interview-ready brief explaining what Roam is, how it works technically, and how to operate it as a founder who can delegate effectively while staying technically credible.

---

## 1) Executive Summary (What Roam Is)

Roam is a choreography workflow platform designed to reduce the friction between **capturing movement ideas** and **turning them into reusable, collaborative choreography assets**.

At its core, Roam combines:

- fast mobile capture and session workflows,
- music-linked structuring and section mapping,
- clip-level review and annotation,
- share-based external feedback,
- and spatial formation planning.

Technically, Roam is a monorepo product with:

- `apps/mobile` (React Native + Expo),
- `apps/api` (Hono API),
- `apps/web` (public share/review surface),
- shared type contracts in `packages/types` and `packages/shared-types`.

Business-wise, Roam sits at the intersection of:

- creator tools,
- team collaboration software,
- and lightweight performance production systems.

The value proposition is speed + structure: Roam helps choreographers move from raw video to refined choreography decisions with fewer context switches.

---

## 2) Product Problem and Why It Matters

### Current pain in choreography workflows

Most choreography teams still rely on fragmented workflows:

- camera roll clips,
- messaging apps for feedback,
- ad-hoc notes,
- separate music timing references,
- and memory-heavy coordination.

This causes:

- lost context between clip and music timing,
- feedback that is unstructured and hard to action,
- repeated rework,
- poor traceability from idea -> final section.

### Roam’s response

Roam compresses the choreography loop:

1. Capture or ingest material quickly.
2. Attach clips to sessions and music sections.
3. Review with time-aware tooling.
4. Collect and categorize feedback.
5. Persist spatial/formation decisions.

This turns choreography from a “chat-and-files” workflow into a **system of record for iteration**.

---

## 3) Product Surfaces and User Journeys

Roam currently spans multiple surfaces:

### Mobile (primary creation surface)

- Session management
- Capture
- Workbench
- Music setup
- Clip review / loupe
- Spatial tab for formation mapping

### API (business logic + persistence boundary)

- Session routes
- Music routes
- Feedback routes
- Assembly routes
- Moments/formation persistence

### Web (external collaboration surface)

- Public share token pages
- Clip player
- Structured feedback submission and display

### Typical choreography cycle in Roam

1. Create/select a session.
2. Capture clips or ingest references (including shared links).
3. Configure music and sections.
4. Map clips to sections (`assembly`).
5. Run loop/review in clip player.
6. Collect comments/feedback categories.
7. Refine spatial formations per moment.
8. Repeat until performance-ready.

---

## 4) Architecture Overview (Monorepo)

Roam uses a workspace-based monorepo (`pnpm-workspace.yaml`) with `apps/`* and `packages/`*.

### Why this architecture works for Roam

- **Shared types reduce drift:** mobile/web/api all compile against common contracts.
- **Cross-surface velocity:** one change can be propagated safely across all clients.
- **Stronger integration discipline:** routes + payloads + UI states can be versioned together.

### Core packages and their role

- `apps/mobile`: where value is created in the field/studio.
- `apps/api`: policy + persistence + integration logic.
- `apps/web`: external review and async collaboration.
- `packages/types`: app-facing domain models.
- `packages/shared-types`: schema-level contracts and broader shape safety.

---

## 5) Mobile App Technical Model

The mobile app is built on React Native (Expo) and implements a multi-tab/multi-route session experience.

### Major mobile domains

- **Home/Inbox/session entry**
- **Capture and quick-save**
- **Workbench (music + section alignment)**
- **Clip player + loupe review**
- **Spatial planning (moments + formation data)**

### Engineering strengths already present

- centralized API request wrapper (`apiRequest`) with timeout/retry semantics,
- stronger offline/network error handling in key flows,
- conflict-aware sync signals for spatial/assembly states,
- performance-oriented loupe controls and guardrails.

### Where mobile can still improve

- deeper runtime acceptance across real devices,
- tablet-first layout refinement (important for “tool-like” UX),
- consistency pass across all edge-state views (loading/error/empty).

---

## 6) API Layer and Service Boundaries

The API is the operational core for cross-client consistency.

### Key route groups

- `sessions`: lifecycle and session-level entities.
- `music`: upload/link and lyrics support.
- `feedback` + `feedbackPublic`: collaboration and comment intake.
- `assembly`: clip-section assignments and ordering.

### Important reliability features

- typed and explicit error semantics,
- timeout handling for third-party providers,
- conflict handling for concurrent writes,
- response compatibility efforts to avoid client breakage.

### Practical founder takeaway

Your API is not “just backend”; it is your choreography operating protocol.  
Every contract you harden here reduces chaos in product operations later.

---

## 7) Data Contracts and Type Strategy

Roam uses shared TypeScript contracts to keep mobile/web/api aligned.

### Why this matters

Without shared contracts, product speed decays because:

- each client invents local assumptions,
- regressions happen silently,
- and release quality depends on manual memory.

### In Roam

Shared types already support:

- clip models,
- feedback extensions (e.g., category/text),
- section assignment and formation data pathways.

### Maturity pattern to continue

Treat contract changes as product decisions:

- schema migration notes,
- client compatibility matrix,
- explicit “breaking vs additive” flags in PR descriptions.

---

## 8) Music and Timing Pipeline

Music is foundational because choreography decisions are music-coupled.

### What Roam supports

- music setup via upload/link flows,
- section-based mapping,
- loop-oriented usage in workbench/review,
- lyrics lookup support for contextual reference.

### Technical risk area

Third-party dependencies (e.g., lyrics providers) can fail intermittently.  
Roam has started hardening this with timeouts/fallback semantics, but founder-level planning should treat this as non-deterministic infrastructure.

### Product implication

Never let optional enrichment (lyrics/provider metadata) block the core choreography loop.

---

## 9) Clip Review and Loupe Subsystem

The clip player/loupe is one of Roam’s differentiators.

### Why it matters

The value of choreography tooling is not only storage; it is **decision quality per minute reviewed**.

### Technical direction already taken

- adaptive throttling and performance-aware capture cadence,
- improved handling around frame extraction/control paths,
- user-visible notices when performance fallback modes activate.

### Founder quality bar

For this subsystem, “works” is not enough.  
Set explicit perf acceptance:

- max jank thresholds,
- minimum usable FPS ranges,
- replay consistency on target device classes.

---

## 10) Collaboration and Feedback System

Roam supports structured collaboration via clip-level comments/feedback and web share flows.

### Product behavior

- create share links for asynchronous review,
- submit feedback with category semantics,
- display feedback in ways that preserve structure.

### Technical improvements observed

- normalization/parsing of feedback categories,
- compatibility-aware API responses,
- improved roundtrip consistency between submission and render.

### Business leverage

This is the start of “team memory.”  
When structured feedback is captured, you can later build:

- quality analytics,
- rehearsal bottleneck detection,
- reviewer scoring patterns,
- and decision traceability.

---

## 11) Spatial / Formation Mapping

Spatial planning in Roam captures formation state per moment, turning choreography from “video-only memory” into editable structure.

### Current mechanics

- moments timeline/context,
- formation payloads and tool states,
- persistence with visible sync status,
- conflict awareness signals.

### Key reliability decisions

- conflict/pending/synced visibility is crucial,
- retries and state refreshes reduce silent data loss risk,
- revision-based guardrails help multi-actor safety.

### Founder lens

This capability can become a moat if polished:

- choreographic intent represented as data,
- not just media.

---

## 12) Reliability, Offline, and Edge Conditions

Roam has been actively hardened but still needs broader runtime evidence.

### What’s in place

- request retries + timeout controls,
- standardized error UX in critical flows,
- conflict detection/recovery pathways in sync-sensitive routes.

### Why this matters commercially

Studios and rehearsals run in imperfect network conditions.  
Perceived trust in the tool is mostly determined by:

- whether actions feel reversible,
- whether failures are understandable,
- and whether recovery is obvious.

### Tactical quality matrix to maintain

For every critical action:

- loading state visible,
- retry path visible,
- failure message human-meaningful,
- data integrity preserved on refresh/retry.

---

## 13) Build, Delivery, and Release Operations

Roam uses modern mobile build/deploy flow with EAS for Android artifacts (APK/AAB profile-dependent).

### Operational reality

- internal preview profiles are ideal for founder validation cycles,
- store builds should remain stricter and slower,
- release confidence should be evidence-based, not intuition-based.

### Founder release discipline

For each release candidate:

1. green compile/lint/type gates,
2. high-risk runtime checklist pass,
3. known issues explicitly documented,
4. rollout plan + rollback plan.

---

## 14) Security and Data Governance Baseline

Roam already uses authenticated session boundaries and secure service integration patterns, but founder leadership should treat security as a product feature.

### Minimum posture

- explicit auth checks on protected routes,
- no secret leakage in client payloads/logging,
- migration safety and access policy discipline,
- controlled handling of public share tokens.

### Founder delegation point

Assign one owner for “security and data hygiene” even in a small team.  
Security only improves when someone owns the checklist.

---

## 15) Product Health: What Is “Done” vs “Partial”

Roam’s own PRD matrix uses `Done`, `Partial`, and `Not Done`.

### Strategic interpretation

Many capabilities are coded and wired, but remain `Partial` due to missing runtime/performance evidence.

This is healthy honesty.  
Founders should avoid “code completed = product completed.”

### Recommended definition shift

A feature is only “Done” when:

- code exists,
- E2E is wired,
- runtime behavior is validated on target devices,
- and success metrics are measured.

---

## 16) Interview Narrative: “I Can Vibecode” (Credibly)

If you’re framing your story in interviews, anchor on outcomes and systems thinking:

### Strong narrative

“I lead an AI-accelerated build process, but I don’t confuse speed with quality. I define contracts, run acceptance gates, and prioritize reliability in production choreography workflows.”

### What to demonstrate

- you understand architecture trade-offs,
- you can ship cross-platform features with shared contracts,
- you can identify and harden weak points,
- you can separate core value from optional enrichment.

### Avoid in interviews

- “AI wrote most of it” with no validation story,
- vague claims about scalability without concrete constraints,
- no mention of error handling or release gates.

---

## 17) Founder Operating System: Delegation Model

To scale Roam, delegate by capability lanes, not by random ticket assignment.

### Suggested lane ownership

- **Product + UX lane:** user flows, interaction consistency, design system.
- **Core app lane:** mobile performance, session workflows.
- **Platform lane:** API integrity, schema migrations, observability.
- **Growth/collab lane:** share flows, feedback loops, analytics instrumentation.

### Delegation artifacts you should require

- one-page technical brief per feature,
- explicit API contract changes,
- acceptance checklist with failure modes,
- post-merge runtime test note.

---

## 18) Business Model and GTM Implications

Roam’s monetizable value is workflow acceleration and quality assurance in creative production.

### Potential customer profiles

- independent choreographers,
- dance studios,
- production teams,
- choreography assistants and rehearsal directors.

### Pricing logic options

- per-seat collaboration tiers,
- per-project/session quotas,
- premium review/spatial tooling,
- team analytics add-ons.

### GTM reality

Traction likely starts via:

- founder-led pilot cohorts,
- visible before/after workflow stories,
- high-touch onboarding with targeted studios.

---

## 19) 90-Day Technical + Product Execution Plan

### Days 0–30: UX and reliability baseline

- tablet-first design refresh implementation pass,
- edge-state consistency audit,
- top 10 runtime friction fixes from real usage,
- instrumentation on critical user actions.

### Days 31–60: Collaboration confidence

- hardened share/review lifecycle,
- structured feedback UX polish,
- improved conflict resolution affordances in spatial/assembly,
- internal pilot with scripted acceptance metrics.

### Days 61–90: Scale readiness

- performance profiling on representative device matrix,
- release process formalization,
- observability dashboards for API/mobile reliability,
- convert pilot evidence into GTM assets.

---

## 20) Practical Founder Checklist (Weekly)

Run this checklist every week:

### Product

- What user pain did we reduce this week?
- Which flow still feels “web-like” instead of “tool-like” on tablet?

### Engineering

- Any contract changes without migration notes?
- Any route with high failure rate and weak retry UX?

### Quality

- Which “Partial” PRD rows moved toward evidence-backed “Done”?
- Do we have runtime proof, not just green local checks?

### Business

- Are pilots producing measurable time-saved outcomes?
- What objections are we hearing repeatedly from choreographers?

### Team/Delegation

- Is every critical domain explicitly owned?
- Are handoffs documented enough to avoid founder bottleneck?

---

## Final Positioning Statement

Roam is not just a video app. It is an emerging choreography operations platform:

- capture,
- structure,
- review,
- collaborate,
- and spatially plan.

As a founder, your leverage comes from running both tracks in parallel:

1. **Technical credibility** (architecture, contracts, reliability, performance),
2. **Business execution** (clear ICP, measurable outcomes, and disciplined delegation).

If you keep translating product friction into technical priorities, and technical progress into customer-visible outcomes, Roam can evolve from a promising build into a category-defining creative operations tool.
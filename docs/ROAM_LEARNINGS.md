# Roam Learnings

Last updated: 2026-04-01
Owner: Georges

## Why this document exists

This document captures the most important lessons from building Roam so decisions get faster and more consistent over time.

## Core founder learnings

1. Brand-first beats product-first for this category.
   - A dance app without a real dance brand struggles with cold start.
   - Building artistic credibility and community creates built-in distribution for Roam.

2. Distribution is a product feature.
   - Personal content, story, and choreography output are not "marketing extras."
   - They are core growth infrastructure for activation and retention.

3. Niche depth is better than broad positioning.
   - Roam works best when it solves one sharp dancer workflow exceptionally well.
   - Trying to be a generic social/video app weakens the value proposition.

4. Founder consistency compounds.
   - Repeated creative output and direct community interaction create trust.
   - Trust converts better than paid reach in early-stage creator products.

## Product and UX learnings

1. Shell-level ownership matters.
   - Shared UI elements should live at shell level, not inside individual tabs.
   - Duplicating UI in tabs creates drift, inconsistency, and rework.

2. Context-driven navigation simplifies flow.
   - Shared session context (`activeTab`, `activeMoment`, `sessionName`) enables smooth cross-tab actions.
   - Lightweight jump actions (example: Workbench -> Map) remove friction from creative workflows.

3. Small interaction details improve creative momentum.
   - Inline editing, quick actions, and visible state cues keep users in flow.
   - Creative tools benefit from fewer modal interruptions and direct manipulation.

4. Build for continuity over novelty.
   - The best feature is often the one that lets dancers continue from current context without re-orientation.

## Technical execution learnings

1. Surgical changes reduce regression risk.
   - Focused edits in the right ownership layer are safer than broad rewrites.
   - Avoid touching routing/coordinator layers unless strictly necessary.

2. Shared state contracts are leverage points.
   - Strong session context design made multiple fixes possible without architecture churn.
   - Type-safe tab ids and clear context value boundaries reduce integration errors.

3. UI duplication is a hidden debt source.
   - Duplicate strip implementations caused visual mismatch and maintenance overhead.
   - Consolidating to one source of truth is both a UX and engineering win.

4. Verification loop should stay lightweight.
   - Run lint checks after substantive edits.
   - Prefer fast, iterative validation over heavy process during product discovery.

## Economics learnings

1. AI tool spend is low versus equivalent external dev spend.
   - Current AI stack budget (about EUR500) is significantly lower than freelancer/agency equivalents.
   - Effective leverage comes from combining tools with strong founder execution.

2. Cash savings shift cost to founder time.
   - Lower development spend is valuable, but requires disciplined prioritization.
   - Time quality and decision quality become the main constraints.

3. Success metric hierarchy matters.
   - Retention and creator activation are stronger signals than raw installs.
   - A smaller but highly engaged dancer community is strategically better than broad low-intent growth.

## What to keep doing

- Keep building the dance brand in public while shipping product increments.
- Keep product scope narrow around core dancer workflows.
- Keep shell-level UI ownership and avoid duplicate implementations.
- Keep adding low-friction cross-tab actions that preserve user context.
- Keep measuring retention and repeat creation behavior as primary KPIs.

## Mistakes to avoid

- Expanding into generic social features too early.
- Optimizing for vanity growth instead of repeat usage.
- Letting UX patterns diverge between tabs/screens.
- Adding complexity before confirming core loop strength.

## Working principles for next phase

1. Every feature must improve one of:
   - creation speed,
   - creative confidence,
   - collaboration feedback loops,
   - or return frequency.

2. Every growth action must connect brand -> product:
   - content inspires,
   - Roam captures action,
   - community reinforces habit.

3. Every roadmap decision should pass this filter:
   - "Will this make core dancers come back next week?"

## Next update prompts

Use these prompts each week to keep this document current:

- What did users repeatedly do without prompting?
- Where did users lose momentum?
- Which feature created the strongest return behavior?
- What did we build that did not move retention?
- What founder actions drove meaningful user quality?

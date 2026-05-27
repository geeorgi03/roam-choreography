# Roam Launch Execution Plan (50 -> 200 -> 1000 Users)

Status: Execution-ready  
Owner: Product/Growth  
Last updated: 2026-05-13

## 1) Goals and Stage Gates

### Stage A: 0 -> 50 active users (pilot fit)

Primary goal:
- Prove choreographers can complete core workflow repeatedly in real rehearsals.

Gate to pass:
- 50 users created sessions
- >= 60% complete onboarding checklist
- >= 40% log at least 3 takes within first 7 days

### Stage B: 50 -> 200 users (repeatability)

Primary goal:
- Prove referral/invite loop can produce consistent new user flow.

Gate to pass:
- 200 total users with at least one session
- invite->waitlist conversion >= 20%
- weekly activated users growth >= 15% for 4 consecutive weeks

### Stage C: 200 -> 1000 users (scale discipline)

Primary goal:
- Scale acquisition while maintaining workflow quality and reliability.

Gate to pass:
- 1000 total users with session activity
- p95 E2E test pass rate in CI remains 100%
- pending cloud writes median = 0 by week end

## 2) North-Star and Supporting Metrics

North-star:
- Activated choreographers per week (completed core first-session flow).

Supporting:
- New users from referral links
- Waitlist leads per week
- Invite->waitlist conversion rate
- Onboarding completion rate
- Session creation rate
- Takes logged per activated user

## 3) Weekly Operating Cadence

### Monday (instrument and prioritize)
- Review weekly report in app + ops snapshot JSON.
- Identify top 2 activation drop-offs.
- Select one product fix and one growth experiment.

### Tuesday-Wednesday (ship + outreach)
- Ship selected product improvement.
- Run targeted outreach to 20-40 choreographers (message + invite link).

### Thursday (feedback loop)
- Conduct 5-8 short user interviews.
- Tag top friction points: onboarding, assignment, reference capture, sync.

### Friday (decision and scaling)
- Compare weekly metrics to stage gate targets.
- Decide: scale current tactic, modify, or drop.
- Publish one internal launch note with learnings and next-week focus.

## 4) Stage-Specific Tactics

### A) 0 -> 50 users
- Hand-recruited pilot cohort (dance schools, choreographer circles).
- White-glove onboarding (10-minute setup call).
- Require one live rehearsal usage in first 48 hours.

### B) 50 -> 200 users
- Referral push:
  - in-session CTA after first successful assignment
  - invite teammate prompt after share-pack generation
- Add weekly “best choreographer workflow” examples in community channels.

### C) 200 -> 1000 users
- Segment campaigns by dance style and team size.
- Build ambassador micro-program for power users.
- Maintain strict reliability gate before each release.

## 5) Release and Reliability Policy

Before each release:
1. `npm run test:ci` must pass locally.
2. GitHub workflow `roam-site-ci` must pass.
3. No unresolved high-severity sync regression.
4. Pending cloud writes trend reviewed (must not regress for 2 releases in a row).

Rollback triggers:
- CI regression on core flows
- sustained increase in pending cloud writes
- onboarding completion drops > 15% week-over-week

## 6) Team Roles (Minimum)

- Product/Growth Owner: experiments, outreach, weekly decisions.
- Builder: ships weekly product improvements.
- User Ops: pilot onboarding + interview scheduling.
- Data Reviewer: prepares weekly metric summary.

## 7) Immediate Next 2 Weeks

### Week 1
- Recruit first 20 pilot choreographers.
- Run onboarding calls and confirm first-session completion.
- Collect top 10 friction points.

### Week 2
- Ship top 2 friction fixes.
- Trigger referral loop from activated pilot users.
- Target 50 activated users gate.

## 8) Definition of “Launch Ready”

Roam is launch-ready when:
- Stage A and B gates are met,
- weekly operating cadence is stable,
- CI/release gate is consistently green,
- reliability metrics remain within target for 3 consecutive weeks.

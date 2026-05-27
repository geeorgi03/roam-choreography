# Roam Go-Live Checklist (This Week)

## Day 1 - Production Setup

- [ ] Apply SQL and RLS policies from `SUPABASE_SETUP.md`
- [ ] Configure cloud credentials in app and verify sign-in
- [ ] Run local gate: `npm run test:ci`
- [ ] Confirm GitHub Actions workflow passes on latest branch
- [ ] Deploy current build to your target environment

Success criteria:
- Cloud sync works (push + pull)
- CI green
- App opens and core workflow completes in production

## Day 2 - Internal Dry Run

- [ ] Run 3 full internal rehearsal simulations
- [ ] Validate assignment, reference, and take flows end-to-end
- [ ] Trigger invite + waitlist flow and verify records
- [ ] Download ops snapshot and review weekly stats output

Success criteria:
- No blocking issues
- Pending cloud queue remains near zero

## Day 3 - Pilot Cohort Onboarding (10-20 users)

- [ ] Invite first pilot cohort (target: choreographers + assistants)
- [ ] Share referral links and onboarding instructions
- [ ] Run short onboarding calls/messages for first users
- [ ] Ensure each pilot creates at least one session

Success criteria:
- >= 10 users complete first session setup
- >= 50% complete onboarding checklist

## Day 4 - Feedback + Fix Sprint

- [ ] Collect top 5 friction points from pilot users
- [ ] Prioritize one UX fix and one reliability fix
- [ ] Ship patch and rerun `npm run test:ci`
- [ ] Reconfirm production behavior on patched build

Success criteria:
- Critical friction issue removed
- No regression in core test suite

## Day 5 - Growth Activation

- [ ] Ask activated users to send at least one invite
- [ ] Track invite->waitlist conversion
- [ ] Post one short usage story/example to your target community
- [ ] Review growth dashboard + weekly report section

Success criteria:
- Invite count increases
- Waitlist leads increase
- At least one referral-attributed user appears

## Day 6 - Reliability Review

- [ ] Check pending cloud writes trend
- [ ] Validate auto-retry + manual flush behavior
- [ ] Export fresh ops snapshot JSON
- [ ] Review CI history for instability

Success criteria:
- Pending cloud writes stable or decreasing
- No unresolved high-severity errors

## Day 7 - Launch Decision

- [ ] Compare outcomes against Stage A gate in `LAUNCH_EXECUTION_PLAN.md`
- [ ] Decide: continue pilot, widen rollout, or hold and patch
- [ ] Publish next-week target metrics (users, activations, invites)

Success criteria:
- Clear go/no-go decision
- Explicit next-week targets and owner

---

## Non-Negotiable Daily Checks

- [ ] `npm run test:ci` before every release
- [ ] Verify sync banner status after deployment
- [ ] Confirm no new blocker in onboarding core flow
- [ ] Record one daily ops note (what changed, impact, next action)

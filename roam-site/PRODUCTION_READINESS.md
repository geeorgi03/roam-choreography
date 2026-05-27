# Production Readiness Checklist

Status: In progress

## Product readiness

- [x] Core choreography workflows implemented
- [x] Tablet-first responsive UX
- [x] Local persistence + recovery
- [x] Growth loop basics (referral, invite, waitlist, weekly report)
- [ ] Full onboarding copy polish and localization QA

## Reliability readiness

- [x] Supabase sync wiring for app state
- [x] Retry queue for failed growth cloud writes
- [x] Manual queue flush control
- [x] Operational JSON snapshot export
- [ ] Automatic background retry schedule
- [ ] Network/offline indicator banner

## Security and auth readiness

- [x] Client uses publishable/anon key flow
- [x] RLS policy setup documented for app and growth tables
- [ ] Password policy and reset UX
- [ ] Abuse controls for waitlist endpoint (rate limiting / CAPTCHA)

## Engineering readiness

- [x] Static integrity check script
- [ ] Unit tests for core data transforms
- [ ] E2E smoke tests for critical flows
- [ ] Error logging integration (Sentry or equivalent)

## Launch readiness (toward 1k users)

- [x] Referral code + invite tracking
- [x] Attribution capture via `?ref=`
- [x] Waitlist capture flow
- [ ] Outreach CRM export integration
- [ ] Weekly growth review ritual + owner
- [ ] Pilot cohort feedback loop (10-20 choreographers)

## Suggested next implementation order

1. Add background auto-retry for pending cloud writes every 30-60s.
2. Add a visible online/offline sync status banner.
3. Add test coverage for:
   - timestamp parsing
   - referral attribution capture
   - growth weekly aggregation
4. Add E2E script for:
   - onboarding completion
   - invite + waitlist capture
   - share-pack generate/import

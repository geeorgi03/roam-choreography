# Roam Site

This folder is a **static / marketing choreography workspace** (HTML + Playwright). It is **not** the primary production app.

**Production mobile surface:** `apps/mobile` (Expo) — sessions, capture, workbench, group collab, and share flows. Use mobile + `apps/api` for soft launch; treat `roam-site` as reference/demo and CI-gated static bundle only.

## Run locally

```bash
npm run dev
```

The site is served at `http://localhost:4173`.

## Validate bundle integrity

```bash
npm run check
```

This verifies:
- required files exist (`index.html`, `vercel.json`)

## Run release gate locally

```bash
npm run test:ci
```

This runs:
- static integrity check
- Playwright E2E suite (`core`, `share-pack`, `cloud-queue`)

## CI

GitHub Actions workflow:
- `.github/workflows/roam-site-ci.yml`

It runs automatically on push/PR when `roam-site/**` changes.

## Supabase setup

Before using cloud auth/sync and growth telemetry tables, apply:
- `SUPABASE_SETUP.md`

Then in-app:
1. Save Supabase URL + publishable/anon key
2. Sign up or sign in
3. Push/Pull sync from the Cloud card

## Operational docs

- `PRODUCTION_READINESS.md` - release checklist and reliability status
- `LAUNCH_EXECUTION_PLAN.md` - staged growth plan (50 -> 200 -> 1000 users)
- `GO_LIVE_THIS_WEEK.md` - day-by-day execution checklist for launch week
- `SUPABASE_SETUP.md` - cloud schema + RLS setup
- `CLAUDE_CODE_REVIEW_BRIEF.md` - external code-review brief and expected output format

## Deploy

`vercel.json` is configured for clean URLs with no trailing slash.

## Current implemented workflow (P0-focused)

- Create an active session
- Add dancers and roles
- Add song sections with status
- Assign sections to dancers with readiness status
- Save section-linked references (URL + timestamp)
- Auto-parse timestamps from supported URL patterns (`t=`, `start=`, `1m30s`, `#t=`)
- Log capture takes per section (`MINE`/`REF`, duration, notes, created time)
- View rehearsal analytics (takes, minutes, ready assignments, sections practiced)
- Generate referral code + invite link
- Track invites sent and waitlist leads
- Generate/import section share packs for collaboration
- Switch UI language (`en`, `zh-CN`, `ko`, `ja`)
- Local persistence via browser storage

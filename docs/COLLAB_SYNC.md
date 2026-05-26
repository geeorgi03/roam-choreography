# Session collaboration (friends sync)

## Wired today (mobile)

| Layer | What works |
|-------|------------|
| **API** | `GET/POST /sessions/:id/dancers`, position updates, broadcasts |
| **Realtime** | `useGroupRealtime` — Supabase channels for participants + broadcasts, reconnect backoff |
| **Group tab** | Live floor dots, choreographer broadcast notes, invite via share link (`handleShare`) |
| **Spatial** | Moment formations persisted via `updateFormation` (dancers, paths, freehand strokes) |
| **UI** | `CollabStatusBar` — live/offline + participant count; invite opens session share sheet |

## Needs device / backend verification

- **RLS policies** on `session_participants`, broadcasts, and dancer rows for non-owner friends (audit Supabase dashboard).
- **Invite deep link** — dancer opens session with `share_token` / `token` query param (`group.tsx` route).
- **Multi-device formation conflict** — revision tokens exist on API; full conflict UI is minimal (Spatial shows sync pending/conflict).
- **Presence** — Group tab merges API dancers + Supabase presence; offline fallback uses last known participants.

Do not mark PRD rows `Done` until [MOBILE_DEP3_SMOKE.md](./MOBILE_DEP3_SMOKE.md) rows 15+ pass on physical devices.

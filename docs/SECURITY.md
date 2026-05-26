# Roam security guide

## What the API enforces (server-side)

- **JWT auth** on private routes (`Authorization: Bearer <user access token>`).
- **Ownership checks** on sessions/clips before reads/writes (service role never trusts client IDs alone).
- **Rate limits** per IP (general API, public `/feedback`, public `/share`).
- **Security headers** (HSTS in production, `nosniff`, deny framing).
- **CORS** only for origins listed in `ROAM_ALLOWED_ORIGINS` or `SHARE_BASE_URL`.
- **Request size cap** via `ROAM_MAX_BODY_BYTES` (default 1 MB).
- **Blocked probe paths** (`/.env`, `/wp-admin`, etc.).
- **Mux / Stripe webhooks** require valid signatures.
- **Public feedback** requires a valid share token + open feedback request; input length limits.
- **Production errors** hide internal database/provider messages.

## What you must configure

| Item | Action |
|------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Render only — never in mobile, web client, or git |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile only — expected to be public |
| `ROAM_ALLOWED_ORIGINS` | Comma-separated web origins allowed to call the API from a browser |
| `SHARE_BASE_URL` | Production HTTPS URL for share pages |
| Supabase RLS | Keep enabled on all `public` tables (migrations) |
| Supabase Auth | Redirect `roam://**`; disable unused sign-in providers |

## Mobile / APK

- Anon key in `eas.json` is normal; **do not** embed service role.
- Profile → Developer Settings API override is for debugging only.

## After code changes

Redeploy **roam-api** on Render so middleware updates take effect.

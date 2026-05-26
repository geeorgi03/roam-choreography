# Supabase Setup for Roam Site

This app expects these tables:

- `roam_user_state` (user app sync state)
- `roam_growth_invites` (invite telemetry)
- `roam_growth_waitlist` (waitlist lead capture)

## SQL (run in Supabase SQL editor)

```sql
create table if not exists public.roam_user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  app_state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.roam_user_state enable row level security;

drop policy if exists "user_can_select_own_state" on public.roam_user_state;
create policy "user_can_select_own_state"
on public.roam_user_state
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_can_insert_own_state" on public.roam_user_state;
create policy "user_can_insert_own_state"
on public.roam_user_state
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_can_update_own_state" on public.roam_user_state;
create policy "user_can_update_own_state"
on public.roam_user_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.roam_growth_invites (
  id bigint generated always as identity primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  invite_email text not null,
  referral_code text,
  attribution_referral_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.roam_growth_waitlist (
  id bigint generated always as identity primary key,
  owner_user_id uuid references auth.users(id) on delete set null,
  lead_name text not null,
  lead_email text not null,
  referral_code text,
  attribution_referral_code text,
  created_at timestamptz not null default now()
);

alter table public.roam_growth_invites enable row level security;
alter table public.roam_growth_waitlist enable row level security;

drop policy if exists "invite_owner_insert" on public.roam_growth_invites;
create policy "invite_owner_insert"
on public.roam_growth_invites
for insert
to authenticated
with check (auth.uid() = owner_user_id);

drop policy if exists "invite_owner_select" on public.roam_growth_invites;
create policy "invite_owner_select"
on public.roam_growth_invites
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists "waitlist_public_insert" on public.roam_growth_waitlist;
create policy "waitlist_public_insert"
on public.roam_growth_waitlist
for insert
to anon, authenticated
with check (true);

drop policy if exists "waitlist_owner_select" on public.roam_growth_waitlist;
create policy "waitlist_owner_select"
on public.roam_growth_waitlist
for select
to authenticated
using (owner_user_id is null or auth.uid() = owner_user_id);
```

## In-app flow

1. Paste your Supabase URL and publishable/anon key in the **Cloud Sync** card.
2. Create account (`Sign Up`) or sign in (`Sign In`).
3. Use `Push Sync` to upload local state.
4. Use `Pull Sync` to restore cloud state.
5. Use the Growth Engine card to record invites and waitlist leads.

## Notes

- Do not use service role keys in this client app.
- If email confirmation is enabled, confirm your email before sign-in.
- Waitlist insert works for anonymous visitors if you applied the RLS policy above.

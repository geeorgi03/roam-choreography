create table if not exists public.drill_sequences (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.drill_sequences enable row level security;

drop policy if exists "drill_sequences_select_owner_or_participant" on public.drill_sequences;
create policy "drill_sequences_select_owner_or_participant"
on public.drill_sequences
for select
using (
  exists (
    select 1
    from public.sessions s
    where s.id = drill_sequences.session_id
      and s.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.group_participants gp
    where gp.session_id = drill_sequences.session_id
      and gp.user_id = auth.uid()
  )
);

drop policy if exists "drill_sequences_modify_owner_only" on public.drill_sequences;
create policy "drill_sequences_modify_owner_only"
on public.drill_sequences
for all
using (
  exists (
    select 1
    from public.sessions s
    where s.id = drill_sequences.session_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.sessions s
    where s.id = drill_sequences.session_id
      and s.user_id = auth.uid()
  )
);

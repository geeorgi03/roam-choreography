create table if not exists public.structured_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  clip_id uuid not null references public.clips(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  statement text,
  questions text,
  observations text,
  opinions text,
  created_at timestamptz not null default now()
);

alter table public.structured_feedback enable row level security;

create policy structured_feedback_insert_participants
  on public.structured_feedback
  for insert
  to authenticated
  with check (public.is_session_member(session_id));

create policy structured_feedback_select_owner
  on public.structured_feedback
  for select
  to authenticated
  using (
    session_id in (
      select id
      from public.sessions
      where user_id = auth.uid()
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'clips_id_session_id_key'
      and conrelid = 'public.clips'::regclass
  ) then
    alter table public.clips
      add constraint clips_id_session_id_key unique (id, session_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'structured_feedback_clip_session_fk'
      and conrelid = 'public.structured_feedback'::regclass
  ) then
    alter table public.structured_feedback
      add constraint structured_feedback_clip_session_fk
      foreign key (clip_id, session_id)
      references public.clips(id, session_id)
      on delete cascade;
  end if;
end $$;

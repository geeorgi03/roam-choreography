-- Run after APPLY_ALL_MIGRATIONS.sql (or supabase db push).
-- All checks should return rows / true — not empty errors.

-- 1) Core tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'sessions', 'clips', 'music_tracks')
ORDER BY table_name;

-- 2) Auth -> public.users trigger exists
SELECT tgname
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 3) RLS enabled on sessions
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'sessions' AND relnamespace = 'public'::regnamespace;

-- 4) Audio storage bucket (optional for file upload; required for bucket policies)
SELECT id, name, public FROM storage.buckets WHERE id = 'audio';

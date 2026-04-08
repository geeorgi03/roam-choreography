-- Audio bucket idempotent guard (bucket created in 20240020000000_audio_storage_bucket.sql)
-- This migration ensures the audio bucket exists for environments that skipped the earlier migration.
INSERT INTO storage.buckets (id, name, public)
  VALUES ('audio', 'audio', true)
  ON CONFLICT (id) DO NOTHING;

-- RLS policies (idempotent — skip if already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload audio'
  ) THEN
    EXECUTE 'CREATE POLICY "Authenticated users can upload audio"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = ''audio'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read access for audio'
  ) THEN
    EXECUTE 'CREATE POLICY "Public read access for audio"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = ''audio'')';
  END IF;
END $$;

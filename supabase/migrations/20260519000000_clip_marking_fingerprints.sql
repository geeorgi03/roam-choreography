-- Marking search: compact motion fingerprints per clip (choreography similarity).

CREATE TABLE IF NOT EXISTS clip_marking_fingerprints (
  clip_id uuid PRIMARY KEY REFERENCES clips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fingerprint jsonb NOT NULL,
  dims integer NOT NULL,
  source text NOT NULL DEFAULT 'mux_thumbnails',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clip_marking_fingerprints_user_id_idx
  ON clip_marking_fingerprints (user_id);

ALTER TABLE clip_marking_fingerprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clip_marking_fingerprints_own ON clip_marking_fingerprints;

CREATE POLICY clip_marking_fingerprints_own ON clip_marking_fingerprints
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

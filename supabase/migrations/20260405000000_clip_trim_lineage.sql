-- Add clip_type column with MINE/REF distinction
ALTER TABLE clips ADD COLUMN IF NOT EXISTS clip_type TEXT CHECK (clip_type IN ('MINE', 'REF'));

-- Add trimmed_from_clip_id foreign key for lineage tracking
ALTER TABLE clips ADD COLUMN IF NOT EXISTS trimmed_from_clip_id uuid REFERENCES clips(id) ON DELETE SET NULL;

-- Add index for efficient queries of trimmed clips
CREATE INDEX IF NOT EXISTS idx_clips_trimmed_from ON clips (trimmed_from_clip_id) WHERE trimmed_from_clip_id IS NOT NULL;

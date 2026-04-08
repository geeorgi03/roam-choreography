-- Creative genealogy — PRD §1
-- Adds bidirectional lineage pointers for clips, including note-trigger origins.

ALTER TABLE clips ADD COLUMN IF NOT EXISTS parent_clip_id UUID REFERENCES clips(id) ON DELETE SET NULL;
ALTER TABLE clips ADD COLUMN IF NOT EXISTS triggered_by_note_id UUID REFERENCES note_pins(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_clips_parent_clip_id ON clips(parent_clip_id) WHERE parent_clip_id IS NOT NULL;

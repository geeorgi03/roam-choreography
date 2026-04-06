-- Add REF clip fields to clips table (excluding clip_type which is added in 20260405000000_clip_trim_lineage.sql)
ALTER TABLE clips 
ADD COLUMN IF NOT EXISTS url text,
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS start_ms integer DEFAULT 0;

-- Add REF clip fields to clips table
ALTER TABLE clips 
ADD COLUMN url text,
ADD COLUMN thumbnail_url text,
ADD COLUMN clip_type text CHECK (clip_type IN ('MINE', 'REF')) DEFAULT 'MINE',
ADD COLUMN start_ms integer DEFAULT 0;

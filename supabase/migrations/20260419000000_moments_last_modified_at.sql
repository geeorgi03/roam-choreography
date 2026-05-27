ALTER TABLE moments
ADD COLUMN IF NOT EXISTS last_modified_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION set_moments_last_modified_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_modified_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS moments_set_last_modified_at ON moments;

CREATE TRIGGER moments_set_last_modified_at
BEFORE UPDATE ON moments
FOR EACH ROW
EXECUTE FUNCTION set_moments_last_modified_at();

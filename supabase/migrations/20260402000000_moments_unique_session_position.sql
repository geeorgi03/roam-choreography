-- Migration 20260402000000: Enforce unique ordering for session moments

ALTER TABLE moments
ADD CONSTRAINT moments_session_id_position_unique
UNIQUE (session_id, position);


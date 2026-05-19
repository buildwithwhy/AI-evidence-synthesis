-- Spot-check accountability layer
--
-- Adds a spot_check_history column to screening_results to record when a human
-- reviewer has audited a high-confidence AI decision. This is the only
-- mechanism that catches "structural failures" — confident AI errors invisible
-- to the deference/UNCERTAIN signal.
--
-- Run once against the project Supabase database. Safe to re-run: ADD COLUMN
-- IF NOT EXISTS makes this idempotent.

alter table screening_results
  add column if not exists spot_check_history jsonb default '[]'::jsonb;

-- Each spot_check_history entry is an object with:
--   by                        text     reviewer email
--   at                        text     ISO-8601 timestamp
--   action                    text     'confirmed' | 'overridden'
--   ai_decision_at_check      text     AI's original decision at audit time
--   ai_confidence_at_check    int      AI's confidence at audit time
--   current_decision_at_check text     the current decision at audit time
--
-- Index for efficient filtering of unaudited rows in the spot-check queue.
create index if not exists idx_screening_results_spot_check
  on screening_results ((jsonb_array_length(spot_check_history)));

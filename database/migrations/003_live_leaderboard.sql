BEGIN;

-- Teacher-configured leaderboard cadence: show it after every N questions (demo limit 1-10).
-- NULL keeps only the final leaderboard after FINISHED.
ALTER TABLE session_settings ADD COLUMN leaderboard_every SMALLINT CHECK (leaderboard_every BETWEEN 1 AND 10);
-- An in-progress session either shows its current question or the leaderboard step after it.
ALTER TABLE sessions ADD COLUMN live_phase VARCHAR(16) CHECK (live_phase IN ('QUESTION', 'LEADERBOARD'));
UPDATE sessions SET live_phase = 'QUESTION' WHERE status = 'IN_PROGRESS';
-- Additive only: code from before this migration still starts/finishes sessions without
-- writing live_phase on the shared DB. The session repository normalizes such rows.

COMMIT;

BEGIN;

-- Keep application IDs and seeded ownership; Auth subjects are an explicit mapping.
ALTER TABLE users ADD COLUMN auth_user_id UUID UNIQUE;
-- Drafts may contain blank text; publish/host services validate stored content.
ALTER TABLE questions DROP CONSTRAINT questions_content_check;
ALTER TABLE question_options DROP CONSTRAINT question_options_content_check;
ALTER TABLE sessions ADD COLUMN current_question_position INTEGER CHECK (current_question_position > 0);
ALTER TABLE sessions ADD COLUMN state_version INTEGER NOT NULL DEFAULT 0 CHECK (state_version >= 0);
ALTER TABLE participants ADD COLUMN token_hash CHAR(64) UNIQUE;
ALTER TABLE participants ADD COLUMN token_expires_at TIMESTAMPTZ;
ALTER TABLE participants ADD COLUMN join_request_hash CHAR(64);
CREATE UNIQUE INDEX uq_participant_join_request ON participants(session_id, join_request_hash) WHERE join_request_hash IS NOT NULL;
ALTER TABLE participants ADD CONSTRAINT participant_credential_pair CHECK (
  (token_hash IS NULL AND token_expires_at IS NULL AND join_request_hash IS NULL)
  OR (token_hash IS NOT NULL AND token_expires_at IS NOT NULL AND join_request_hash IS NOT NULL)
);

COMMIT;

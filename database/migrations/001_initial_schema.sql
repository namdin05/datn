BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('TEACHER', 'STUDENT');
CREATE TYPE quiz_status AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE question_type AS ENUM ('MULTIPLE_CHOICE');
CREATE TYPE session_mode AS ENUM ('CLASSIC');
CREATE TYPE session_status AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED');
CREATE TYPE timer_mode AS ENUM ('ON_ALLOW_AFTER_TIMEOUT', 'ON_LOCK_AFTER_TIMEOUT', 'OFF');
CREATE TYPE participant_status AS ENUM ('JOINED', 'PLAYING', 'COMPLETED', 'LEFT');
CREATE TYPE attempt_status AS ENUM ('IN_PROGRESS', 'SUBMITTED');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name VARCHAR(100) NOT NULL CHECK (btrim(display_name) <> ''),
    role user_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL CHECK (btrim(title) <> ''),
    description TEXT,
    status quiz_status NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        status = 'DRAFT'
        OR (status = 'PUBLISHED' AND published_at IS NOT NULL)
    )
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    type question_type NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    content TEXT NOT NULL CHECK (btrim(content) <> ''),
    points NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (points >= 0),
    time_limit_seconds INTEGER NOT NULL CHECK (time_limit_seconds > 0),
    position INTEGER NOT NULL CHECK (position >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (quiz_id, position)
);

CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (btrim(content) <> ''),
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    position SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (question_id, position)
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    pin VARCHAR(12) NOT NULL CHECK (pin ~ '^[0-9]+$'),
    mode session_mode NOT NULL DEFAULT 'CLASSIC',
    status session_status NOT NULL DEFAULT 'WAITING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    CHECK (
        (status = 'WAITING' AND started_at IS NULL AND ended_at IS NULL)
        OR (status = 'IN_PROGRESS' AND started_at IS NOT NULL AND ended_at IS NULL)
        OR (status = 'FINISHED' AND started_at IS NOT NULL AND ended_at IS NOT NULL)
    ),
    CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE UNIQUE INDEX uq_sessions_active_pin
    ON sessions(pin)
    WHERE status IN ('WAITING', 'IN_PROGRESS');

CREATE TABLE session_settings (
    session_id UUID PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
    timer_mode timer_mode NOT NULL DEFAULT 'OFF',
    shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE,
    shuffle_answers BOOLEAN NOT NULL DEFAULT FALSE,
    show_leaderboard BOOLEAN NOT NULL DEFAULT TRUE,
    allow_skip_questions BOOLEAN NOT NULL DEFAULT FALSE,
    participant_attempt_limit SMALLINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        participant_attempt_limit IS NULL
        OR participant_attempt_limit BETWEEN 1 AND 3
    )
);

CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE RESTRICT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    nickname VARCHAR(100) NOT NULL CHECK (btrim(nickname) <> ''),
    status participant_status NOT NULL DEFAULT 'JOINED',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    CHECK (status <> 'COMPLETED' OR completed_at IS NOT NULL)
);

CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
    attempt_number SMALLINT NOT NULL CHECK (attempt_number >= 1),
    status attempt_status NOT NULL DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at TIMESTAMPTZ,
    accuracy_points NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (accuracy_points >= 0),
    max_accuracy_points NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (max_accuracy_points >= 0),
    session_score INTEGER NOT NULL DEFAULT 0 CHECK (session_score >= 0),
    correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count >= 0),
    incorrect_count INTEGER NOT NULL DEFAULT 0 CHECK (incorrect_count >= 0),
    answered_count INTEGER NOT NULL DEFAULT 0 CHECK (answered_count >= 0),
    total_questions INTEGER NOT NULL CHECK (total_questions >= 0),
    time_spent_ms BIGINT CHECK (time_spent_ms >= 0),
    UNIQUE (participant_id, attempt_number),
    CHECK (
        (status = 'IN_PROGRESS' AND submitted_at IS NULL)
        OR (status = 'SUBMITTED' AND submitted_at IS NOT NULL)
    ),
    CHECK (accuracy_points <= max_accuracy_points),
    CHECK (answered_count = correct_count + incorrect_count)
);

CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE RESTRICT,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
    is_correct BOOLEAN NOT NULL,
    accuracy_points_awarded NUMERIC(10,2) NOT NULL CHECK (accuracy_points_awarded >= 0),
    session_score_awarded INTEGER NOT NULL CHECK (session_score_awarded >= 0),
    response_time_ms BIGINT NOT NULL CHECK (response_time_ms >= 0),
    answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (attempt_id, question_id)
);

CREATE TABLE answer_options (
    answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES question_options(id) ON DELETE RESTRICT,
    PRIMARY KEY (answer_id, option_id)
);

CREATE INDEX idx_questions_quiz_position ON questions(quiz_id, position);
CREATE INDEX idx_question_options_question_position ON question_options(question_id, position);
CREATE INDEX idx_sessions_quiz ON sessions(quiz_id);
CREATE INDEX idx_sessions_host ON sessions(host_id);
CREATE INDEX idx_participants_session_joined ON participants(session_id, joined_at);
CREATE INDEX idx_participants_user ON participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_attempts_participant_number ON attempts(participant_id, attempt_number);
CREATE INDEX idx_answers_attempt ON answers(attempt_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answer_options_option ON answer_options(option_id);

COMMIT;

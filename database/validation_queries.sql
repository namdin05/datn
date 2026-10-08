-- Wayground MVP - validation / smoke-test queries

-- 1. Load published quiz with ordered questions/options.
SELECT
    qz.title AS quiz_title,
    q.position AS question_position,
    q.content AS question,
    qo.position AS option_position,
    qo.content AS option,
    qo.is_correct
FROM quizzes qz
JOIN questions q ON q.quiz_id = qz.id
JOIN question_options qo ON qo.question_id = q.id
WHERE qz.id = '10000000-0000-0000-0000-000000000001'
ORDER BY q.position, qo.position;

-- 2. Resolve active session by PIN.
SELECT s.id, s.status, s.mode, ss.*
FROM sessions s
JOIN session_settings ss ON ss.session_id = s.id
WHERE s.pin = '123456'
  AND s.status IN ('WAITING', 'IN_PROGRESS');

-- 3. Load lobby participants.
SELECT id, nickname, status, joined_at
FROM participants
WHERE session_id = '40000000-0000-0000-0000-000000000001'
ORDER BY joined_at;

-- 4. Verify question option counts and correct option counts.
SELECT
    q.id,
    q.content,
    COUNT(qo.id) AS option_count,
    COUNT(qo.id) FILTER (WHERE qo.is_correct) AS correct_option_count
FROM questions q
JOIN question_options qo ON qo.question_id = q.id
GROUP BY q.id, q.content
ORDER BY MIN(q.position);

-- 5. Participant attempt summary.
SELECT
    p.nickname,
    a.attempt_number,
    a.status,
    a.accuracy_points,
    a.max_accuracy_points,
    a.session_score,
    a.correct_count,
    a.incorrect_count,
    a.answered_count
FROM participants p
LEFT JOIN attempts a ON a.participant_id = p.id
WHERE p.session_id = '40000000-0000-0000-0000-000000000001'
ORDER BY p.joined_at, a.attempt_number;

-- 6. Leaderboard query for submitted/in-progress attempts.
-- This uses each participant's latest attempt for MVP display.
WITH latest_attempt AS (
    SELECT DISTINCT ON (participant_id)
        participant_id,
        id,
        attempt_number,
        session_score,
        accuracy_points,
        max_accuracy_points
    FROM attempts
    ORDER BY participant_id, attempt_number DESC
)
SELECT
    p.nickname,
    la.attempt_number,
    la.session_score,
    CASE
        WHEN la.max_accuracy_points > 0
        THEN ROUND((la.accuracy_points / la.max_accuracy_points) * 100, 2)
        ELSE 0
    END AS accuracy_percent
FROM participants p
JOIN latest_attempt la ON la.participant_id = p.id
WHERE p.session_id = '40000000-0000-0000-0000-000000000001'
ORDER BY la.session_score DESC, accuracy_percent DESC, p.joined_at ASC;

-- 7. Question-level report skeleton.
SELECT
    q.id AS question_id,
    q.position,
    q.content,
    COUNT(ans.id) AS response_count,
    COUNT(ans.id) FILTER (WHERE ans.is_correct) AS correct_responses,
    ROUND(AVG(ans.response_time_ms), 2) AS avg_response_time_ms
FROM questions q
LEFT JOIN answers ans ON ans.question_id = q.id
WHERE q.quiz_id = '10000000-0000-0000-0000-000000000001'
GROUP BY q.id, q.position, q.content
ORDER BY q.position;

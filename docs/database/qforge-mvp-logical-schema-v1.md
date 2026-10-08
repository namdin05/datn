# Wayground MVP – Logical Database Schema V1

**Ngày:** 06/10/2026  
**Trạng thái:** Ready for implementation  
**Database target:** PostgreSQL

## 1. Phạm vi

Logical schema hỗ trợ core flow của MVP:

**Teacher tạo Quiz → Host Live Classic Session → Student join bằng PIN → Làm bài realtime → Submit → Chấm điểm → Result/Report.**

Schema gồm 10 bảng core:

```text
users
quizzes
questions
question_options
sessions
session_settings
participants
attempts
answers
answer_options
```

Các tính năng ngoài core flow như Classes, Homework, AI, Team Mode, Mastery Peak, Paper Mode, LMS, Payments và Organization Management không nằm trong schema V1.

---

## 2. Các behavior Wayground được dùng làm baseline

Trong phạm vi Classic Live Session, logical schema hỗ trợ các behavior sau:

- Session dùng numerical join code.
- Student có thể join live session khi session vẫn active.
- Classic là Student-paced và có realtime leaderboard khi bật.
- Multiple Choice hỗ trợ một hoặc nhiều correct options.
- Session attempts hỗ trợ 1, 2, 3 hoặc unlimited.
- Question Timer có ba mode:
  - On – allow answers after time ends
  - On – lock answers after time ends
  - Off
- Shuffle Questions và Shuffle Answers áp dụng được cho Classic.
- Skip Questions & Attempt Later áp dụng được cho Classic.
- Accuracy Points và Session Score được tách riêng.
- Result/Report được derive từ dữ liệu session, participant, attempt và answer.

Schema này tái tạo behavior cần thiết; không giả định đây là schema nội bộ thật của Wayground.

---

## 3. Enum model

### user_role

```text
TEACHER
STUDENT
```

### quiz_status

```text
DRAFT
PUBLISHED
```

### question_type

```text
MULTIPLE_CHOICE
```

### session_mode

```text
CLASSIC
```

### session_status

```text
WAITING
IN_PROGRESS
FINISHED
```

### timer_mode

```text
ON_ALLOW_AFTER_TIMEOUT
ON_LOCK_AFTER_TIMEOUT
OFF
```

### participant_status

```text
JOINED
PLAYING
COMPLETED
LEFT
```

### attempt_status

```text
IN_PROGRESS
SUBMITTED
```

---

# 4. Table definitions

## 4.1 users

| Column | PostgreSQL type | Null | Constraint / Default |
|---|---|---:|---|
| id | UUID | No | PK, `gen_random_uuid()` |
| display_name | VARCHAR(100) | No |  |
| role | user_role | No |  |
| created_at | TIMESTAMPTZ | No | `now()` |
| updated_at | TIMESTAMPTZ | No | `now()` |

`users` đại diện cho account/identity của hệ thống. Student guest vẫn được hỗ trợ thông qua `participants.user_id = NULL`.

---

## 4.2 quizzes

| Column | PostgreSQL type | Null | Constraint / Default |
|---|---|---:|---|
| id | UUID | No | PK |
| creator_id | UUID | No | FK → users.id |
| title | VARCHAR(255) | No | non-empty |
| description | TEXT | Yes |  |
| status | quiz_status | No | `DRAFT` |
| published_at | TIMESTAMPTZ | Yes |  |
| created_at | TIMESTAMPTZ | No | `now()` |
| updated_at | TIMESTAMPTZ | No | `now()` |

Business rules:

```text
DRAFT -> PUBLISHED
```

`published_at` được set khi quiz chuyển sang `PUBLISHED`.

---

## 4.3 questions

| Column | PostgreSQL type | Null | Constraint / Default |
|---|---|---:|---|
| id | UUID | No | PK |
| quiz_id | UUID | No | FK → quizzes.id |
| type | question_type | No | `MULTIPLE_CHOICE` |
| content | TEXT | No | non-empty |
| points | NUMERIC(10,2) | No | default 1, >= 0 |
| time_limit_seconds | INTEGER | No | > 0 |
| position | INTEGER | No | >= 1 |
| created_at | TIMESTAMPTZ | No | `now()` |
| updated_at | TIMESTAMPTZ | No | `now()` |

Constraint:

```text
UNIQUE(quiz_id, position)
```

---

## 4.4 question_options

| Column | PostgreSQL type | Null | Constraint / Default |
|---|---|---:|---|
| id | UUID | No | PK |
| question_id | UUID | No | FK → questions.id |
| content | TEXT | No | non-empty |
| is_correct | BOOLEAN | No | default false |
| position | SMALLINT | No | 1..5 |
| created_at | TIMESTAMPTZ | No | `now()` |
| updated_at | TIMESTAMPTZ | No | `now()` |

Constraint:

```text
UNIQUE(question_id, position)
```

Service-level rules:

```text
2 <= option_count <= 5
correct_option_count >= 1
```

Các rule trên phụ thuộc vào toàn bộ tập options của một question nên được validate trong transaction ở service layer.

---

## 4.5 sessions

| Column | PostgreSQL type | Null | Constraint / Default |
|---|---|---:|---|
| id | UUID | No | PK |
| quiz_id | UUID | No | FK → quizzes.id |
| host_id | UUID | No | FK → users.id |
| pin | VARCHAR(12) | No | numeric-only |
| mode | session_mode | No | `CLASSIC` |
| status | session_status | No | `WAITING` |
| created_at | TIMESTAMPTZ | No | `now()` |
| started_at | TIMESTAMPTZ | Yes |  |
| ended_at | TIMESTAMPTZ | Yes |  |

`VARCHAR(12)` là implementation capacity, không phải khẳng định Wayground luôn dùng PIN 12 chữ số. Behavior bắt buộc là numerical code và không conflict giữa các active session.

Partial unique index:

```sql
UNIQUE(pin)
WHERE status IN ('WAITING', 'IN_PROGRESS')
```

Nhờ đó PIN có thể được tái sử dụng sau khi session đã `FINISHED` mà vẫn giữ uniqueness đối với session đang active.

---

## 4.6 session_settings

| Column | PostgreSQL type | Null | Constraint / Default |
|---|---|---:|---|
| session_id | UUID | No | PK, FK → sessions.id |
| timer_mode | timer_mode | No | `OFF` |
| shuffle_questions | BOOLEAN | No | false |
| shuffle_answers | BOOLEAN | No | false |
| show_leaderboard | BOOLEAN | No | true |
| allow_skip_questions | BOOLEAN | No | false |
| participant_attempt_limit | SMALLINT | Yes | 1..3; NULL = unlimited |
| created_at | TIMESTAMPTZ | No | `now()` |
| updated_at | TIMESTAMPTZ | No | `now()` |

`participant_attempt_limit`:

```text
1     = one attempt
2     = two attempts
3     = three attempts
NULL  = unlimited
```

Wayground yêu cầu login khi giới hạn attempts; MVP hiện có authentication đơn giản hóa nên account-gating này thuộc application layer và không ép bằng DB constraint trong V1.

---

## 4.7 participants

| Column | PostgreSQL type | Null | Constraint / Default |
|---|---|---:|---|
| id | UUID | No | PK |
| session_id | UUID | No | FK → sessions.id |
| user_id | UUID | Yes | FK → users.id |
| nickname | VARCHAR(100) | No | non-empty |
| status | participant_status | No | `JOINED` |
| joined_at | TIMESTAMPTZ | No | `now()` |
| completed_at | TIMESTAMPTZ | Yes |  |

Không đặt:

```text
UNIQUE(session_id, nickname)
```

trong V1 vì behavior duplicate nickname của live Classic chưa được xác minh đủ rõ để biến thành DB invariant.

Index chính:

```text
participants(session_id)
```

---

## 4.8 attempts

| Column | PostgreSQL type | Null | Constraint / Default |
|---|---|---:|---|
| id | UUID | No | PK |
| participant_id | UUID | No | FK → participants.id |
| attempt_number | SMALLINT | No | >= 1 |
| status | attempt_status | No | `IN_PROGRESS` |
| started_at | TIMESTAMPTZ | No | `now()` |
| submitted_at | TIMESTAMPTZ | Yes |  |
| accuracy_points | NUMERIC(12,2) | No | 0 |
| max_accuracy_points | NUMERIC(12,2) | No | 0 |
| session_score | INTEGER | No | 0 |
| correct_count | INTEGER | No | 0 |
| incorrect_count | INTEGER | No | 0 |
| answered_count | INTEGER | No | 0 |
| total_questions | INTEGER | No | >= 0 |
| time_spent_ms | BIGINT | Yes | >= 0 |

Constraint:

```text
UNIQUE(participant_id, attempt_number)
```

`attempt_number` được cấp tuần tự trong transaction.

---

## 4.9 answers

| Column | PostgreSQL type | Null | Constraint / Default |
|---|---|---:|---|
| id | UUID | No | PK |
| attempt_id | UUID | No | FK → attempts.id |
| question_id | UUID | No | FK → questions.id |
| is_correct | BOOLEAN | No |  |
| accuracy_points_awarded | NUMERIC(10,2) | No | >= 0 |
| session_score_awarded | INTEGER | No | >= 0 |
| response_time_ms | BIGINT | No | >= 0 |
| answered_at | TIMESTAMPTZ | No | `now()` |

Constraint:

```text
UNIQUE(attempt_id, question_id)
```

Constraint này làm Answer submission idempotent ở mức logical result: một question chỉ có một final submitted answer trong một attempt.

---

## 4.10 answer_options

| Column | PostgreSQL type | Null | Constraint / Default |
|---|---|---:|---|
| answer_id | UUID | No | FK → answers.id |
| option_id | UUID | No | FK → question_options.id |

Primary key:

```text
PRIMARY KEY(answer_id, option_id)
```

Service layer phải validate:

```text
selected option thuộc đúng question của answer
```

vì constraint này phụ thuộc quan hệ xuyên qua nhiều bảng.

---

# 5. Foreign key strategy

| Relationship | ON DELETE |
|---|---|
| quizzes.creator_id → users.id | RESTRICT |
| questions.quiz_id → quizzes.id | CASCADE |
| question_options.question_id → questions.id | CASCADE |
| sessions.quiz_id → quizzes.id | RESTRICT |
| sessions.host_id → users.id | RESTRICT |
| session_settings.session_id → sessions.id | CASCADE |
| participants.session_id → sessions.id | RESTRICT |
| participants.user_id → users.id | SET NULL |
| attempts.participant_id → participants.id | RESTRICT |
| answers.attempt_id → attempts.id | RESTRICT |
| answers.question_id → questions.id | RESTRICT |
| answer_options.answer_id → answers.id | CASCADE |
| answer_options.option_id → question_options.id | RESTRICT |

Ý nghĩa:

- Draft Quiz chưa có Session có thể xóa cùng Questions/Options.
- Quiz đã có Session không thể bị hard-delete vì `sessions.quiz_id` dùng `RESTRICT`.
- Session history không cascade sang Participant/Attempt/Answer.
- User student có thể bị tách khỏi participant lịch sử bằng `SET NULL`.
- AnswerOption là thành phần phụ thuộc hoàn toàn vào Answer nên được cascade theo Answer.

---

# 6. Session state model

## 6.1 States

```text
WAITING
IN_PROGRESS
FINISHED
```

## 6.2 Valid transitions

```text
WAITING -> IN_PROGRESS
IN_PROGRESS -> FINISHED
```

Không cho:

```text
FINISHED -> IN_PROGRESS
IN_PROGRESS -> WAITING
```

## 6.3 Operations by state

| Operation | WAITING | IN_PROGRESS | FINISHED |
|---|:---:|:---:|:---:|
| Join by PIN | ✓ | ✓ | ✗ |
| Edit session settings | ✓ | ✗ | ✗ |
| Start session | ✓ | ✗ | ✗ |
| Begin attempt | ✗ | ✓ | ✗ |
| Submit answer | ✗ | ✓ | ✗ |
| Complete attempt | ✗ | ✓ | ✗ |
| Finish session | ✗ | ✓ | ✗ |
| View result/report | limited | live | ✓ |

`View result/report` trong running session có thể dùng cho live dashboard; finalized report sử dụng session `FINISHED`.

---

# 7. Participant / Attempt lifecycle

## Participant

```text
JOINED -> PLAYING -> COMPLETED
   \         \
    \         -> LEFT
     -> LEFT
```

Nếu session cho phép retry:

```text
COMPLETED -> PLAYING
```

khi một Attempt mới bắt đầu.

## Attempt

```text
IN_PROGRESS -> SUBMITTED
```

Attempt mới chỉ được tạo nếu:

```text
session.status = IN_PROGRESS
```

và:

```text
count(previous attempts) < participant_attempt_limit
```

hoặc:

```text
participant_attempt_limit IS NULL
```

---

# 8. Attempt creation rule

Logical rule:

```text
Attempt được tạo khi participant bắt đầu chơi/reattempt,
không tạo hàng loạt cho toàn bộ lobby lúc host bấm Start.
```

Lợi ích:

- late join hoạt động tự nhiên;
- không tạo orphan attempts cho người join nhưng không chơi;
- retry tạo Attempt mới rõ ràng;
- `attempt_number` phản ánh số lần chơi thực tế.

Transaction khi Begin Attempt:

1. Lock participant.
2. Load session + settings.
3. Verify session `IN_PROGRESS`.
4. Count existing attempts.
5. Verify attempt limit.
6. Generate next `attempt_number`.
7. Insert Attempt.
8. Set participant `PLAYING`.

---

# 9. Answer grading model

## 9.1 Correctness

Với Multiple Choice:

```text
selected_option_set = correct_option_set
```

thì:

```text
is_correct = true
```

Ngược lại:

```text
is_correct = false
```

Không partial accuracy points cho multiple-correct MCQ trong V1.

## 9.2 Accuracy Points

```text
correct:
accuracy_points_awarded = question.points

incorrect:
accuracy_points_awarded = 0
```

## 9.3 Session Score

### Timer = ON_ALLOW_AFTER_TIMEOUT

```text
correct:
600 + speed_bonus(0..400)

incorrect:
0
```

### Timer = ON_LOCK_AFTER_TIMEOUT

```text
correct:
600

incorrect or timeout:
0
```

### Timer = OFF

```text
correct:
600

incorrect:
0
```

Wayground công khai range `0..400` nhưng không công khai exact mathematical formula của speed bonus trong tài liệu đã xác minh. Exact formula vì vậy không được hard-code vào logical schema; scoring service có thể triển khai một function riêng và thay thế sau mà không đổi DB.

---

# 10. Submit Answer transaction

Một lần submit answer phải là một transaction:

1. Lock Attempt.
2. Verify Attempt `IN_PROGRESS`.
3. Verify Session `IN_PROGRESS`.
4. Verify Question thuộc Quiz của Session.
5. Verify selected options thuộc Question.
6. Check `answers(attempt_id, question_id)` chưa tồn tại.
7. Load correct option set.
8. Calculate correctness.
9. Calculate accuracy points.
10. Calculate session score.
11. Insert Answer.
12. Insert AnswerOptions.
13. Update Attempt aggregates:
   - `accuracy_points`
   - `session_score`
   - `correct_count`
   - `incorrect_count`
   - `answered_count`
14. Commit.
15. Sau commit mới emit realtime event.

DB commit phải xảy ra trước realtime broadcast để client không nhận state chưa durable.

---

# 11. Complete Attempt transaction

1. Lock Attempt.
2. Verify `IN_PROGRESS`.
3. Calculate/finalize `max_accuracy_points`.
4. Set `status = SUBMITTED`.
5. Set `submitted_at`.
6. Set `time_spent_ms`.
7. Update Participant:
   - `status = COMPLETED`
   - `completed_at = now()`
8. Commit.
9. Emit completion / leaderboard event.

Participant có thể chuyển lại `PLAYING` khi bắt đầu attempt tiếp theo nếu session vẫn active và attempt limit cho phép.

---

# 12. Transaction boundaries

Các operation sau phải atomic:

```text
Create Question + QuestionOptions

Host Session + SessionSettings

Join Session + Participant

Begin Attempt

Submit Answer + AnswerOptions + Attempt aggregates

Complete Attempt
```

Publish Quiz cũng nên chạy trong transaction sau khi validate:

```text
question_count >= 1
mỗi question có 2..5 options
mỗi question có >= 1 correct option
```

---

# 13. Database-level vs service-level rules

## Database-level

```text
PK/FK integrity

UNIQUE(quiz_id, position)

UNIQUE(question_id, position)

UNIQUE(participant_id, attempt_number)

UNIQUE(attempt_id, question_id)

PRIMARY KEY(answer_id, option_id)

points >= 0

time_limit_seconds > 0

position bounds

non-negative score/count/time fields

active-session PIN uniqueness
```

## Service-level

```text
Quiz chỉ publish khi hợp lệ

Question có 2..5 options

Question có >= 1 correct option

Selected option thuộc đúng question

Join chỉ khi session active

Begin Attempt chỉ khi session IN_PROGRESS

Attempt limit

Session state transition

Correctness calculation

Speed bonus calculation

Running live settings không được edit

Report aggregation khi có multiple attempts
```

---

# 14. Index plan

## Join by PIN

```text
sessions(pin)
```

Partial unique index trên active sessions đồng thời phục vụ lookup.

## Quiz loading

```text
questions(quiz_id, position)
question_options(question_id, position)
```

## Lobby

```text
participants(session_id, joined_at)
```

## Attempts

```text
attempts(participant_id, attempt_number)
```

## Answer loading

```text
answers(attempt_id)
answers(question_id)
answer_options(answer_id)
```

## Session report

```text
participants(session_id)
attempts(participant_id)
answers(attempt_id)
```

Các index trên đủ cho MVP; optimization sâu hơn cần query plan thực tế sau integration.

---

# 15. Report model

Không tạo bảng `reports` trong V1.

Report được derive từ:

```text
sessions
participants
attempts
answers
questions
```

Core metrics:

```text
participant count
completion
accuracy
accuracy points
session score
correct / incorrect
average response time
participant breakdown
question breakdown
```

Khi có multiple attempts, report không được aggregate bằng `SUM(all attempts)`. Raw attempts và answers được giữ nguyên để query layer áp dụng rule phù hợp với metric hiển thị.

Wayground cho phép bật/tắt report with repetitions; schema V1 giữ đủ dữ liệu để hỗ trợ cả hai cách nhìn mà không thay schema.

---

# 16. Realtime boundary

Database chỉ lưu persistent state.

Realtime layer phát các event sau DB commit, ví dụ:

```text
participant_joined
session_started
answer_submitted
participant_progress_updated
leaderboard_updated
participant_completed
session_finished
```

Tên event không phải database contract.

---

# 17. Question versioning

Wayground cho phép sửa/replace existing question trong running session trong một số điều kiện. Full behavior này cần versioning để lưu lịch sử chính xác.

V1 core E2E chưa phụ thuộc vào feature edit-running-question, nên versioning chưa nằm trong migration đầu tiên.

Extension dự kiến:

```text
question_versions
option_versions
answers.question_version_id
```

Core schema không áp rule sai kiểu “quiz đã host thì không bao giờ được edit”; feature này được defer thay vì khóa architecture.

---

# 18. Research status sau ngày 06/10

## Đã xác minh đủ để chốt schema

```text
Classic = Student-paced
Live Classic có realtime leaderboard
Session attempts = 1, 2, 3, unlimited
Skip Questions hỗ trợ Classic
Shuffle Questions hỗ trợ Classic
Shuffle Answers hỗ trợ Classic
Timer có 3 modes
PIN là numerical join code
Live session cho late join khi code còn active
Multiple-correct MCQ được hỗ trợ
Accuracy Points tách Session Score
```

## Không ảnh hưởng core schema và tiếp tục để mở

```text
exact PIN digit count
duplicate nickname handling in live Classic
exact speed bonus formula
leaderboard tie-breaking
exact running-question version storage
```

Các điểm này không yêu cầu thay đổi 10 core tables của migration đầu tiên.

---

# 19. Definition of Done – 06/10

Hoàn thành:

```text
[x] Core ERD ổn định
[x] Exact PostgreSQL types
[x] Nullable/default rules
[x] PK/FK definitions
[x] UNIQUE/CHECK constraints
[x] ON DELETE strategy
[x] Session state transitions
[x] Participant/Attempt lifecycle
[x] Attempt creation rule
[x] Answer grading model
[x] Transaction boundaries
[x] Database vs service validation boundary
[x] Index plan
[x] Schema sẵn sàng tạo migration
```

Logical schema V1 hiện đủ để chuyển sang PostgreSQL migration mà không phải thiết kế lại core model.

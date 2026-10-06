# Wayground MVP – Database Design V1

**Ngày:** 05/10/2026  
**Trạng thái:** Draft – chờ review/chốt

## 1. Mục tiêu

Database của MVP hỗ trợ đầy đủ flow end-to-end:

**Teacher tạo Quiz → Host Session → Student join bằng PIN → Làm bài realtime → Submit → Chấm điểm → Xem Result/Report.**

Thiết kế tập trung vào các domain chính:

- Quiz / Question / Option
- Session / Session Settings
- Participant / Attempt
- Answer / Scoring
- Result / Report data

Phạm vi hiện tại không nhằm tái tạo toàn bộ Wayground. Các tính năng ngoài core flow như Classes, Homework, AI generation, Mastery Peak, Team Mode, Paper Mode, LMS, Standards, Payments và Organization Management chưa nằm trong MVP.

## 2. Nguyên tắc thiết kế

### 2.1. Bám behavior của Wayground

Trong phạm vi MVP, behavior đã được xác minh từ Wayground được ưu tiên làm chuẩn cho data model.

### 2.2. Không giả định schema nội bộ của Wayground

Wayground không công khai database schema. Vì vậy schema trong tài liệu là implementation của hệ thống nhằm tái tạo behavior quan sát được, không phải schema nội bộ của Wayground.

### 2.3. Giữ scope đủ gọn cho MVP

Chỉ bổ sung entity hoặc constraint khi cần trực tiếp cho core flow hoặc để tránh khóa architecture vào một thiết kế không phù hợp với behavior của Wayground.

## 3. Flow tổng thể

```text
Teacher
   |
   v
Create Quiz
   |
   v
Create Questions + Options
   |
   v
Publish
   |
   v
Host Live Session
   |
   v
Configure Session
   |
   v
Generate PIN
   |
   v
Lobby
   |
   +---- Student Join
   |         |
   |         v
   |    Participant
   |
   v
Start Session
   |
   v
Student begins Attempt
   |
   v
Answer Questions
   |
   v
Grade Answer
   |
   +---- Accuracy Points
   |
   +---- Session Score
   |
   v
Submit / Complete
   |
   v
Student Result
   |
   v
Teacher Report
```

## 4. Session mode trong MVP

MVP triển khai:

```text
Session Type = LIVE
Session Mode = CLASSIC
```

Classic là Student-paced: mỗi participant có thể tiến triển theo tốc độ riêng, trong khi host theo dõi kết quả và trạng thái session theo thời gian thực.

## 5. Core entities

```text
User

Quiz
Question
Option

Session
SessionSetting

Participant
Attempt

Answer
AnswerOption
```

Tổng cộng: **10 core tables**.

Extension có thể bổ sung sau:

```text
QuestionVersion
OptionVersion
```

nếu triển khai đầy đủ behavior chỉnh sửa question trong running session.

## 6. ERD tổng quát

```text
USER
 |
 | 1
 +----------------< QUIZ
                     |
                     | 1
                     +----------------< QUESTION
                                          |
                                          | 1
                                          +----------------< OPTION


QUIZ
 |
 | 1
 +----------------< SESSION
                     |
                     +---------------- SESSION_SETTING
                     |
                     +----------------< PARTICIPANT
                                          |
                                          | 1
                                          +----------------< ATTEMPT
                                                               |
                                                               | 1
                                                               +--------< ANSWER
                                                                            |
                                                                            | N
                                                                            +----< ANSWER_OPTION >---- OPTION
```

Relationships:

```text
User          1 : N Quiz
Quiz          1 : N Question
Question      1 : N Option

Quiz          1 : N Session
User          1 : N Session (host)

Session       1 : 1 SessionSetting
Session       1 : N Participant

Participant   1 : N Attempt

Attempt       1 : N Answer

Answer        N : M Option
             through AnswerOption
```

## 7. users

```text
users
-----
id              UUID PK
display_name    VARCHAR(100)

role            ENUM(
                  TEACHER,
                  STUDENT
                )

created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Student tham gia session có thể hoạt động như guest, vì vậy `participants.user_id` được phép `NULL`.

## 8. quizzes

```text
quizzes
-------
id              UUID PK
creator_id      UUID FK -> users.id

title           VARCHAR(255)
description     TEXT NULL

status          ENUM(
                  DRAFT,
                  PUBLISHED
                )

created_at      TIMESTAMP
updated_at      TIMESTAMP
published_at    TIMESTAMP NULL
```

Lifecycle:

```text
DRAFT
  |
  v
PUBLISHED
```

## 9. questions

```text
questions
---------
id                  UUID PK
quiz_id             UUID FK -> quizzes.id

type                ENUM(
                      MULTIPLE_CHOICE
                    )

content             TEXT

points              DECIMAL DEFAULT 1
time_limit_seconds  INTEGER
position            INTEGER

created_at          TIMESTAMP
updated_at          TIMESTAMP
```

Constraints:

```text
points >= 0
time_limit_seconds > 0

UNIQUE(
    quiz_id,
    position
)
```

MVP triển khai `MULTIPLE_CHOICE`, nhưng vẫn giữ `type` để schema có thể mở rộng.

## 10. options

```text
options
-------
id              UUID PK
question_id     UUID FK -> questions.id

content         TEXT
is_correct      BOOLEAN
position        INTEGER

created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Business rules:

```text
2 <= option_count <= 5
correct_option_count >= 1
```

Constraint:

```text
UNIQUE(
    question_id,
    position
)
```

Data model hỗ trợ cả single-correct và multiple-correct MCQ.

## 11. sessions

```text
sessions
--------
id              UUID PK

quiz_id         UUID FK -> quizzes.id
host_id         UUID FK -> users.id

pin             VARCHAR(...)

mode            ENUM(
                  CLASSIC
                )

status          ENUM(
                  WAITING,
                  IN_PROGRESS,
                  FINISHED
                )

created_at      TIMESTAMP
started_at      TIMESTAMP NULL
ended_at        TIMESTAMP NULL
```

### Session lifecycle

```text
WAITING
   |
   v
IN_PROGRESS
   |
   v
FINISHED
```

### Join behavior

```text
WAITING
-> join allowed

IN_PROGRESS
-> join allowed

FINISHED
-> join denied
```

PIN phải tra cứu nhanh và không được conflict giữa các active session.

```text
INDEX sessions(pin)
```

Trong MVP có thể sử dụng `UNIQUE(pin)` như một implementation đơn giản.

## 12. session_settings

```text
session_settings
----------------
session_id                UUID PK/FK

timer_mode                ENUM(
                            ON_ALLOW_AFTER_TIMEOUT,
                            ON_LOCK_AFTER_TIMEOUT,
                            OFF
                          )

shuffle_questions         BOOLEAN DEFAULT FALSE
shuffle_answers           BOOLEAN DEFAULT FALSE

show_leaderboard          BOOLEAN DEFAULT TRUE
allow_skip_questions      BOOLEAN

participant_attempt_limit INTEGER NULL

created_at                TIMESTAMP
updated_at                TIMESTAMP
```

`participant_attempt_limit = NULL` có thể được dùng để biểu diễn unlimited attempts.

Session settings thuộc session, không thuộc quiz.

## 13. participants

```text
participants
------------
id              UUID PK

session_id      UUID FK -> sessions.id
user_id         UUID NULL FK -> users.id

nickname        VARCHAR(100)

status          ENUM(
                  JOINED,
                  PLAYING,
                  COMPLETED,
                  LEFT
                )

joined_at       TIMESTAMP
completed_at    TIMESTAMP NULL
```

Participant là identity của người chơi trong một session cụ thể và không đồng nhất với User.

Lifecycle:

```text
JOINED
  |
  v
PLAYING
  |
  v
COMPLETED
```

Có thể rẽ sang `LEFT` từ `JOINED` hoặc `PLAYING`.

Hiện chưa enforce:

```text
UNIQUE(session_id, nickname)
```

cho đến khi behavior duplicate nickname được xác minh rõ.

## 14. attempts

```text
attempts
--------
id                    UUID PK

participant_id        UUID FK -> participants.id

attempt_number        INTEGER

status                ENUM(
                        IN_PROGRESS,
                        SUBMITTED
                      )

started_at            TIMESTAMP
submitted_at          TIMESTAMP NULL

accuracy_points       DECIMAL DEFAULT 0
max_accuracy_points   DECIMAL DEFAULT 0

session_score         INTEGER DEFAULT 0

correct_count         INTEGER DEFAULT 0
incorrect_count       INTEGER DEFAULT 0
answered_count        INTEGER DEFAULT 0
total_questions       INTEGER

time_spent_ms         INTEGER NULL
```

Constraint:

```text
attempt_number >= 1

UNIQUE(
    participant_id,
    attempt_number
)
```

Relationship:

```text
Participant 1 : N Attempt
```

Data model không giới hạn một participant chỉ có một attempt.

## 15. answers

```text
answers
-------
id                       UUID PK

attempt_id               UUID FK -> attempts.id
question_id              UUID FK -> questions.id

is_correct               BOOLEAN

accuracy_points_awarded  DECIMAL
session_score_awarded    INTEGER

response_time_ms         INTEGER
answered_at              TIMESTAMP
```

Constraint:

```text
UNIQUE(
    attempt_id,
    question_id
)
```

Một question chỉ có một final submitted response trong cùng một attempt.

## 16. answer_options

```text
answer_options
--------------
answer_id       UUID FK -> answers.id
option_id       UUID FK -> options.id

PRIMARY KEY(
    answer_id,
    option_id
)
```

Quan hệ:

```text
Answer N : M Option
```

Cấu trúc này hỗ trợ một response chọn nhiều options.

## 17. Multiple-correct grading

Ví dụ:

```text
Correct options:
A, C, D
```

Student chọn:

```text
A, C, D
```

Kết quả:

```text
is_correct = TRUE
```

Student chọn:

```text
A, C
```

hoặc:

```text
A, C, D, E
```

Kết quả:

```text
is_correct = FALSE
accuracy_points_awarded = 0
```

## 18. Accuracy Points và Session Score

Hai khái niệm được lưu riêng.

### Accuracy Points

Phản ánh correctness của response dựa trên points của question.

Ví dụ:

```text
question.points = 2

Correct:
accuracy_points_awarded = 2

Incorrect:
accuracy_points_awarded = 0
```

### Session Score

Phục vụ gameplay/leaderboard và có thể phụ thuộc vào tốc độ.

Không dùng một field `points` chung cho cả hai loại điểm.

## 19. Accuracy

Accuracy được tính theo:

```text
earned accuracy points
---------------------- x 100
possible accuracy points
```

Không tính đơn giản bằng:

```text
correct_count / total_questions
```

vì mỗi question có thể có số points khác nhau.

## 20. Timer scoring

### ON_ALLOW_AFTER_TIMEOUT

Correct:

```text
session_score_awarded =
600 + speed_bonus
```

với:

```text
0 <= speed_bonus <= 400
```

Incorrect:

```text
0
```

### ON_LOCK_AFTER_TIMEOUT

Correct:

```text
600
```

Incorrect hoặc timeout:

```text
0
```

### OFF

Correct:

```text
600
```

Incorrect:

```text
0
```

## 21. Answer submission flow

```text
Student selects option(s)
        |
        v
Submit
        |
        v
Validate Session
        |
        v
Validate Attempt
        |
        v
Validate Question
        |
        v
Validate selected Options
        |
        v
Load correct Option set
        |
        v
Compare selected/correct
        |
        v
Calculate:
- is_correct
- accuracy_points
- session_score
- response_time
        |
        v
INSERT Answer
        |
        v
INSERT AnswerOptions
        |
        v
UPDATE Attempt totals
        |
        v
Emit realtime event
```

## 22. Host flow

```text
Teacher clicks Host
        |
        v
Validate Quiz
        |
        v
Create Session
        |
        v
Create SessionSetting
        |
        v
Generate Join PIN
        |
        v
Session = WAITING
        |
        v
Lobby
```

## 23. Join flow

```text
Student enters PIN
        |
        v
Find active Session
        |
        v
Validate status != FINISHED
        |
        v
Student chooses nickname
        |
        v
INSERT Participant
        |
        v
Participant = JOINED
        |
        v
Emit participant_joined
```

## 24. Start flow

```text
Teacher clicks START
        |
        v
Session:
WAITING -> IN_PROGRESS
        |
        v
started_at = NOW()
        |
        v
Emit session_started
```

Attempt có thể được tạo khi participant bắt đầu thực sự chơi, thay vì tạo đồng loạt khi session start. Cách này hỗ trợ late join tự nhiên hơn.

## 25. Realtime và database

Database chịu trách nhiệm lưu persistent state.

Socket.IO/WebSocket chịu trách nhiệm broadcast state changes.

```text
Frontend
   |
   v
Backend
   |
   +---- Database
   |
   +---- Socket.IO / WebSocket
              |
              v
           Clients
```

Các event chính có thể gồm:

```text
participant_joined
session_started
answer_submitted
participant_progress_updated
leaderboard_updated
participant_completed
session_finished
```

Tên event cụ thể do realtime/backend layer quyết định; database không phụ thuộc vào tên event.

## 26. Student Result

Result không cần một bảng riêng.

Có thể derive từ:

```text
Attempt
 +
Answers
 +
Questions
```

Result V1 có thể gồm:

```text
Quiz title
Accuracy
Accuracy Points
Session Score
Correct Count
Incorrect Count
Answered Count
Response details
```

## 27. Teacher Report

Report không bắt buộc cần bảng `reports`.

Có thể derive từ:

```text
Session
Participants
Attempts
Answers
Questions
```

Các metric cần hỗ trợ:

```text
student count
completion
accuracy
accuracy points
session score
correct / incorrect
average response time
participant breakdown
question breakdown
```

## 28. Multiple Attempts và Report

Không aggregate report bằng cách cộng tất cả attempts.

Raw data phải giữ đầy đủ:

```text
Participant
   |
   +---- Attempts
           |
           +---- Answers
```

để report có thể tính metric phù hợp khi participant có nhiều attempts.

## 29. Running question editing

Architecture không áp dụng rule:

```text
Quiz đã Host -> không bao giờ được edit
```

Behavior Wayground cho phép sửa hoặc replace existing question trong running session nhưng không thêm question mới.

Nếu chức năng này được triển khai trong MVP, schema sẽ mở rộng bằng question versioning.

Potential extension:

```text
questions
   |
   +----< question_versions
```

Ví dụ:

```text
question_versions
-----------------
id
question_id FK
version_number
content
points
time_limit_seconds
created_at
```

`answers` có thể bổ sung:

```text
question_version_id
```

để giữ đúng lịch sử response.

Versioning chưa phải dependency bắt buộc của core E2E flow.

## 30. Main constraints

### Quiz

```text
creator_id NOT NULL
title NOT NULL
```

### Question

```text
quiz_id NOT NULL
points >= 0
time_limit_seconds > 0

UNIQUE(
    quiz_id,
    position
)
```

### Option

```text
question_id NOT NULL

UNIQUE(
    question_id,
    position
)
```

Business validation:

```text
2 <= option_count <= 5
correct_option_count >= 1
```

### Session

```text
quiz_id NOT NULL
host_id NOT NULL
pin NOT NULL
```

### Participant

```text
session_id NOT NULL
nickname NOT NULL
```

### Attempt

```text
participant_id NOT NULL
attempt_number >= 1

UNIQUE(
    participant_id,
    attempt_number
)
```

### Answer

```text
attempt_id NOT NULL
question_id NOT NULL

UNIQUE(
    attempt_id,
    question_id
)
```

### AnswerOption

```text
PRIMARY KEY(
    answer_id,
    option_id
)
```

## 31. Suggested indexes

```text
sessions(pin)
sessions(quiz_id)

questions(quiz_id)
options(question_id)

participants(session_id)

attempts(participant_id)

answers(attempt_id)
answers(question_id)

answer_options(answer_id)
answer_options(option_id)
```

## 32. Delete strategy

Không cascade xóa lịch sử session/report một cách tự động.

### Draft Quiz

Question/Option chưa được sử dụng có thể hard-delete.

### Quiz đã có Session

Ưu tiên `RESTRICT` hoặc soft delete.

### Session

Không hard-delete core session data nếu dữ liệu vẫn cần phục vụ Result/Report.

## 33. Database read/write map

| Action | Main reads | Main writes |
|---|---|---|
| Create Quiz | User | Quiz |
| Add Question | Quiz | Question |
| Add Options | Question | Option |
| Publish | Quiz, Question, Option | Quiz |
| Host | Quiz | Session, SessionSetting |
| Join PIN | Session | Participant |
| Start | Session | Session |
| Begin Play | Participant | Attempt |
| Submit Answer | Question, Option, Attempt | Answer, AnswerOption, Attempt |
| Complete Attempt | Answer | Attempt, Participant |
| Retry | SessionSetting, Participant | Attempt |
| Student Result | Attempt, Answer, Question | — |
| Leaderboard | Attempt | — |
| Teacher Report | Session, Participant, Attempt, Answer | — |

## 34. Core ERD summary

```text
users
  |
  +-- quizzes
        |
        +-- questions
        |     |
        |     +-- options
        |
        +-- sessions
              |
              +-- session_settings
              |
              +-- participants
                    |
                    +-- attempts
                          |
                          +-- answers
                                |
                                +-- answer_options
                                      |
                                      +-- options
```

Optional extension:

```text
questions
   |
   +-- question_versions
```

## 35. Nội dung đã xác định trong V1

V1 hiện đã xác định các điểm nền tảng:

```text
- Live Classic session
- PIN-based joining
- Late joining while session is active
- Multiple-correct MCQ support
- Participant 1:N Attempt
- Answer N:M Option
- Accuracy Points tách khỏi Session Score
- Timer scoring model
- Result derived from Attempt/Answer
- Report derived from session data
- Session settings tách khỏi Quiz
- Architecture không khóa running-question editing
```

Các chi tiết chưa đủ bằng chứng hoặc chưa ảnh hưởng core ERD tiếp tục được research, ví dụ:

```text
- exact PIN length
- duplicate nickname behavior
- exact speed bonus formula
- leaderboard tie-breaking
- exact question-versioning implementation
- exact moment Attempt record is created
```

---

# 36. Mục tiêu Database – Ngày 06/10

Mục tiêu ngày 06/10 là chuyển Database Design V1 từ mức conceptual design sang **logical schema đủ chính xác để implementation có thể bắt đầu mà không phải thiết kế lại core model**.

## 36.1. Hoàn thiện logical schema

Chốt cho từng bảng:

```text
exact columns
exact PostgreSQL data types
nullable / not null
default values
primary keys
foreign keys
unique constraints
check constraints
```

Core tables:

```text
users
quizzes
questions
options
sessions
session_settings
participants
attempts
answers
answer_options
```

## 36.2. Chốt foreign-key behavior

Xác định `ON DELETE` / `ON UPDATE` cho các relationship chính:

```text
Quiz -> Question
Question -> Option

Quiz -> Session

Session -> Participant

Participant -> Attempt

Attempt -> Answer

Answer -> AnswerOption
```

Mục tiêu là tránh xóa ngoài ý muốn dữ liệu lịch sử của Session/Result/Report.

## 36.3. Chốt constraints ở mức database và service

Phân biệt rõ:

### Database-level constraint

Ví dụ:

```text
UNIQUE(participant_id, attempt_number)
UNIQUE(attempt_id, question_id)

points >= 0
time_limit_seconds > 0
```

### Service-level validation

Ví dụ:

```text
2 <= number of options <= 5

correct_option_count >= 1

selected option phải thuộc đúng question

PIN chỉ được join khi session còn active
```

## 36.4. Hoàn thiện session state model

Xác định các transition hợp lệ:

```text
WAITING -> IN_PROGRESS
IN_PROGRESS -> FINISHED
```

và các operation được phép theo từng trạng thái:

```text
join
start
begin attempt
submit answer
complete attempt
finish session
view report
```

## 36.5. Hoàn thiện attempt/answer model

Xác định rõ:

```text
khi nào Attempt được tạo

cách tăng attempt_number

cách kiểm tra attempt limit

cách submit Answer idempotently

cách cập nhật:
accuracy_points
session_score
correct_count
incorrect_count
answered_count
```

## 36.6. Xác định transaction boundaries

Các operation cần transaction tối thiểu:

```text
Create Question + Options

Host Session + SessionSetting

Join Session + Participant

Begin Attempt

Submit Answer + AnswerOptions + Attempt totals

Complete Attempt
```

## 36.7. Hoàn thiện index plan

Xác định index phục vụ các query quan trọng:

```text
Join by PIN

Load quiz questions

Load lobby participants

Load participant attempts

Load attempt answers

Generate leaderboard

Generate session report
```

## 36.8. Chuẩn bị schema implementation

Kết quả cuối ngày cần đủ để chuyển trực tiếp sang một trong các dạng:

```text
PostgreSQL DDL
ORM schema
Migration files
```

mà không thay đổi core ERD.

## 36.9. Definition of Done ngày 06/10

Database workstream đạt mục tiêu ngày 06/10 khi:

```text
[ ] Core ERD ổn định
[ ] Exact column definitions hoàn thành
[ ] PostgreSQL types được xác định
[ ] PK/FK hoàn thành
[ ] UNIQUE/CHECK constraints hoàn thành
[ ] ON DELETE strategy hoàn thành
[ ] Session state transitions được xác định
[ ] Attempt/Answer lifecycle được xác định
[ ] Transaction boundaries được xác định
[ ] Index plan được xác định
[ ] Schema sẵn sàng để tạo migration
```

Sau mốc này, database có thể chuyển từ design sang implementation mà không cần thiết kế lại core model.

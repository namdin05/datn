# Wayground MVP – Database Implementation Status

**Ngày:** 07/10/2026  
**Trạng thái:** Initial database implementation ready

## 1. Mục tiêu

Ngày 3 chuyển database từ logical design sang implementation có thể chạy trên PostgreSQL.

Phạm vi implementation hiện tại:

```text
Schema migration
Seed data
Core constraints
Indexes
Smoke-test queries
```

## 2. Migration

File:

```text
migrations/001_initial_schema.sql
```

Migration tạo:

```text
8 enum types
10 core tables
foreign keys
check constraints
unique constraints
partial unique index cho active PIN
query-support indexes
```

Core tables:

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

## 3. Seed data

File:

```text
seeds/001_demo_seed.sql
```

Seed tạo một dataset đủ để backend/realtime bắt đầu integration:

```text
1 Teacher
1 Student account
1 published Quiz
3 Questions
10 Options
1 Live Classic Session
1 SessionSetting
2 Participants
```

Trong 3 question có cả:

```text
single-correct MCQ
multiple-correct MCQ
```

Session demo:

```text
PIN: 123456
Mode: CLASSIC
Status: WAITING
Timer: ON_ALLOW_AFTER_TIMEOUT
Attempt limit: 2
Leaderboard: enabled
Skip questions: enabled
```

## 4. Validation queries

File:

```text
validation_queries.sql
```

Bao gồm query kiểm tra:

```text
Quiz + Questions + Options
Active Session lookup by PIN
Lobby Participants
Question option/correct-option counts
Participant attempt summary
Leaderboard skeleton
Question-level report skeleton
```

## 5. Core invariants đã encode trong database

```text
Question position unique trong Quiz
Option position unique trong Question
Active PIN unique
Attempt number unique trong Participant
Một final Answer / Question / Attempt
AnswerOption không duplicate
Non-negative points/scores/counts/times
Session timestamp consistency
Attempt timestamp/status consistency
```

## 6. Invariants nằm ở service layer

Các rule sau không được encode bằng simple SQL constraint vì phụ thuộc nhiều row/bảng hoặc business state:

```text
Question phải có 2..5 options khi publish
Question phải có ít nhất 1 correct option
Selected option phải thuộc đúng question
Join chỉ khi session active
Session state transition hợp lệ
Attempt count không vượt session setting
Attempt number cấp tuần tự
Scoring calculation
Running live settings immutable
Realtime emit chỉ sau DB commit
```

## 7. Integration boundary

Database hiện sẵn sàng cho Backend triển khai các operation:

```text
Create Quiz
Add Question/Options
Publish Quiz
Host Session
Join PIN
Start Session
Begin Attempt
Submit Answer
Complete Attempt
Result
Leaderboard
Report
```

## 8. Phần chưa implement trong migration đầu tiên

```text
Question versioning khi edit running session
Full report materialization
Exact Wayground speed-bonus formula
Leaderboard tie-breaking chính xác theo Wayground
Soft-delete framework
```

Các phần này không block core MVP flow.

## 9. Definition of Done – Day 3

```text
[x] Initial PostgreSQL migration created
[x] Core tables created in migration
[x] Constraints/indexes encoded
[x] Seed dataset created
[x] Active PIN demo data available
[x] Multiple-correct question represented
[x] Validation/report queries prepared
[x] Database package ready for backend integration
```

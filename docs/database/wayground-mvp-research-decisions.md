# Wayground MVP – Database Research Decisions

**Ngày cập nhật:** 06/10/2026  
**Phạm vi:** Các behavior ảnh hưởng trực tiếp đến logical schema của Live Classic MVP.

## 1. Live Classic

Classic là Student-paced: learners tiến triển theo tốc độ riêng; host theo dõi live progress và leaderboard.

Source:  
https://help.wayground.com/support/solutions/articles/158000404918-live-session-modes-on-wayground

## 2. Join code

Wayground tạo numerical join code khi session được tạo. Mỗi active session có code riêng; code hết hiệu lực khi session kết thúc.

Source:  
https://help.wayground.com/support/solutions/articles/158000404920-create-and-share-a-join-code

Database decision:

```text
sessions.pin = numeric string
unique among active sessions
```

Không hard-code exact digit count vì tài liệu công khai được kiểm tra không nêu invariant này.

## 3. Late join

Learners có thể tham gia live session trong lúc session vẫn active và không nhất thiết phải join cùng thời điểm.

Source:  
https://help.wayground.com/support/solutions/articles/158000404965-what-s-the-difference-between-live-and-assigned-hw-sessions-

Database/application decision:

```text
WAITING      -> join allowed
IN_PROGRESS  -> join allowed
FINISHED     -> join denied
```

## 4. Session attempts

Classic hỗ trợ Session attempts:

```text
1
2
3
unlimited
```

Source:  
https://help.wayground.com/support/solutions/articles/158000404930-navigate-session-settings

Database decision:

```text
participant_attempt_limit SMALLINT NULL

1..3 = limit
NULL = unlimited
```

`Participant 1:N Attempt`.

## 5. Timer

Classic hỗ trợ ba timer modes:

```text
ON_ALLOW_AFTER_TIMEOUT
ON_LOCK_AFTER_TIMEOUT
OFF
```

Correct answer scoring:

```text
ON_ALLOW_AFTER_TIMEOUT:
600 + 0..400 speed bonus

ON_LOCK_AFTER_TIMEOUT:
600

OFF:
600
```

Wrong/timed-out response = 0.

Sources:  
https://help.wayground.com/support/solutions/articles/158000404053-grade-questions-using-timer  
https://help.wayground.com/support/solutions/articles/158000404930-navigate-session-settings

Database decision:

- lưu `timer_mode` ở `session_settings`;
- lưu `response_time_ms` ở `answers`;
- lưu final `session_score_awarded`;
- exact speed-bonus formula thuộc scoring service, không thuộc schema.

## 6. Shuffle / Skip / Leaderboard

Classic hỗ trợ:

```text
Shuffle Questions
Shuffle Answers
Skip Questions & Attempt Later
Show Leaderboard
```

Source:  
https://help.wayground.com/support/solutions/articles/158000404930-navigate-session-settings

Database decision:

Các setting này thuộc `session_settings`.

## 7. Multiple-correct MCQ

Wayground Multiple Choice hỗ trợ multiple correct options.

Database decision:

```text
questions 1:N question_options
answers N:M question_options
```

thông qua `answer_options`.

## 8. Accuracy Points và Session Score

Accuracy Points và Session Score là hai metric khác nhau. Gamification có thể ảnh hưởng session score nhưng không đổi accuracy points.

Source:  
https://help.wayground.com/support/solutions/articles/158000404051-understand-how-accuracy-is-measured-on-wayground

Database decision:

Tách:

```text
accuracy_points
session_score
```

ở Attempt và Answer.

## 9. Report với nhiều attempts

Wayground lưu nhiều attempts và report có thể hiển thị performance với repetitions.

Source:  
https://help.wayground.com/support/solutions/articles/158000404930-navigate-session-settings

Database decision:

Không collapse attempts trong storage. Giữ toàn bộ:

```text
Participant -> Attempts -> Answers
```

Report aggregation thuộc query/service layer.

## 10. Các điểm chưa dùng làm DB invariant

Các điểm sau chưa đủ bằng chứng công khai hoặc không cần để chốt core schema:

```text
exact PIN digit count
duplicate nickname behavior in live Classic
exact 0..400 speed-bonus formula
leaderboard tie-breaking
exact internal versioning mechanism for running-question edits
```

Các điểm này không làm thay đổi core 10-table logical schema.

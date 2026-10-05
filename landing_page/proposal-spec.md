# INTELLIGENT ASSESSMENT PLATFORM
## Project Proposal Specification

> Tài liệu nền dùng để xây dựng proposal / landing page cho đồ án tốt nghiệp.  
> Đây là bản tổng hợp ý tưởng hiện tại, chưa phải scope cuối cùng.  
> Nhóm sẽ tiếp tục research, đánh giá và tinh chỉnh feature trước khi chốt proposal chính thức.

---

# 1. Tổng quan đề tài

## 1.1. Tên tạm thời

**Intelligent Assessment Platform**

Tên tiếng Việt:

**Nền tảng hỗ trợ xây dựng, tổ chức và phân tích đánh giá học tập thông minh**

Một số tên sản phẩm có thể cân nhắc sau:

- AssessIQ
- AssessFlow
- AssessLab
- ExamForge
- ExamCraft
- LearnGauge
- EduGauge
- Questive
- AssessHub
- QuestMatrix

Tên chính thức sẽ được chốt sau khi kiểm tra:
- GitHub repository name
- domain
- brand uniqueness
- khả năng mở rộng về sau

---

# 2. Bối cảnh

Các nền tảng kiểm tra và học tập hiện nay đã hỗ trợ khá tốt các chức năng cơ bản như:

- tạo đề
- ngân hàng câu hỏi
- random câu hỏi
- đảo đáp án
- import câu hỏi
- tổ chức bài kiểm tra online
- chấm điểm tự động
- thống kê kết quả

Tuy nhiên, bài toán mà nhóm muốn tiếp cận không chỉ là:

> "Tạo một hệ thống giống Azota nhưng thêm AI."

Mục tiêu hướng đến là xây dựng một **assessment platform có vòng đời khép kín**, trong đó:

1. Giảng viên cung cấp tài liệu và mục tiêu học tập.
2. Hệ thống hỗ trợ xây dựng ngân hàng câu hỏi.
3. AI có thể hỗ trợ sinh và đánh giá chất lượng câu hỏi.
4. Hệ thống tạo đề dựa trên blueprint thay vì random thuần túy.
5. Có thể sinh nhiều phiên bản đề tương đương.
6. Sinh viên thực hiện bài đánh giá.
7. Hệ thống chấm và phân tích kết quả.
8. Dữ liệu thực tế từ bài làm được sử dụng để đánh giá lại chất lượng câu hỏi.
9. Kết quả học tập được sử dụng để xác định điểm yếu của sinh viên.
10. Hệ thống có thể đề xuất nội dung hoặc bài luyện tập phù hợp hơn.

Mô hình tổng thể:

```text
Course Material
      ↓
Knowledge Processing
      ↓
Question Bank
      ↓
Question Quality Analysis
      ↓
Exam Blueprint
      ↓
Exam Generation
      ↓
Assessment Delivery
      ↓
Grading
      ↓
Item Analysis
      ↓
Learning Analytics
      ↓
Question Bank Improvement
      ↓
Personalized Practice
```

---

# 3. Vấn đề cốt lõi

## 3.1. Không giới hạn vào một môn học cụ thể

Hệ thống không được thiết kế chỉ cho:

- lập trình
- toán
- tiếng Anh
- mạng máy tính
- hay một môn cụ thể

Thay vào đó, hệ thống là **domain-independent assessment platform**.

Ví dụ:

```text
Course
 ├── Topic
 │    ├── Learning Outcome
 │    │      └── Question
 │    └── Learning Material
 │
 └── Assessment
```

Ví dụ môn Mạng máy tính:

```text
Computer Networks
 └── TCP/IP
      ├── LO1: Explain TCP connection establishment
      ├── LO2: Compare TCP and UDP
      └── Questions
```

Ví dụ môn Toán:

```text
Calculus
 └── Derivative
      ├── LO1: Calculate basic derivatives
      ├── LO2: Apply derivative rules
      └── Questions
```

---

# 4. Vai trò của dữ liệu đầu vào

Do hệ thống không cố định vào một topic cụ thể nên **chất lượng hệ thống phụ thuộc mạnh vào dữ liệu do người dùng cung cấp**.

Nguyên tắc:

> Garbage input → Garbage assessment.

Hệ thống không nên giả định rằng AI tự có đủ kiến thức chính xác cho mọi môn.

Nguồn dữ liệu ưu tiên phải đến từ:

- syllabus
- course outline
- lecture slides
- textbook chapters
- PDF
- DOCX
- PPTX
- teacher notes
- learning outcomes
- existing question bank
- grading rubric
- sample exam
- course resources

Flow đề xuất:

```text
Teacher Input
     ↓
Input Validation
     ↓
Content Processing
     ↓
Knowledge Structure
     ↓
Question / Assessment Generation
```

---

# 5. Input Quality Validation

Đây là một feature quan trọng.

Trước khi AI sử dụng tài liệu, hệ thống cần đánh giá:

- file có đọc được không
- có đủ nội dung không
- nội dung có thuộc đúng course không
- có section/topic rõ ràng không
- có duplicate document không
- file scan có cần OCR không
- tài liệu có quá ít nội dung không
- tài liệu có quá nhiều nội dung nhiễu không

Ví dụ:

```text
Input Quality Report

File: chapter-3.pdf

Readable Content: 92%
Detected Topics: 7
Pages with low OCR confidence: 3
Potential duplicate content: 12%
Recommended status: Ready with warnings
```

Teacher có thể:

```text
Accept
Replace File
Remove Pages
Edit Metadata
```

---

# 6. Người dùng mục tiêu

## 6.1. Teacher

Teacher là user chính.

Teacher cần:

- quản lý course
- upload tài liệu
- xây dựng ngân hàng câu hỏi
- tạo đề
- tổ chức exam
- chấm bài
- xem analytics
- theo dõi chất lượng câu hỏi
- theo dõi năng lực sinh viên

---

## 6.2. Student

Student cần:

- tham gia course
- thực hiện exam
- xem kết quả
- xem feedback
- xem điểm yếu
- làm personalized practice
- theo dõi tiến độ học tập

---

## 6.3. Teaching Assistant

Có thể hỗ trợ:

- review questions
- grading
- monitoring exam
- manage students

---

## 6.4. Admin

Admin quản lý:

- users
- organizations
- system configuration
- content moderation
- audit
- system analytics

---

# 7. Role-Based Access Control

Role đề xuất:

```text
System Admin
Institution Admin
Teacher
Teaching Assistant
Student
```

Permission nên thiết kế theo capability thay vì hard-code.

Ví dụ:

```text
course:create
course:update

question:create
question:review
question:approve

exam:create
exam:publish

submission:grade

analytics:view
```

---

# 8. Module 1 — Organization / Course Management

Feature:

- tạo organization
- tạo course
- tạo semester
- tạo class
- enroll student
- join bằng invite code
- import student CSV
- assign teacher
- assign TA
- archive course
- clone course

Course metadata:

```text
Course Code
Course Name
Description
Semester
Academic Year
Language
Instructor
Credits
Status
```

---

# 9. Module 2 — Learning Content Management

Teacher có thể upload:

- PDF
- DOCX
- PPTX
- TXT
- Markdown
- copied text

Hệ thống cần extract:

```text
Document
 ├── Chapters
 ├── Sections
 ├── Topics
 ├── Concepts
 └── Learning Outcomes
```

Có thể hỗ trợ teacher chỉnh sửa lại cấu trúc AI detect.

Ví dụ:

```text
Operating Systems

Chapter 1
 └── Introduction

Chapter 2
 ├── Process
 └── Thread

Chapter 3
 ├── CPU Scheduling
 └── Algorithms
```

---

# 10. Module 3 — Learning Outcome

Mỗi course nên có Learning Outcome.

Ví dụ:

```text
LO01
Explain fundamental concepts of operating systems.

LO02
Analyze CPU scheduling algorithms.

LO03
Apply synchronization mechanisms.
```

Learning Outcome có thể được tạo:

- manual
- import
- AI suggestion

Teacher phải approve.

Relationship:

```text
Course
 ↓
Topic
 ↓
Learning Outcome
 ↓
Questions
```

---

# 11. Module 4 — Question Bank

Question Bank là core module.

Không nên chỉ lưu:

```text
Question
Answer
```

Mỗi question cần metadata.

```text
Question ID

Content
Answer
Explanation

Course
Topic
Learning Outcome

Question Type
Difficulty
Bloom Level

Estimated Time

Tags
Source
Author

Version
Status

Created At
Updated At

Usage Count
Last Used At
```

---

# 12. Question Types

Core:

- Single Choice
- Multiple Choice
- True / False
- Fill in Blank
- Matching
- Ordering
- Numeric
- Short Answer
- Essay

Có thể mở rộng:

- Case Study
- Reading Comprehension
- Coding Question

Coding Question chỉ nên là extension.

Không nên biến hệ thống thành coding judge.

---

# 13. Question Lifecycle

Đề xuất:

```text
Draft
  ↓
Review
  ↓
Approved
  ↓
Active
  ↓
Deprecated
```

Teacher / reviewer có thể:

```text
Create
Edit
Review
Comment
Approve
Reject
Retire
Restore
```

---

# 14. Question Versioning

Question cần version.

Ví dụ:

```text
Q102

v1
What is TCP?

v2
Which statement best describes TCP?

v3
Which of the following correctly describes TCP?
```

Lưu:

- version number
- modified by
- modified at
- change reason

Exam cũ vẫn tham chiếu đúng version đã sử dụng.

---

# 15. Question Collaboration

Question visibility:

```text
Private
Course
Department
Institution
Public
```

Teacher có thể:

- share
- review
- comment
- duplicate
- fork question
- approve question

---

# 16. Module 5 — Question Import

Teacher có thể:

### Manual

Create question bằng editor.

### Bulk import

- Excel
- CSV
- DOCX
- PDF

### AI extraction

Flow:

```text
Document
   ↓
Parsing
   ↓
OCR if required
   ↓
Question Detection
   ↓
Question Structuring
   ↓
Teacher Review
   ↓
Question Bank
```

Không được tự publish câu hỏi AI extract.

Teacher phải approve.

---

# 17. Module 6 — AI Question Generation

Teacher chọn:

```text
Course

Topic

Learning Outcome

Material Source

Question Type

Number of Questions

Difficulty

Bloom Level
```

Ví dụ:

```text
Generate 20 Questions

Topic:
CPU Scheduling

Difficulty:
Easy 5
Medium 10
Hard 5

Bloom:
Remember 20%
Understand 30%
Apply 40%
Analyze 10%
```

Output:

```text
Question

Answer

Explanation

Difficulty

Bloom Level

Topic

Learning Outcome

Source Reference
```

---

# 18. Grounded Question Generation

AI không nên generate chỉ từ general knowledge.

Đề xuất:

```text
Course Materials
       ↓
Document Processing
       ↓
Chunking
       ↓
Embedding
       ↓
Vector Search
       ↓
Relevant Context
       ↓
LLM
       ↓
Question
```

Mục tiêu:

> Câu hỏi phải grounded vào tài liệu teacher cung cấp.

Question cần có reference:

```text
Source:

Operating-System-Chapter-3.pdf
Page 24
Section 3.2
```

Teacher có thể mở source để verify.

---

# 19. AI Question Validation

Sau khi generate:

```text
Generated Question
       ↓
Validation Pipeline
```

Có thể kiểm tra:

- source grounding
- duplicate question
- answer consistency
- ambiguity
- difficulty
- Bloom taxonomy
- distractor quality
- language quality

Output:

```text
Validation Score: 87/100

Grounding: Good
Duplicate Risk: Low
Ambiguity: Low
Distractor Quality: Medium
Difficulty Confidence: 0.76
```

---

# 20. Module 7 — Question Quality Engine

Một trong các feature research chính.

---

## 20.1. Duplicate Detection

Ví dụ:

```text
Q1:
What is TCP?

Q2:
Which statement best describes the TCP protocol?
```

System:

```text
Semantic Similarity: 91%

Possible Duplicate
```

Teacher:

```text
Keep Both
Merge
Delete
Rewrite
```

---

## 20.2. Ambiguity Detection

Ví dụ cảnh báo:

```text
Potential ambiguity detected.

The wording may allow more than one reasonable interpretation.
```

---

## 20.3. Distractor Analysis

Ví dụ:

```text
A. TCP
B. UDP
C. HTTP
D. Banana
```

System:

```text
Weak Distractor:
Option D
```

AI có thể suggest replacement.

---

## 20.4. Difficulty Prediction

Trước khi exam:

```text
Estimated Difficulty:
Medium

Confidence:
0.72
```

Sau khi có student data:

```text
Estimated:
Medium

Empirical:
Easy
```

Điều này tạo feedback loop.

---

## 20.5. Bloom Classification

Possible classes:

```text
Remember
Understand
Apply
Analyze
Evaluate
Create
```

AI predict.

Teacher có thể override.

---

# 21. Module 8 — Exam Blueprint

Teacher không nên tạo exam bằng random thuần túy.

Teacher tạo blueprint.

Ví dụ:

```text
MIDTERM

Total Questions:
40

Duration:
60 minutes
```

Topic distribution:

```text
Process          20%
Thread           20%
Scheduling       30%
Synchronization  30%
```

Difficulty:

```text
Easy      30%
Medium    50%
Hard      20%
```

Bloom:

```text
Remember       20%
Understand     30%
Apply          30%
Analyze        20%
```

Question Type:

```text
Single Choice     60%
Multiple Choice   20%
True/False        10%
Short Answer      10%
```

---

# 22. Blueprint Constraint

Exam Generator phải chọn question thỏa nhiều constraints.

```text
Question Count

Topic Distribution

Difficulty Distribution

Bloom Distribution

Question Type

Estimated Duration

Learning Outcome Coverage

Question Reuse Limit
```

---

# 23. Module 9 — Smart Exam Generation

Input:

```text
Question Bank
+
Exam Blueprint
```

Output:

```text
Exam
```

Có thể xem như optimization problem.

Objective:

```text
Minimize:

Topic deviation
+
Difficulty deviation
+
Bloom deviation
+
Question reuse
+
Semantic duplication
+
Estimated time deviation
```

---

# 24. Equivalent Exam Generator

Một trong các research core.

Teacher yêu cầu:

```text
Generate:

Form A
Form B
Form C
Form D
```

Hệ thống không đơn giản random câu khác nhau.

Goal:

```text
Form A ≈ Form B ≈ Form C ≈ Form D
```

Theo:

- difficulty
- topic distribution
- Bloom distribution
- learning outcome coverage
- estimated completion time
- question type

Output:

```text
Form A
Difficulty: 0.62
Time: 59 minutes

Form B
Difficulty: 0.60
Time: 61 minutes

Form C
Difficulty: 0.61
Time: 60 minutes
```

Có thể có:

```text
Exam Equivalence Score
```

---

# 25. Exam Preview

Teacher xem:

- exam overview
- question list
- blueprint coverage
- difficulty chart
- topic chart
- Bloom chart
- estimated time

Teacher có thể:

```text
Regenerate Question

Replace Question

Lock Question

Regenerate Exam
```

---

# 26. Module 10 — Exam Delivery

Flow:

```text
Exam Lobby
     ↓
Student Verification
     ↓
Instructions
     ↓
Exam
     ↓
Submit
     ↓
Result
```

Feature:

- schedule
- start time
- end time
- duration
- password
- access code
- attempt limit
- autosave
- countdown
- navigation
- flag question
- save draft
- reconnect
- auto submit
- responsive UI

---

# 27. Exam Randomization

Possible:

- random question order
- random answer order
- question pool
- exam form
- personalized question set

Randomization là baseline feature.

Không nên xem đây là research contribution chính.

---

# 28. Exam Session Recovery

Nếu mất mạng:

```text
Student Answer
       ↓
Local Storage
       ↓
Reconnect
       ↓
Server Synchronization
```

Cần xử lý:

- duplicated request
- conflict
- expired exam
- submission timeout

---

# 29. Module 11 — Academic Integrity

Không nên xây proctoring quá nặng trong MVP.

Basic signal:

- tab switch
- window blur
- reconnect count
- multiple device login
- IP changes
- abnormal submission
- copy/paste events nếu phù hợp
- full screen exit

Output:

```text
Exam Activity Log
```

Optional:

```text
Suspicious Activity Score
```

Quan trọng:

> Hệ thống chỉ cung cấp signal.

Không tự kết luận student cheating.

---

# 30. Module 12 — Grading

## Objective Questions

Auto grading.

```text
Single Choice
Multiple Choice
True / False
Numeric
Matching
```

---

## Subjective Questions

Manual grading.

Teacher có:

```text
Score
Feedback
Rubric
Comment
```

---

# 31. Rubric Grading

Ví dụ:

```text
Essay:
10 points

Correct Concept       4
Reasoning             3
Example               2
Presentation          1
```

Teacher click rubric item để grade.

---

# 32. Module 13 — AI-Assisted Grading

Optional advanced feature.

Flow:

```text
Student Answer
       ↓
Question
       ↓
Reference Answer
       ↓
Rubric
       ↓
AI
       ↓
Suggested Score
+
Reasoning
```

Teacher:

```text
Accept
Modify
Reject
```

AI không tự publish final grade.

Human-in-the-loop.

---

# 33. Answer Clustering

Cho 100 short answers:

```text
Student Answers
       ↓
Embedding
       ↓
Semantic Clustering
       ↓
Answer Groups
```

Teacher có thể grade theo group.

Ví dụ:

```text
Cluster A
28 answers

Cluster B
14 answers

Cluster C
9 answers
```

Giảm workload.

---

# 34. Module 14 — Result & Feedback

Student xem:

```text
Score
Correct / Incorrect
Feedback
Explanation
Learning Outcome Performance
Topic Performance
```

Teacher configure:

```text
Show immediately

Show after exam closes

Do not show answers
```

---

# 35. Module 15 — Item Analysis

Một feature research quan trọng.

Sau khi có nhiều submission:

```text
Exam Result
      ↓
Question Analysis
```

---

## 35.1. Item Difficulty

```text
P = Correct Students / Total Students
```

Ví dụ:

```text
Q21

Correct:
82%

Difficulty:
Easy
```

---

## 35.2. Item Discrimination

Mục tiêu:

> Question có phân biệt được student có performance cao và thấp không?

Output:

```text
Discrimination Index
```

---

## 35.3. Distractor Effectiveness

Ví dụ:

```text
A    4%
B    9%
C   84% ✓
D    3%
```

System:

```text
Option D may be an ineffective distractor.
```

---

# 36. Question Health Score

Kết hợp:

```text
Empirical Difficulty

Discrimination

Distractor Performance

AI Quality Analysis

Usage

Duplicate Risk
```

Output:

```text
Question Health
```

Ví dụ:

```text
92
Excellent

75
Good

54
Needs Review

31
Poor
```

Recommendation:

```text
Keep

Review

Rewrite

Retire
```

---

# 37. Closed Feedback Loop

Một điểm quan trọng của proposal.

```text
Question Created
      ↓
Exam Used
      ↓
Student Responses
      ↓
Item Analysis
      ↓
Question Quality Updated
      ↓
Question Improved
```

Question Bank được cải thiện theo thời gian.

---

# 38. Module 16 — Learning Analytics

Teacher Dashboard:

```text
Class Performance

Average Score

Pass Rate

Topic Performance

Learning Outcome Performance

Question Quality

At-Risk Students
```

---

# 39. Student Analytics

Student Profile:

```text
Course

Topic Mastery

Learning Outcome

Performance Trend

Strength

Weakness
```

Ví dụ:

```text
Operating Systems

Process           84%
Thread            76%
Scheduling        51%
Memory            43%
File System       79%
```

---

# 40. Knowledge Profile

Mỗi student có mastery profile.

```text
Student

Topic A    0.90
Topic B    0.72
Topic C    0.41
Topic D    0.83
```

Profile cập nhật sau mỗi assessment.

---

# 41. Module 17 — Personalized Practice

Advanced / research feature.

Không:

```text
Random 20 Questions
```

Mà:

```text
Student Knowledge Profile
       ↓
Weak Topics
       ↓
Question Selection
       ↓
Personalized Practice
```

Ví dụ:

```text
Weak Topic:

CPU Scheduling
Deadlock
```

Hệ thống tăng tỷ lệ question của 2 topic này.

---

# 42. Adaptive Difficulty

Flow:

```text
Question
Medium
   ↓
Correct
   ↓
Medium / Hard
```

Nếu sai:

```text
Hard
 ↓
Incorrect
 ↓
Medium
```

Mục tiêu:

- tránh quá dễ
- tránh quá khó
- giữ student trong vùng phù hợp

---

# 43. Learning Recommendation

Sau quiz:

```text
Weak Topics:

Deadlock
Virtual Memory
```

System recommend:

```text
Review:

Lecture 05
Section 5.2

Practice:
Set #3
```

Recommendation phải dựa trên:

```text
Student Performance
+
Course Resources
```

Không recommend random internet content trong MVP.

---

# 44. Module 18 — Analytics for Course Improvement

Teacher có thể biết:

```text
Which topic students struggle with?

Which questions are poor?

Which learning outcomes are not achieved?

Which exams are too hard?

Which exam versions differ significantly?
```

---

# 45. Research Direction

Không nên research tất cả feature.

Đề xuất 3 research pillars.

---

# 46. Research Pillar 1 — Grounded Question Generation

Research question:

> How can assessment questions generated by AI remain grounded in teacher-provided academic materials?

Pipeline:

```text
Course Material
      ↓
Chunking
      ↓
Retrieval
      ↓
LLM
      ↓
Question
      ↓
Validation
```

Evaluation:

- relevance
- grounding
- factual correctness
- difficulty accuracy
- Bloom accuracy
- duplicate rate

---

# 47. Research Pillar 2 — Equivalent Exam Generation

Research question:

> How can multiple exam forms be automatically generated while maintaining equivalent assessment characteristics?

Factors:

```text
Difficulty

Topic

Bloom

Learning Outcome

Question Type

Estimated Time
```

Possible approach:

- constraint solving
- heuristic search
- genetic algorithm
- integer programming
- weighted optimization

Research sẽ lựa chọn approach sau.

---

# 48. Research Pillar 3 — Question Quality Analysis

Research question:

> How can AI prediction and empirical student response data be combined to continuously evaluate question quality?

Input:

```text
Question Content
+
AI Analysis
+
Student Response Data
```

Output:

```text
Question Health
```

---

# 49. Potential Research Extension — Adaptive Assessment

Nếu đủ thời gian:

> How can student mastery estimates be used to select suitable practice questions?

Không đưa vào research core ở giai đoạn đầu.

---

# 50. Core Differentiation

Không nên pitch:

> "Azota + AI"

Nên pitch:

> "Closed-loop intelligent assessment."

Concept:

```text
Academic Material
      ↓
Grounded Question Creation
      ↓
Question Quality
      ↓
Blueprint-driven Exam
      ↓
Equivalent Exam Forms
      ↓
Student Assessment
      ↓
Item Analysis
      ↓
Learning Analytics
      ↓
Question Bank Improvement
```

---

# 51. Competitive Positioning

Nhóm sẽ research sau:

- Azota
- Moodle
- Quizizz
- Kahoot
- Canvas
- Google Forms
- Microsoft Forms
- Gradescope
- QuestionWell
- ClassMarker
- Testportal

Không cần chứng minh:

> sản phẩm của nhóm tốt hơn toàn bộ hệ thống trên.

Mục tiêu:

1. Xác định baseline feature.
2. Xác định feature đã phổ biến.
3. Xác định limitation.
4. Chọn research contribution phù hợp.

---

# 52. Feature Classification

## Baseline Features

Phải có để system usable.

```text
Authentication

Course

Class

Question Bank

Manual Question Creation

Exam Creation

Exam Delivery

Auto Grading

Result
```

---

## Enhanced Features

```text
Document Import

Learning Outcome

Blueprint

Question Versioning

Question Review

Analytics

Rubric
```

---

## Intelligent Features

```text
AI Question Generation

Grounding

Question Validation

Question Quality Engine

Equivalent Exam

AI Grading

Learning Recommendation
```

---

## Research Features

Recommended:

```text
Grounded Question Generation

Equivalent Exam Generator

Question Quality Analysis
```

Optional:

```text
Adaptive Practice
```

---

# 53. MVP Scope

MVP cần chứng minh:

> Teacher có thể đi từ course material → question bank → exam → student submission → analytics.

MVP:

```text
Authentication

Course

Class

Student Enrollment

Learning Content

Learning Outcome

Question Bank

Manual Question

Question Import

Exam Blueprint

Exam Generator

Exam Delivery

Auto Grading

Result

Basic Analytics
```

---

# 54. Advanced Scope

```text
AI Question Generation

RAG

Source Citation

Question Validation

Question Quality

Equivalent Exam Forms

Rubric

Item Analysis

Question Health

Student Mastery
```

---

# 55. Stretch Scope

```text
AI Grading

Answer Clustering

Adaptive Practice

Recommendation

Academic Integrity Score

Institution Sharing
```

---

# 56. Non-Goal

Không nên build:

- full LMS như Moodle
- video learning platform
- social network
- coding judge hoàn chỉnh
- live video proctoring
- plagiarism platform hoàn chỉnh
- AI tutor toàn diện
- school ERP
- student information system hoàn chỉnh

Project tập trung:

> Assessment lifecycle.

---

# 57. High-Level User Flow

Teacher:

```text
Register
 ↓
Create Course
 ↓
Upload Material
 ↓
Define Learning Outcomes
 ↓
Build Question Bank
 ↓
Create Blueprint
 ↓
Generate Exam
 ↓
Review Exam
 ↓
Publish
 ↓
Students Take Exam
 ↓
Grade
 ↓
Analytics
 ↓
Improve Question Bank
```

Student:

```text
Join Course
 ↓
View Assessment
 ↓
Take Exam
 ↓
Submit
 ↓
View Result
 ↓
View Feedback
 ↓
View Weak Topics
 ↓
Practice
```

---

# 58. Question Creation Flow

```text
Teacher
 ↓
Choose Source
 ↓
Manual / Import / AI
 ↓
Question Draft
 ↓
Quality Analysis
 ↓
Teacher Review
 ↓
Approved
 ↓
Question Bank
```

---

# 59. Exam Generation Flow

```text
Teacher
 ↓
Create Assessment
 ↓
Create Blueprint
 ↓
Select Question Pool
 ↓
Generate
 ↓
Constraint Validation
 ↓
Preview
 ↓
Teacher Review
 ↓
Publish
```

---

# 60. AI Architecture Concept

```text
Frontend
      ↓
Backend API
      ↓
AI Service
      ↓
Retrieval Service
      ↓
Vector Database
      ↓
Course Documents
```

AI Service responsibilities:

- question generation
- question classification
- quality checking
- answer suggestion
- grading assistance

Không để frontend gọi LLM trực tiếp.

---

# 61. Suggested System Architecture

```text
Web Client

      ↓

API Gateway / Backend

 ├── Authentication
 ├── Course
 ├── Question
 ├── Assessment
 ├── Submission
 ├── Analytics
 └── AI Integration

      ↓

PostgreSQL

      ↓

Object Storage

      ↓

AI Service
      ↓
Vector DB / pgvector
```

---

# 62. Suggested Technology Stack

Đây là gợi ý, chưa phải quyết định cuối.

Frontend:

```text
React
TypeScript
Vite / Next.js
Tailwind CSS
shadcn/ui
```

Backend Option A:

```text
Node.js
NestJS
```

Backend Option B:

```text
Java
Spring Boot
```

AI Service:

```text
Python
FastAPI
```

Database:

```text
PostgreSQL
```

Vector:

```text
pgvector
```

Cache:

```text
Redis
```

Queue:

```text
RabbitMQ
or
BullMQ
```

Storage:

```text
S3-compatible Object Storage
```

Deployment:

```text
Docker
GitHub Actions
```

---

# 63. Database Core Entities

Potential:

```text
users

organizations

courses

classes

enrollments

learning_materials

topics

learning_outcomes

questions

question_versions

question_choices

question_tags

question_reviews

assessments

exam_blueprints

exam_forms

exam_questions

exam_sessions

submissions

submission_answers

rubrics

grades

question_statistics

student_mastery

audit_logs
```

---

# 64. Important Relationships

```text
Course
 ├── Topics
 ├── Materials
 ├── Learning Outcomes
 ├── Questions
 └── Assessments
```

```text
Question
 ├── Topic
 ├── Learning Outcome
 ├── Version
 ├── Statistics
 └── Reviews
```

```text
Assessment
 ├── Blueprint
 ├── Exam Forms
 ├── Sessions
 └── Submissions
```

---

# 65. Functional Requirements Direction

Sau khi research sẽ chuyển các module thành FR.

Ví dụ:

```text
FR-01
The system shall allow teachers to create a course.

FR-02
The system shall allow teachers to upload course materials.

FR-03
The system shall extract text from uploaded documents.

FR-04
The system shall allow teachers to create questions manually.

FR-05
The system shall support AI-assisted question generation.

FR-06
The system shall allow teachers to define an exam blueprint.

FR-07
The system shall generate an exam based on blueprint constraints.
```

---

# 66. Non-Functional Requirements

NFR cần research tiếp.

Possible:

### Performance

```text
Exam page response must remain responsive under concurrent student access.
```

### Reliability

```text
Student answers must not be lost during temporary network interruption.
```

### Security

```text
Role-based authorization must be enforced.
```

### Explainability

```text
AI-generated questions should include source references.
```

### Auditability

```text
Changes to exam/question should be traceable.
```

### Scalability

```text
Assessment delivery should support concurrent users.
```

---

# 67. AI Safety / Quality Principle

AI output không được mặc định là đúng.

Principle:

```text
AI Suggests

Human Approves
```

Áp dụng cho:

- question generation
- question classification
- quality analysis
- grading
- learning recommendation

---

# 68. Explainability

Teacher phải biết:

```text
Why was this question generated?

Which source?

Why is it labeled hard?

Why is a question marked poor?

Why was a student recommended this practice?
```

Explainability sẽ giúp proposal khác với:

> "Add AI API."

---

# 69. Research Evaluation

Mỗi research feature phải có metric.

AI Question Generation:

```text
Grounding Accuracy

Correctness

Relevance

Duplicate Rate

Bloom Accuracy

Difficulty Accuracy
```

Equivalent Exam:

```text
Topic Distribution Difference

Difficulty Difference

Bloom Difference

Estimated Time Difference
```

Question Quality:

```text
Agreement with Teacher Review

Correlation with Student Response Statistics
```

---

# 70. Dataset Strategy

Không nên phụ thuộc dữ liệu internet ngẫu nhiên.

Data có thể lấy từ:

- môn học của nhóm
- tài liệu được giảng viên cho phép
- open educational resources
- synthetic student data cho initial test

Sau đó pilot test:

```text
Teacher evaluation

Student test run
```

---

# 71. Privacy

Không đưa dữ liệu student thật vào public AI model nếu chưa có policy phù hợp.

Data categories:

```text
Public Course Content

Private Course Content

Student Personal Data

Student Assessment Data
```

AI pipeline phải phân biệt.

---

# 72. Audit Trail

Important actions cần log:

```text
Question Created

Question Modified

Question Approved

Exam Generated

Exam Published

Grade Modified

AI Suggestion Accepted
```

---

# 73. Team Research Phase

Nhóm có 5 người.

Chưa chia coding.

Trước tiên chia research domain.

---

# 74. Research Member 1 — Question Bank

Research:

- question management
- lifecycle
- metadata
- collaboration
- import
- versioning

Products:

```text
Azota

Moodle

Canvas

Quiz platforms
```

Output:

```text
10+ Features

Top 3 Recommendations

Competitor Comparison

Research Sources
```

---

# 75. Research Member 2 — Exam Generation

Research:

- exam blueprint
- randomization
- question selection
- constraint solving
- equivalent exam

Output:

```text
Existing solutions

Algorithms

Possible metrics

Technical feasibility
```

---

# 76. Research Member 3 — AI Question Generation

Research:

- RAG
- document processing
- question generation
- Bloom classification
- difficulty prediction
- hallucination reduction

Output:

```text
AI pipeline

Model options

Evaluation methods

Dataset options
```

---

# 77. Research Member 4 — Grading & Analytics

Research:

- automatic grading
- rubric
- item analysis
- question health
- class analytics

Output:

```text
Metrics

Algorithms

Teacher workflow
```

---

# 78. Research Member 5 — Personalization & Integrity

Research:

- student mastery
- adaptive assessment
- personalized practice
- recommendation
- exam integrity

Output:

```text
Possible adaptive models

Integrity features

Scope recommendation
```

---

# 79. Research Template

Mỗi feature phải ghi:

```text
Feature Name

Problem

Target User

Existing Solution

Existing Limitation

Proposed Solution

Workflow

Required Data

AI Required?

Technical Complexity

Research Value

User Value

MVP Feasibility

Risks

References
```

---

# 80. Feature Selection Criteria

Score:

```text
User Value

Research Value

Technical Value

Feasibility

Data Availability

Demo Value
```

---

# 81. Feature Matrix Example

| Feature | User Value | Research Value | Complexity | MVP |
|---|---:|---:|---:|---|
| Question Bank | High | Low | Medium | Yes |
| Random Exam | Medium | Low | Low | Yes |
| Blueprint | High | Medium | Medium | Yes |
| AI Question Gen | High | High | High | Advanced |
| Equivalent Exam | High | Very High | High | Research |
| Item Analysis | High | High | Medium | Advanced |
| Adaptive Practice | High | Very High | High | Stretch |

---

# 82. Development Management Tools

Recommended:

```text
GitHub
GitHub Projects
GitHub Issues
Notion
Google Drive
Figma
Postman / Bruno
Swagger
dbdiagram
Mermaid
Docker
GitHub Actions
```

---

# 83. Tool Responsibility

GitHub:

```text
Source Code

Issues

Pull Requests

Milestones

Release
```

Notion:

```text
Research

Meeting

Decision

Requirement Notes

Knowledge Base
```

Google Drive:

```text
Official Report

Proposal

Presentation

Research Documents
```

Figma:

```text
Wireframe

UI Design

Prototype
```

---

# 84. GitHub Project Board

Columns:

```text
Backlog

Ready

In Progress

Review

Testing

Done
```

---

# 85. Issue Types

```text
[FEATURE]

[BUG]

[RESEARCH]

[DOCUMENT]

[DESIGN]

[TECH]
```

---

# 86. Git Workflow

Possible:

```text
main

develop

feature/*
fix/*
research/*
```

Flow:

```text
Issue
 ↓
Branch
 ↓
Development
 ↓
Pull Request
 ↓
Review
 ↓
Merge
```

---

# 87. Pull Request Rule

Recommended:

- minimum 1 reviewer
- CI pass
- no direct push main
- link PR to issue

---

# 88. Project Milestones

Possible:

```text
M1
Research

M2
Requirement Analysis

M3
Architecture + UX

M4
Core MVP

M5
Advanced Features

M6
Research Features

M7
Evaluation

M8
Thesis + Demo
```

---

# 89. Proposal Landing Page Structure

Codex nên dựng proposal page theo structure sau.

---

## Section 1 — Hero

Content:

```text
Intelligent Assessment Platform

Build better assessments from academic content.

From course materials to question generation,
exam creation, grading and learning analytics.
```

CTA:

```text
Explore Solution

View Feature Map
```

Visual:

```text
Material
→ Question
→ Exam
→ Analytics
```

---

## Section 2 — Problem

Hiển thị 4 problem cards:

```text
Manual Question Creation

Random Exam Quality

Question Quality Evaluation

Learning Feedback
```

---

## Section 3 — Vision

Statement:

> Transform assessment from a one-way examination process into a continuous feedback loop.

Diagram:

```text
Content
 ↓
Question
 ↓
Assessment
 ↓
Student Data
 ↓
Analytics
 ↓
Improvement
```

---

# 90. Proposal Section — Users

3 cards:

```text
Teacher

Student

Administrator
```

Teacher card là primary.

---

# 91. Proposal Section — Workflow

Interactive horizontal flow:

```text
Upload
→ Structure
→ Generate
→ Review
→ Build Exam
→ Assess
→ Analyze
```

---

# 92. Proposal Section — Core Modules

Cards:

```text
Course

Content

Question Bank

AI Generation

Exam Blueprint

Exam Generator

Grading

Analytics
```

---

# 93. Proposal Section — Intelligent Layer

Highlight:

```text
Grounded Question Generation

Question Quality Analysis

Equivalent Exam Generator

Learning Analytics
```

---

# 94. Proposal Section — Research Focus

3 columns:

```text
RAG Question Generation

Equivalent Exam Optimization

Question Quality Feedback Loop
```

---

# 95. Proposal Section — Feature Scope

Tabs:

```text
MVP

Advanced

Research

Stretch
```

---

# 96. Proposal Section — Architecture

Show simplified architecture.

```text
React Web

Backend

AI Service

PostgreSQL

Vector Search

Object Storage
```

---

# 97. Proposal Section — Competitive Direction

Không cần bảng "we are better".

Nên:

```text
Existing tools solve parts of the workflow.

Our research focus is connecting the full assessment lifecycle.
```

Có comparison table nhưng neutral.

Possible columns:

```text
Question Bank

AI Generation

Blueprint

Equivalent Exam

Item Analysis

Adaptive Practice
```

Data thật sẽ research sau.

Không hard-code competitor claims khi chưa verify.

---

# 98. Proposal Section — Team Research

5 research domains:

```text
Question Bank

Exam Generation

AI

Analytics

Personalization
```

Không cần gắn tên nếu chưa chia chính thức.

---

# 99. Proposal Section — Roadmap

Visual timeline:

```text
Research

Requirement

MVP

Advanced

Evaluation

Final
```

---

# 100. UI / UX Direction for Codex

Không làm UI theo phong cách:

- quá nhiều gradient
- glassmorphism nặng
- neon
- dashboard AI generic
- card floating tràn lan
- icon ngẫu nhiên

Direction:

```text
Academic

Clean

Professional

Modern SaaS

Research-focused
```

---

# 101. Suggested Visual Style

Tone:

```text
Trustworthy

Intelligent

Structured

Academic
```

Layout:

- large whitespace
- strong typography
- grid-based
- subtle borders
- minimal shadows
- consistent spacing

---

# 102. Colors

Không bắt buộc.

Có thể dùng:

```text
Primary:
Deep Blue / Indigo

Background:
White / Near White

Text:
Slate / Neutral

Accent:
Blue / Purple nhẹ
```

Tránh quá nhiều màu.

---

# 103. Typography

Suggested:

```text
Inter

Geist

Manrope
```

Heading rõ.

Body dễ đọc.

---

# 104. Responsive

Proposal phải tốt trên:

```text
Desktop

Tablet

Mobile
```

Desktop ưu tiên.

---

# 105. Suggested Proposal Components

Possible:

```text
Navbar

Hero

Problem Grid

Workflow

Feature Matrix

Research Cards

Architecture Diagram

Roadmap

Team Research

Footer
```

---

# 106. Codex Requirements

Codex cần:

1. Đọc toàn bộ file này.
2. Không tự thêm feature ngoài scope nếu không cần.
3. Không biến proposal thành product marketing quá mức.
4. Ưu tiên diễn giải problem → solution → research.
5. Không claim competitor facts chưa verify.
6. Các chart và diagram phải phục vụ nội dung.
7. Dùng mock data thực tế.
8. Không dùng lorem ipsum.
9. Proposal phải đủ rõ để giảng viên hiểu project trong 5–10 phút.
10. Highlight research contribution.

---

# 107. Suggested Demo Data

Course:

```text
Introduction to Operating Systems
```

Topics:

```text
Process

Thread

CPU Scheduling

Synchronization

Memory Management
```

Example:

```text
Course Material:
Operating-System-Chapter-3.pdf

Learning Outcome:
Analyze CPU scheduling algorithms.
```

Question:

```text
Which scheduling algorithm may cause starvation?

A. FCFS
B. Round Robin
C. Priority Scheduling
D. FIFO
```

---

# 108. Sample Teacher Dashboard Data

```text
Course:

Operating Systems

Students:
132

Question Bank:
485

Assessments:
12

Question Health:
81%

Average Score:
7.4 / 10
```

---

# 109. Sample Exam Blueprint

```text
Midterm Exam

40 Questions

60 Minutes

Difficulty:

Easy      30%
Medium    50%
Hard      20%
```

Topic:

```text
Process          20%
Thread           20%
Scheduling       30%
Synchronization  30%
```

---

# 110. Sample Question Analytics

```text
Question 017

Difficulty:
0.38

Discrimination:
0.56

Distractor Efficiency:
67%

Health:
78 / 100

Recommendation:
Review distractor D
```

---

# 111. Sample Student Profile

```text
Student A

Process          84%

Thread           71%

Scheduling       48%

Synchronization  42%

Memory           77%
```

Recommendation:

```text
Practice:

CPU Scheduling

Synchronization
```

---

# 112. Proposal Core Message

Proposal phải truyền tải:

> The platform is not merely an online examination website.

Mà là:

> An intelligent academic assessment system that connects course materials, question quality, exam generation, assessment data and continuous learning improvement.

---

# 113. Short Problem Statement

Có thể dùng:

> Creating fair and high-quality assessments requires more than collecting questions and randomizing exams. Teachers must ensure that questions align with learning outcomes, exam forms have comparable difficulty, assessment results are meaningful, and weak questions can be identified and improved. Existing workflows often separate these activities into disconnected steps. This project proposes an intelligent assessment platform that integrates academic content, question management, exam generation, grading and analytics into a continuous assessment lifecycle.

---

# 114. Short Solution Statement

> The proposed platform enables educators to transform course materials into structured assessment resources, manage a quality-controlled question bank, generate exams using configurable blueprints, create equivalent exam forms, organize assessments, analyze student responses, and continuously improve question quality. AI is used as an assistive layer for question generation, classification, validation and analysis while teachers remain responsible for final decisions.

---

# 115. Core Research Contribution

Recommended:

```text
1. Grounded Question Generation

2. Equivalent Exam Generation

3. Question Quality Feedback Loop
```

---

# 116. Proposed Project Boundary

Inside:

```text
Assessment lifecycle
```

Outside:

```text
Full learning management

School administration

Live teaching

Video conference

Social network
```

---

# 117. Main Success Criteria

System success:

```text
Teacher can create assessment efficiently.

Generated exam follows blueprint.

Multiple forms remain comparable.

Questions are traceable to course materials.

Poor questions can be detected.

Student results produce actionable analytics.
```

---

# 118. Research Success Criteria

Research success:

```text
AI-generated questions demonstrate acceptable grounding.

Equivalent exam forms show low deviation.

Question quality scores align reasonably with teacher / empirical evaluation.
```

---

# 119. Main Risks

## Data Quality

Bad input → bad output.

Mitigation:

```text
Input validation
Teacher review
```

---

## AI Hallucination

Mitigation:

```text
RAG
Source citation
Validation
Human review
```

---

## Scope Too Large

Mitigation:

```text
MVP
Advanced
Research
Stretch
```

---

## Lack of Student Data

Mitigation:

```text
Synthetic data initially

Pilot test later
```

---

## Equivalent Exam Complexity

Mitigation:

```text
Start with constrained dimensions

Expand gradually
```

---

# 120. Questions Still Open

Nhóm cần tiếp tục quyết định:

1. Backend chính là Node/NestJS hay Java/Spring?
2. Có cần organization multi-tenant trong MVP không?
3. Adaptive practice có nằm trong scope chính không?
4. AI grading có đủ giá trị để giữ không?
5. Loại câu hỏi nào MVP phải support?
6. AI provider nào?
7. Có self-host model không?
8. Document formats nào cần support?
9. Item analysis dùng metric nào?
10. Equivalent exam sử dụng algorithm nào?
11. Student mastery model đơn giản hay knowledge tracing?
12. Có cần mobile app không?
13. Academic integrity làm tới mức nào?
14. Có cần integration LMS không?
15. Evaluation dataset lấy từ đâu?

---

# 121. Recommended Next Step

Không code production ngay.

Thứ tự:

```text
1. Team Research

2. Competitor Analysis

3. Feature Matrix

4. Scope Selection

5. Proposal Approval

6. Requirement Specification

7. Architecture

8. Prototype

9. MVP

10. Research Evaluation
```

---

# 122. Immediate Team Task

Mỗi thành viên:

```text
Research 1 domain

Find:

5+ products / papers

10+ features

3 recommended features

Possible research contribution
```

Sau đó:

```text
Feature Workshop
```

Output:

```text
Keep

Remove

MVP

Advanced

Research

Stretch
```

---

# 123. Final Working Concept

Tên tạm:

# Intelligent Assessment Platform

Tagline:

> From academic content to meaningful assessment.

Core flow:

```text
Academic Material
       ↓
Knowledge Structure
       ↓
Question Bank
       ↓
AI-assisted Quality Control
       ↓
Blueprint-driven Exam
       ↓
Equivalent Exam Forms
       ↓
Assessment
       ↓
Grading
       ↓
Analytics
       ↓
Question Improvement
       ↓
Personalized Practice
```

Core idea:

> Assessment should not end when a student submits an exam.  
> The resulting data should improve future questions, future exams and future learning.

---

# 124. Instruction for Future Revision

Tài liệu này là bản nền.

Khi nhóm research xong:

- không rewrite toàn bộ từ đầu
- update trực tiếp từng section
- thêm citations
- thêm competitor analysis
- chốt MVP
- chốt research
- chốt tech stack
- chốt architecture
- chốt tên project

Các phần chưa chắc chắn phải được đánh dấu:

```text
TODO

RESEARCH REQUIRED

DECISION REQUIRED
```

Không biến assumption thành fact.

---

# END

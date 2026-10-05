# INTELLIGENT ASSESSMENT PLATFORM
## Research Assignment Brief

## 1. Bối cảnh

Nhóm đồ án tốt nghiệp gồm 5 thành viên:

- Nam
- Bảo
- Hộp
- Lâm
- Duy

Đề tài hiện tại là **Intelligent Assessment Platform** — nền tảng hỗ trợ xây dựng, tổ chức và phân tích đánh giá học tập thông minh.

Mục tiêu của giai đoạn hiện tại **chưa phải chia task coding**, mà là chia research cho 4 thành viên còn lại để chuẩn bị cho buổi meeting tiếp theo với giảng viên.

Nam sẽ phụ trách tổng hợp kết quả research, so sánh các hướng, chốt scope và cập nhật proposal.

Việc phân công research **không dựa trên CV hay chuyên môn riêng của từng thành viên**. Mục tiêu chính là đảm bảo các phần quan trọng của hệ thống đều được nghiên cứu và hạn chế overlap.

---

# 2. Mục tiêu research chung

Mỗi thành viên cần tìm hiểu:

1. Các sản phẩm / hệ thống hiện có trên thị trường.
2. Các feature tương tự với ý tưởng của nhóm.
3. Cách các hệ thống đó giải quyết bài toán.
4. Những hạn chế hoặc điểm còn thiếu.
5. Feature nào chỉ là baseline.
6. Feature nào có tiềm năng trở thành điểm khác biệt hoặc research contribution.
7. Dữ liệu, thuật toán hoặc AI cần thiết.
8. Cách đánh giá feature bằng metric cụ thể.
9. Mức độ khả thi cho đồ án sinh viên.

Không research theo kiểu chỉ liệt kê:

> Sản phẩm A có feature X.

Cần đi sâu theo hướng:

> Existing Solution → Limitation → Proposed Direction → Evaluation Metric

---

# 3. Phân công 4 thành viên

## 3.1. Bảo — Question Bank & Learning Content

Research các chức năng liên quan đến:

- quản lý course material
- upload PDF / DOCX / PPTX
- document processing
- topic extraction
- learning outcome
- question bank
- question metadata
- difficulty
- Bloom taxonomy
- tags
- search / filter
- question lifecycle
- Draft / Review / Approved / Deprecated
- question versioning
- question collaboration
- import question
- duplicate detection
- question reuse

Câu hỏi research chính:

> Một Question Bank tốt cần quản lý những dữ liệu và workflow nào để có thể phục vụ lâu dài cho AI generation, exam blueprint và analytics?

Các hệ thống có thể tham khảo:

- Azota
- Moodle
- Canvas
- TAO
- Quizizz
- QuestionWell

---

## 3.2. Lâm — Exam Blueprint & Exam Generation

Research các chức năng liên quan đến:

- exam blueprint
- ma trận đề
- topic distribution
- difficulty distribution
- Bloom distribution
- learning outcome coverage
- question type distribution
- estimated completion time
- randomization
- constraint-based question selection
- question pool
- multiple exam forms
- equivalent exam generation
- question locking / replacement
- exam preview
- exam scheduling
- exam session
- autosave
- reconnect / recovery
- auto submit

Câu hỏi research chính:

> Làm thế nào hệ thống có thể tự động sinh nhiều mã đề khác nhau nhưng vẫn đảm bảo chúng tương đương về nội dung, độ khó và mục tiêu đánh giá?

Các hướng kỹ thuật cần tìm hiểu:

- weighted optimization
- constraint solving
- heuristic search
- integer programming
- genetic algorithm

Các metric có thể nghiên cứu:

- Topic Distribution Difference
- Difficulty Difference
- Bloom Difference
- Learning Outcome Coverage
- Estimated Time Difference
- Question Reuse Rate

---

## 3.3. Duy — AI Question Intelligence & Personalization

Research các chức năng liên quan đến:

### AI Question Generation

- document processing
- chunking
- embedding
- retrieval
- RAG
- grounded question generation
- source citation
- hallucination reduction
- answer generation
- explanation generation

### Question Intelligence

- Bloom classification
- difficulty prediction
- ambiguity detection
- duplicate detection
- distractor quality
- question validation
- Question Health

### Personalization

- student mastery profile
- weak topic detection
- personalized practice
- adaptive difficulty
- learning recommendation
- progress update

Câu hỏi research chính:

> AI có thể hỗ trợ sinh, kiểm định và cá nhân hóa câu hỏi như thế nào mà vẫn đảm bảo grounded, explainable và đo được chất lượng?

Các yếu tố cần chú ý:

- AI chỉ đưa suggestion
- Teacher phải có quyền review / approve
- AI output không được mặc định là đúng
- cần source reference
- cần metric đánh giá rõ ràng

Metric có thể nghiên cứu:

- Grounding Accuracy
- Factual Correctness
- Relevance
- Duplicate Rate
- Bloom Accuracy
- Difficulty Accuracy
- Teacher Agreement
- Recommendation Effectiveness

---

## 3.4. Hộp — Paper/OMR, Grading & Item Analysis

Research hai nhóm chức năng.

### Paper / OMR

- generate answer sheet
- answer sheet template
- QR / exam form identification
- scan bằng camera
- image alignment
- bubble detection
- ambiguous mark detection
- multi-mark / blank handling
- review uncertain answer
- batch scan
- mapping với exam version
- lưu ảnh gốc để audit
- kết nối kết quả bài giấy với cùng analytics của bài online

### Grading & Analytics

- auto grading
- manual grading
- rubric grading
- AI-assisted grading
- grading workflow
- regrade
- grade history
- item difficulty
- item discrimination
- distractor effectiveness
- question health
- class analytics
- topic performance
- learning outcome performance

Câu hỏi research chính:

> Làm thế nào kết nối bài thi giấy và bài thi online vào cùng một assessment lifecycle từ chấm bài, review đến analytics?

Các hệ thống có thể tham khảo:

- ZipGrade
- Gradescope
- Azota
- Moodle
- Canvas

Metric có thể nghiên cứu:

- OMR Accuracy
- Scan Failure Rate
- Manual Review Rate
- Processing Time
- Item Difficulty
- Discrimination Index
- Distractor Effectiveness
- Agreement With Teacher Grading

---

# 4. Vai trò của Nam

Nam không cần nhận thêm một research domain riêng.

Nam phụ trách:

- tổng hợp 4 research report
- loại bỏ feature bị trùng
- xác định baseline feature
- xác định feature có research value
- lập competitor matrix chung
- phân loại feature thành:
  - MVP
  - Advanced
  - Research
  - Stretch
- tổng hợp open questions
- chuẩn bị nội dung meeting với giảng viên
- chốt scope sau khi nhận feedback
- chuyển kết quả research thành Functional Requirements
- cập nhật architecture và proposal

Ngoài ra Nam cần theo dõi các vấn đề cross-cutting:

- RBAC
- permissions
- audit trail
- privacy
- explainability
- human-in-the-loop
- reliability
- security
- scalability
- NFR

---

# 5. Yêu cầu đầu ra cho mỗi thành viên

Mỗi người cần:

- nghiên cứu ít nhất 5 sản phẩm / paper / official documentation
- tổng hợp ít nhất 10 feature
- chọn Top 3 feature / hướng đáng giữ
- chỉ ra các feature đã là baseline trên thị trường
- chỉ ra limitation hoặc research gap
- đề xuất hướng của nhóm
- đưa ra metric có thể dùng để đánh giá
- ghi rõ nguồn tham khảo

Không yêu cầu tất cả research đều trở thành feature cuối cùng.

Mục tiêu là có đủ dữ liệu để nhóm quyết định.

---

# 6. Research Template

Mỗi thành viên sử dụng cùng template sau.

```text
# RESEARCH REPORT

Member:
Research Domain:
Date:

## 1. Research Objective

Domain này giải quyết vấn đề gì?

Research Questions:
- RQ1:
- RQ2:
- RQ3:

---

## 2. Existing Solutions

| Product / Paper | Relevant Feature | How It Works | Strength | Limitation | Source |
|---|---|---|---|---|---|

Tối thiểu 5 nguồn.

Ưu tiên:
1. Official documentation
2. Research paper
3. Technical documentation
4. Product documentation

---

## 3. Feature Inventory

| Feature | Existing Products | User Value | Research Value | Complexity |
|---|---|---|---|---|

Tối thiểu 10 feature.

---

## 4. Feature Deep Dive

### Feature Name

Problem:

Target User:

Existing Solution:

Existing Limitation:

Proposed Direction:

Workflow:

Required Data:

Output:

AI Required:
- No AI
- AI Assisted
- AI Core

Technical Complexity:
- Low
- Medium
- High

Research Value:
- Low
- Medium
- High

User Value:
- Low
- Medium
- High

MVP Feasibility:
- MVP
- Advanced
- Research
- Stretch
- Should Not Build

Evaluation Metrics:

Risks:

References:

---

## 5. Gap Analysis

| Existing Capability | Market Baseline? | Limitation / Gap | Opportunity |
|---|---|---|---|

Trả lời:

Nếu thị trường đã có feature này thì đồ án của chúng ta còn nghiên cứu được điều gì?

---

## 6. Top 3 Recommendations

### Recommendation 1

Feature:
Reason:
Research Contribution:
Evaluation Metric:
Suggested Scope:

### Recommendation 2

Feature:
Reason:
Research Contribution:
Evaluation Metric:
Suggested Scope:

### Recommendation 3

Feature:
Reason:
Research Contribution:
Evaluation Metric:
Suggested Scope:

---

## 7. Open Questions

Các vấn đề chưa thể kết luận và cần hỏi nhóm hoặc giảng viên.

- Q1:
- Q2:
- Q3:

---

## 8. Conclusion

Tóm tắt:

- thị trường hiện tại đang làm gì
- đâu là baseline
- đâu là research gap
- feature nào nên giữ
- feature nào nên bỏ hoặc để Stretch

---

## 9. References

[1]
Title:
URL:
Accessed:

[2]
Title:
URL:
Accessed:
```

---

# 7. Nguyên tắc research

Không cố chứng minh sản phẩm của nhóm tốt hơn toàn bộ thị trường.

Mục tiêu là xác định:

```text
Existing Product
      ↓
Existing Capability
      ↓
Limitation / Gap
      ↓
Possible Research Direction
      ↓
Evaluation Method
      ↓
Scope Decision
```

Một feature chỉ thực sự đáng đưa thành research contribution nếu nhóm có thể trả lời:

1. Vấn đề cụ thể là gì?
2. Existing solution đang giải quyết như thế nào?
3. Hạn chế nằm ở đâu?
4. Nhóm đề xuất khác gì?
5. Có dữ liệu để thực hiện không?
6. Có metric để đánh giá không?
7. Có khả thi trong thời gian đồ án không?

---

# 8. Kết quả mong muốn sau research

Sau khi 4 thành viên hoàn thành research, nhóm sẽ tổ chức một buổi tổng hợp để tạo:

1. Competitor Matrix
2. Final Feature List
3. MVP Scope
4. Advanced Scope
5. Research Contributions
6. Stretch Features
7. Open Questions cho giảng viên
8. Functional Requirements
9. Architecture Direction
10. Evaluation Plan

Mục tiêu cuối cùng của giai đoạn này là chuyển từ:

> “Nhóm muốn xây một hệ thống có nhiều feature.”

sang:

> “Nhóm đã khảo sát các giải pháp hiện tại, xác định baseline, tìm được các khoảng trống phù hợp và có phương pháp đánh giá rõ ràng cho các research feature được lựa chọn.”

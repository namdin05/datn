# RESEARCH REPORT

**Member:** Bảo  
**Research Domain:** Question Bank, Learning Content & Explainable Personalized Practice  
**Date:** 30/09/2026  
**Status:** Draft hoàn chỉnh cho giai đoạn research và chốt scope

## Executive Summary

Các hệ thống assessment phổ biến đã hỗ trợ question bank, category, import/export, tìm kiếm, trạng thái, version, comment và usage statistics. Vì vậy, nếu phần của Bảo chỉ dừng ở upload tài liệu và CRUD câu hỏi thì giá trị nghiên cứu thấp, dù đây vẫn là nền tảng bắt buộc của sản phẩm.

Báo cáo này đề xuất một pipeline khép kín nhưng có giới hạn rõ:

> **Question Bank có nguồn gốc và phiên bản → kết quả học tập đã xác nhận → hồ sơ năng lực theo chủ đề → chọn bộ luyện tập phù hợp → giải thích và cho phép giảng viên điều chỉnh → đánh giá lại bằng bằng chứng mới.**

Question Bank đóng vai trò **data backbone** kết nối ba miền còn lại: nhận câu hỏi và cảnh báo AI từ Duy, cung cấp metadata câu hỏi đã duyệt cho Lâm sinh đề, nhận dữ liệu item analysis đã xác nhận từ Hộp. Đóng góp nghiên cứu chính của Bảo là phương pháp **constraint-aware personalized practice** có thể giải thích, sử dụng hồ sơ năng lực theo từng chủ đề và các ràng buộc giáo dục để đề xuất một bộ bài luyện tập giữa các lần làm bài.

Phương pháp prototype ưu tiên mô hình đơn giản, minh bạch và kiểm chứng được thay vì deep learning phức tạp: mastery được ước lượng từ các kết quả đã xác nhận, có prior và độ tin cậy; candidate được lọc theo topic, learning outcome, trạng thái và phiên bản; sau đó được xếp hạng theo nhu cầu củng cố, mức khó phù hợp, độ bao phủ, độ mới và giới hạn lặp. Bayesian Knowledge Tracing (BKT) hoặc mô hình knowledge tracing khác chỉ được dùng làm đối chứng/Advanced nếu dữ liệu đủ.

Báo cáo không tuyên bố recommendation chắc chắn làm tăng kết quả học tập chỉ từ mô phỏng hoặc offline metrics. Learning gain cần được kiểm chứng bằng pre-test/post-test hoặc pilot có bài kiểm tra chung. Trong phạm vi đồ án, phần đánh giá khả thi tập trung vào chất lượng dữ liệu, độ phù hợp của bộ bài, độ bao phủ điểm yếu, khả năng giải thích, cold-start và mức đồng thuận/điều chỉnh của giảng viên.

---

## 1. Research Objective

### 1.1. Vấn đề cần giải quyết

Một ngân hàng câu hỏi có nhiều câu chưa tự động tạo ra hoạt động luyện tập phù hợp. Nếu tất cả sinh viên nhận cùng một bộ bài hoặc hệ thống chỉ chọn ngẫu nhiên, bộ bài có thể không tập trung vào chủ đề đang yếu, lặp lại câu đã làm, thiếu learning outcome quan trọng hoặc quá dễ/quá khó so với bằng chứng hiện có.

Ngược lại, nếu hệ thống dùng một mô hình phức tạp nhưng không giải thích được, giảng viên và sinh viên khó biết vì sao câu hỏi được chọn, dữ liệu nào ảnh hưởng đến quyết định và phải sửa thế nào khi recommendation không phù hợp. Dữ liệu ban đầu còn có các vấn đề thực tế:

- sinh viên mới chưa có lịch sử;
- một câu sai không đủ để kết luận sinh viên yếu cả chủ đề;
- điểm từ bài scan chưa review hoặc bài đang phúc khảo không nên cập nhật mastery;
- độ khó do giảng viên gán, AI dự đoán và độ khó thực nghiệm là ba giá trị khác nhau;
- một câu hỏi có thể bị chỉnh sửa sau khi đã dùng, nhưng kết quả cũ phải tham chiếu đúng version;
- recommendation phải giữ coverage và giới hạn lặp, không chỉ chọn toàn câu dễ ở chủ đề yếu.

Vì vậy, domain của Bảo tập trung vào hai lớp:

1. **Data foundation:** Question Bank, Learning Content, Topic, Learning Outcome, lifecycle, versioning và provenance đủ tin cậy để các miền khác sử dụng.
2. **Research layer:** ước lượng mastery theo chủ đề và tạo bộ luyện tập cá nhân hóa có giải thích, có constraint, có teacher override và có bước đánh giá lại.

### 1.2. Research Questions

- **RQ1 — Data foundation:** Question Bank cần metadata, lifecycle, versioning và provenance nào để phục vụ đồng thời AI generation, exam blueprint, OMR/item analysis và personalized practice mà không làm mất khả năng truy vết?
- **RQ2 — Mastery & recommendation:** Một phương pháp chọn bộ luyện tập dựa trên mastery theo chủ đề có cải thiện weak-topic coverage, difficulty fit và learning outcome coverage so với fixed set hoặc random-with-constraints hay không?
- **RQ3 — Explainability & human control:** Explanation dựa trên dữ liệu gần đây, chủ đề cần luyện và constraint có giúp giảng viên đánh giá/điều chỉnh recommendation hiệu quả hơn so với chỉ hiển thị danh sách câu hỏi không?
- **RQ4 — Cold-start & robustness:** Hệ thống nên hoạt động thế nào khi sinh viên ít dữ liệu, metadata thiếu, question pool không đủ hoặc kết quả nguồn bị sửa/phúc khảo?
- **RQ5 — Evaluation:** Metric nào đo được trong thời gian đồ án và metric nào bắt buộc cần pilot thực tế trước khi đưa ra kết luận về learning effectiveness?

### 1.3. Phạm vi nghiên cứu

**Trong phạm vi:**

- Quản lý Course, Learning Material metadata, Topic và Learning Outcome.
- Question Bank cho MCQ một đáp án đúng ở luồng research chính; có thể lưu thêm loại câu hỏi khác ở mức sản phẩm.
- Metadata, search/filter, import, lifecycle và versioning câu hỏi.
- Tách nhãn độ khó do giảng viên xác nhận, AI dự đoán và độ khó thực nghiệm.
- Chỉ sử dụng submission/result đã xác nhận để cập nhật mastery.
- Hồ sơ mastery theo từng topic/learning outcome kèm confidence/data sufficiency.
- Cold-start bằng prior, diagnostic set hoặc chính sách chung có giải thích.
- Tạo bộ luyện tập giữa các lần làm bài, không adaptive từng câu trong cùng phiên.
- Ràng buộc coverage, difficulty mix, số câu, giới hạn lặp và trạng thái câu hỏi.
- Explanation, teacher override, student feedback và audit trail.
- Đánh giá lại bằng câu khác cùng learning outcome sau một khoảng luyện tập.
- Offline experiment bằng synthetic/public dataset và pilot nhỏ nếu có quyền/dữ liệu.

**Ngoài phạm vi:**

- RAG, sinh câu hỏi và pre-exam AI validation — thuộc miền của Duy.
- Sinh nhiều mã đề thi chung và equivalence verification — thuộc miền của Lâm.
- OMR, item difficulty/discrimination và distractor effectiveness sau thi — thuộc miền của Hộp.
- Adaptive testing từng câu trong bài thi chính thức.
- Deep Knowledge Tracing, reinforcement learning hoặc knowledge graph phức tạp như contribution bắt buộc.
- IRT/equating để so sánh điểm của các đề khác độ khó.
- Chứng minh fairness giáo dục hoặc learning gain ở quy mô lớn chỉ bằng dữ liệu synthetic.
- Full LMS, learning path toàn khóa học và AI tutor tổng quát.

### 1.4. Giả định và giới hạn kết luận

- Mỗi câu hỏi phải liên kết ít nhất một topic hoặc learning outcome được giảng viên xác nhận.
- Mastery là ước lượng theo dữ liệu và policy đã chọn, không phải sự thật tuyệt đối về năng lực sinh viên.
- Sai một câu không làm thay đổi mạnh mastery; hệ thống cần prior, nhiều bằng chứng và confidence.
- Dữ liệu từ bài chưa xác nhận, ảnh scan còn ambiguity, bài trùng hoặc bài đang phúc khảo không được dùng để cập nhật hồ sơ chính thức.
- Difficulty label là metadata dự kiến. Empirical difficulty chỉ có ý nghĩa khi kèm sample size, nhóm người học, form và version câu hỏi.
- Offline recommendation metrics không chứng minh sinh viên học tốt hơn. Kết luận về learning gain cần common post-test hoặc thiết kế thực nghiệm phù hợp.
- Public dataset có thể khác môn học, ngôn ngữ và population của đồ án; chỉ dùng để kiểm tra thuật toán, không mặc định tổng quát hóa.
- Recommendation cho luyện tập không được dùng để xếp hạng chính thức giữa sinh viên bằng raw score của các bộ khác độ khó.

---

## 2. Existing Solutions and Research

### 2.1. Tổng hợp sản phẩm, tiêu chuẩn và nghiên cứu

| Product / Paper | Relevant Feature | How It Works | Strength | Limitation / Gap | Source |
|---|---|---|---|---|---|
| Moodle Question Bank | Category, status, version, comment, usage, history, statistics | Giáo viên tạo, preview, chỉnh sửa, phân loại; câu có trạng thái, version và lịch sử; dữ liệu usage/statistics hỗ trợ review | Baseline thực tế rõ cho lifecycle và QA | Không phải research framework cho explainable personalized practice | [1] |
| Canvas New Quizzes / Item Banks | Item bank, reuse, import QTI, sharing, outcome alignment | Câu hỏi được lưu trong item bank và tái sử dụng giữa quiz/course; hỗ trợ outcome | Chứng minh item reuse và outcome alignment là baseline sản phẩm | Tài liệu sản phẩm không tự cung cấp bằng chứng về thuật toán recommendation cá nhân hóa | [2] |
| 1EdTech QTI 3 | Trao đổi item, test, results và metadata giữa hệ thống | Chuẩn hóa AssessmentItem/AssessmentTest, response processing, feedback và metadata | Hữu ích cho portability và ranh giới dữ liệu | QTI là chuẩn trao đổi, không quyết định lifecycle nội bộ hay mastery policy của đồ án | [3] |
| ASSISTments | Practice, immediate feedback, reports và dữ liệu theo skill/problem | Thu thập interaction học tập, cung cấp báo cáo để giáo viên điều chỉnh hỗ trợ | Ví dụ sản phẩm/dataset thực về data-driven practice | Dữ liệu và domain có thể khác ngữ cảnh đồ án; cần tuân thủ terms và ẩn danh | [4][5] |
| Abdelrahman et al., 2023 | Survey Knowledge Tracing | Phân loại BKT/factor models và các mô hình recurrent, memory, attention, graph; tổng hợp dataset | Nền tảng học thuật để chọn model và hiểu giới hạn | Model dự đoán tốt chưa chắc recommendation tạo learning gain tốt | [6] |
| KG4Ex, 2023 | Explainable exercise recommendation | Biểu diễn student, knowledge concept và exercise trong knowledge graph; tạo recommendation reason | Đặt explainability là một phần của recommendation, đánh giá trên dữ liệu thật và expert interview | Knowledge graph/LSTM có thể quá lớn cho MVP; cần baseline đơn giản để đối chiếu | [7] |
| Takami et al., 2024 | BKT-based explainable recommender | Dùng BKT và giải thích vì sao quiz được đề xuất; đánh giá bằng pre/post-test với 115 học sinh | Cho ví dụ đánh giá explanation và academic performance | Kết quả theo một ngữ cảnh cụ thể; không chứng minh mọi explanation đều hiệu quả | [8] |
| Pei et al., 2024 | Knowledge tracing cho exercise recommendation | GCN + Bi-GRU theo dõi trạng thái và gợi ý difficulty; đánh giá ASSISTments 2009/2017 | Cho thấy recommendation có thể dùng dynamic knowledge state và difficulty | Deep model khó giải thích/triển khai; accuracy dự đoán không đồng nghĩa trực tiếp learning gain | [9] |
| DK-PRACTICE | Knowledge-state-based question/material recommendation | Adaptive assessment, theo dõi interaction và đề xuất câu/material theo knowledge gap | Luồng pre/post-assessment và recommendation gần use case đồ án | Cần dữ liệu huấn luyện; bản đầu không đủ để coi hiệu quả giáo dục đã được chứng minh cho domain của nhóm | [10] |
| UniER Benchmark, 2026 | Unified exercise recommendation evaluation | So item-level và path-level recommendation; xem xét cognitive gain, cold-start, noise, efficiency | Cung cấp góc nhìn metric đa chiều và dataset công khai | Benchmark mới và mô hình phức tạp; không nên bê toàn bộ vào MVP | [11] |

### 2.2. Nhận xét rút ra

1. Category, search/filter, import/export, status, version, comment và usage là baseline của Question Bank.
2. Tính mới không nằm ở việc “có ngân hàng câu hỏi” hay “giao câu hỏi theo chủ đề”.
3. Research gap phù hợp là kết nối dữ liệu đã xác nhận với mastery theo chủ đề và recommendation có constraint, explanation, uncertainty và human control.
4. Knowledge Tracing có nhiều mức phức tạp. Đồ án nên bắt đầu bằng baseline minh bạch, sau đó mới so sánh BKT nếu dữ liệu đủ.
5. Recommendation cần tách hai bài toán:
   - dự đoán student có trả lời đúng không;
   - chọn bộ bài nào có giá trị luyện tập phù hợp.

   Dự đoán response tốt không tự động chứng minh recommendation tốt.
6. Evaluation phải bao gồm cold-start, data sparsity, label noise, coverage, repetition và teacher acceptance; không chỉ Accuracy/AUC.
7. Explainability cần trả lời bằng dữ liệu có thể kiểm tra: topic nào, bằng chứng nào, mức confidence nào, constraint nào ảnh hưởng.

### 2.3. Phương pháp nghiên cứu

Report sử dụng bốn bước:

1. **Product and standards review:** khảo sát Question Bank, item bank, QTI và workflow thực tế.
2. **Literature review:** khảo sát knowledge tracing, explainable exercise recommendation và evaluation.
3. **Prototype-oriented modeling:** thiết kế schema, mastery baseline, recommendation score và constraints.
4. **Controlled evaluation:** so fixed/random-with-constraints với mastery-based recommendation trên cùng candidate pool; kiểm tra cold-start/noise; pilot với giảng viên nếu có thể.

### 2.4. Tiêu chí so sánh giải pháp

- Traceability của question/version/source.
- Khả năng biểu diễn topic, learning outcome và difficulty.
- Xử lý lifecycle và quyền thao tác.
- Khả năng cập nhật mastery từ dữ liệu đã xác nhận.
- Xử lý cold-start và confidence.
- Weak-topic coverage và learning outcome coverage.
- Difficulty fit, repetition và diversity.
- Explanation và teacher override.
- Khả năng đánh giá bằng dữ liệu hiện có.
- Độ phức tạp và tính khả thi trong phạm vi đồ án.

---

## 3. Feature Inventory

| Feature | Existing Products / Research | User Value | Research Value | Complexity | Scope đề xuất |
|---|---|---:|---:|---:|---|
| Quản lý Course/Topic/Learning Outcome | Moodle, Canvas, project requirement | Cao | Thấp | Thấp–TB | MVP |
| Quản lý Learning Material metadata | LMS, QTI ecosystem | Cao | Thấp | Trung bình | MVP |
| Question Bank category/search/filter | Moodle, Canvas | Cao | Thấp | Thấp | MVP |
| Question lifecycle Draft/Review/Approved/Deprecated | Moodle status/history | Cao | Trung bình | Trung bình | MVP |
| Question versioning và snapshot đã sử dụng | Moodle history/version | Rất cao | Trung bình | Trung bình | MVP |
| Import/export có validation | Moodle, Canvas, QTI | Cao | Thấp–TB | Trung bình | MVP |
| Provenance của câu hỏi và metadata | QTI, project requirement | Cao | Trung bình | Trung bình | MVP |
| Tách teacher/AI/empirical difficulty | Project integration | Rất cao | Cao | Trung bình | MVP |
| Response evidence chỉ lấy từ kết quả đã xác nhận | Learning analytics practice | Rất cao | Cao | Trung bình | MVP |
| Hồ sơ mastery theo topic/LO | Knowledge Tracing | Rất cao | Cao | Trung bình | Research |
| Confidence/data sufficiency cho mastery | KT/cold-start research | Cao | Cao | Trung bình | Research |
| Cold-start bằng prior/diagnostic/default policy | Recommendation systems | Cao | Cao | Trung bình | Research |
| Candidate filtering theo trạng thái/version/quyền | Question bank workflow | Cao | Trung bình | Trung bình | MVP |
| Phân phối bộ bài theo weak topics | Exercise recommendation | Rất cao | Cao | Trung bình–Cao | Research |
| Difficulty mix có thể cấu hình | Personalized practice | Cao | Cao | Trung bình | Research |
| Coverage và giới hạn câu lặp | UniER / recommendation practice | Cao | Cao | Trung bình | Research |
| Explanation cho recommendation | KG4Ex, explainable BKT | Rất cao | Cao | Trung bình | Research |
| Teacher override và lưu lý do | Human-in-the-loop | Rất cao | Cao | Trung bình | MVP/Research |
| Student feedback quá dễ/quá khó | Personalized learning UX | Cao | Trung bình | Thấp–TB | Advanced |
| Đánh giá lại bằng câu khác cùng LO | Mastery/retrieval practice workflow | Rất cao | Cao | Trung bình | Research |
| Deep KT / reinforcement learning | KT literature, UniER | Cao | Rất cao | Rất cao | Stretch |

### 3.1. Mô hình dữ liệu đề xuất

#### Question và version

```text
questions
- question_id
- course_id
- current_version_id
- lifecycle_status
- visibility_scope
- created_by
- created_at

question_versions
- question_version_id
- question_id
- version_number
- content
- answer_key
- explanation
- question_type
- source_type          # manual/import/ai
- source_document_id
- source_location
- created_by
- created_at
- change_reason
```

#### Metadata học thuật

```text
question_topic_links
- question_version_id
- topic_id
- weight
- approved_by

question_outcome_links
- question_version_id
- learning_outcome_id
- approved_by

question_difficulty
- question_version_id
- teacher_label
- ai_estimated_label
- ai_confidence
- empirical_p_value
- empirical_sample_size
- empirical_population
- computed_at
```

Nguyên tắc: không ghi đè ba loại difficulty lên nhau. Lâm dùng `teacher_label` đã xác nhận trong blueprint MVP; Duy ghi AI estimate; Hộp cập nhật empirical data sau thi.

#### Evidence và mastery

```text
response_events
- response_event_id
- student_id
- question_version_id
- assessment_id
- topic_ids
- learning_outcome_ids
- is_correct
- score_normalized
- submitted_at
- result_status       # pending/confirmed/revised/invalidated
- source_channel      # online/paper
- result_revision_id

student_topic_mastery
- student_id
- topic_id
- mastery_value
- confidence
- evidence_count
- effective_evidence_weight
- model_name
- model_version
- calculated_at
- source_revision
```

Chỉ `confirmed` hoặc revision chính thức mới đi vào mastery. Khi điểm nguồn được sửa, hồ sơ phải được tính lại và giữ revision.

#### Recommendation và audit

```text
practice_policies
- policy_id
- version
- difficulty_mix_rules
- coverage_rules
- repetition_limit
- minimum_question_quality
- cold_start_policy
- created_by
- approved_at

recommendation_runs
- recommendation_run_id
- student_id
- mastery_snapshot_id
- policy_id
- candidate_pool_snapshot
- selected_question_versions
- explanation_payload
- created_at

recommendation_decisions
- recommendation_run_id
- actor_id
- action               # accept/edit/reject
- before_questions
- after_questions
- reason
- decided_at
```

### 3.2. Ranh giới dữ liệu với các thành viên

| Nguồn/đích | Dữ liệu bàn giao |
|---|---|
| Duy → Bảo | Câu hỏi AI draft, source evidence, Bloom/difficulty suggestion, warnings, model/prompt version |
| Bảo → Lâm | Approved question version, topic, LO, teacher difficulty, Bloom, estimated time, exposure/status |
| Lâm → Hộp | Exam form/version, question snapshot, answer mapping |
| Hộp → Bảo | Confirmed result, empirical difficulty, sample size, item-analysis revision |
| Bảo → Personalized Practice | Question candidates + mastery snapshot + policy/version |

---

## 4. Feature Deep Dive

### 4.1. Feature A — Traceable Question Bank & Learning Content Foundation

**Problem:** Câu hỏi bị chỉnh sửa, import hoặc AI tạo ra có thể mất nguồn gốc; đề cũ có thể bị ảnh hưởng nếu chỉ lưu nội dung hiện tại; metadata không nhất quán làm hỏng blueprint, analytics và recommendation.

**Target User:** Giảng viên, trợ giảng, reviewer và các module downstream.

**Existing Solution:** Moodle có category, status, version, history, comment, usage và statistics; Canvas có item bank/reuse/outcome; QTI chuẩn hóa trao đổi item/test/result [1][2][3].

**Existing Limitation:** Các sản phẩm/chuẩn không quyết định schema và ownership cụ thể cho pipeline Duy–Bảo–Lâm–Hộp. Nếu nhóm không thống nhất data contract, cùng một trường difficulty hoặc version có thể bị diễn giải khác nhau.

**Proposed Direction:**

- Question và QuestionVersion tách biệt.
- Topic/LO gắn với version và có người phê duyệt.
- Tách teacher, AI và empirical difficulty.
- Exam/practice luôn tham chiếu snapshot version cụ thể.
- Không hard-delete câu đã từng dùng; chuyển Deprecated/Hidden.
- Import phải validate schema, duplicate candidate và required metadata.
- Ghi provenance: manual/import/AI, source, người tạo và lý do sửa.

**Workflow:** Material metadata → tạo/import/nhận AI draft → review metadata/nội dung → Approved version → dùng cho blueprint/practice → nhận usage/statistics → review hoặc tạo version mới.

**Required Data:** Course, Topic, LO, material/source, question/version, metadata, permissions, audit.

**Output:** Question pool có version, trạng thái, provenance và data contract ổn định.

**AI Required:** No AI cho core; AI output từ Duy chỉ là suggestion/draft.

**Technical Complexity:** Medium.

**Research Value:** Medium; chủ yếu là nền tảng để research khác đáng tin.

**User Value:** Very High.

**MVP Feasibility:** MVP bắt buộc.

**Evaluation Metrics:** Import validation pass rate, provenance completeness, version reconstruction success, unauthorized transition rejection, downstream schema compatibility.

**Risks:** Scope CRUD quá lớn; metadata bị bỏ trống; migration phức tạp; quyền chia sẻ sai; versioning không snapshot đủ dữ liệu.

**Quyền thao tác:** Teacher tạo/sửa; reviewer comment/approve theo phân công; TA không tự publish nếu thiếu quyền; student không thấy draft/answer.

**Bằng chứng cần lưu:** Source, version diff, actor, timestamp, approval, change reason, downstream usage.

**References:** [1][2][3].

### 4.2. Feature B — Topic Mastery Profile có Confidence và Revision

**Problem:** Tổng điểm môn không cho biết sinh viên mạnh/yếu ở chủ đề nào. Một tỷ lệ đúng đơn giản dễ bị nhiễu khi có ít câu, câu khác độ khó hoặc một kết quả bị sửa.

**Target User:** Sinh viên, giảng viên và recommendation engine.

**Existing Solution:** Knowledge Tracing ước lượng knowledge state từ chuỗi interaction; BKT và các mô hình deep KT là hai nhóm lớn [6].

**Existing Limitation:** Deep model cần nhiều dữ liệu và khó giải thích; BKT cần parameter phù hợp; đồ án chưa chắc có đủ lịch sử thật. Dùng raw accuracy không có prior/confidence cũng dễ kết luận quá mạnh.

**Proposed Direction:** Xây baseline mastery minh bạch bằng weighted evidence với Bayesian-style shrinkage; tùy dữ liệu có thể so với BKT.

Với sinh viên `s`, topic `k`:

```text
M(s,k) = (alpha * prior + sum(w_i * y_i)) / (alpha + sum(w_i))
```

Trong đó:

- `y_i` là score chuẩn hóa của response đã xác nhận;
- `w_i` kết hợp recency, assessment reliability và mức liên kết question–topic;
- `alpha` kiểm soát sức mạnh của prior;
- `prior` là mức khởi tạo do policy quy định, không phải nhãn “trung bình” tuyệt đối.

Confidence prototype:

```text
C(s,k) = 1 - exp(-effective_evidence_weight / tau)
```

Mastery và confidence phải hiển thị cùng nhau. Khi ít dữ liệu, UI nói “chưa đủ bằng chứng” thay vì khẳng định sinh viên yếu.

**Workflow:** Confirm result → map question version tới topic/LO → validate revision → update/recompute mastery → lưu snapshot/model version → cung cấp cho recommendation.

**Required Data:** Confirmed responses, question version, topic mapping, timestamps, assessment/source reliability, revision history.

**Output:** `mastery_value`, `confidence`, evidence count và explanation theo topic.

**AI Required:** No AI cho baseline; BKT/KT model là Advanced/Research comparison.

**Technical Complexity:** Medium.

**Research Value:** High.

**User Value:** High.

**MVP Feasibility:** Research prototype khả thi.

**Evaluation Metrics:** Response prediction Brier score/log loss/AUC nếu phù hợp; calibration; stability under one anomalous answer; revision consistency; cold-start behavior; agreement với teacher rating.

**Risks:** Topic mapping sai; prior/weight tùy ý; mastery bị hiểu như điểm chính thức; dữ liệu ít; feedback loop từ recommendation làm lệch sample.

**Quyền thao tác:** Teacher xem evidence và có thể ghi nhận override/correction nhưng không sửa trực tiếp lịch sử response; student chỉ xem hồ sơ của mình với cách diễn đạt phù hợp.

**Bằng chứng cần lưu:** Response IDs, weights, prior, model/policy version, timestamp và revision nguồn.

**References:** [6][8][9].

### 4.3. Feature C — Constraint-Aware Personalized Practice Set Generation

**Problem:** Random set hoặc một bộ chung cho cả lớp không ưu tiên đúng knowledge gap. Chọn toàn câu ở chủ đề yếu lại có thể phá coverage, lặp câu và làm bộ bài quá dễ/khó.

**Target User:** Sinh viên luyện tập; giảng viên cấu hình và review.

**Existing Solution:** Exercise recommendation dùng knowledge state, knowledge graph hoặc knowledge tracing để chọn câu; UniER phân biệt item-level recommendation và learning path recommendation [7][9][11].

**Existing Limitation:** Mô hình phức tạp có thể thiếu explainability; recommendation accuracy không tự chứng minh learning gain; nhiều nghiên cứu dùng dataset lớn không giống môi trường đồ án.

**Proposed Direction:** Hai bước minh bạch:

1. **Candidate filtering:** chỉ lấy Approved question versions đúng course, chưa vượt repetition/exposure, có metadata cần thiết và không nằm trong bài đang tranh chấp.
2. **Scoring + constrained selection:** chấm điểm câu theo need, difficulty fit, coverage, novelty và quality; chọn tập câu thỏa constraint.

Điểm ứng viên minh họa:

```text
score(s,q) =
  w_need       * Need(s, topic(q))
+ w_difficulty * DifficultyFit(s, q)
+ w_coverage   * CoverageBonus(s, q)
+ w_novelty    * Novelty(s, q)
+ w_quality    * Quality(q)
- w_repeat     * RepetitionPenalty(s, q)
```

Đây là policy prototype cần được version hóa và đánh giá; không coi trọng số minh họa là chân lý giáo dục.

Difficulty mix ban đầu có thể cấu hình theo mastery band:

| Mức mastery ở chủ đề | Easy | Medium | Hard |
|---|---:|---:|---:|
| Cần củng cố | 60% | 30% | 10% |
| Cơ bản | 30% | 50% | 20% |
| Thành thạo | 10% | 40% | 50% |

Các tỷ lệ này là giả thuyết vận hành từ scope v0.2, phải được giảng viên chỉnh và không được tuyên bố đã kiểm chứng.

**Hard constraints đề xuất:** số câu, Approved version, course/topic hợp lệ, minimum LO coverage, repetition ceiling, không trùng trong set.

**Soft constraints đề xuất:** difficulty mix, topic proportions, novelty, estimated time và diversity.

**Workflow:** Chọn student/policy → lấy mastery snapshot → sinh candidate pool → tính score → chọn set có constraint → tạo explanation → teacher review/auto-assign theo policy → student làm → confirmed result → đánh giá lại.

**Required Data:** Mastery snapshot, confidence, question metadata/version, history, policy, candidate quality/status.

**Output:** Practice set, explanation theo câu/set, coverage report, policy/version.

**AI Required:** No AI cho baseline; có thể dùng learned ranking/KT ở Stretch.

**Technical Complexity:** Medium–High.

**Research Value:** Very High.

**User Value:** Very High.

**MVP Feasibility:** Research prototype nếu giới hạn MCQ, 3 difficulty bands và adaptation giữa các lần làm bài.

**Evaluation Metrics:** Weak Topic Coverage, LO Coverage, Difficulty Fit, Constraint Satisfaction Rate, Repetition Rate, Diversity, Teacher Appropriateness, Acceptance/Override Rate, runtime.

**Risks:** Filter bubble giữ sinh viên mãi ở mức dễ; question pool thiếu; mastery sai kéo recommendation sai; các set khác nhau làm raw score không so sánh trực tiếp được.

**Quyền thao tác:** Teacher cấu hình policy và override; student xem lý do, phản hồi quá dễ/khó; hệ thống không tự dùng recommendation làm high-stakes assessment.

**Bằng chứng cần lưu:** Mastery snapshot, candidate scores, constraint decisions, selected versions, explanation, teacher/student feedback.

**References:** [7][9][10][11].

### 4.4. Feature D — Explainable Recommendation, Teacher Override & Re-evaluation

**Problem:** Một danh sách câu hỏi không cho người dùng biết vì sao được chọn. Nếu recommendation sai, không có override/audit thì khó kiểm soát và khó nghiên cứu hiệu quả.

**Target User:** Giảng viên và sinh viên.

**Existing Solution:** KG4Ex tạo recommendation reason; nghiên cứu explainable BKT đánh giá recommendation có explanation và pre/post-test [7][8].

**Existing Limitation:** Explanation có thể chỉ là văn bản thuyết phục nhưng không phản ánh đúng logic; teacher override không được đo thì không biết policy sai ở đâu.

**Proposed Direction:** Explanation được tạo từ structured evidence, không cần LLM:

```text
Chủ đề: Synchronization
Mastery ước lượng: 0.42 (confidence: thấp–trung bình)
Bằng chứng: 3/7 câu gần đây đúng trong 2 bài đã xác nhận
Lý do chọn bộ bài: củng cố LO-SYNC-02, ưu tiên Easy/Medium,
giới hạn tối đa 1 câu đã làm trong 30 ngày
```

Giảng viên có thể thay câu, đổi difficulty mix hoặc hoãn recommendation; mọi thay đổi lưu lý do. Sau luyện tập, hệ thống dùng câu khác cùng LO để đánh giá lại, tránh coi completion là mastery.

**Workflow:** Recommendation → render evidence-based explanation → teacher/student view → accept/edit/feedback → practice → reassessment → mastery revision.

**Required Data:** Mastery evidence, selected questions, policy/constraints, interaction log, reassessment result.

**Output:** Explanation payload, override record, feedback và re-evaluation outcome.

**AI Required:** No AI cho structured explanation; LLM wording chỉ là optional và không được thay đổi căn cứ.

**Technical Complexity:** Medium.

**Research Value:** High.

**User Value:** Very High.

**MVP Feasibility:** MVP/Research instrumentation.

**Evaluation Metrics:** Explanation completeness/correctness, teacher comprehension, review time, acceptance/override rate, reason distribution, SUS/usability, teacher agreement, re-evaluation improvement.

**Risks:** Explanation gây quá tải; confidence bị hiểu sai; teacher override có thể không nhất quán; student cảm thấy bị gắn nhãn yếu.

**Quyền thao tác:** Student chỉ xem dữ liệu của mình; teacher xem lớp được giao; mọi override nhạy cảm phải có audit.

**Bằng chứng cần lưu:** Explanation fields, policy version, viewed/accepted/edited state, override reason và reassessment link.

**References:** [7][8].

---

## 5. Thuật toán Prototype Đề xuất

### 5.1. Input

- Question Bank đã Approved và có version.
- Topic/LO mapping.
- Teacher difficulty label.
- Confirmed response events.
- Practice policy/version.
- Số câu, thời gian và constraint của bộ luyện tập.

### 5.2. Processing

1. Validate question metadata và result status.
2. Recompute mastery snapshot theo topic/LO.
3. Xác định weak topics nhưng xét confidence; topic ít dữ liệu được đưa vào diagnostic/exploration, không mặc định là yếu.
4. Filter candidate theo trạng thái, quyền, course, repetition và metadata.
5. Tính candidate score.
6. Chọn tập câu thỏa hard constraints và giảm soft-constraint deviation.
7. Nếu pool không đủ, tạo shortage report thay vì âm thầm phá constraint.
8. Sinh structured explanation.
9. Lưu snapshot, policy, candidates, selected version và quyết định người dùng.
10. Sau practice, chỉ cập nhật mastery khi kết quả được xác nhận; lên lịch re-evaluation bằng câu khác cùng LO.

### 5.3. Pseudocode mức khái niệm

```text
events = load_confirmed_events(student)
mastery = estimate_mastery(events, model_version)

candidates = filter_questions(
    status = APPROVED,
    course = target_course,
    metadata_complete = true,
    repetition_within_limit = true
)

for q in candidates:
    q.score = need(mastery, q.topics)
            + difficulty_fit(mastery, q.teacher_difficulty)
            + coverage_bonus(q.learning_outcomes)
            + novelty(q, student_history)
            - repetition_penalty(q, student_history)

practice_set = constrained_select(candidates, policy)

if practice_set is infeasible:
    return shortage_report(candidates, policy)

explanation = build_structured_explanation(
    mastery_snapshot,
    practice_set,
    policy
)

return practice_set, explanation, audit_snapshot
```

### 5.4. Baselines so sánh

1. **Fixed set:** mọi sinh viên nhận cùng bộ bài.
2. **Random-with-constraints:** random nhưng giữ course, số câu và coverage tối thiểu.
3. **Weak-topic heuristic:** ưu tiên topic có mastery thấp, chưa xét difficulty/repetition.
4. **Proposed method:** mastery + confidence + difficulty fit + coverage + novelty + repetition.
5. **BKT-based mastery (optional):** đối chứng nếu dữ liệu và thời gian cho phép.

---

## 6. Evaluation Plan

### 6.1. Bộ dữ liệu

#### Dataset A — Synthetic controlled data

| Mức | Students | Questions | Topics | Interactions/student | Mục đích |
|---|---:|---:|---:|---:|---|
| Small | 30 | 100 | 3 | 10–30 | Debug và test edge cases |
| Medium | 100 | 300 | 5 | 20–80 | Đánh giá chính |
| Stress | 500 | 1,000 | 8 | 50–150 | Runtime và data volume |

Tạo các scenario:

- balanced mastery;
- một topic yếu rõ;
- nhiều topic yếu;
- cold-start 0–3 interactions;
- missing metadata;
- question pool thiếu Easy/Medium/Hard;
- result revision/phúc khảo;
- noisy answer hoặc một lần sai bất thường;
- repetition pressure khi pool nhỏ.

#### Dataset B — Public interaction data

ASSISTments 2009/2017 hoặc dataset phù hợp khác có question–skill interaction có thể dùng để kiểm tra mastery/recommendation offline. Cần tuân thủ terms, kiểm tra preprocessing và ghi rõ khác biệt domain [5][6][11].

#### Dataset C — Pilot nội bộ nếu được phép

- Một học phần quen thuộc với giảng viên.
- Question bank được giảng viên xác nhận.
- Nhóm nhỏ sinh viên hoặc evaluator.
- Có common diagnostic/pre-test và common post-test nếu muốn phát biểu về learning gain.
- Có consent, phân quyền và chính sách dữ liệu phù hợp.

### 6.2. Experiments

#### E1 — Data integrity và traceability

- Tạo/sửa/deprecate câu hỏi đã dùng.
- Import dữ liệu thiếu metadata/sai answer.
- Reconstruct một practice set và exam từ version snapshot.
- Thử unauthorized lifecycle transition.

#### E2 — Mastery robustness

- So raw accuracy, shrinkage baseline và BKT optional.
- Kiểm tra cold-start, ít evidence và một answer anomaly.
- Sửa một result cũ và kiểm tra mastery revision.

#### E3 — Recommendation quality

So Fixed, Random-with-constraints, Weak-topic heuristic và Proposed method trên cùng question pool/student state.

Đo:

- weak-topic coverage;
- LO coverage;
- difficulty fit;
- repetition/diversity;
- constraint satisfaction;
- shortage detection;
- runtime.

#### E4 — Explanation và teacher control

So hai giao diện:

- chỉ hiển thị practice set;
- hiển thị practice set + mastery evidence + constraint explanation.

Đo review time, mức hiểu lý do, acceptance/override, số vấn đề phát hiện và usability.

#### E5 — Learning effectiveness (chỉ khi có pilot)

So fixed/random practice với personalized practice bằng common post-test. Nếu có pre-test, báo cáo gain hoặc normalized gain kèm sample size và uncertainty. Không dùng completion rate làm bằng chứng duy nhất về học tập.

### 6.3. Định nghĩa metric

- **Weak Topic Coverage:** số weak topic mục tiêu được phủ trong practice set / tổng weak topic cần phủ.
- **Learning Outcome Coverage:** số LO bắt buộc xuất hiện / tổng LO bắt buộc.
- **Difficulty Distribution Difference:** `0.5 × sum(abs(p_actual(v) - p_target(v)))` trên các difficulty band.
- **Difficulty Fit:** mức phù hợp giữa distribution câu đã chọn và policy theo mastery band.
- **Constraint Satisfaction Rate:** tỷ lệ practice set thỏa toàn bộ hard constraints.
- **Repetition Rate:** số câu vượt giới hạn lặp / tổng câu được đề xuất.
- **Novelty/Diversity:** tỷ lệ câu hoặc topic chưa xuất hiện trong cửa sổ lịch sử; phải báo cùng coverage để tránh tối ưu novelty đơn độc.
- **Teacher Appropriateness:** rating của giảng viên về mức phù hợp topic/difficulty/coverage.
- **Acceptance Rate:** số recommendation được chấp nhận không sửa / tổng recommendation.
- **Override Rate & Reasons:** tỷ lệ bị sửa và phân bố nguyên nhân.
- **Explanation Correctness:** explanation có khớp mastery snapshot, policy và selected questions hay không.
- **Cold-start Safety:** tỷ lệ sinh viên ít dữ liệu vẫn nhận được diagnostic/balanced set thay vì bị gắn nhãn yếu sai.
- **Mastery Calibration:** mức khớp giữa mastery prediction và response outcome; dùng Brier score/calibration plot nếu đủ dữ liệu.
- **Learning Gain:** thay đổi common test trước/sau; chỉ dùng khi thiết kế pilot phù hợp.
- **Runtime:** tách mastery update, candidate scoring, selection và report generation.

### 6.4. Quy tắc báo cáo

- Chốt metric và threshold trước thí nghiệm.
- Chạy nhiều seed đối với synthetic/random baseline.
- Báo mean, standard deviation và worst case; không chỉ chọn kết quả đẹp nhất.
- Tách kết quả cold-start, normal và sparse-data.
- Ghi dataset version, policy version, model version và seed.
- Không gọi “improved learning” nếu chỉ có offline recommendation metrics.
- Không so raw score trực tiếp giữa các practice set khác difficulty.

---

## 7. Gap Analysis

| Existing Capability | Market Baseline? | Limitation / Gap | Opportunity cho đồ án |
|---|---|---|---|
| Question Bank/category | Có | CRUD không tạo research contribution mạnh | Xây data backbone có provenance/version rõ |
| Status/version/comment/usage | Có | Cần tích hợp với AI, blueprint, OMR và recommendation | Data contract và audit xuyên vòng đời |
| Import/export | Có | Dữ liệu import có thể thiếu metadata/sai mapping | Validation + review trước Approved |
| Topic/LO tagging | Có | Label có thể thiếu hoặc không nhất quán | Approved metadata và ownership rõ |
| Student analytics | Có ở nhiều hệ thống | Dashboard không tự tạo recommendation phù hợp | Chuyển confirmed evidence thành mastery + confidence |
| Random/fixed practice | Có | Không ưu tiên knowledge gap cá nhân | Baseline để so mastery-based recommendation |
| Knowledge tracing | Có trong research | Deep model cần dữ liệu và khó giải thích | Baseline minh bạch + BKT optional |
| Exercise recommendation | Có trong research/sản phẩm | Accuracy không chứng minh learning gain; cold-start khó | Constraint-aware set + evaluation đa chiều |
| Explainable recommendation | Đang nghiên cứu | Explanation có thể không faithful | Structured explanation từ evidence/policy |
| Teacher override | Có thể có | Thường không được instrument để đánh giá | Audit override/reason và cải thiện policy |
| Adaptive testing từng câu | Có trong CAT/research | Phức tạp và dễ trùng phạm vi thi chính thức | Để Stretch; ưu tiên adaptation giữa phiên |

### Research gap chính

Khoảng trống phù hợp với đồ án không phải “xây Question Bank mới” hoặc “dùng AI gợi ý câu hỏi”. Hướng có giá trị hơn là:

> **Một pipeline cá nhân hóa có thể truy vết từ question version và confirmed evidence đến mastery, practice selection, explanation, teacher override và re-evaluation.**

Đóng góp được đánh giá bằng baseline, constraint metrics, cold-start, teacher review và pilot giới hạn; không phụ thuộc việc huấn luyện deep model quy mô lớn.

---

## 8. Top 3 Recommendations

### Recommendation 1 — Explainable Constraint-Aware Personalized Practice

**Feature:** Sinh bộ luyện tập theo mastery/topic, difficulty mix, LO coverage, repetition và quality constraints.

**Reason:** Đây là điểm khác biệt trực tiếp với fixed/random practice và nối được dữ liệu giấy + online.

**Research Contribution:** Đề xuất một phương pháp hai bước candidate filtering + transparent ranking/constrained selection, so với các baseline trên cùng pool.

**Evaluation Metric:** Weak Topic Coverage, LO Coverage, Difficulty Fit, Constraint Satisfaction, Repetition, Teacher Appropriateness, runtime.

**Suggested Scope:** Research chính; MCQ; adaptation giữa phiên; 3 difficulty bands; 3–5 topics ở demo; không dùng cho high-stakes exam.

### Recommendation 2 — Mastery Profile có Confidence, Cold-start và Revision

**Feature:** Hồ sơ năng lực theo topic/LO được cập nhật từ confirmed evidence, có prior, confidence và version.

**Reason:** Recommendation không đáng tin nếu mastery không thể giải thích hoặc không xử lý dữ liệu ít/sửa điểm.

**Research Contribution:** Baseline mastery minh bạch, kiểm tra robustness/cold-start và so BKT optional; tách mastery value khỏi confidence.

**Evaluation Metric:** Calibration, stability, response prediction bổ trợ, cold-start safety, teacher agreement, revision consistency.

**Suggested Scope:** Research nền cho Recommendation 1; không dùng nhãn “giỏi/yếu” cố định.

### Recommendation 3 — Evidence-based Explanation, Override & Re-evaluation

**Feature:** Giải thích vì sao bộ bài được chọn, cho teacher override có lý do và đánh giá lại bằng câu khác cùng LO.

**Reason:** Human control và audit là điều kiện để hệ thống cá nhân hóa có thể sử dụng và bảo vệ trước hội đồng.

**Research Contribution:** Đánh giá quy trình người–hệ thống, không chỉ thuật toán; đo explanation correctness, review time và override reasons.

**Evaluation Metric:** Explanation correctness/completeness, acceptance/override rate, review time, usability, teacher agreement, re-evaluation change.

**Suggested Scope:** MVP cho audit/override; Research cho experiment có/không explanation.

### 8.4. Ma trận ưu tiên cuối

| Hướng | User Value | Research Value | Khả thi | Quyết định |
|---|---:|---:|---:|---|
| Question Bank CRUD/category | Cao | Thấp | Cao | MVP baseline |
| Version/provenance/data contract | Rất cao | Trung bình | Cao | MVP bắt buộc |
| Mastery + confidence | Cao | Cao | Trung bình–Cao | Research foundation |
| Personalized practice set | Rất cao | Rất cao | Trung bình–Cao | Research chính |
| Explanation + override | Rất cao | Cao | Cao | Làm cùng recommendation |
| Re-evaluation | Cao | Cao | Trung bình | Prototype |
| BKT comparison | Trung bình | Cao | Trung bình | Advanced nếu đủ dữ liệu |
| Deep KT/RL/learning path | Cao | Rất cao | Thấp | Stretch/future work |
| Adaptive high-stakes exam | Cao | Rất cao | Thấp | Không làm đợt này |

---

## 9. Open Questions

1. Môn học/domain nào được dùng cho dataset và pilot?
2. Bảo có chính thức nhận Personalized Practice từ Duy theo phân công điều chỉnh không?
3. Topic và LO được gắn cho question version bởi ai, và ai phê duyệt?
4. Một câu có nhiều topic thì chia evidence weight thế nào?
5. Difficulty MVP dùng teacher label hay numerical score?
6. Prior mastery và ngưỡng mastery band được chốt theo cơ sở nào?
7. Cửa sổ recency và repetition là bao lâu?
8. Kết quả formative, summative, giấy và online có weight giống nhau không?
9. Bài đang phúc khảo có tạm loại khỏi mastery hay dùng version trước?
10. Cold-start dùng diagnostic test, balanced set hay prior theo lớp?
11. Practice set cần bao nhiêu câu và bao nhiêu LO bắt buộc?
12. Giảng viên có quyền sửa mastery trực tiếp hay chỉ sửa evidence/policy?
13. Explanation hiển thị mức số cụ thể hay chỉ mức diễn giải để tránh gắn nhãn?
14. Nhóm có đủ giảng viên/reviewer để tạo teacher ratings và đánh giá explanation không?
15. Có pilot sinh viên và common post-test không, hay chỉ đánh giá offline + expert review?
16. Dữ liệu public nào được phép sử dụng và cần preprocessing gì?
17. Policy/version nào được dùng khi reproduction một recommendation cũ?
18. Recommendation có cần fairness analysis theo nhóm không, và dữ liệu nào được phép dùng?

---

## 10. Conclusion

### Thị trường và research hiện tại đang làm gì

Question Bank với category, version, status, review, reuse và statistics đã là baseline. Knowledge tracing và personalized exercise recommendation là các hướng nghiên cứu phát triển mạnh, từ BKT minh bạch đến deep KT, knowledge graph và reinforcement learning. Tuy nhiên, mô hình phức tạp, data sparsity, cold-start, explainability và việc chứng minh learning gain vẫn là vấn đề cần thận trọng.

### Baseline bắt buộc

- Course, Topic, Learning Outcome và material metadata.
- Question Bank category/search/filter/import.
- Lifecycle, version, provenance và permission.
- Teacher-approved metadata.
- Confirmed response events và revision.
- Candidate filtering và audit.

### Research contribution phù hợp

Phần của Bảo nên được trình bày là:

> **An explainable, constraint-aware personalized practice pipeline built on a traceable question bank and confirmed assessment evidence.**

Trọng tâm không phải deep AI mà là quyết định có căn cứ, kiểm chứng được và kết nối được toàn bộ assessment lifecycle.

### Scope cuối đề xuất

- **MVP:** Question Bank, metadata, lifecycle, version, import validation, permissions, confirmed evidence.
- **Research:** Mastery + confidence, constraint-aware personalized practice, explanation và controlled evaluation.
- **Advanced:** BKT comparison, student feedback, re-evaluation workflow và richer diversity policy.
- **Stretch:** Deep KT, knowledge graph, reinforcement learning, item-level adaptive sequencing.
- **Should Not Build:** full LMS, AI tutor toàn diện, adaptive high-stakes exam và tuyên bố learning gain khi chưa có pilot.

### Các bước tiếp theo

1. Nhóm xác nhận Bảo sở hữu Personalized Practice.
2. Chốt data contract với Duy, Lâm và Hộp.
3. Chốt question types, topic/LO schema và ba loại difficulty.
4. Implement QuestionVersion, lifecycle và confirmed response event.
5. Tạo synthetic dataset có cold-start/noise/revision.
6. Implement fixed/random baseline.
7. Implement mastery shrinkage baseline.
8. Implement recommendation scoring + constrained selection.
9. Implement structured explanation và override audit.
10. Chạy E1–E4; chỉ chạy E5 nếu có pilot hợp lệ.
11. Báo cáo kết quả, giới hạn và threat to validity.

---

## 11. References

> Ngày truy cập: 30/09/2026.

1. MoodleDocs. **Question bank** — category, status, version, history, comments, usage and statistics.  
   https://docs.moodle.org/404/en/Question_bank

2. Instructure. **Canvas Instructor Guide / New Quizzes Item Banks**.  
   https://community.canvaslms.com/t5/Instructor-Guide/tkb-p/Instructor

3. 1EdTech Consortium. **Question & Test Interoperability (QTI) Specification Documents**.  
   https://www.1edtech.org/standards/qti/index

4. ASSISTments Foundation. **ASSISTments — practice, feedback and actionable reports**.  
   https://www.assistments.org/

5. ASSISTments Data Mining Competition. **2017 Dataset**.  
   https://sites.google.com/view/assistmentsdatamining/dataset

6. Abdelrahman, G., Wang, Q., & Nunes, B. (2023). **Knowledge Tracing: A Survey**. ACM Computing Surveys, 55(11), Article 224.  
   https://doi.org/10.1145/3569576

7. Guan, Q., Xiao, F., Cheng, X., Fang, L., Chen, Z., Chen, G., & Luo, W. (2023). **KG4Ex: An Explainable Knowledge Graph-Based Approach for Exercise Recommendation**. CIKM 2023, 597–607.  
   https://doi.org/10.1145/3583780.3614943

8. Takami, K., Flanagan, B., Dai, Y., & Ogata, H. (2024). **Evaluating the Effectiveness of Bayesian Knowledge Tracing Model-Based Explainable Recommender**. International Journal of Distance Education Technologies, 22(1), 1–23.  
   https://doi.org/10.4018/IJDET.337600

9. Pei, P., Raga Jr., R. C., & Abisado, M. (2024). **Enhanced Personalized Learning Exercise Question Recommendation Model Based on Knowledge Tracing**. International Journal of Advances in Intelligent Informatics, 10(1), 13–26.  
   https://doi.org/10.26555/ijain.v10i1.1136

10. Delianidi, M., Diamantaras, K., Moras, I., & Sidiropoulos, A. (2025/2026). **DK-PRACTICE: An Intelligent Platform for Knowledge Tracing and Educational Content Recommendation**.  
    https://arxiv.org/abs/2501.10373

11. UniER. **A Unified Benchmark for Item-Level and Path-Level Exercise Recommendation**.  
    https://www.unier-benchmark.com/

12. 1EdTech Consortium. **Question & Test Interoperability 3.0 Overview**.  
    https://www.imsglobal.org/spec/qti/v3p0/oview/

---

## Checklist tự kiểm trước khi nộp report

- [x] Bám phân công ban đầu và điều chỉnh scope của nhóm.
- [x] Có ít nhất 5 sản phẩm/paper/official documentation.
- [x] Có trên 10 feature trong Feature Inventory.
- [x] Phân biệt baseline, research value và complexity.
- [x] Có Question Bank data model và ranh giới với Duy/Lâm/Hộp.
- [x] Có 4 feature deep dive với problem, direction, data, metric, risk và scope.
- [x] Có thuật toán baseline đủ cụ thể để implement.
- [x] Có Top 3 recommendation và evaluation plan.
- [x] Có cold-start, confidence, revision và human override.
- [x] Phân biệt offline recommendation quality với learning effectiveness.
- [ ] Nhóm xác nhận Bảo chính thức nhận Personalized Practice.
- [ ] Giảng viên chốt domain, dataset, policy và metric.
- [ ] Bổ sung kết quả thực nghiệm sau khi có prototype.
- [ ] Kiểm chứng lại toàn bộ nguồn/citation trước khi đưa vào luận văn chính thức.

# RESEARCH REPORT

**Member:** Trương Hoàng Lâm
**Research Domain:** Exam Blueprint & Exam Generation
**Date:** 28/09/2026
**Status:** Draft hoàn chỉnh cho giai đoạn research

## Executive Summary

Các hệ thống LMS phổ biến đã hỗ trợ question bank, random question, item bank và test assembly. Tuy nhiên, việc chọn ngẫu nhiên câu hỏi chưa bảo đảm nhiều mã đề có phân bố tương đương về topic, difficulty, Bloom taxonomy, learning outcome và thời gian làm bài.

Report này đề xuất tập trung vào một pipeline có thể đo lường được:

> **Blueprint có cấu trúc → chọn câu theo ràng buộc → sinh nhiều mã đề → kiểm tra độ lệch → giải thích khi blueprint không khả thi.**

Đóng góp nghiên cứu chính được đề xuất là một phương pháp **constraint-based multi-form generation** có thể tạo nhiều mã đề và tối ưu độ lệch theo blueprint. **Equivalence verification** là lớp đánh giá bắt buộc, còn **infeasibility detection & explanation** là phần mở rộng ở mức prototype. Đề xuất không đưa AI sinh câu hỏi, adaptive testing hoặc IRT/equating vào MVP vì các hướng này cần dữ liệu và phạm vi lớn hơn.

## 1. Research Objective

### 1.1. Vấn đề cần giải quyết

Giảng viên thường phải tạo nhiều mã đề từ cùng một ngân hàng câu hỏi. Nếu chọn câu hỏi thủ công hoặc chỉ xáo trộn ngẫu nhiên, các mã đề có thể khác nhau về chủ đề, độ khó, Bloom taxonomy, learning outcome và thời gian làm bài. Điều này làm giảm tính công bằng, tăng công sức biên soạn và khó kiểm tra chất lượng trước khi phát hành.

Hướng nghiên cứu này khảo sát cách xây dựng **blueprint đề thi** và đề xuất một phương pháp tự động chọn câu hỏi để tạo nhiều mã đề thỏa các ràng buộc định trước. Trọng tâm là tính tương đương theo metadata, độ lệch giữa các form và khả năng giải thích khi blueprint không thể thực hiện. Kết quả chỉ được diễn giải là tương đương theo metadata, không phải bằng chứng về fairness psychometric.

### 1.2. Research Questions

- **RQ1:** Các hệ thống hiện có mô hình hóa blueprint, question pool và ràng buộc chọn câu hỏi như thế nào?
- **RQ2:** Có thể tạo nhiều mã đề bằng constraint-based selection mà vẫn giữ phân bố topic, độ khó, Bloom và learning outcome gần nhau ở mức nào?
- **RQ3:** Khi ngân hàng câu hỏi không đủ để thỏa blueprint, hệ thống nên phát hiện, giải thích và đề xuất nới lỏng ràng buộc ra sao?
- **RQ4:** Với phạm vi đồ án sinh viên, metric nào có thể đo bằng dữ liệu tự tạo mà không cần một kho dữ liệu lịch sử lớn?

### 1.3. Phạm vi nghiên cứu

**Trong phạm vi:**

- Blueprint cho bài thi trắc nghiệm.
- Question pool có metadata có cấu trúc.
- Chọn câu hỏi theo hard constraints và soft constraints.
- Sinh 3–5 mã đề trong một lần chạy.
- So sánh mã đề với blueprint và với nhau.
- Phát hiện thiếu dữ liệu hoặc xung đột constraint.
- Đề xuất tối đa 2–3 phương án relaxation.
- Lưu kết quả sinh đề, metric và quyết định của người dùng.
- Quy định rõ phạm vi reuse của mỗi câu trên toàn bộ batch form.

**Ngoài phạm vi:**

- AI sinh nội dung câu hỏi.
- Chấm tự luận hoặc AI-assisted grading.
- Adaptive testing theo năng lực từng sinh viên.
- IRT/equating và chứng minh fairness psychometric ở quy mô lớn.
- Autosave, reconnect, auto-submit và toàn bộ exam delivery workflow.
- Tối ưu thứ tự/format đề như một bài toán độc lập.

### 1.4. Giả định và giới hạn kết luận

- Difficulty, Bloom và learning outcome trong phiên bản đầu là metadata do giảng viên hoặc người nghiên cứu gán.
- Phân bố tương đương theo metadata không đồng nghĩa với tương đương về độ khó thực nghiệm.
- Dữ liệu thử nghiệm ban đầu có thể là dữ liệu synthetic; kết quả cần được ghi rõ là kết quả trên bộ dữ liệu tổng hợp.
- Các ngưỡng pass/warning/fail là ngưỡng vận hành của prototype, không phải tiêu chuẩn đánh giá giáo dục phổ quát.
- Nếu sử dụng solver, kết quả phụ thuộc vào mô hình constraint, dữ liệu đầu vào và giới hạn thời gian chạy.
- Kết luận về feasibility cần dựa trên một feasibility oracle hoặc solver chính xác ở các dataset nhỏ; pre-check heuristic chỉ được xem là bước phát hiện sớm.
- Kết quả so sánh chỉ có ý nghĩa khi random baseline và constraint-based method dùng cùng question pool, cùng hard constraints và nhiều random seed.

## 2. Existing Solutions

### 2.1. Tổng hợp hệ thống và tài liệu tham khảo

| Product / Paper                                                  | Relevant Feature                                              | How It Works                                                                                                                 | Strength                                                             | Limitation / Gap                                                                                                                      | Source                                                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Moodle Question Bank & Quiz                                      | Question bank, category, random questions, quiz configuration | Giảng viên tổ chức câu hỏi theo category rồi chọn câu thủ công hoặc dùng random question trong quiz                          | Phổ biến, dễ triển khai, phù hợp baseline MVP                        | Random selection chưa tự chứng minh sự tương đương giữa các mã đề theo nhiều chiều; khả năng giải thích thiếu câu chưa phải trọng tâm | [Moodle Question bank](https://docs.moodle.org/en/Question_bank), [Moodle Quiz settings](https://docs.moodle.org/en/Quiz_settings) |
| Canvas New Quizzes                                               | Item banks, câu hỏi theo ngân hàng, reuse item                | Item bank lưu trữ câu hỏi để tái sử dụng trong nhiều quiz; giảng viên chọn item theo cấu hình quiz                           | Workflow quản lý câu hỏi và tái sử dụng rõ ràng                      | Không phải một framework nghiên cứu về tối ưu đồng thời topic, độ khó và learning outcome giữa nhiều form                             | [Canvas Admin Guide](https://community.canvaslms.com/html/assets/Canvas_Admin_Guide.pdf)                                           |
| TAO                                                              | Test assembly, item metadata, randomization, test delivery    | Item được quản lý trong content bank; test được assemble từ item/section, có thể randomize và publish thành delivery cố định | Tách rõ item, test, delivery; có versioning ở mức delivery           | Tài liệu tập trung vào nền tảng assessment tổng quát; không trình bày đầy đủ thuật toán tối ưu equivalence cho đồ án nhỏ              | [TAO Test assembly](https://userguide.taotesting.com/knowledge-base/latest/public/tao-full-workflow-overview)                      |
| Automated Test Assembly using SAS Operations Research            | Constraint satisfaction và combinatorial optimization         | Dùng biến nhị phân để chọn item vào nhiều form, sau đó tối ưu hoặc kiểm tra các constraint về số câu, thuộc tính và phân bố  | Mô hình hóa rõ ràng; phù hợp với bài toán tạo nhiều form tương đương | Cần dữ liệu metadata đáng tin cậy và solver; mô hình thực tế có thể khó debug với người dùng phổ thông                                | [Yang & co-authors, 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7174804/)                                                       |
| Automated Test Assembly for Large-Scale Standardized Assessments | MILP, parallel forms, MAXIMIN/MINIMAX, infeasibility handling | Tối ưu nhiều form đồng thời, cân bằng nội dung và độ chính xác đo lường; nghiên cứu cách xử lý model không khả thi           | Cho thấy cần có chiến lược phát hiện và nới lỏng constraint          | Phù hợp assessment quy mô lớn hơn phạm vi MVP; IRT và psychometric data chưa chắc có sẵn cho đồ án                                    | [Galgani et al., 2020](https://www.mdpi.com/2624-8611/2/4/24)                                                                      |
| Diao & van der Linden, 2013                                      | Đồng thời chọn item và định dạng test form                    | Mô hình mixed-integer programming để chọn item, sắp xếp và format form trong cùng bài toán                                   | Gợi ý rằng thứ tự và format cũng có thể được xem là constraint       | Tăng độ phức tạp; chưa cần đưa vào MVP của nhóm                                                                                       | [Integrating Test-Form Formatting](https://journals.sagepub.com/doi/pdf/10.1177/0146621613476157)                                  |

### 2.2. Nhận xét rút ra

1. Question bank, item bank, category và randomization đã là baseline phổ biến.
2. Giá trị nghiên cứu không nằm ở việc “bốc ngẫu nhiên câu hỏi”, mà nằm ở việc tạo nhiều form có phân bố mục tiêu gần nhau và có thể kiểm tra bằng metric.
3. Blueprint nên được biểu diễn thành dữ liệu có cấu trúc, ví dụ:
   - tổng số câu;
   - số câu tối thiểu/tối đa theo topic;
   - phân bố difficulty;
   - phân bố Bloom;
   - coverage của learning outcome;
   - thời gian làm bài;
   - số form cần sinh;
   - giới hạn reuse/exposure của mỗi câu.

4. Hệ thống cần phân biệt hai trạng thái:
   - **Feasible:** tìm được toàn bộ số form yêu cầu, trong đó mỗi form thỏa các hard constraints và các constraint liên-form về reuse cũng được thỏa.
   - **Infeasible:** không thể thỏa tất cả constraints; cần cho biết constraint nào gây xung đột và đề xuất nới lỏng.

5. Việc so sánh random baseline với constraint-based method phải được thực hiện trên cùng tập nghiệm hợp lệ đối với hard constraints. Random thuần túy chỉ nên dùng như tham chiếu phụ, không phải baseline chính.

### 2.3. Phương pháp nghiên cứu

Report sử dụng phương pháp nghiên cứu gồm bốn bước:

1. **Literature and product review:** đọc tài liệu chính thức của các hệ thống assessment và các paper về Automated Test Assembly.
2. **Feature comparison:** lập bảng đối chiếu feature, cách triển khai, giá trị người dùng, research value và giới hạn.
3. **Prototype-oriented modeling:** chuyển bài toán thành blueprint, question metadata, hard constraints, soft constraints và output form.
4. **Controlled experiment:** tạo question bank synthetic, chạy random baseline và constraint-based method trên cùng input, sau đó so sánh metric.

Trong đó, random baseline chính sử dụng random selection có kiểm tra hoặc repair hard constraints; mỗi cấu hình được chạy nhiều lần với các seed khác nhau. Với dataset nhỏ, exhaustive search hoặc solver chính xác được dùng làm feasibility oracle để xác định ground truth feasible/infeasible.

### 2.4. Tiêu chí so sánh giải pháp

Các giải pháp được đối chiếu theo các tiêu chí:

- Khả năng mô hình hóa blueprint.
- Mức độ kiểm soát topic, difficulty, Bloom và learning outcome.
- Khả năng sinh nhiều form.
- Khả năng đo hoặc báo cáo độ lệch.
- Khả năng phát hiện blueprint không khả thi.
- Khả năng giải thích kết quả cho giảng viên.
- Khả năng triển khai trong phạm vi đồ án sinh viên.

## 3. Feature Inventory

| Feature                           | Existing Products / Research                    | User Value | Research Value | Complexity | Scope đề xuất |
| --------------------------------- | ----------------------------------------------- | ---------: | -------------: | ---------: | ------------- |
| Tạo blueprint đề thi              | Moodle, TAO, assessment practice                |        Cao |     Trung bình |       Thấp | MVP           |
| Khai báo số câu theo topic        | Moodle category, TAO metadata                   |        Cao |           Thấp |       Thấp | MVP           |
| Khai báo phân bố độ khó           | TAO metadata, ATA research                      |        Cao |            Cao | Trung bình | MVP           |
| Khai báo Bloom taxonomy           | Metadata-based assessment                       |        Cao |     Trung bình |       Thấp | MVP           |
| Khai báo learning outcome         | TAO/content classification, project requirement |        Cao |     Trung bình | Trung bình | MVP           |
| Chọn câu hỏi có ràng buộc         | ATA/MILP research                               |    Rất cao |            Cao |        Cao | Research      |
| Sinh nhiều mã đề                  | Moodle/TAO randomization, ATA                   |    Rất cao |            Cao | Trung bình | Advanced      |
| Giảm độ lệch giữa các mã đề       | ATA research                                    |        Cao |            Cao |        Cao | Research      |
| Giới hạn số lần reuse câu hỏi     | ATA/security practice                           | Trung bình |     Trung bình | Trung bình | Advanced      |
| Kiểm tra blueprint khả thi        | ATA infeasibility research                      |    Rất cao |            Cao |        Cao | Research      |
| Giải thích constraint bị vi phạm  | Chưa phải baseline rõ trong sản phẩm phổ thông  |        Cao |            Cao |        Cao | Research      |
| Preview mã đề trước khi phát hành | Moodle, Canvas, TAO                             |        Cao |           Thấp |       Thấp | MVP           |
| Khóa câu hỏi trong mã đề          | TAO delivery/versioning                         |        Cao |     Trung bình | Trung bình | MVP           |
| Lưu version blueprint và mã đề    | TAO delivery, versioned assessment              |        Cao |     Trung bình | Trung bình | MVP           |
| Tối ưu thứ tự câu hỏi             | Diao & van der Linden                           | Trung bình |     Trung bình |        Cao | Stretch       |
| Tương đương theo IRT/equating     | ATA/psychometrics research                      |        Cao |        Rất cao |    Rất cao | Stretch       |

### 3.1. Mô hình dữ liệu đề xuất

Mỗi câu hỏi cần có metadata tối thiểu sau:

| Field | Kiểu dữ liệu | Ý nghĩa | Bắt buộc |
|---|---|---|---|
| `question_id` | String/UUID | Định danh câu hỏi | Có |
| `topic_id` | String | Chủ đề chính của câu hỏi | Có |
| `learning_outcome_ids` | Array | Các learning outcome được phủ | Có |
| `difficulty_label` | Enum | Easy/Medium/Hard hoặc mức tương đương | Có |
| `bloom_level` | Enum | Remember/Understand/Apply/Analyze/... | Nên có |
| `estimated_time_seconds` | Integer | Thời gian làm bài ước lượng | Nên có |
| `question_type` | Enum | Multiple choice, true/false,... | Có |
| `status` | Enum | Draft/Review/Approved/Deprecated | Có |
| `version` | Integer | Phiên bản câu hỏi | Có |
| `exposure_count` | Integer | Số lần đã đưa vào form | Nên có |

Blueprint cần lưu tối thiểu:

```json
{
  "title": "Midterm Assessment",
  "form_count": 3,
  "total_items": 30,
  "topic_constraints": {
    "topic-a": {"min": 8, "max": 12},
    "topic-b": {"min": 8, "max": 12},
    "topic-c": {"min": 6, "max": 10}
  },
  "difficulty_distribution": {"easy": 10, "medium": 14, "hard": 6},
  "bloom_distribution": {"remember": 6, "understand": 10, "apply": 10, "analyze": 4},
  "target_time_seconds": 2700,
  "max_question_reuse": 2,
  "reuse_scope": "across_all_forms"
}
```

Trong prototype, cần phân biệt rõ:

- **Hard constraint:** vi phạm thì form không hợp lệ.
- **Soft constraint:** có thể nới lỏng nhưng phải ghi nhận deviation.
- **Target:** giá trị mong muốn để tối ưu, không nhất thiết phải đạt tuyệt đối.

Trong ví dụ trên, `max_question_reuse` được hiểu là số form tối đa mà một câu hỏi được phép xuất hiện trong toàn bộ batch, không phải số lần xuất hiện trong một form. `reuse_scope` phải được lưu cùng blueprint để tránh diễn giải khác nhau. Nếu yêu cầu `max_question_reuse = 1`, question pool cần có đủ số câu đủ điều kiện cho tất cả các form; nếu không, blueprint phải được đánh dấu infeasible hoặc được relaxation có xác nhận của người dùng.

## 4. Feature Deep Dive

### 4.1. Feature A — Constraint-based Exam Generation

**Problem:** Chọn câu hỏi thủ công hoặc random có thể tạo ra các mã đề lệch nhau về nội dung và độ khó.

**Target User:** Giảng viên hoặc người phụ trách tạo đề.

**Existing Solution:** Các LMS thường cung cấp question bank, category và random question. Nghiên cứu Automated Test Assembly mô hình hóa việc chọn item bằng constraint satisfaction hoặc combinatorial optimization.

**Existing Limitation:** Người dùng khó kiểm soát đồng thời nhiều thuộc tính. Khi không đủ câu hỏi, hệ thống có thể chỉ báo “không tạo được đề” mà không nói rõ constraint nào gây lỗi.

**Proposed Direction:**

- Tạo một blueprint dạng JSON/database record.
- Tách **hard constraints** và **soft constraints**.
- Hard constraints: số câu, không trùng câu trong cùng form, topic tối thiểu, learning outcome bắt buộc.
- Soft constraints: độ lệch difficulty, Bloom và thời gian giữa các form.
- Ràng buộc reuse được áp dụng trên toàn bộ batch form, không chỉ từng form riêng lẻ.
- Sinh nhiều form bằng heuristic hoặc MILP solver tùy phạm vi triển khai; kết quả phải được đánh giá trên cùng hard constraints.
- Trả về kết quả cùng các chỉ số lệch để người dùng preview.

**Workflow:**

1. Người dùng chọn question pool.
2. Người dùng nhập blueprint.
3. Hệ thống kiểm tra dữ liệu thiếu hoặc metadata không hợp lệ.
4. Hệ thống tìm tập câu phù hợp cho từng form.
5. Hệ thống tính coverage và deviation.
6. Người dùng xem preview, khóa/thay câu nếu cần.
7. Hệ thống publish các form và lưu snapshot của blueprint.

Khi so sánh thuật toán, random baseline cần được giới hạn trong cùng tập nghiệm thỏa hard constraints hoặc được repair trước khi tính metric. Nếu không thể tạo đủ form hợp lệ, hệ thống phải phân biệt rõ lỗi do thiếu dữ liệu, do conflict constraint hay do timeout.

**Required Data:**

- `question_id`
- `topic_id`
- `learning_outcome_ids`
- `difficulty_label` hoặc `difficulty_score`
- `bloom_level`
- `estimated_time_seconds`
- `question_type`
- `status` và `version`
- `exposure_count` hoặc lịch sử đã dùng

**Output:** Một hoặc nhiều exam form, kèm danh sách câu, coverage report, deviation report và cảnh báo.

**AI Required:** No AI cho MVP; có thể dùng heuristic/optimization.

**Technical Complexity:** High.

**Research Value:** High.

**User Value:** High.

**MVP Feasibility:** Có thể làm ở mức prototype nếu giới hạn số thuộc tính, số form và dùng heuristic; solver chính xác chỉ dùng làm oracle hoặc cho dataset nhỏ.

**Evaluation Metrics:**

- Tỷ lệ form thỏa hard constraints.
- Topic Distribution Difference.
- Difficulty Distribution Difference.
- Bloom Distribution Difference.
- Learning Outcome Coverage.
- Estimated Time Difference.
- Question Reuse Rate.
- Thời gian chạy của thuật toán.

**Risks:** Metadata sai sẽ làm kết quả tối ưu không có ý nghĩa; solver có thể chạy lâu; nhiều constraint cùng lúc có thể làm bài toán infeasible.

**References:** [1], [4], [5].

### 4.2. Feature B — Equivalence Verification giữa các mã đề

**Problem:** Hai mã đề có cùng số câu nhưng chưa chắc tương đương về chủ đề, độ khó hoặc thời gian làm bài.

**Target User:** Giảng viên, reviewer và người phụ trách đảm bảo chất lượng đề.

**Existing Solution:** Một số hệ thống cung cấp metadata và preview. Nghiên cứu ATA đánh giá parallel forms dựa trên test specifications và các đặc tính đo lường.

**Existing Limitation:** Các LMS phổ thông thường không trình bày một báo cáo đơn giản, dễ hiểu cho giảng viên về độ lệch giữa các form.

**Proposed Direction:** Xây dựng dashboard kiểm tra tương đương theo metadata trước khi publish. Kết quả không kết luận rằng hai đề “công bằng tuyệt đối”; nó chỉ xác nhận mức tương đương theo các thuộc tính mà nhóm đã định nghĩa.

**Workflow:**

1. Nhận danh sách câu của các form.
2. Gom nhóm theo topic, difficulty, Bloom và learning outcome.
3. So sánh mỗi form với blueprint và với form tham chiếu.
4. Tính deviation theo từng thuộc tính.
5. Hiển thị pass/warning/fail theo ngưỡng.
6. Cho phép xuất báo cáo để lưu audit.

**Required Data:** Metadata câu hỏi, blueprint, form đã sinh và ngưỡng đánh giá.

**Output:** Bảng so sánh form, biểu đồ phân bố, các cảnh báo và một kết luận giới hạn: “đạt tương đương theo metadata” hoặc “cần review”.

**AI Required:** No AI.

**Technical Complexity:** Medium.

**Research Value:** Medium–High.

**User Value:** High.

**MVP Feasibility:** MVP/Advanced.

**Evaluation Metrics:**

- Sai số giữa phân bố thực tế và blueprint.
- Sai số phân bố giữa từng cặp form và độ lệch lớn nhất của một form.
- Số form pass toàn bộ ngưỡng.
- Số cảnh báo được phát hiện đúng trên bộ test tổng hợp có ground truth.
- Thời gian reviewer cần để phát hiện chênh lệch so với kiểm tra thủ công.

**Risks:** Nếu chỉ dùng label difficulty do giáo viên gán, kết quả chỉ phản ánh metadata chứ chưa phản ánh độ khó thực nghiệm.

**References:** [4], [5], [6].

### 4.3. Feature C — Infeasibility Detection & Explanation

**Problem:** Blueprint có thể yêu cầu nhiều câu theo một topic/difficulty/Bloom nhưng question bank không đủ. Việc chỉ trả về lỗi chung khiến người dùng không biết cần bổ sung câu hay nới lỏng điều kiện nào.

**Target User:** Giảng viên và admin quản lý question bank.

**Existing Solution:** Bài toán ATA thường được mô hình hóa bằng constraint programming hoặc mathematical programming; một số nghiên cứu bàn về chiến lược xác định constraint gây infeasible.

**Existing Limitation:** Công cụ nghiên cứu thường yêu cầu người dùng hiểu mô hình tối ưu; sản phẩm giáo dục cần giải thích bằng ngôn ngữ nghiệp vụ.

**Proposed Direction:** Trước khi chạy sinh đề, hệ thống thực hiện pre-check đơn giản và tạo conflict report:

- thiếu bao nhiêu câu theo topic;
- thiếu difficulty/Bloom nào;
- learning outcome nào chưa được phủ;
- constraint nào có thể nới lỏng và mức ưu tiên của từng loại relaxation;
- nếu nới lỏng thì deviation dự kiến là bao nhiêu.

Nếu có thể, conflict report nên chỉ ra một tập constraint xung đột tối thiểu hoặc ít nhất là nguyên nhân gần nhất có thể hành động được. Không nên đề xuất tự động nới lỏng hard constraint nếu chưa có xác nhận của người dùng.

**Workflow:**

1. Đếm khả năng đáp ứng của question pool.
2. Xác định các constraint thiếu nguồn.
3. Phân loại lỗi: thiếu dữ liệu, thiếu câu hoặc xung đột constraint.
4. Đề xuất một hoặc nhiều phương án nới lỏng.
5. Yêu cầu người dùng xác nhận trước khi sinh đề theo phương án mới.

Các phương án relaxation cần được xếp hạng theo chi phí nghiệp vụ và deviation dự kiến, ví dụ ưu tiên nới soft constraint về thời gian hoặc khoảng difficulty trước khi giảm coverage learning outcome bắt buộc.

**Required Data:** Blueprint, metadata question bank, quan hệ topic–learning outcome và ngưỡng soft constraint.

**Output:** Conflict report, suggested relaxation, expected deviation và log quyết định của người dùng.

**AI Required:** No AI cho MVP; AI chỉ là hướng phụ để diễn giải lỗi bằng ngôn ngữ tự nhiên.

**Technical Complexity:** High.

**Research Value:** High.

**User Value:** High.

**MVP Feasibility:** Có thể làm ở mức prototype với pre-check và một số loại conflict phổ biến; việc chứng minh đầy đủ nguyên nhân xung đột nên giới hạn ở dataset nhỏ có feasibility oracle.

**Evaluation Metrics:**

- Infeasibility detection precision/recall trên các blueprint tổng hợp.
- Tỷ lệ xác định đúng constraint gây lỗi.
- Tỷ lệ đề xuất relaxation tạo được form hợp lệ.
- Mức giảm deviation sau relaxation.
- Thời gian xử lý pre-check.

**Risks:** Nhiều nguyên nhân có thể cùng gây lỗi; một relaxation có thể tạo đề dễ hoặc lệch hơn dự kiến; cần lưu rõ người dùng đã chấp nhận thay đổi nào.

**References:** [4], [5].

## 4.4. Luồng thuật toán đề xuất

### Input

- Question bank đã được phê duyệt.
- Blueprint.
- Số lượng form cần sinh.
- Danh sách hard constraints.
- Danh sách soft constraints và trọng số.

### Processing

1. Validate schema và metadata của question bank.
2. Lọc các câu hỏi không đủ điều kiện, ví dụ Draft hoặc Deprecated.
3. Kiểm tra nhanh khả năng đáp ứng từng hard constraint.
4. Nếu không khả thi, tạo conflict report và dừng trước bước sinh đề.
5. Nếu khả thi, chạy random baseline có kiểm soát và constraint-based method trên cùng input.
6. Tính coverage, deviation, pairwise form difference, reuse rate và runtime.
7. Với dataset nhỏ, đối chiếu trạng thái feasible/infeasible với feasibility oracle.
8. Xếp hạng các solution theo tổng weighted deviation, đồng thời báo cáo độ lệch lớn nhất của từng form.
9. Trả về form tốt nhất cùng explanation và audit log.

### Pseudocode mức khái niệm

```text
validate(question_bank, blueprint)
eligible_items = filter_approved_items(question_bank)

conflicts = precheck_constraints(eligible_items, blueprint)
if conflicts is not empty:
    return conflict_report(conflicts)

random_forms = generate_random_feasible_forms(eligible_items, blueprint)
optimized_forms = generate_constraint_based_forms(eligible_items, blueprint)

random_metrics = evaluate_forms(random_forms, blueprint)
optimized_metrics = evaluate_forms(optimized_forms, blueprint)

return compare(random_metrics, optimized_metrics)
```

Đây là mô hình nghiên cứu/đánh giá, chưa phải quyết định cuối về thư viện hoặc solver. Nhóm có thể bắt đầu bằng heuristic dễ giải thích; chỉ dùng MILP/OR-Tools nếu heuristic không đạt yêu cầu hoặc cần một feasibility oracle/đối chứng chính xác cho dataset nhỏ. Random baseline không nên được đánh giá bằng random thuần túy nếu nó vi phạm hard constraints ngay từ đầu.

## 4.5. Kế hoạch thực nghiệm

### Bộ dữ liệu

Tạo tối thiểu ba mức dữ liệu để kiểm tra:

| Dataset | Số câu | Số topic | Số form | Mục đích |
|---|---:|---:|---:|---|
| Small | 60 | 3 | 3 | Kiểm tra logic và debug |
| Medium | 150 | 5 | 3–5 | Đánh giá chính |
| Stress | 500 | 6 | 5 | Kiểm tra runtime và khả năng mở rộng |

Mỗi dataset nên có cả phiên bản feasible và infeasible. Ví dụ infeasible yêu cầu 20 câu Topic A trong khi question bank chỉ có 12 câu đủ điều kiện.

Số câu trong bảng là kích thước question pool, không phải số câu của một form. Khi cấu hình blueprint, cần kiểm tra công suất sử dụng tối đa: nếu có `F` form, mỗi form có `N` câu và mỗi câu được dùng tối đa `R` form, question pool phải có ít nhất `ceil(F × N / R)` câu đủ điều kiện, chưa tính các ràng buộc topic, difficulty, Bloom và learning outcome. Dataset Small cần dùng blueprint nhỏ hơn nếu muốn kiểm tra trường hợp `max_question_reuse = 1`.

### Experimental factors

- Phương pháp: random selection vs constraint-based selection.
- Baseline random chính: random selection có rejection sampling hoặc repair để thỏa hard constraints; random thuần túy chỉ là tham chiếu phụ.
- Số form: 3 và 5.
- Mật độ constraint: thấp, trung bình và cao.
- Question pool: đầy đủ metadata vs thiếu một phần metadata.
- Solver/runtime limit: ghi nhận thời gian chạy và trạng thái timeout nếu có.
- Feasibility oracle: exhaustive search hoặc solver chính xác trên dataset Small để tạo ground truth.

### Cách báo cáo kết quả

Mỗi lần chạy cần lưu:

- Dataset ID.
- Blueprint ID/version.
- Algorithm/version.
- Seed random.
- Số form sinh được.
- Trạng thái feasible/infeasible/timeout.
- Tất cả metric.
- Danh sách warning và relaxation.

Không nên chỉ báo cáo một kết quả tốt nhất. Nên chạy mỗi cấu hình nhiều lần với seed khác nhau và báo cáo trung bình, độ lệch chuẩn hoặc khoảng giá trị nếu thời gian cho phép.

### 4.6. Định nghĩa metric

Với một thuộc tính phân loại `A` và form `f`, gọi `p_actual(f, v)` và `p_target(v)` lần lượt là tỷ lệ của giá trị `v` trong form và tỷ lệ mục tiêu trong blueprint.

- **Distribution Difference:**

  `0.5 × sum(abs(p_actual(f, v) - p_target(v)))` với mọi giá trị `v` của thuộc tính `A`. Metric này nằm trong khoảng 0–1 và phù hợp để so sánh phân bố.

- **Mean Distribution Difference:** trung bình Distribution Difference trên tất cả thuộc tính và form.
- **Pairwise Form Difference:** Distribution Difference trung bình giữa từng cặp form, dùng để đo trực tiếp mức tương đương giữa các form.
- **Maximum Form Deviation:** giá trị Distribution Difference hoặc Estimated Time Difference lớn nhất của một form; metric này tránh che khuất một form lệch nghiêm trọng bởi giá trị trung bình.
- **Hard Constraint Satisfaction Rate:** số form thỏa toàn bộ hard constraints chia cho tổng số form cần sinh.
- **Learning Outcome Coverage:** số learning outcome bắt buộc xuất hiện ít nhất một lần trong từng form chia cho tổng số learning outcome bắt buộc; cần báo cáo riêng từng form và trung bình toàn batch.
- **Question Reuse Rate:** số lần xuất hiện vượt mức reuse cho phép chia cho tổng số lần xuất hiện của câu trong tất cả form; cần ghi rõ reuse được tính trên toàn bộ batch.
- **Estimated Time Difference:** trị tuyệt đối giữa tổng thời gian ước lượng của form và target time, chia cho target time.
- **Feasibility Detection Precision/Recall:** so sánh trạng thái do pre-check hoặc thuật toán trả về với ground truth từ feasibility oracle trên dataset có kiểm soát.
- **Runtime:** nên tách thời gian pre-check, thời gian sinh form và thời gian tạo report; ghi nhận riêng trường hợp solution, infeasible và timeout.

Các metric cần được tính riêng cho từng form và từng cặp form trước khi tính trung bình. Nếu chỉ báo cáo trung bình, một form bị lệch nghiêm trọng có thể bị che khuất bởi các form còn lại. Với metric pass/warning/fail, ngưỡng phải được chốt trước khi chạy thử nghiệm và áp dụng giống nhau cho cả hai phương pháp.

## 5. Gap Analysis

| Existing Capability             | Market Baseline?                         | Limitation / Gap                                                                  | Opportunity cho đồ án                                   |
| ------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Question bank và category       | Có                                       | Chỉ quản lý câu hỏi, chưa giải quyết sâu bài toán tương đương nhiều form          | Dùng làm nền tảng dữ liệu                               |
| Random question selection       | Có                                       | Random không bảo đảm phân bố theo nhiều thuộc tính                                | So sánh random baseline với constraint-based method     |
| Blueprint cơ bản                | Có ở các hệ thống assessment             | Chưa luôn có kiểm tra khả thi và conflict explanation dễ hiểu                     | Xây dựng blueprint có hard/soft constraints             |
| Sinh nhiều mã đề                | Có                                       | Chưa có báo cáo deviation trực quan cho người dùng phổ thông                      | Equivalence verification                                |
| Metadata difficulty/Bloom/topic | Có thể có                                | Chất lượng phụ thuộc việc gán nhãn; label không đồng nghĩa difficulty thực nghiệm | Ghi rõ nguồn label và giới hạn kết luận                 |
| Tối ưu theo MILP/constraint     | Có trong research/assessment chuyên dụng | Phức tạp, khó giải thích, cần solver                                              | Nghiên cứu mô hình rút gọn phù hợp đồ án                |
| Infeasibility explanation       | Chưa phải baseline UX phổ biến           | Thông báo lỗi thường chung chung                                                  | Conflict report và relaxation suggestion                |
| IRT/equating                    | Có trong research/large-scale assessment | Cần dữ liệu làm bài đủ lớn, vượt phạm vi MVP                                      | Để Stretch/future work                                  |
| Random hóa thứ tự câu và đáp án | Có                                       | Không chứng minh tương đương nội dung                                             | Giữ ở baseline bảo mật, không coi là contribution chính |

### Research gap chính

Khoảng trống phù hợp với đồ án không phải là phát minh một LMS mới. Hướng có giá trị hơn là xây dựng một pipeline nhỏ nhưng đo được:

> **Blueprint có cấu trúc → sinh nhiều form có ràng buộc → kiểm tra deviation → giải thích khi blueprint không khả thi.**

Pipeline này có thể so sánh với random baseline trên dữ liệu tổng hợp và tạo ra một research contribution vừa sức hơn so với việc tuyên bố “đề thi công bằng” theo nghĩa psychometric đầy đủ.

## 6. Top 3 Recommendations

### Recommendation 1 — Constraint-based multi-form generation

**Feature:** Tự động sinh nhiều mã đề từ question bank theo blueprint.

**Reason:** Đây là phần cốt lõi của miền research, có bài toán rõ, có thể xây dựng dữ liệu tổng hợp và có metric định lượng.

**Research Contribution:** Đề xuất và đánh giá một phương pháp constraint-based selection cho nhiều form, sau đó so sánh với random baseline công bằng trong việc giảm độ lệch topic, difficulty, Bloom và thời gian giữa các form.

**Evaluation Metric:**

- Hard Constraint Satisfaction Rate.
- Topic Distribution Difference.
- Difficulty Distribution Difference.
- Bloom Distribution Difference.
- Learning Outcome Coverage.
- Estimated Time Difference.
- Runtime.

**Suggested Scope:**

- 3–5 form trong một lần sinh.
- 100–500 câu hỏi tổng hợp.
- 4–6 topic, 3 mức difficulty, 3–4 mức Bloom.
- Heuristic làm phương pháp chính; MILP/OR-Tools chỉ dùng làm đối chứng chính xác trên dataset nhỏ hoặc khi heuristic không đạt yêu cầu.
- Không đưa IRT vào MVP.

### Recommendation 2 — Equivalence verification dashboard

**Feature:** Báo cáo độ lệch giữa blueprint và các mã đề đã sinh.

**Reason:** Kết quả sinh đề cần được kiểm chứng, nếu không người dùng chỉ nhìn thấy danh sách câu hỏi mà không biết các form có cân bằng hay không.

**Research Contribution:** Chuẩn hóa lớp đánh giá metadata-based equivalence bằng bộ metric, ngưỡng và báo cáo pairwise giữa các form; không diễn giải kết quả này thành bằng chứng về psychometric fairness.

**Evaluation Metric:**

- Tỷ lệ phát hiện đúng các form bị lệch trên test cases có ground truth.
- Số cảnh báo đúng/sai.
- Thời gian review với và không có dashboard.

**Suggested Scope:**

- Biểu đồ phân bố theo topic/difficulty/Bloom.
- Bảng so sánh từng form với blueprint.
- Pass/warning/fail theo threshold.
- Xuất JSON hoặc Markdown report.

### Recommendation 3 — Infeasibility detection and explanation

**Feature:** Phát hiện blueprint không khả thi và giải thích nguyên nhân.

**Reason:** Đây là điểm khác biệt có giá trị sử dụng cao, đồng thời gắn với vấn đề nghiên cứu về constraint handling.

**Research Contribution:** Xây dựng cách ánh xạ lỗi tối ưu thành các nguyên nhân nghiệp vụ có thể hành động: bổ sung câu, giảm số câu, đổi khoảng difficulty hoặc bỏ một constraint mềm. Với dataset nhỏ, kết quả được đối chiếu với feasibility oracle để đánh giá độ chính xác.

**Evaluation Metric:**

- Precision/recall của việc phát hiện blueprint không khả thi.
- Tỷ lệ xác định đúng constraint gây lỗi.
- Tỷ lệ phương án relaxation tạo ra được form hợp lệ.
- Deviation trước/sau relaxation.

**Suggested Scope:**

- Pre-check dựa trên đếm dữ liệu và kiểm tra một số conflict phổ biến.
- Conflict report theo topic/difficulty/Bloom.
- Tối đa 2–3 phương án relaxation, được xếp hạng theo chi phí nghiệp vụ và deviation dự kiến.
- Có bước người dùng xác nhận trước khi áp dụng.

### 6.4. Ma trận ưu tiên cuối

| Hướng | Giá trị người dùng | Giá trị nghiên cứu | Khả thi trong đồ án | Quyết định |
|---|---:|---:|---:|---|
| Blueprint cơ bản | Cao | Thấp–Trung bình | Cao | Bắt buộc trong MVP |
| Constraint-based generation | Rất cao | Cao | Trung bình–Cao | Hướng research chính |
| Equivalence verification | Cao | Cao | Cao | Làm cùng generation |
| Infeasibility explanation | Cao | Cao | Trung bình | Làm prototype có giới hạn |
| Randomization câu/đáp án | Trung bình | Thấp | Cao | Baseline/bảo mật |
| IRT/equating | Cao | Rất cao | Thấp | Stretch/future work |
| AI question generation | Cao | Cao | Thấp trong miền này | Chuyển sang miền của Duy |
| Tối ưu format/ordering nâng cao | Trung bình | Trung bình–Cao | Thấp | Để Stretch |

### 6.5. Kết luận lựa chọn hướng

Lâm đề xuất nhóm chọn **constraint-based multi-form generation** làm research contribution chính, dùng **equivalence verification** làm lớp đánh giá bắt buộc và triển khai **infeasibility detection** ở mức prototype. Blueprint, metadata, preview và versioning là nền tảng sản phẩm; không nên coi chúng là đóng góp nghiên cứu chính.

## 7. Open Questions

- Nhãn difficulty sẽ do giảng viên nhập thủ công, do AI dự đoán hay lấy từ kết quả làm bài?
- Trong MVP, nhóm có coi các mức difficulty là ordinal label hay dùng numerical score?
- Blueprint có bắt buộc learning outcome cho từng câu hay chỉ cần coverage theo tổng đề?
- Có cần cấm hai câu cùng một nhóm nội dung hoặc cùng một “enemy item” xuất hiện trong một form không?
- Số form tối đa cần sinh trong demo là bao nhiêu?
- Có cần dùng solver như OR-Tools/MILP hay heuristic là đủ cho phạm vi đồ án?
- Ngưỡng deviation nào được xem là pass/warning/fail?
- Khi không thể thỏa blueprint, ai có quyền phê duyệt relaxation?
- Có cần lưu audit trail cho việc khóa/thay câu và thay đổi blueprint không?
- Dữ liệu đánh giá sẽ hoàn toàn synthetic hay có thể xin một bộ dữ liệu anonymized từ giảng viên?

## 8. Conclusion

### Thị trường hiện tại đang làm gì

Các LMS và assessment platform phổ biến đã cung cấp question bank/item bank, metadata, randomization, test assembly, preview và delivery/versioning. Đây là baseline cần tham khảo nhưng không nên xem toàn bộ các feature này là research contribution.

### Baseline cần có

- Question pool có metadata.
- Blueprint cơ bản.
- Chọn câu theo topic và số lượng.
- Random hóa thứ tự câu/đáp án.
- Preview và khóa mã đề.
- Lưu version của blueprint và form.

### Research gap phù hợp

Đồ án nên tập trung vào việc sinh nhiều form có ràng buộc, đo độ lệch giữa các form và giải thích khi blueprint không khả thi. Đây là hướng có thể thử nghiệm trên dữ liệu tổng hợp và không phụ thuộc hoàn toàn vào dữ liệu lịch sử của một trường học.

### Đề xuất scope cuối

- **MVP:** Blueprint, metadata, question pool, preview, lưu version.
- **Advanced:** Sinh nhiều form theo constraint và equivalence dashboard.
- **Research:** So sánh thuật toán với random baseline, infeasibility explanation và relaxation.
- **Stretch:** IRT/equating, tối ưu thứ tự/format đồng thời, adaptive testing.
- **Should Not Build trong đợt này:** AI sinh câu hỏi và tổ chức thi online đầy đủ.

### Các bước tiếp theo sau report

1. Thống nhất với Bảo schema metadata của question bank: topic, difficulty, Bloom, learning outcome và estimated time.
2. Tạo dataset synthetic Small và Medium, gồm cả trường hợp feasible và infeasible.
3. Chốt định nghĩa hard constraint, soft constraint và threshold cho từng metric.
4. Implement random baseline trước để có mốc so sánh.
5. Implement constraint-based method ở mức prototype.
6. Chạy evaluation theo kế hoạch ở mục 4.5 và lưu kết quả có seed/version.
7. Bàn giao cho Hộp `exam_form_id`, `exam_version`, danh sách câu hỏi và mapping đáp án để phục vụ OMR/item analysis.
8. Gửi cho Nam competitor matrix, feature inventory, Top 3 recommendations, scope và evaluation plan.

### Tiêu chí hoàn thành report của Lâm

- Có tối thiểu 5 nguồn, trong đó có 1–2 paper học thuật.
- Có tối thiểu 10 feature trong Feature Inventory.
- Có 3 feature deep dive với problem, limitation, proposed direction, data, metric, risk và scope.
- Có baseline random để so sánh.
- Có định nghĩa dữ liệu, metric và experimental protocol.
- Có phân biệt rõ metadata equivalence với psychometric fairness.
- Có kết luận scope cho MVP, Advanced, Research và Stretch.
- Có danh sách open questions cần nhóm hoặc giảng viên chốt.

## 9. References

> Ngày truy cập các nguồn dưới đây: 28/09/2026.

1. Moodle. _Question bank_. https://docs.moodle.org/en/Question_bank
2. Moodle. _Quiz settings_. https://docs.moodle.org/en/Quiz_settings
3. Instructure. _Canvas Admin Guide_. https://community.canvaslms.com/html/assets/Canvas_Admin_Guide.pdf
4. TAO Testing. _TAO: Full workflow overview_. https://userguide.taotesting.com/knowledge-base/latest/public/tao-full-workflow-overview
5. Yang, H. et al. (2020). _Automated Test Assembly Using SAS Operations Research Software in a Medical Licensing Examination_. https://pmc.ncbi.nlm.nih.gov/articles/PMC7174804/
6. Galgani, B. et al. (2020). _Automated Test Assembly for Large-Scale Standardized Assessments: Practical Issues and Possible Solutions_. https://www.mdpi.com/2624-8611/2/4/24
7. Diao, Q. & van der Linden, W. J. (2013). _Integrating Test-Form Formatting Into Automated Test Assembly_. https://doi.org/10.1177/0146621613476157
8. Breithaupt, K. & Hare, D. (2014). _Automated Test Assembly_. https://www.taylorfrancis.com/chapters/oa-edit/10.4324/9781315871493-7/automated-test-assembly-krista-breithaupt-donovan-hare

---

## Checklist tự kiểm trước khi nộp report

- [x] Có ít nhất 5 nguồn và ghi rõ URL.
- [x] Có ít nhất 10 feature trong Feature Inventory.
- [x] Phân biệt baseline, research value và complexity.
- [x] Có 3 recommendation kèm metric và scope.
- [x] Có open questions cần hỏi nhóm/giảng viên.
- [x] Không coi metric dựa trên metadata là bằng chứng về fairness psychometric đầy đủ.
- [ ] Bổ sung kết quả thực nghiệm sau khi có question bank và dữ liệu test.
- [ ] Xác nhận lại phạm vi với nhóm và giảng viên.

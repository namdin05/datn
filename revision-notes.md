# Cập nhật phạm vi proposal 1.1 — 02/10/2026

Quyết định của chủ đồ án: giảng viên là đối tượng sử dụng chính, sinh viên là đối tượng thụ hưởng. Phạm vi hiện tại được trình bày trong [proposal tổng hợp](proposal/index.html#target-users).

- Tập trung giao diện và quy trình vào giảng viên: tạo đề, nhập bài, kiểm tra OMR, xác nhận và xuất kết quả, phân tích và lựa chọn hoạt động hỗ trợ.
- Giữ nghiên cứu cá nhân hóa ở mức đề xuất bộ luyện tập để giảng viên duyệt và xuất; hồ sơ sinh viên là dữ liệu theo lớp, không yêu cầu tài khoản sinh viên.
- Thay phòng thi trực tuyến trong MVP bằng xuất đề và nhập câu trả lời từng câu theo mẫu CSV. OMR tiếp tục là hướng ưu tiên.
- Đưa cổng sinh viên, tự luyện, bảng tiến độ cá nhân, thông báo, phòng thi trực tuyến và cổng phúc khảo ra ngoài phạm vi nghiệm thu hiện tại.
- Đánh giá trải nghiệm và hiệu quả công việc tập trung vào giảng viên. Nghiên cứu tiến bộ học tập của sinh viên là phần bổ sung khi có thí điểm phù hợp.
- Báo cáo thành viên và đặc tả ban đầu được giữ nguyên làm nguồn đối chiếu; không coi điều chỉnh mới là kết luận có sẵn trong các báo cáo đó.

# Ghi chú cập nhật v0.2 — 22/09/2026

Nguồn: đặc tả gốc (proposal-spec.md), yêu cầu bổ sung của chủ đồ án và thảo luận trong nhóm. Đây là thiết kế đề xuất, chưa phải tính năng đã triển khai.

## Yêu cầu mới đã ghi nhận
- Giáo viên định dạng phần tô đáp án, xuất phiếu và chấm bài giấy bằng camera điện thoại.
- Giáo viên gán độ khó; hệ thống phân phối bộ bài theo quá trình học tập của sinh viên.
- Bảo mật theo nghiệp vụ để tạo môi trường đánh giá minh bạch.

## Đề xuất thiết kế
- Mẫu phiếu có ràng buộc; QR tham chiếu mã đề / mẫu, không chứa đáp án. Giữ ảnh nguồn và quy trình review ô chưa rõ.
- Bài giấy và online cùng sử dụng phiên bản câu hỏi, mã đề và quy trình kết quả. Chỉ dữ liệu đã xác nhận đi vào analytics.
- Phân phối bài theo năng lực từng chủ đề, ưu tiên luyện tập giữa các lần làm bài. Thi chung vẫn dùng đề tương đương.
- Giải thích phân phối, đánh giá lại tiến bộ, phát hiện hiểu sai có giảng viên xác nhận, đối chiếu độ khó thực nghiệm và kiểm tra blueprint thiếu câu.
- Quyền theo lớp / hành động; phê duyệt và khóa phiên bản; biên nhận; lịch sử sửa điểm; giải trình, phúc khảo và chính sách lưu giữ dữ liệu.
- Phân biệt FR với NFR, đưa ra tình huống kiểm chứng thay vì tuyên bố bảo mật tuyệt đối.

## Thay đổi phạm vi đề xuất
20 module (18 module gốc và 2 module phiếu / OMR). Phân phối bộ luyện tập chuyển từ mở rộng sang nâng cao theo yêu cầu mới. Ưu tiên nghiên cứu cá nhân hóa có giải thích; OMR cần đánh giá chất lượng. RAG, đề tương đương và Question Health vẫn giữ, cần chọn độ sâu theo nguồn lực. Chưa chốt thuật toán, ngưỡng chất lượng, quy tắc hai người duyệt hoặc thời hạn lưu trữ.

## Tham khảo
- https://www.zipgrade.com/forms/
- https://www.rasch.org/mra/mra-11-09.htm
- https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html

Đặc tả gốc được giữ nguyên để đối chiếu. Các bổ sung không được gán số mục giả trong tài liệu gốc.

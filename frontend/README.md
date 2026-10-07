# QForge frontend demo

Giao diện dựa trên 7 frame trong Figma `demoB`: Welcome/PIN, đăng nhập/đăng ký, Teacher dashboard, quiz editor, Teacher live, Student lobby và Student question. Có thêm kết quả và báo cáo để hoàn tất flow.

Chạy từ root repo bằng `npm run dev:fe` (PowerShell dùng `npm.cmd run dev:fe` nếu execution policy chặn npm.ps1). Mở http://127.0.0.1:5173.

1. Đăng nhập với email và mật khẩu demo bất kỳ từ 6 ký tự. Không nhập thông tin thật; không có xác thực Supabase ở giai đoạn này.
2. Tạo/chỉnh sửa câu hỏi; xuất bản sau khi đủ nội dung, 4 lựa chọn và một đáp án đúng.
3. Bắt đầu phiên để nhận PIN. Mở cổng sinh viên trong tab khác cùng browser profile và nhập PIN + tên.
4. Teacher bắt đầu, chuyển câu; Student gửi đáp án một lần. Kết thúc để xem result/report (đúng 100, sai 0; chưa trả lời riêng).
5. Refresh giữ state. Đề đang có phiên mở bị khóa sửa/xóa. Phiên giữ bản chụp đề tại lúc tạo.

`src/lib/demo.ts` là gateway dữ liệu demo localStorage; state đồng bộ giữa tab bằng storage events. Teacher/participant identity lưu sessionStorage. Đây không phải xác thực, bảo vệ đáp án hay realtime qua mạng. Dữ liệu/đáp án demo có thể đọc trong browser. Các thiết bị khác không chia sẻ phiên; chưa có API nghiệp vụ hoặc Socket.IO.

Khi tích hợp BE, thay demo gateway bằng REST/session gateway với actor và DTO theo contract, để server validate/quản lý state/chấm điểm. Giữ `/setup` để kiểm tra `/health` hiện có. Auth thật, socket/reconnect mạng và quyền dữ liệu cần triển khai ở bước tích hợp.

Kiểm tra từ root: `npm run check`.

Đã kiểm tra local: lint/typecheck/build; tạo đề và chặn publish khi thiếu câu/đáp án; publish và host; Student join ở tab thứ hai; start và đồng bộ câu hỏi; submit cập nhật progress; refresh giữ câu trả lời đã gửi; finish hiển thị 100 điểm/100% cho một câu đúng; Welcome ở viewport 390px. Kiểm tra này áp dụng cho gateway demo, chưa phải kiểm thử REST/socket.

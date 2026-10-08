# QForge — Checkpoint triển khai

Ngày cập nhật: 07/10/2026. Branch: `setup/foundation`.

## Bước 1: baseline và workspace chạy được

| Task | Trạng thái | Phần đã hoàn thành / còn lại |
|---|---|---|
| S01 | Draft | Phân công và baseline ghi ở mvp-decisions.md; auth/rule mismatch còn chờ xác nhận |
| S02 | Hoàn thành trên máy Hộp | FE/BE/shared workspaces, scripts, lockfile, versions, gitignore và conventions; chưa xác minh trên máy Bảo |
| S03 | Khởi động | Express app/HTTP bootstrap, env validation, CORS, health, JSON errors/size limit; validation cho API nghiệp vụ sẽ thêm tiếp |
| S04 | Hoàn thành trên máy Bảo | Pool pg kết nối Supabase; `/ready`; migration tracking và baseline đối chiếu schema; seed chạy lại an toàn, thêm đề 5 câu chuẩn 4/1; repository skeleton. Xem [hướng dẫn S04](database-setup.md) |
| S05 | Đã triển khai nền FE | React/Vite/TS/Tailwind/Router; UI primitives theo cấu trúc shadcn/Radix; layouts Teacher/Student, loading/error/empty và error boundary. Luồng chính đọc DB qua API; Student gameplay vẫn chỉ ở code demo tham khảo. Chưa nghiệm thu trực quan responsive sau lần nối DB; auth/API ghi còn lại |
| S06 | Khởi động | Shared health envelope và FE gọi HTTP thật; DTO/gateway nghiệp vụ còn lại |
| S07 | Chưa bắt đầu | Auth Teacher chưa được chọn; chưa triển khai identity |
| S08 | Một phần | README và CI config có sẵn; GitHub CI và onboarding trên máy Bảo chưa chạy |

## Đã kiểm tra local

- Cài dependencies từ lockfile bằng `npm ci` thành công.
- `npm run check`: ESLint, TypeScript và shared/BE/FE build pass.
- `npm run dev`: shared watcher + BE + FE chạy; thay đổi output shared được BE watcher nhận.
- Trên browser, `/setup` gọi `/health` và xác thực response bằng shared Zod schema thành công.
- Khi chỉ chạy FE, `/setup` hiển thị lỗi kết nối API và cho phép thử lại; khi chạy lại BE, kết nối phục hồi.
- HTTP smoke: origin FE được cấp CORS header, origin ngoài danh sách không được cấp; 404 envelope; JSON sai trả 400; payload vượt giới hạn trả 413.
- Deep link `/setup`, `/teacher/quizzes`, `/join` được FE dev server phục vụ.
- PORT không hợp lệ làm BE từ chối startup với thông báo config, không khởi chạy server.
- `.env`, node_modules và dist được Git ignore; không có credential thật trong scaffold.

Các smoke checks là kiểm tra của checkpoint scaffold, chưa phải bộ test nghiệp vụ/E2E demo. `/health` chỉ xác nhận HTTP server sống.

## Bước tiếp theo

1. Hoàn thiện S03: error/validation helpers cho API nghiệp vụ, conventions route/service/repository.
2. S05 đã có nền FE và components dùng chung; tiếp tục nối REST ở S06 và auth ở S07.
3. S04 đã kết nối DB và chạy migration/seed/test; S07 còn cần chốt auth. S06 chốt DTO/gateway cùng Nam/Lâm.
4. Bảo lấy branch `setup/foundation`, kiểm tra clone/onboarding theo README; đối chiếu kết quả với CI trên GitHub sau khi push.

# QForge — Checkpoint triển khai

Ngày cập nhật: 07/10/2026. Branch: `setup/foundation`.

## Bước 1: baseline và workspace chạy được

| Task | Trạng thái | Phần đã hoàn thành / còn lại |
|---|---|---|
| S01 | Draft | Phân công và baseline ghi ở mvp-decisions.md; auth/rule mismatch còn chờ xác nhận |
| S02 | Hoàn thành trên máy Hộp | FE/BE/shared workspaces, scripts, lockfile, versions, gitignore và conventions; chưa xác minh trên máy Bảo |
| S03 | Khởi động | Express app/HTTP bootstrap, env validation, CORS, health, JSON errors/size limit; validation cho API nghiệp vụ sẽ thêm tiếp |
| S04 | Chưa bắt đầu | Chưa kết nối DB, chưa có migration/seed runner |
| S05 | Khởi động | React/Vite/TS/Tailwind/Router; home và routes placeholder; shadcn/components/layout nghiệp vụ còn lại |
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
2. Hoàn thiện S05: shadcn/ui, Teacher/Student layouts và components dùng chung để Bảo phát triển UI.
3. S04/S07 cần DB/access và quyết định auth; S06 chốt DTO/gateway cùng Nam/Lâm.
4. Bảo lấy branch `setup/foundation`, kiểm tra clone/onboarding theo README; đối chiếu kết quả với CI trên GitHub sau khi push.

# QForge — Checkpoint triển khai

Ngày cập nhật: 07/10/2026. Checkpoint workspace đã push ở `setup/foundation`; S03 đang ở `feat/backend-foundation` (chưa commit/push).

## Bước 1: baseline và workspace chạy được

| Task | Trạng thái | Phần đã hoàn thành / còn lại |
|---|---|---|
| S01 | Draft | Phân công và baseline ghi ở mvp-decisions.md; auth/rule mismatch còn chờ xác nhận |
| S02 | Hoàn thành trên máy Hộp | FE/BE/shared workspaces, scripts, lockfile, versions, gitignore và conventions; chưa xác minh trên máy Bảo |
| S03 | Nền HTTP hoàn thành local; readiness chờ S04 | Express/HTTP bootstrap, env, CORS, health, response/ApiError helpers, body/params/query validation, error handler, conventions và 17 HTTP tests; `/ready` chưa có vì chưa kết nối DB |
| S04 | Chưa bắt đầu | Chưa kết nối DB, chưa có migration/seed runner |
| S05 | Khởi động | React/Vite/TS/Tailwind/Router; home và routes placeholder; shadcn/components/layout nghiệp vụ còn lại |
| S06 | Khởi động | Shared health envelope và FE gọi HTTP thật; DTO/gateway nghiệp vụ còn lại |
| S07 | Chưa bắt đầu | Auth Teacher chưa được chọn; chưa triển khai identity |
| S08 | Một phần | README và CI config có sẵn; CI checkpoint workspace đã pass; CI cho S03 và onboarding trên máy Bảo chưa chạy |

## Đã kiểm tra local

- Cài dependencies từ lockfile bằng `npm ci` thành công.
- `npm run check`: ESLint, TypeScript (gồm tests), 17 HTTP tests và shared/BE/FE build pass.
- `npm run dev`: shared watcher + BE + FE chạy; thay đổi output shared được BE watcher nhận.
- Trên browser, `/setup` gọi `/health` và xác thực response bằng shared Zod schema thành công.
- Khi chỉ chạy FE, `/setup` hiển thị lỗi kết nối API và cho phép thử lại; khi chạy lại BE, kết nối phục hồi.
- HTTP smoke: origin FE được cấp CORS header, origin ngoài danh sách không được cấp; 404 envelope; JSON sai trả 400; payload vượt giới hạn trả 413.
- Deep link `/setup`, `/teacher/quizzes`, `/join` được FE dev server phục vụ.
- PORT không hợp lệ làm BE từ chối startup với thông báo config, không khởi chạy server.
- `.env`, node_modules và dist được Git ignore; không có credential thật trong scaffold.

Các smoke checks là kiểm tra của checkpoint scaffold. S03 thêm tests HTTP tự động cho parsed input/async validation, nested fields, request đồng thời, status/envelope và lỗi nội bộ; xem [hướng dẫn BE](backend-foundation.md). Chưa có bộ test nghiệp vụ/E2E demo. `/health` chỉ xác nhận HTTP server sống.

## GitHub

- Checkpoint workspace: commit `dde2e952335e43efabde627f9c4929298c89e224`, đã push `setup/foundation`.
- [GitHub CI checkpoint workspace](https://github.com/namdin05/datn/actions/runs/37551753291): success.
- S03: kiểm tra local đã pass; thay đổi trên `feat/backend-foundation` chưa commit/push nên chưa có CI run cho phần này.

## Bước tiếp theo

1. S04: Bảo phối hợp Duy chuẩn bị DB/access, migration và seed; nối readiness `/ready` khi kiểm tra được DB thật.
2. S05: Bảo hoàn thiện shadcn/ui, Teacher/Student layouts và components dùng chung.
3. Hộp chốt DTO/gateway ở S06; S07 cần quyết định auth. Nam/Lâm gắn realtime sau khi FE/BE hoàn thành.
4. Bảo có thể lấy branch `setup/foundation` để kiểm tra onboarding hiện tại; đọc S03 trên branch `feat/backend-foundation` sau khi phần này được push.

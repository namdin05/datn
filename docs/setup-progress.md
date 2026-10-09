# QForge — Checkpoint triển khai

## Checkpoint 10/10/2026 — Auth/REST implementation

Branch `feat/auth-identity-rest`, based on main `d815e65`. Shared contracts, Supabase JWT verifier/user mapping, protected FE, guest token join/resume/revoke, Quiz CRUD/Publish, Host, REST lifecycle/snapshot, transactional answers and result/report now have implementation. Teacher/Student UI uses these APIs; landing points to /login and /join.

- Local checks: lint/typecheck, 34 BE tests, 2 FE smoke suites and builds pass. SQL tests execute migrations/seeds/business transactions on isolated PGlite; JWT tests use signed ES256 tokens/local JWKS.
- Migration 002 is authored; **not applied to team Supabase in this turn**. Auth URL/key/two real Teacher accounts/mapping and live login remain to configure. Participant secret generated in ignored local env.
- S01 choices implemented; S06/S07 and C01–C06 have core code/tests but live DB/Auth/UI acceptance remains pending. S08 docs updated. H01/realtime still pending.
- Backend refactored into feature modules with route/service/repository/policy/read models and explicit composition. Regression checks cover cross-module rollback and split HTTP auth/CRUD/gameplay/report routes. See [backend architecture](backend-architecture.md). Changes are saved as local commits on this feature branch; not pushed.
- Tests do not validate PostgreSQL row-lock scheduling across multiple pg connections or full browser/responsive flow. `/api/dev/*` defaults off; /preview remains mock.

Read [integration contract](integration-contract.md). The checkpoint below records historical evidence from 08/10 and is retained for context.


Ngày cập nhật: 08/10/2026. Branch tích hợp: `feat/backend-foundation`, đã ghép main tại `43eb915`. Checkpoint S03 riêng: `b96da34`.

## Bước 1: baseline và workspace chạy được

| Task | Trạng thái | Phần đã hoàn thành / còn lại |
|---|---|---|
| S01 | Draft | Phân công và baseline ghi ở mvp-decisions.md; auth/rule mismatch còn chờ xác nhận |
| S02 | Hoàn thành trên máy Hộp | FE/BE/shared workspaces, scripts, lockfile, versions, gitignore và conventions; chưa xác minh trên máy Bảo |
| S03 | Hoàn thành và tích hợp S04/S05 | HTTP/env/CORS, response/ApiError helpers, request validation, health/ready, error middleware, conventions và 27 HTTP tests |
| S04 | Team đã triển khai | Pool pg, migration tracking/baseline, seeds và repository skeleton; giữ code của Bảo/Duy. Lượt tích hợp S03 chỉ kiểm tra DB routes với mocked query, chưa chạy lại trên Supabase thật. Xem [hướng dẫn S04](database-setup.md) |
| S05 | Team đã triển khai nền FE | Layouts Teacher/Student, UI primitives, feedback/error boundary, luồng đọc DB và UI demo tham khảo; smoke FE pass, auth/API ghi nghiệp vụ còn lại |
| S06 | Một phần | Shared health/ready và DTO đọc DB; FE HTTP client đọc dữ liệu đã có; DTO/gateway nghiệp vụ hoàn chỉnh còn lại |
| S07 | Chưa bắt đầu | Auth Teacher chưa được chọn; chưa triển khai identity |
| S08 | Một phần | README/CI đã có; clean install và checks local pass Node 24.15.0/npm 11.6.2; CI chạy theo branch/PR, onboarding và DB integration trên máy Hộp còn lại |

## Đã kiểm tra local

- Clean `npm ci` thành công với Node 24.15.0/npm 11.6.2; giữ `engine-strict=true`. Node được nâng để đáp ứng dependencies test FE mới.
- `npm run check`: ESLint, TypeScript (gồm BE tests), 27 HTTP tests, smoke FE và shared/BE/FE build pass.
- `npm run dev`: shared watcher + BE + FE chạy; thay đổi output shared được BE watcher nhận.
- Trên browser, `/setup` gọi `/health` và xác thực response bằng shared Zod schema thành công.
- Khi chỉ chạy FE, `/setup` hiển thị lỗi kết nối API và cho phép thử lại; khi chạy lại BE, kết nối phục hồi.
- HTTP smoke: origin FE được cấp CORS header, origin ngoài danh sách không được cấp; 404 envelope; JSON sai trả 400; payload vượt giới hạn trả 413.
- Deep link `/setup`, `/teacher/quizzes`, `/join` được FE dev server phục vụ.
- PORT không hợp lệ làm BE từ chối startup với thông báo config, không khởi chạy server.
- `.env`, node_modules và dist được Git ignore; không có credential thật trong scaffold.

Các smoke checks là kiểm tra của checkpoint scaffold. S03 thêm tests HTTP tự động cho parsed input/async validation, nested fields, request đồng thời, status/envelope, readiness và integration DB routes với mocked query; xem [hướng dẫn BE](backend-foundation.md). Chưa có bộ test nghiệp vụ/E2E demo. `/health` chỉ xác nhận HTTP server sống.

## GitHub

- Checkpoint workspace: commit `dde2e952335e43efabde627f9c4929298c89e224`, đã push `setup/foundation`.
- [GitHub CI checkpoint workspace](https://github.com/namdin05/datn/actions/runs/37551753291): success.
- Main `43eb915` fail CI ở `npm ci`: Node 24.13.0 không đạt engines của dependencies test FE. Branch tích hợp nâng Node 24.15.0, clean install/check local đã pass. Kết quả CI mới xem theo branch/PR trên GitHub Checks.

## Bước tiếp theo

1. Xác minh DB access/readiness trên máy Hộp, chạy kiểm tra DB phù hợp theo S04; không tự chạy migration/seed chỉ để giải quyết merge.
2. Hộp chốt DTO/gateway ở S06; Bảo nối FE; S07 cần quyết định auth.
3. Triển khai API ghi và các business services; Nam/Lâm gắn realtime sau khi FE/BE hoàn thành.
4. Team dùng Node 24.15.0/npm 11.6.2, lấy branch tích hợp để kiểm tra onboarding và review PR vào main.

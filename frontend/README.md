# Frontend checkpoint 10/10/2026

Main routes now use authenticated REST: /login (prepared Supabase Teacher account), /teacher/quizzes (owned DB data), /teacher/editor/new or /:id (draft/publish/host), /teacher/session/:id (manual lifecycle/progress/report), /join and /student/session/:id (guest token, manual snapshot, submit/result). Configure .env from .env.example; apply BE migration 002 and map accounts first. See [integration contract](../docs/integration-contract.md).

`npm run check` includes mock UI smoke plus real HTTP → isolated PostgreSQL Student smoke. `npm run test:db -w @qforge/frontend` now performs read-only business checks against live Supabase Auth/DB with QFORGE_TEST_TEACHER_EMAIL/PASSWORD in ignored backend/.env; it requires URL/key and account mapping. It no longer bypasses auth through a demo actor.

Teacher and guest credentials are stored in same-tab sessionStorage. /preview remains local mock. Browser/responsive, real account login and team DB flow still need acceptance. The older foundation notes below are retained as history.

---

# QForge frontend

Frontend dùng React/Vite/TypeScript, Tailwind và Router, giữ tông kem/cam theo mẫu demoB. Layout dùng chung ở `src/app/layouts/`, Button/Input/Card ở `src/components/ui/`. PageState/ErrorBoundary phục vụ loading/error/empty và lỗi render.

## Chạy ứng dụng

Từ thư mục gốc:

```powershell
npm.cmd ci
npm.cmd run dev
```

Mở http://127.0.0.1:5173/teacher/quizzes để xem Teacher mẫu trong DB. Backend đọc `backend/.env`; FE dùng `VITE_API_URL` trong `frontend/.env` (mặc định http://127.0.0.1:3002). Không đưa credentials DB vào frontend.

## Đọc dữ liệu thật

Luồng chính dùng `DatabaseApp` và `databaseApi`, không đọc quiz/session từ localStorage:

- Dashboard: Teacher, quiz, số câu, session và số người tham gia.
- Chi tiết quiz: câu hỏi, lựa chọn và đáp án cho môi trường test Teacher, giữ nguyên câu nhiều đáp án đúng.
- Phiên: danh sách participants và từng attempt trong DB; không cộng điểm nhiều lượt làm vào một kết quả.
- Báo cáo: các session FINISHED; accuracy tính theo accuracy_points/max_accuracy_points của attempt.
- Trang chủ: tra cứu phòng theo PIN; chỉ nhận title/status/count, không nhận đáp án hoặc danh tính.

API Teacher `/api/dev/*` dùng Teacher mẫu do server chọn và chỉ hoạt động khi NODE_ENV khác production. Đây là chế độ test, chưa phải xác thực. Auth cần được triển khai trước khi công khai API Teacher. API tạo/sửa/xóa, host/join/start/next/submit/finish chưa có; giao diện ghi rõ và không lưu giả vào localStorage. `/setup` kiểm tra HTTP health; `/ready` của BE kiểm tra DB.

`LocalDemoApp` và `lib/demo.ts` được giữ làm tham khảo và kiểm thử UI cũ; không được mount trong luồng chính hiện tại.

## Kiểm tra

```powershell
npm.cmd run test:db -w @qforge/frontend
npm.cmd run test -w @qforge/frontend
npm.cmd run check
```

`test:db` chạy HTTP backend trên cổng tạm và FE trong DOM với PostgreSQL thật, chỉ đọc DB. Kiểm tra dashboard bỏ localStorage, quiz seed 5 câu/20 options, session/participants, public response không lộ đáp án, ID sai/không tồn tại và retry sau lỗi mạng. `test` kiểm tra components và UI demo cũ. DOM tests không thay thế kiểm tra trực quan responsive.

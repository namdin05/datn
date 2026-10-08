# S04 — Kết nối PostgreSQL và lớp truy cập dữ liệu

BE dùng PostgreSQL qua `pg`, cấu hình ở `backend/.env`. Không đưa credentials vào FE hoặc Git. Pool được dùng bởi server; `/health` kiểm tra tiến trình, `/ready` truy vấn DB và trả 503 nếu DB không sẵn sàng. Repository dùng SQL có tham số, nhận pool hoặc client transaction.

## Kiểm tra kết nối

Chạy từ thư mục gốc:

```powershell
npm.cmd run db:check
npm.cmd run db:status
```

`db:check` kiểm tra kết nối, bảng core và khả năng đọc repository. `db:status` hiển thị trạng thái migration tracking.

## Khởi tạo và cập nhật schema

### DB mới, chưa có bảng core

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
```

### DB đã có schema nhưng chưa có migration tracking

```powershell
npm.cmd run db:baseline
npm.cmd run db:migrate
npm.cmd run db:seed
```

Baseline đối chiếu cột, kiểu dữ liệu, giá trị mặc định, nullability, constraints, indexes và enum với migration đầu tiên qua schema tạm trong transaction. Nếu khác, lệnh dừng và rollback; cần review khác biệt trước khi tiếp tục. Không tự sửa bảng hiện có. Baseline không kiểm tra trigger, RLS hoặc function ngoài migration.

Bảng `public.qforge_migrations` lưu tên, checksum, thời điểm áp dụng và cờ baseline. DB đã có tracking chỉ cần chạy `db:migrate` để áp dụng migration mới. Không sửa migration đã áp dụng; thêm file migration mới. Runner có advisory lock để tránh chạy đồng thời và transaction để rollback khi lỗi.

## Dữ liệu mẫu

| File trong `database/seeds/` | Nội dung |
|---|---|
| `001_demo_seed.sql` | Quiz 3 câu, có câu nhiều đáp án đúng, session và participants |
| `002_s04_demo.sql` | Quiz 5 câu, mỗi câu 4 lựa chọn/1 đáp án đúng và `points=100` |

Seed dùng UUID cố định và `ON CONFLICT DO NOTHING` để chạy lại không nhân đôi hoặc ghi đè bản ghi hiện có. Không reset session hoặc kết quả đã lưu. Runner kiểm tra cấu trúc bộ demo 5 câu sau khi seed.

Teacher dùng UUID `00000000-0000-0000-0000-000000000001`; quiz 5 câu dùng UUID `10000000-0000-0000-0000-000000000004`. Seed không tạo tài khoản đăng nhập hoặc mật khẩu. Bộ 3 câu là dữ liệu tham khảo, không dùng để nghiệm thu rule demo single-choice 4/1.

## Kiểm thử

```powershell
npm.cmd run db:test
```

Lệnh test chạy seed hai lần, kiểm tra số bản ghi không tăng ở lần thứ hai và cấu trúc quiz 5 câu. Repository tạo/đọc draft trong transaction, sau đó rollback và xác nhận draft không còn trong DB. Lệnh cũng kiểm tra `/ready` trả HTTP 200 với DB thật. Dữ liệu test không được giữ. Dùng DB phát triển hoặc kiểm thử.

## Repository và phạm vi triển khai

`repositories()` cung cấp user lookup, quiz list/detail/questions/createDraft, session lookup theo ID/PIN và participant list. Đáp án đúng trong repository chỉ dành cho BE; service/DTO Student phải lọc đáp án. API status `ACTIVE` ánh xạ DB `IN_PROGRESS`. FE hiện đọc dashboard, quiz và session qua API backend. Auth, API ghi nghiệp vụ, token/current question/stateVersion (S07/C03), scoring và realtime chưa được triển khai.

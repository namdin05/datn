# QForge — Baseline và những điểm cần xác nhận

Ngày: 07/10/2026. Nguồn: spec/guideline Jira và phân công hiện tại.

## Phân công và tổ chức repo

- Hộp/Bảo hoàn thiện FE/BE trước; Nam/Lâm gắn realtime sau bàn giao.
- Repo code demo: `namdin05/datn`. FE/BE/shared nằm trong cùng repo.
- Branch setup hiện tại: `setup/foundation`. Các nhánh feature dùng `feat/<task>`.

## Baseline đề xuất theo spec Jira

| Chủ đề | Baseline | Trạng thái |
|---|---|---|
| Frontend | React + Vite + TypeScript; Tailwind, Router; shadcn/ui ở bước FE foundation tiếp theo | Đang dựng nền |
| Backend | Express + TypeScript; REST trước, business service độc lập transport | Đang dựng nền |
| Database | PostgreSQL trên Supabase; schema hiện có cần mapping/constraint theo scope Jira | Chưa kết nối |
| Teacher auth | Supabase Auth hoặc identity demo do server cấp | **Chờ thống nhất trong nhóm**; chưa triển khai |
| Question | Chính xác 4 options và 1 correct; single-choice | Cần nhóm xác nhận mismatch với schema |
| Session state | API WAITING/ACTIVE/FINISHED; map ACTIVE ↔ DB IN_PROGRESS | Đề xuất |
| Gameplay | Teacher start/next/finish; join mới khi WAITING; resume identity cũ khi ACTIVE | Đề xuất theo guideline |
| PIN | 6 chữ số, string; unique cho phiên còn hiệu lực | Đề xuất |
| Scoring | Correct 100, incorrect 0; một attempt; timer/shuffle/speed bonus OFF | Đề xuất theo scope demo |
| Metrics | Incorrect = đã trả lời sai; unanswered riêng; accuracy = correct/total | Chưa chốt với nhóm |

Các lựa chọn gameplay/DB/auth không phải quyết định đã được leader duyệt. Bước scaffold chưa thay đổi SQL, chưa thêm auth giả hoặc API nghiệp vụ.

## Điểm nối cần chốt với Nam/Lâm trước khi hoàn thiện core

- Shared DTO tách TeacherQuestion và PublicQuestion; Student không nhận đáp án đúng.
- Actor xác thực được truyền vào service; HTTP và socket dùng chung service.
- Session gateway FE tách transport khỏi màn hình; snapshot có stateVersion và hasAnswered.
- State chỉ được phát sau transaction thành công; REST join và socket attach không tạo participant hai lần.
- Live-state/participant credential migration do Hộp/Bảo phối hợp Duy; Socket.IO adapter/client/reconnect do Nam/Lâm.
- Tên event và lựa chọn REST actions + broadcast hay socket commands được chốt cùng Nam/Lâm; chưa cài Socket.IO trong scaffold.

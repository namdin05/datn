# QForge — Realtime và bảng xếp hạng

Tài liệu trình bày cho giảng viên (lý do thiết kế, bảo mật, kiểm thử): [realtime-thuyet-trinh.md](realtime-thuyet-trinh.md).

Cập nhật 10/10/2026, branch `feat/realtime-leaderboard`. Nhiều Student tham gia một Live session của Teacher; trạng thái phiên được đẩy realtime, Student xem bảng xếp hạng chung sau mỗi N câu, Teacher theo dõi bảng xếp hạng trực tiếp.

## Nghiệp vụ

- Teacher chọn khi mở phòng (`POST /api/sessions` với `leaderboardEvery`): sau mỗi N câu, N từ 1 đến 10 (giới hạn demo), hoặc `null` nghĩa là chỉ hiện khi kết thúc. Mặc định của API là `null`; UI chọn sẵn 2.
- Bước bảng xếp hạng do Teacher điều khiển. Ví dụ N=2, đề 5 câu: Câu 1 → Câu 2 → **BXH** → Câu 3 → Câu 4 → **BXH** → Câu 5 → Kết thúc → **BXH chung cuộc**. Không có bước BXH sau câu cuối; Teacher bấm Kết thúc.
- `next` từ câu N, 2N… mở bước BXH (`phase = LEADERBOARD`, vị trí giữ nguyên); `next` tiếp theo sang câu kế (`phase = QUESTION`). Mỗi bước tăng `stateVersion`.
- Trong bước BXH, Student không nhận câu hỏi và không gửi được câu trả lời mới; retry y hệt câu trả lời đã gửi vẫn idempotent.
- Xếp hạng: điểm giảm dần, cùng điểm cùng hạng (1, 1, 3). Student nhận top 10, hạng của chính mình và tổng số người, chỉ ở bước BXH hoặc sau FINISHED. Không bao giờ gửi bảng xếp hạng trong lúc câu hỏi đang mở, để không lộ đáp án. Teacher nhận toàn bộ bảng xếp hạng ở mọi bước.

## Realtime (Socket.IO)

Socket chỉ là kênh thông báo server → client. Mọi lệnh ghi (join, answer, start/next/finish, revoke) vẫn qua REST. Payload không chứa câu hỏi, đáp án hay điểm: client nhận thông báo rồi đọc lại snapshot của chính mình qua REST, nên quyền và projection giữ nguyên.

| Event | Gửi tới | Khi nào |
|---|---|---|
| `session:changed` `{sessionId, reason: 'lifecycle', stateVersion}` | Mọi Student của phiên và Teacher | start / next / finish |
| `session:changed` `{reason: 'roster' \| 'answer', stateVersion: null}` | Chỉ Teacher, gộp tối đa 1 lần/300 ms/phiên | join, revoke, câu trả lời mới |
| `session:revoked` `{sessionId}` | Đúng participant đó, sau đó server ngắt socket | revoke credential |

Handshake: `io(API_URL, { auth: { kind: 'teacher', sessionId, token: <Supabase JWT> } })` hoặc `{ kind: 'participant', sessionId, token: <credential> }`. Server dùng `resolveTeacher` + kiểm tra host qua `sessions.snapshot`, hoặc `ParticipantTokens.resolve`; room do server gán, client không tự chọn. Lỗi handshake trả `connect_error` với `data.code` (`UNAUTHORIZED`, `NOT_FOUND`, `FORBIDDEN`, `DB_UNAVAILABLE`).

Client (`frontend/src/lib/realtime.ts`): khi connect/reconnect thì đọc lại snapshot; khi mất kết nối thì poll REST mỗi 10 giây; Teacher lấy access token mới ở mỗi lần kết nối. Student rải lượt đọc snapshot ngẫu nhiên 0–300 ms sau thông báo lifecycle để tránh dồn request. `applySnapshot`/`stateVersion` loại bỏ kết quả cũ đến sau.

## Code

- `shared/src/contracts.ts`: `hostInputSchema`, `leaderboardEntrySchema`, `studentLeaderboardSchema`, `phase`/`leaderboardEvery`/`leaderboard` trong snapshot, `nextOpensLeaderboard`, `realtimeEvents`, `realtimeAuthSchema`, `sessionChangedSchema`.
- `backend/src/modules/session-events.ts`: port `SessionEvents` và event bus trong tiến trình. Services `sessions.action`, `participants.join/revoke`, `answers.submit` publish sau khi transaction commit; mặc định `noSessionEvents` cho test.
- `backend/src/realtime/socket.ts`: adapter Socket.IO, gắn vào HTTP server trong `server.ts` qua `createBackendRuntime`.
- `database/migrations/003_live_leaderboard.sql`: `session_settings.leaderboard_every`, `sessions.live_phase`. Migration chỉ thêm cột, để code trước 003 vẫn chạy trên DB dùng chung; repository coi `live_phase` NULL của phiên IN_PROGRESS là `QUESTION`.
- FE: chọn N ở trang soạn đề trước khi mở phòng; `SessionControl` (BXH trực tiếp, nút "Hiện bảng xếp hạng"/"Câu tiếp theo"); `StudentSession` (tự cập nhật, màn BXH). Nút "Cập nhật phiên/phòng" vẫn giữ làm dự phòng.

## Kiểm thử và giới hạn

`backend/test/realtime.test.ts` (PGlite + socket.io-client thật): giới hạn N, luồng BXH sau mỗi N câu, BXH ẩn khi câu đang mở, xếp hạng đồng hạng, chặn trả lời ở bước BXH, cadence giữ nguyên sau start, tương thích dữ liệu trước 003, handshake từ chối token sai/host khác/phòng khác, event đúng audience, gộp event cho Teacher, payload không chứa dữ liệu chấm điểm, revoke ngắt socket.

Chưa nghiệm thu: migration 003 trên DB Supabase thật, chạy trình duyệt nhiều Student cùng lúc, tải thật nhiều kết nối (k6/Artillery), deploy trên host hỗ trợ WebSocket. Một tiến trình Node đủ cho một lớp học; chạy nhiều instance cần `@socket.io/redis-adapter` và sticky session.

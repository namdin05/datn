# QForge PoC — Socket.IO Realtime & Reconnect

## 1. Mục tiêu

PoC tập trung xây dựng luồng quiz realtime bằng Socket.IO:

- Host và player dùng chung một room realtime.
- Server đồng bộ trạng thái room và câu hỏi cho các client.
- Client tự reconnect khi mất kết nối.
- User có thể resume vào room sau refresh hoặc khi socket thay đổi.
- Host có thể đóng room cho toàn bộ player.

## 2. Kiến trúc Socket.IO

```text
Host Client ─┐
Player Client ├── Socket.IO ── QForge Server
Player Client ┘                    │
                              Room state
                              Quiz timer
                              Answer validation
```

Server là nguồn dữ liệu chính. Client chỉ gửi action và hiển thị state nhận từ server.

Mỗi room sử dụng channel riêng:

```text
room:{roomCode}
```

## 3. Socket connection lifecycle

Client sử dụng cấu hình:

```js
{
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000
}
```

Flow kết nối:

```text
App load
  ↓
Đăng ký socket listeners
  ↓
socket.connect()
  ↓
Nếu có session → room:resume
  ↓
Nhận room:snapshot
```

Client hiển thị trạng thái `Connected` hoặc `Disconnected · reconnecting`.

## 4. Identity khi reconnect

Không dùng `socket.id` làm identity lâu dài vì `socket.id` thay đổi sau mỗi connection.

Server cấp cho mỗi host/player:

```js
{
  participantId,
  reconnectToken,
  role,
  roomCode
}
```

`socket.id` chỉ đại diện cho connection hiện tại. `participantId` dùng để tìm lại user trong room.

Client lưu thông tin resume trong browser storage để gửi lại khi reconnect.

## 5. Client events

| Event | Mục đích |
|---|---|
| `room:create` | Host tạo room mới |
| `room:join` | Player tham gia room |
| `room:resume` | Khôi phục participant sau reconnect |
| `room:sync` | Yêu cầu server gửi snapshot mới nhất |
| `quiz:start` | Host bắt đầu quiz |
| `answer:submit` | Player gửi đáp án |
| `question:next` | Host chuyển câu hỏi |
| `quiz:finish` | Host kết thúc quiz |
| `room:close` | Host đóng room cho tất cả client |

Mỗi action có acknowledgement để client biết request thành công hoặc nhận lỗi validation.

## 6. Server events

| Event | Mục đích |
|---|---|
| `room:state` | Broadcast trạng thái room và danh sách player |
| `room:snapshot` | Gửi state đầy đủ cho client vừa resume/sync |
| `room:resumed` | Xác nhận participant đã resume thành công |
| `question:changed` | Gửi câu hỏi hiện tại |
| `quiz:started` | Thông báo quiz bắt đầu |
| `answer:accepted` | Xác nhận answer đã được server lưu |
| `answer:progress` | Cập nhật tiến độ trả lời cho host |
| `quiz:finished` | Thông báo quiz kết thúc |
| `player:result` | Gửi kết quả riêng cho player |
| `quiz:report` | Gửi report tổng hợp cho host |
| `room:connection` | Thông báo host disconnect/reconnect |
| `room:closed` | Thông báo room bị host đóng |
| `error` | Thông báo lỗi thao tác hoặc validation |

## 7. Resume flow

### Khi refresh hoặc reconnect

```text
Socket connect lại
  ↓
Client gửi room:resume
  ↓
Server kiểm tra room + participantId + reconnectToken
  ↓
Gắn socket mới vào participant cũ
  ↓
socket.join(room:{roomCode})
  ↓
Server gửi room:snapshot
```

Snapshot gồm:

- `state`: trạng thái room.
- `question`: câu hỏi hiện tại nếu quiz đang active.
- `hasAnsweredCurrentQuestion`.
- `result`: kết quả cá nhân nếu quiz đã kết thúc.
- `report`: report host nếu quiz đã kết thúc.

Client luôn lấy snapshot từ server làm state chính sau khi resume.

## 8. Xử lý disconnect

### Player disconnect

- Server giữ player trong room.
- Đặt `connected = false`.
- Các answer đã lưu không bị mất.
- Player có thể resume bằng `participantId` và `reconnectToken`.

### Host disconnect

- Quiz không kết thúc ngay.
- Server chờ host reconnect trong 60 giây.
- Nếu host reconnect, socket mới được gắn lại vào host cũ.
- Nếu hết thời gian, room được kết thúc.

## 9. Validation và chống submit trùng

Server validate:

- Room có tồn tại không.
- Socket có đúng role không.
- Host có phải host của room không.
- Quiz có đang active không.
- Question ID có đúng câu hiện tại không.
- Option ID có hợp lệ không.
- Player đã trả lời câu này chưa.
- Answer có gửi trước khi hết thời gian không.

Answer được lưu theo:

```text
questionIndex + participantId
```

Nếu client gửi lại answer sau khi mất response, server không tạo answer mới và vẫn phát `answer:accepted` để đồng bộ UI.

## 10. Host đóng room

Host gọi:

```text
room:close
```

Server sẽ:

1. Kiểm tra socket hiện tại là host.
2. Gửi `room:closed` cho toàn bộ client.
3. Dừng quiz timer và reconnect timer.
4. Cho các socket rời Socket.IO room.
5. Xóa room khỏi server memory.

Các client nhận `room:closed` sẽ xóa session và quay về landing page.

## 11. Các file chính

### Client

- `client/src/socketClient.js`: tạo Socket.IO client, reconnect config và request acknowledgement.
- `client/src/main.jsx`: đăng ký events, gửi actions, hydrate snapshot và hiển thị connection status.
- `client/src/storage.js`: lưu thông tin cần thiết để resume socket session.

### Server

- `server/src/index.js`: Socket.IO connection handler và toàn bộ event contract.
- `server/src/roomManager.js`: quản lý room, participant identity, reconnect token và room lifecycle.

## 12. Cách chạy

Terminal 1:

```bash
cd PoC_QForge/server
npm install
npm run dev
```

Terminal 2:

```bash
cd PoC_QForge/client
npm install
npm run dev
```

Client: `http://localhost:5173`  
Server: `http://localhost:3002`

## 13. Đã kiểm tra

- Host tạo room và player join realtime.
- Host start/next/finish quiz.
- Player reconnect và giữ nguyên participant.
- Host reconnect khi quiz đang active.
- Snapshot khôi phục đúng câu hỏi hiện tại.
- Answer không bị tạo trùng sau khi mất response.
- Host đóng room và player nhận `room:closed`.
- Không thể resume vào room đã bị đóng.

## 14. Giới hạn của PoC

- Room state chỉ nằm trong server memory.
- Restart server sẽ mất room và không thể resume session cũ.
- Chưa có Socket.IO adapter hoặc shared store cho multi-server deployment.
- Reconnect token hiện phù hợp cho PoC, chưa có cơ chế refresh token production.

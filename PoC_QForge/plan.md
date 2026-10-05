# QForge Realtime Quiz PoC - Plan

## 1. Muc tieu

Xay dung PoC quiz realtime gom React client va Node.js/Express server, su dung Socket.IO va mock data trong memory.

Plan nay tap trung vao flow chinh:

```text
Create Room -> Join -> Start Quiz -> Question Sync -> Submit Answer
-> Next Question -> Finish -> Result
```

## 2. Nguyen tac ky thuat

- Server la nguon du lieu chinh cho room va quiz state.
- Client chi gui action va hien thi state nhan tu server.
- Server validate moi action truoc khi cap nhat state va broadcast.
- Khong dung database; du lieu mat khi server restart.
- Quiz dung bo question co dinh.
- Moi question co thoi luong mac dinh 10 giay.
- Khong gui `correctOptionId` cho player trong question dang choi.

## 3. Cau truc project

```text
PoC_QForge/
├── client/                 # React application
│   └── src/
└── server/                 # Node.js/Express + Socket.IO
    └── src/
```

## 4. Mock data va state

### Question

```js
{
  id: "q1",
  text: "...",
  options: [
    { id: "a", text: "..." },
    { id: "b", text: "..." }
  ],
  correctOptionId: "a",
  durationSeconds: 10
}
```

`correctOptionId` chi duoc dung tren server de cham diem.

### Room

```js
{
  roomCode: "ABCD",
  hostSocketId: "...",
  players: [],
  status: "WAITING",
  currentQuestionIndex: -1,
  questionStartedAt: null,
  answersByQuestion: {},
  results: []
}
```

Room status gom `WAITING`, `ACTIVE` va `FINISHED`.

## 5. Socket.IO event contract

### Client emit

- `room:create` - host tao room.
- `room:join` - player join bang room code va nickname.
- `quiz:start` - host bat dau quiz.
- `answer:submit` - player gui dap an.
- `question:next` - host chuyen sang question tiep theo.
- `quiz:finish` - host ket thuc quiz.
- `room:sync` - client yeu cau snapshot khi reconnect.

### Server emit

- `room:created` - tra ve room code cho host.
- `room:state` - cap nhat lobby va trang thai room.
- `player:joined` - thong bao player moi.
- `player:left` - thong bao player disconnect.
- `quiz:started` - thong bao quiz da bat dau.
- `question:changed` - gui question hien tai cho ca room.
- `answer:accepted` - xac nhan answer cua player.
- `answer:progress` - cap nhat tien do tra loi cho host.
- `quiz:finished` - thong bao quiz da ket thuc.
- `player:result` - ket qua rieng cua player.
- `quiz:report` - report tong hop cho host.
- `room:snapshot` - state hien tai sau reconnect.
- `error` - loi validation hoac thao tac khong hop le.

## 6. Server implementation

### 6.1 Room manager

- Tao room code duy nhat.
- Luu room trong `Map`.
- Luu host socket, players va quiz state.
- Cho socket join Socket.IO room theo room code.
- Xu ly disconnect bang cach danh dau player roi room hoac disconnected.

### 6.2 Action validation

Server phai kiem tra:

- Room co ton tai khong.
- Socket co thuoc room khong.
- Action co dung vai tro host/player khong.
- Room co dang o dung status khong.
- Question co dung la question hien tai khong.
- Option co ton tai khong.
- Player da tra loi question nay chua.
- Answer co con trong 10 giay khong.

### 6.3 Quiz flow

1. Host tao room voi status `WAITING`.
2. Player join room va server broadcast lobby state.
3. Host start quiz; server chuyen status sang `ACTIVE` va question index ve `0`.
4. Server broadcast question hien tai cho tat ca client.
5. Player submit answer; server luu answer va cap nhat answer progress.
6. Het 10 giay hoac host next; server chuyen sang question tiep theo.
7. Khi het question, hoac host finish, server chuyen status sang `FINISHED`.
8. Server tinh diem mock va gui result.

### 6.4 Timer

- Timer duoc tinh dua tren `questionStartedAt` o server.
- Client chi hien thi countdown theo timestamp server cung cap.
- Answer den sau 10 giay bi tu choi.
- Co the dung `setTimeout`/scheduler de thong bao het thoi gian, nhung validation server van la bat buoc.

## 7. React client implementation

### Host screens

1. Host setup: nhap ten va tao room.
2. Lobby: hien thi room code, so luong player va danh sach player.
3. Quiz control: hien thi question, countdown, answer progress va nut Next/Finish.
4. Result: hien thi report tong hop sau khi quiz ket thuc.

### Player screens

1. Join room: nhap room code va nickname.
2. Waiting lobby: cho host start.
3. Question: hien thi question, options, countdown va nut Submit.
4. Waiting next question: khoa answer sau khi submit.
5. Result: hien thi ket qua ca nhan sau khi quiz ket thuc.

### UI requirements

- Layout don gian, ro rang, phu hop demo.
- Hien thi loading, loi va trang thai Socket.IO.
- Disable button khi action khong hop le.
- Khong hien thi dap an dung truoc khi quiz ket thuc.

## 8. Trinh tu thuc hien

### Phase 1 - Khoi tao

- Tao `client` React va `server` Node.js.
- Cai Express, Socket.IO va socket.io-client.
- Tao lenh start cho client/server.
- Cau hinh CORS local.

### Phase 2 - Server room va lobby

- Tao mock quiz.
- Tao room manager trong memory.
- Implement create room, join room va disconnect.
- Broadcast room state va player list.

### Phase 3 - Server quiz flow

- Implement start quiz va question sync.
- Implement timer 10 giay va answer validation.
- Implement submit answer va answer progress.
- Implement next question, finish va tinh result.
- Implement room snapshot cho reconnect co ban.

### Phase 4 - React UI

- Tao Host/Player flow.
- Tao Socket.IO context/service.
- Tao lobby, question, waiting va result screens.
- Ket noi UI voi cac event server.

### Phase 5 - Verification

- Chay mot host va it nhat hai player.
- Kiem tra toan bo flow tu tao room den result.
- Kiem tra tat ca client nhan cung question.
- Kiem tra timeout, duplicate answer va answer sai question.
- Kiem tra player disconnect/reconnect.
- Kiem tra command cua player khong the thay the host.

## 9. Tieu chi hoan thanh

- Host tao duoc room code.
- Nhieu player join duoc cung room va lobby cap nhat realtime.
- Host start quiz va moi client nhan cung question.
- Moi question co thoi luong 10 giay duoc server validate.
- Moi player chi submit toi da mot answer cho moi question.
- Host chuyen question va state duoc broadcast realtime.
- Quiz finish thanh cong va result chi hien thi sau khi ket thuc.
- PoC chay duoc khong can database.
- Co the demo bang mot host va nhieu player tren local.

## 10. Ngoai pham vi

- Dang nhap va tai khoan that.
- Database va luu tru lau dai.
- Tao quiz dong.
- Lich su ket qua, analytics va payment.
- Scale nhieu server.
- UI production-ready.

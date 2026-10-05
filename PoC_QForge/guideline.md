# QForge Socket.IO PoC Design

## 1. Mục tiêu

PoC sử dụng Socket.IO để kiểm chứng luồng realtime chính của QForge:

Create Room  
→ Student Join  
→ Realtime Lobby  
→ Start Quiz  
→ Question Sync  
→ Submit Answer  
→ Answer Progress  
→ Next Question  
→ Finish Quiz  
→ Result

Server giữ vai trò **authoritative state**. Client chỉ gửi action, server validate và broadcast trạng thái mới.

---

## Stage 1 - Create Room

**Mục tiêu:**  
Teacher tạo một Live Session.

**Xử lý:**

- Server tạo `sessionId`.
- Server sinh `Join PIN`.
- Session có trạng thái `WAITING`.
- Teacher join Socket.IO room của session.

```js
socket.emit("session:join", {
  sessionId,
});
```

```js
socket.join(`session:${sessionId}`);
```

**Kết quả:**  
Teacher đã kết nối vào room của session.

---

## Stage 2 - Student Join

**Mục tiêu:**  
Student tham gia session bằng PIN và nickname.

**Xử lý:**

- Server kiểm tra PIN.
- Kiểm tra session đang ở trạng thái `WAITING`.
- Tạo Participant.
- Student join Socket.IO room.

```js
socket.emit("session:join", {
  sessionId,
  participantId,
});
```

```js
socket.join(`session:${sessionId}`);
```

**Kết quả:**  
Student được đưa vào Lobby.

---

## Stage 3 - Realtime Lobby

**Mục tiêu:**  
Teacher thấy Student tham gia theo thời gian thực.

Khi Student join:

```js
io.to(`session:${sessionId}`).emit("participant:joined", {
  participantId,
  nickname,
});
```

Teacher nhận:

```js
socket.on("participant:joined", (participant) => {
  // update participant list
});
```

Khi Student disconnect:

```js
socket.on("disconnect", () => {
  // mark participant as disconnected
});
```

Server gửi:

```js
io.to(`session:${sessionId}`).emit("participant:disconnected", {
  participantId,
});
```

**Kết quả:**  
Teacher thấy Participant List và Participant Count realtime.

---

## Stage 4 - Start Quiz

**Mục tiêu:**  
Teacher bắt đầu Live Quiz.

Teacher gửi:

```js
socket.emit("session:start", {
  sessionId,
});
```

Server nhận:

```js
socket.on("session:start", async ({ sessionId }) => {
  // validate teacher
  // WAITING -> ACTIVE
  // currentQuestion = Question 1
});
```

Server broadcast:

```js
io.to(`session:${sessionId}`).emit("session:started", {
  currentQuestionIndex: 0,
});
```

**Kết quả:**  
Tất cả Student biết quiz đã bắt đầu.

---

## Stage 5 - Question Sync

**Mục tiêu:**  
Tất cả Student nhận cùng một câu hỏi hiện tại.

Server gửi:

```js
io.to(`session:${sessionId}`).emit("question:changed", {
  questionId,
  text,
  options,
  index,
  totalQuestions,
});
```

Student nhận:

```js
socket.on("question:changed", (question) => {
  // render question
});
```

Server không gửi:

```js
correctOptionId;
```

**Kết quả:**  
Tất cả Student nhìn thấy cùng một câu hỏi.

---

## Stage 6 - Submit Answer

**Mục tiêu:**  
Student gửi đáp án cho câu hỏi hiện tại.

Student gửi:

```js
socket.emit(
  "answer:submit",
  {
    questionId,
    selectedOptionId,
  },
  (response) => {
    // acknowledgement
  },
);
```

Server nhận:

```js
socket.on("answer:submit", async ({ questionId, selectedOptionId }, ack) => {
  // validate participant
  // validate current question
  // validate option
  // check duplicate
  // save answer
  // calculate score

  ack({
    success: true,
  });
});
```

**Kết quả:**  
Answer được lưu và Student biết submit thành công.

---

## Stage 7 - Answer Progress

**Mục tiêu:**  
Teacher theo dõi số Student đã trả lời.

Sau mỗi answer hợp lệ:

```js
io.to(teacherSocketId).emit("answer:progress", {
  answered: 4,
  total: 6,
});
```

Teacher nhận:

```js
socket.on("answer:progress", (progress) => {
  // show 4 / 6 answered
});
```

**Kết quả:**  
Teacher thấy progress realtime.

---

## Stage 8 - Next Question

**Mục tiêu:**  
Teacher chuyển sang câu tiếp theo.

Teacher gửi:

```js
socket.emit("question:next", {
  sessionId,
});
```

Server nhận:

```js
socket.on("question:next", async ({ sessionId }) => {
  // validate teacher
  // currentQuestionIndex++
});
```

Server broadcast:

```js
io.to(`session:${sessionId}`).emit("question:changed", nextQuestion);
```

**Kết quả:**  
Tất cả Student chuyển sang câu tiếp theo.

---

## Stage 9 - Reconnect

**Mục tiêu:**  
Student quay lại session sau khi mất kết nối.

Student reconnect và yêu cầu state hiện tại:

```js
socket.emit("session:sync", {
  sessionId,
  participantId,
});
```

Server trả về:

```js
socket.emit("session:snapshot", {
  status: "ACTIVE",
  currentQuestion,
  currentQuestionIndex,
  hasAnsweredCurrentQuestion,
});
```

Student nhận:

```js
socket.on("session:snapshot", (snapshot) => {
  // restore UI
});
```

**Kết quả:**  
Student quay lại đúng trạng thái hiện tại của quiz.

---

## Stage 10 - Finish Quiz

**Mục tiêu:**  
Teacher kết thúc Live Quiz.

Teacher gửi:

```js
socket.emit("session:finish", {
  sessionId,
});
```

Server nhận:

```js
socket.on("session:finish", async ({ sessionId }) => {
  // ACTIVE -> FINISHED
  // calculate final results
  // save results
});
```

Server broadcast:

```js
io.to(`session:${sessionId}`).emit("session:finished");
```

**Kết quả:**  
Tất cả client biết session đã kết thúc.

---

## Stage 11 - Result

**Mục tiêu:**  
Hiển thị kết quả sau khi quiz kết thúc.

Server gửi kết quả riêng cho từng Student:

```js
studentSocket.emit("student:result", {
  score: 400,
  correct: 4,
  incorrect: 1,
  accuracy: 80,
});
```

Server gửi report cho Teacher:

```js
teacherSocket.emit("session:report", {
  participants: [...]
});
```

**Kết quả:**  
Student thấy kết quả cá nhân, Teacher thấy report toàn session.

---

## Realtime Flow

Create Room  
→ Student Join  
→ Lobby  
→ Start  
→ Question  
→ Submit Answer  
→ Answer Progress  
→ Next Question  
→ Repeat  
→ Finish  
→ Result

## Nguyên tắc xử lý

```text
Client emit event
→ Server nhận event
→ Validate
→ Update state
→ Save data
→ Server emit event mới
→ Client update UI
```

Socket.IO chỉ chịu trách nhiệm giao tiếp realtime. Business logic và trạng thái của Live Session được quản lý bởi QForge Server.

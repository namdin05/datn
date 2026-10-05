import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import {
  addPlayer,
  createRoom,
  currentQuestion,
  findRoomBySocket,
  getRoom,
  publicState,
  quiz,
  resetRoomTimer,
} from "./roomManager.js";
import { publicQuestion } from "./quiz.js";

const app = express();
app.use(cors());
app.get("/health", (_req, res) =>
  res.json({ ok: true, service: "qforge-server" }),
);
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: true, credentials: true },
});
const channel = (room) => `room:${room.roomCode}`;
const fail = (ack, message) => ack?.({ success: false, message });
const ok = (ack, data = {}) => ack?.({ success: true, ...data });
const broadcastState = (room) =>
  io.to(channel(room)).emit("room:state", publicState(room));
const broadcastQuestion = (room) =>
  io
    .to(channel(room))
    .emit(
      "question:changed",
      publicQuestion(currentQuestion(room), room.currentQuestionIndex),
    );
function resultFor(room, player) {
  let correct = 0,
    answered = 0;
  for (const [index, answers] of room.answersByQuestion) {
    const answer = answers.get(player.id);
    if (answer) {
      answered++;
      if (answer.selectedOptionId === quiz.questions[index].correctOptionId)
        correct++;
    }
  }
  return {
    playerId: player.id,
    nickname: player.nickname,
    score: correct * 100,
    correct,
    incorrect: answered - correct,
    accuracy: Math.round((correct / quiz.questions.length) * 100),
  };
}
function finishRoom(room) {
  resetRoomTimer(room);
  room.status = "FINISHED";
  room.results = [...room.players.values()]
    .map((p) => resultFor(room, p))
    .sort((a, b) => b.score - a.score);
  io.to(channel(room)).emit("quiz:finished");
  for (const result of room.results)
    io.to(result.playerId).emit("player:result", result);
  io.to(room.hostSocketId).emit("quiz:report", { participants: room.results });
  broadcastState(room);
}
function startTimer(room) {
  resetRoomTimer(room);
  room.timer = setTimeout(
    () => {
      if (room.status === "ACTIVE") advanceQuestion(room);
    },
    currentQuestion(room).durationSeconds * 1000,
  );
}
function advanceQuestion(room) {
  if (room.currentQuestionIndex >= quiz.questions.length - 1)
    return finishRoom(room);
  room.currentQuestionIndex += 1;
  room.questionStartedAt = Date.now();
  room.answersByQuestion.set(room.currentQuestionIndex, new Map());
  broadcastQuestion(room);
  broadcastState(room);
  startTimer(room);
}

io.on("connection", (socket) => {
  socket.on("room:create", ({ hostName }, ack) => {
    const room = createRoom(socket.id, hostName || "Host");
    socket.join(channel(room));
    const state = publicState(room);
    ok(ack, { roomCode: room.roomCode, state });
    socket.emit("room:created", { roomCode: room.roomCode, state });
  });
  socket.on("room:join", ({ roomCode, nickname }, ack) => {
    const room = getRoom(roomCode);
    if (!room) return fail(ack, "Room not found.");
    if (room.status !== "WAITING")
      return fail(ack, "This quiz has already started.");
    if (!nickname?.trim()) return fail(ack, "Nickname is required.");
    const player = addPlayer(room, socket.id, nickname);
    socket.join(channel(room));
    ok(ack, { state: publicState(room), playerId: player.id });
    io.to(channel(room)).emit("player:joined", {
      playerId: player.id,
      nickname: player.nickname,
    });
    broadcastState(room);
  });
  socket.on("quiz:start", ({ roomCode }, ack) => {
    const room = getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id)
      return fail(ack, "Only the host can start the quiz.");
    if (!room.players.size)
      return fail(ack, "At least one player is required.");
    room.status = "ACTIVE";
    room.currentQuestionIndex = 0;
    room.questionStartedAt = Date.now();
    room.answersByQuestion.set(0, new Map());
    socket.to(channel(room)).emit("quiz:started", { currentQuestionIndex: 0 });
    broadcastQuestion(room);
    broadcastState(room);
    startTimer(room);
    ok(ack);
  });
  socket.on(
    "answer:submit",
    ({ roomCode, questionId, selectedOptionId }, ack) => {
      const room = getRoom(roomCode);
      const question = room && currentQuestion(room);
      if (
        !room ||
        room.status !== "ACTIVE" ||
        !question ||
        question.id !== questionId
      )
        return fail(ack, "Question is no longer active.");
      if (!room.players.has(socket.id))
        return fail(ack, "Only players can submit answers.");
      if (
        Date.now() - room.questionStartedAt >=
        question.durationSeconds * 1000
      )
        return fail(ack, "Time is up.");
      if (!question.options.some((o) => o.id === selectedOptionId))
        return fail(ack, "Invalid option.");
      const answers = room.answersByQuestion.get(room.currentQuestionIndex);
      if (answers.has(socket.id))
        return fail(ack, "You already answered this question.");
      answers.set(socket.id, { selectedOptionId, submittedAt: Date.now() });
      ok(ack);
      socket.emit("answer:accepted", { questionId });
      io.to(room.hostSocketId).emit("answer:progress", {
        answered: answers.size,
        total: room.players.size,
      });
    },
  );
  socket.on("question:next", ({ roomCode }, ack) => {
    const room = getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id)
      return fail(ack, "Only the host can change questions.");
    if (room.status !== "ACTIVE") return fail(ack, "Quiz is not active.");
    advanceQuestion(room);
    ok(ack);
  });
  socket.on("quiz:finish", ({ roomCode }, ack) => {
    const room = getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id)
      return fail(ack, "Only the host can finish the quiz.");
    if (room.status !== "ACTIVE") return fail(ack, "Quiz is not active.");
    finishRoom(room);
    ok(ack);
  });
  socket.on("room:sync", ({ roomCode }, ack) => {
    const room = getRoom(roomCode);
    if (!room) return fail(ack, "Room not found.");
    ok(ack, { state: publicState(room) });
    socket.emit("room:snapshot", {
      state: publicState(room),
      question:
        room.status === "ACTIVE"
          ? publicQuestion(currentQuestion(room), room.currentQuestionIndex)
          : null,
      hasAnsweredCurrentQuestion:
        room.status === "ACTIVE" &&
        room.answersByQuestion.get(room.currentQuestionIndex)?.has(socket.id),
    });
  });
  socket.on("disconnect", () => {
    const room = findRoomBySocket(socket.id);
    if (!room) return;
    if (room.hostSocketId === socket.id) {
      resetRoomTimer(room);
      room.status = "FINISHED";
      io.to(channel(room)).emit("error", {
        message: "Host disconnected; session ended.",
      });
    } else if (room.players.has(socket.id)) {
      room.players.get(socket.id).connected = false;
      io.to(channel(room)).emit("player:left", { playerId: socket.id });
      broadcastState(room);
    }
  });
});
const port = process.env.PORT || 3002;
httpServer.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the existing server or run with another port, for example: $env:PORT=3002; npm run dev`,
    );
    return;
  }
  console.error("QForge server error:", error);
});
httpServer.listen(port, () =>
  console.log(`QForge server listening on http://localhost:${port}`),
);

import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import {
  addPlayer,
  authenticateParticipant,
  createRoom,
  currentQuestion,
  deleteRoom,
  findPlayerBySocket,
  findRoomBySocket,
  getRoom,
  publicState,
  quiz,
  resetHostReconnectTimer,
  resetRoomTimer,
} from "./roomManager.js";
import { publicQuestion } from "./quiz.js";

const HOST_RECONNECT_GRACE_MS = 60_000;

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
  let correct = 0;
  let answered = 0;
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

function snapshotFor(room, identity) {
  const playerId = identity?.role === "player" ? identity.participantId : null;
  return {
    state: publicState(room),
    question:
      room.status === "ACTIVE"
        ? publicQuestion(currentQuestion(room), room.currentQuestionIndex)
        : null,
    hasAnsweredCurrentQuestion:
      Boolean(playerId) &&
      room.status === "ACTIVE" &&
      room.answersByQuestion.get(room.currentQuestionIndex)?.has(playerId),
    result: playerId
      ? room.results?.find((result) => result.playerId === playerId) || null
      : null,
    report:
      identity?.role === "host" && room.results
        ? { participants: room.results }
        : null,
    serverTime: Date.now(),
  };
}

function sendSnapshot(socket, room, identity) {
  socket.emit("room:snapshot", snapshotFor(room, identity));
}

function finishRoom(room) {
  if (room.status === "FINISHED") return;
  resetRoomTimer(room);
  resetHostReconnectTimer(room);
  room.status = "FINISHED";
  room.results = [...room.players.values()]
    .map((player) => resultFor(room, player))
    .sort((a, b) => b.score - a.score);

  io.to(channel(room)).emit("quiz:finished");
  for (const result of room.results) {
    const player = room.players.get(result.playerId);
    if (player?.socketId) io.to(player.socketId).emit("player:result", result);
  }
  if (room.hostSocketId)
    io.to(room.hostSocketId).emit("quiz:report", {
      participants: room.results,
    });
  broadcastState(room);
}

function startTimer(room) {
  resetRoomTimer(room);
  room.timer = setTimeout(() => {
    if (room.status === "ACTIVE") advanceQuestion(room);
  }, currentQuestion(room).durationSeconds * 1000);
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

function scheduleHostReconnect(room) {
  resetHostReconnectTimer(room);
  room.hostReconnectTimer = setTimeout(() => {
    if (room.hostSocketId || room.status === "FINISHED") return;
    if (room.status === "ACTIVE") {
      finishRoom(room);
      return;
    }
    room.status = "FINISHED";
    io.to(channel(room)).emit("error", {
      message: "Host did not reconnect; session ended.",
    });
    broadcastState(room);
  }, HOST_RECONNECT_GRACE_MS);
}

function hostIdentity(room) {
  return {
    role: "host",
    participantId: room.hostParticipantId,
  };
}

io.on("connection", (socket) => {
  socket.on("room:create", ({ hostName } = {}, ack) => {
    const { room, reconnectToken } = createRoom(socket.id, hostName || "Host");
    socket.data.session = {
      role: "host",
      roomCode: room.roomCode,
      participantId: room.hostParticipantId,
    };
    socket.join(channel(room));
    ok(ack, {
      roomCode: room.roomCode,
      state: publicState(room),
      participantId: room.hostParticipantId,
      reconnectToken,
      role: "host",
    });
    socket.emit("room:created", {
      roomCode: room.roomCode,
      state: publicState(room),
    });
  });

  socket.on("room:join", ({ roomCode, nickname } = {}, ack) => {
    const room = getRoom(roomCode);
    if (!room) return fail(ack, "Room not found.");
    if (room.status !== "WAITING")
      return fail(ack, "This quiz has already started.");
    if (!nickname?.trim()) return fail(ack, "Nickname is required.");

    const { player, reconnectToken } = addPlayer(room, socket.id, nickname);
    socket.data.session = {
      role: "player",
      roomCode: room.roomCode,
      participantId: player.id,
    };
    socket.join(channel(room));
    ok(ack, {
      state: publicState(room),
      playerId: player.id,
      participantId: player.id,
      reconnectToken,
      role: "player",
      roomCode: room.roomCode,
    });
    io.to(channel(room)).emit("player:joined", {
      playerId: player.id,
      nickname: player.nickname,
    });
    broadcastState(room);
  });

  socket.on(
    "room:resume",
    ({ roomCode, participantId, reconnectToken, role } = {}, ack) => {
      const room = getRoom(roomCode);
      if (!room) return fail(ack, "Room not found or session expired.");

      const identity = authenticateParticipant(
        room,
        role,
        participantId,
        reconnectToken,
      );
      if (!identity) return fail(ack, "Session is invalid or expired.");

      if (role === "host") {
        resetHostReconnectTimer(room);
        room.hostSocketId = socket.id;
        room.hostDisconnectedAt = null;
      } else {
        identity.player.socketId = socket.id;
        identity.player.connected = true;
        identity.player.disconnectedAt = null;
      }

      socket.data.session = {
        role,
        roomCode: room.roomCode,
        participantId,
      };
      socket.join(channel(room));
      ok(ack, {
        roomCode: room.roomCode,
        state: publicState(room),
        participantId,
        role,
      });
      socket.emit("room:resumed", { roomCode: room.roomCode, role });
      sendSnapshot(socket, room, identity);
      broadcastState(room);
    },
  );

  socket.on("quiz:start", ({ roomCode } = {}, ack) => {
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
    ({ roomCode, questionId, selectedOptionId, actionId } = {}, ack) => {
      const room = getRoom(roomCode);
      const question = room && currentQuestion(room);
      const player = room && findPlayerBySocket(room, socket.id);
      if (
        !room ||
        room.status !== "ACTIVE" ||
        !question ||
        question.id !== questionId
      )
        return fail(ack, "Question is no longer active.");
      if (!player) return fail(ack, "Only players can submit answers.");
      if (
        Date.now() - room.questionStartedAt >=
        question.durationSeconds * 1000
      )
        return fail(ack, "Time is up.");
      if (!question.options.some((option) => option.id === selectedOptionId))
        return fail(ack, "Invalid option.");

      const answers = room.answersByQuestion.get(room.currentQuestionIndex);
      if (answers.has(player.id)) {
        socket.emit("answer:accepted", { questionId });
        return fail(ack, "You already answered this question.");
      }
      answers.set(player.id, {
        actionId: actionId || null,
        selectedOptionId,
        submittedAt: Date.now(),
      });
      ok(ack);
      socket.emit("answer:accepted", { questionId });
      if (room.hostSocketId)
        io.to(room.hostSocketId).emit("answer:progress", {
          answered: answers.size,
          total: room.players.size,
        });
    },
  );

  socket.on("question:next", ({ roomCode } = {}, ack) => {
    const room = getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id)
      return fail(ack, "Only the host can change questions.");
    if (room.status !== "ACTIVE") return fail(ack, "Quiz is not active.");
    advanceQuestion(room);
    ok(ack);
  });

  socket.on("quiz:finish", ({ roomCode } = {}, ack) => {
    const room = getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id)
      return fail(ack, "Only the host can finish the quiz.");
    if (room.status !== "ACTIVE") return fail(ack, "Quiz is not active.");
    finishRoom(room);
    ok(ack);
  });

  socket.on("room:close", ({ roomCode } = {}, ack) => {
    const room = getRoom(roomCode);
    if (!room || room.hostSocketId !== socket.id)
      return fail(ack, "Only the host can close this room.");

    io.to(channel(room)).emit("room:closed", {
      message: "The host closed this room.",
    });
    broadcastState(room);
    ok(ack);
    io.in(channel(room)).socketsLeave(channel(room));
    deleteRoom(room);
  });

  socket.on("room:sync", ({ roomCode } = {}, ack) => {
    const room = getRoom(roomCode);
    if (!room) return fail(ack, "Room not found.");
    const player = findPlayerBySocket(room, socket.id);
    const identity =
      room.hostSocketId === socket.id
        ? hostIdentity(room)
        : player
          ? { role: "player", participantId: player.id, player }
          : null;
    if (!identity) return fail(ack, "You are not connected to this room.");
    ok(ack, { state: publicState(room) });
    sendSnapshot(socket, room, identity);
  });

  socket.on("disconnect", () => {
    const room = findRoomBySocket(socket.id);
    if (!room) return;

    if (room.hostSocketId === socket.id) {
      room.hostSocketId = null;
      room.hostDisconnectedAt = Date.now();
      if (room.status !== "FINISHED") scheduleHostReconnect(room);
      io.to(channel(room)).emit("room:connection", {
        role: "host",
        connected: false,
      });
      broadcastState(room);
      return;
    }

    const player = findPlayerBySocket(room, socket.id);
    if (!player) return;
    player.socketId = null;
    player.connected = false;
    player.disconnectedAt = Date.now();
    io.to(channel(room)).emit("player:left", { playerId: player.id });
    broadcastState(room);
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

import crypto from "node:crypto";
import { quiz } from "./quiz.js";

const rooms = new Map();

const makeCode = () => {
  let value;
  do value = crypto.randomBytes(3).toString("hex").toUpperCase();
  while (rooms.has(value));
  return value;
};

const makeToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token || "")).digest("hex");

export function createRoom(hostSocketId, hostName) {
  const reconnectToken = makeToken();
  const room = {
    roomCode: makeCode(),
    hostSocketId,
    hostParticipantId: crypto.randomUUID(),
    hostReconnectTokenHash: hashToken(reconnectToken),
    hostName: String(hostName || "Host").trim().slice(0, 30) || "Host",
    hostDisconnectedAt: null,
    hostReconnectTimer: null,
    players: new Map(),
    status: "WAITING",
    currentQuestionIndex: -1,
    questionStartedAt: null,
    answersByQuestion: new Map(),
    results: null,
    timer: null,
  };
  rooms.set(room.roomCode, room);
  return { room, reconnectToken };
}

export const getRoom = (code) => rooms.get(String(code || "").toUpperCase());

export function addPlayer(room, socketId, nickname) {
  const reconnectToken = makeToken();
  const player = {
    id: crypto.randomUUID(),
    nickname: String(nickname).trim().slice(0, 30),
    socketId,
    reconnectTokenHash: hashToken(reconnectToken),
    connected: true,
    disconnectedAt: null,
  };
  room.players.set(player.id, player);
  return { player, reconnectToken };
}

export function findRoomBySocket(socketId) {
  return [...rooms.values()].find(
    (room) =>
      room.hostSocketId === socketId ||
      [...room.players.values()].some((player) => player.socketId === socketId),
  );
}

export function findPlayerBySocket(room, socketId) {
  return [...room.players.values()].find((player) => player.socketId === socketId);
}

export function authenticateParticipant(room, role, participantId, token) {
  if (role === "host") {
    if (
      participantId !== room.hostParticipantId ||
      hashToken(token) !== room.hostReconnectTokenHash
    )
      return null;
    return { role, participantId: room.hostParticipantId };
  }

  const player = room.players.get(participantId);
  if (!player || hashToken(token) !== player.reconnectTokenHash) return null;
  return { role: "player", participantId: player.id, player };
}

export function publicState(room) {
  return {
    roomCode: room.roomCode,
    hostName: room.hostName,
    hostConnected: Boolean(room.hostSocketId),
    status: room.status,
    currentQuestionIndex: room.currentQuestionIndex,
    questionStartedAt: room.questionStartedAt,
    players: [...room.players.values()].map((player) => ({
      id: player.id,
      nickname: player.nickname,
      connected: player.connected,
    })),
  };
}

export function currentQuestion(room) {
  return quiz.questions[room.currentQuestionIndex];
}

export function resetRoomTimer(room) {
  if (room.timer) clearTimeout(room.timer);
  room.timer = null;
}

export function resetHostReconnectTimer(room) {
  if (room.hostReconnectTimer) clearTimeout(room.hostReconnectTimer);
  room.hostReconnectTimer = null;
}

export function deleteRoom(room) {
  resetRoomTimer(room);
  resetHostReconnectTimer(room);
  rooms.delete(room.roomCode);
}

export { quiz };

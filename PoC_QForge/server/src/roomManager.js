import crypto from 'node:crypto';
import { quiz } from './quiz.js';
const rooms = new Map();
const makeCode = () => { let value; do value = crypto.randomBytes(3).toString('hex').toUpperCase(); while (rooms.has(value)); return value; };
export function createRoom(hostSocketId, hostName) { const room = { roomCode: makeCode(), hostSocketId, hostName, players: new Map(), status: 'WAITING', currentQuestionIndex: -1, questionStartedAt: null, answersByQuestion: new Map(), results: null, timer: null }; rooms.set(room.roomCode, room); return room; }
export const getRoom = code => rooms.get(String(code || '').toUpperCase());
export function addPlayer(room, socketId, nickname) { const player = { id: socketId, nickname: String(nickname).trim().slice(0, 30), connected: true }; room.players.set(socketId, player); return player; }
export function findRoomBySocket(socketId) { return [...rooms.values()].find(room => room.hostSocketId === socketId || room.players.has(socketId)); }
export function publicState(room) { return { roomCode: room.roomCode, hostName: room.hostName, status: room.status, currentQuestionIndex: room.currentQuestionIndex, questionStartedAt: room.questionStartedAt, players: [...room.players.values()] }; }
export function currentQuestion(room) { return quiz.questions[room.currentQuestionIndex]; }
export function resetRoomTimer(room) { if (room.timer) clearTimeout(room.timer); room.timer = null; }
export { quiz };

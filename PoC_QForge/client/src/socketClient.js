import { io } from "socket.io-client";

export const socket = io(
  import.meta.env.VITE_SERVER_URL || "http://localhost:3002",
  {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  },
);

export function request(event, payload, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (!socket.connected) {
      reject(new Error("Socket is disconnected. Reconnecting..."));
      return;
    }

    const timeout = setTimeout(
      () => reject(new Error(`Request timed out: ${event}`)),
      timeoutMs,
    );
    socket.emit(event, payload, (response) => {
      clearTimeout(timeout);
      resolve(response || { success: true });
    });
  });
}

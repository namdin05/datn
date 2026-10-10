import { io } from 'socket.io-client';
import { realtimeEvents, sessionChangedSchema } from '@qforge/shared';
import type { RealtimeAuth, SessionChanged } from '@qforge/shared';
import { apiUrl } from './api';

export type RealtimeStatus = 'connecting' | 'live' | 'offline';
const FALLBACK_POLL_MS = 10000;
const REJECTED_RETRY_MS = 10000;

// Server -> client notifications only. `onChange(null)` asks the page to re-read its
// snapshot: after (re)connecting, and periodically while the socket is unavailable.
export function subscribeSession(getAuth: () => Promise<RealtimeAuth>, handlers: {
  onChange: (change: SessionChanged | null) => void;
  onStatus: (status: RealtimeStatus) => void;
  onRevoked?: () => void;
}) {
  let closed = false;
  let poll: ReturnType<typeof setInterval> | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  const startPolling = () => { poll ??= setInterval(() => handlers.onChange(null), FALLBACK_POLL_MS); };
  const stopPolling = () => { clearInterval(poll); poll = undefined; };
  // A function runs on every (re)connect, so a Teacher always sends a fresh access token.
  const socket = io(apiUrl, {
    transports: ['websocket'], reconnectionDelayMax: 10000,
    auth: callback => { getAuth().then(callback, () => callback({})); },
  });
  handlers.onStatus('connecting');
  socket.on('connect', () => { stopPolling(); handlers.onStatus('live'); handlers.onChange(null); });
  socket.on('disconnect', () => { if (!closed) { handlers.onStatus('offline'); startPolling(); } });
  socket.on('connect_error', () => {
    handlers.onStatus('offline'); startPolling();
    // A handshake rejection is not retried by Socket.IO itself; REST polling still reports errors.
    if (!socket.active && !closed) { clearTimeout(retry); retry = setTimeout(() => { if (!closed) socket.connect(); }, REJECTED_RETRY_MS); }
  });
  socket.on(realtimeEvents.changed, (payload: unknown) => {
    const change = sessionChangedSchema.safeParse(payload);
    if (change.success) handlers.onChange(change.data);
  });
  socket.on(realtimeEvents.revoked, () => { closed = true; stopPolling(); handlers.onRevoked?.(); });
  return () => { closed = true; stopPolling(); clearTimeout(retry); socket.disconnect(); };
}

export const realtimeLabel: Record<RealtimeStatus, string> = {
  connecting: 'Đang kết nối realtime…',
  live: 'Đang cập nhật trực tiếp',
  offline: 'Mất kết nối realtime, đang thử lại…',
};

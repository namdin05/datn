// Transport-independent port. Services publish only after their transaction has
// committed; the realtime adapter decides which audience to notify.
export type SessionChange =
  | { sessionId: string; reason: 'lifecycle'; stateVersion: number }
  | { sessionId: string; reason: 'roster' | 'answer'; stateVersion: null }
  | { sessionId: string; reason: 'revoked'; participantId: string };

export interface SessionEvents {
  publish(change: SessionChange): void;
}

export const noSessionEvents: SessionEvents = { publish() {} };

// In-process fan-out used by the HTTP server and its Socket.IO adapter.
export function createSessionEventBus() {
  const listeners = new Set<(change: SessionChange) => void>();
  return {
    publish(change: SessionChange) {
      // A failing listener must never fail an already committed command.
      for (const listener of listeners) { try { listener(change); } catch { console.error('SESSION_EVENT_LISTENER_FAILED'); } }
    },
    subscribe(listener: (change: SessionChange) => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}
export type SessionEventBus = ReturnType<typeof createSessionEventBus>;

const SESSION_PREFIX = "qforge:session:";
const ACTIVE_SESSION_KEY = "qforge:active-session";

function makeKey({ roomCode, participantId }) {
  return `${SESSION_PREFIX}${String(roomCode).toUpperCase()}:${participantId}`;
}

export function saveSession(session) {
  const key = makeKey(session);
  localStorage.setItem(key, JSON.stringify({ version: 1, ...session, updatedAt: Date.now() }));
  sessionStorage.setItem(ACTIVE_SESSION_KEY, key);
  return key;
}

export function updateSession(patch) {
  const activeKey = sessionStorage.getItem(ACTIVE_SESSION_KEY);
  if (!activeKey) return null;
  const current = readSessionByKey(activeKey);
  if (!current) return null;
  const next = { ...current, ...patch, updatedAt: Date.now() };
  localStorage.setItem(activeKey, JSON.stringify(next));
  return next;
}

export function loadActiveSession() {
  const activeKey = sessionStorage.getItem(ACTIVE_SESSION_KEY);
  return activeKey ? readSessionByKey(activeKey) : null;
}

export function clearActiveSession() {
  const activeKey = sessionStorage.getItem(ACTIVE_SESSION_KEY);
  if (activeKey) localStorage.removeItem(activeKey);
  sessionStorage.removeItem(ACTIVE_SESSION_KEY);
}

function readSessionByKey(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "null");
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

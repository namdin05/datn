import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { request, socket } from "./socketClient.js";
import {
  clearActiveSession,
  loadActiveSession,
  saveSession,
  updateSession,
} from "./storage.js";

const initial = {
  mode: null,
  roomCode: "",
  state: null,
  question: null,
  result: null,
  report: null,
  selected: null,
  submitted: false,
  progress: null,
  error: "",
};

function App() {
  const [savedSession] = useState(() => loadActiveSession());
  const sessionRef = useRef(savedSession);
  const [app, setApp] = useState(() => ({
    ...initial,
    mode: savedSession?.role || null,
    roomCode: savedSession?.roomCode || "",
    state: savedSession?.lastKnownState || null,
    selected: savedSession?.selectedOptionId || null,
    submitted: Boolean(savedSession?.hasAnsweredCurrentQuestion),
  }));
  const [name, setName] = useState(savedSession?.nickname || "");
  const [joinCode, setJoinCode] = useState(savedSession?.roomCode || "");
  const [connected, setConnected] = useState(socket.connected);
  const [booting, setBooting] = useState(Boolean(savedSession));
  const [now, setNow] = useState(Date.now());

  const mergeSession = (patch) => {
    const next = updateSession(patch);
    if (next) sessionRef.current = next;
    return next;
  };

  useEffect(() => {
    const resume = () => {
      const session = sessionRef.current;
      if (!session) {
        setBooting(false);
        return;
      }
      socket.emit(
        "room:resume",
        {
          roomCode: session.roomCode,
          participantId: session.participantId,
          reconnectToken: session.reconnectToken,
          role: session.role,
        },
        (response) => {
          if (response?.success) {
            setBooting(false);
            return;
          }
          clearActiveSession();
          sessionRef.current = null;
          setBooting(false);
          setApp({ ...initial, error: response?.message || "Session expired." });
        },
      );
    };

    const onConnect = () => {
      setConnected(true);
      resume();
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (error) => {
      setConnected(false);
      setBooting(false);
      setApp((current) => ({ ...current, error: error.message }));
    };
    const onState = (state) => {
      setApp((current) => ({ ...current, state, roomCode: state.roomCode }));
      mergeSession({ lastKnownState: state });
    };
    const onQuestion = (question) => {
      setApp((current) => ({
        ...current,
        question,
        selected: null,
        submitted: false,
        error: "",
      }));
      mergeSession({
        selectedOptionId: null,
        hasAnsweredCurrentQuestion: false,
      });
    };
    const onAccepted = () => {
      setApp((current) => ({ ...current, submitted: true, error: "" }));
      mergeSession({ hasAnsweredCurrentQuestion: true, selectedOptionId: null });
    };
    const onProgress = (progress) =>
      setApp((current) => ({ ...current, progress }));
    const onFinished = () => {
      setApp((current) => ({
        ...current,
        state: current.state && { ...current.state, status: "FINISHED" },
        question: null,
      }));
      mergeSession({ hasAnsweredCurrentQuestion: false });
    };
    const onResult = (result) => {
      setApp((current) => ({ ...current, result }));
    };
    const onReport = (report) =>
      setApp((current) => ({ ...current, report }));
    const onSnapshot = (snapshot) => {
      const selected = snapshot.hasAnsweredCurrentQuestion
        ? null
        : sessionRef.current?.selectedOptionId || null;
      setApp((current) => ({
        ...current,
        mode: sessionRef.current?.role || current.mode,
        roomCode: snapshot.state.roomCode,
        state: snapshot.state,
        question: snapshot.question,
        selected,
        submitted: Boolean(snapshot.hasAnsweredCurrentQuestion),
        result: snapshot.result || current.result,
        report: snapshot.report || current.report,
        error: "",
      }));
      mergeSession({
        lastKnownState: snapshot.state,
        selectedOptionId: selected,
        hasAnsweredCurrentQuestion: Boolean(snapshot.hasAnsweredCurrentQuestion),
      });
    };
    const onError = (error) =>
      setApp((current) => ({ ...current, error: error.message }));
    const onRoomClosed = ({ message } = {}) => {
      clearActiveSession();
      sessionRef.current = null;
      setBooting(false);
      setApp({ ...initial, error: message || "This room has been closed." });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("room:state", onState);
    socket.on("question:changed", onQuestion);
    socket.on("answer:accepted", onAccepted);
    socket.on("answer:progress", onProgress);
    socket.on("quiz:finished", onFinished);
    socket.on("player:result", onResult);
    socket.on("quiz:report", onReport);
    socket.on("room:snapshot", onSnapshot);
    socket.on("error", onError);
    socket.on("room:closed", onRoomClosed);

    if (!socket.connected) socket.connect();
    else resume();

    return () => {
      [
        "connect",
        "disconnect",
        "connect_error",
        "room:state",
        "question:changed",
        "answer:accepted",
        "answer:progress",
        "quiz:finished",
        "player:result",
        "quiz:report",
        "room:snapshot",
        "error",
        "room:closed",
      ].forEach((event) => socket.off(event));
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, []);

  const secondsLeft = useMemo(
    () =>
      app.question
        ? Math.max(
            0,
            Math.ceil(
              (app.question.durationSeconds * 1000 -
                (now - (app.state?.questionStartedAt || now))) /
                1000,
            ),
          )
        : 0,
    [app.question, app.state, now],
  );
  const message = app.error && <div className="alert">{app.error}</div>;

  if (booting)
    return (
      <Shell connected={connected}>
        <section className="hero">
          <p className="eyebrow">QFORGE SESSION</p>
          <h1>Restoring your session...</h1>
          <p className="sub">Reconnecting to room {app.roomCode}.</p>
        </section>
      </Shell>
    );

  if (!app.mode)
    return (
      <Landing
        connected={connected}
        name={name}
        setName={setName}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        onHost={async () => {
          try {
            const response = await request("room:create", {
              hostName: name || "Host",
            });
            if (!response.success) throw new Error(response.message);
            const session = {
              role: "host",
              roomCode: response.roomCode,
              participantId: response.participantId,
              reconnectToken: response.reconnectToken,
              nickname: name || "Host",
              lastKnownState: response.state,
            };
            saveSession(session);
            sessionRef.current = session;
            setApp((current) => ({
              ...current,
              mode: "host",
              roomCode: response.roomCode,
              state: response.state,
              error: "",
            }));
          } catch (error) {
            setApp((current) => ({ ...current, error: error.message }));
          }
        }}
        onJoin={async () => {
          try {
            const response = await request("room:join", {
              roomCode: joinCode,
              nickname: name,
            });
            if (!response.success) throw new Error(response.message);
            const session = {
              role: "player",
              roomCode: response.roomCode || joinCode.toUpperCase(),
              participantId: response.participantId,
              reconnectToken: response.reconnectToken,
              nickname: name,
              lastKnownState: response.state,
            };
            saveSession(session);
            sessionRef.current = session;
            setApp((current) => ({
              ...current,
              mode: "player",
              roomCode: session.roomCode,
              state: response.state,
              error: "",
            }));
          } catch (error) {
            setApp((current) => ({ ...current, error: error.message }));
          }
        }}
      />
    );

  if (app.state?.status === "FINISHED" || app.result || app.report)
    return (
      <Result
        app={app}
        connected={connected}
        onReset={() => {
          clearActiveSession();
          sessionRef.current = null;
          setApp(initial);
        }}
      />
    );

  if (app.mode === "host")
    return (
      <Host
        app={app}
        connected={connected}
        secondsLeft={secondsLeft}
        message={message}
        onStart={async () => {
          try {
            const response = await request("quiz:start", {
              roomCode: app.roomCode,
            });
            if (!response.success) throw new Error(response.message);
          } catch (error) {
            setApp((current) => ({ ...current, error: error.message }));
          }
        }}
        onNext={async () => {
          try {
            const response = await request("question:next", {
              roomCode: app.roomCode,
            });
            if (!response.success) throw new Error(response.message);
          } catch (error) {
            setApp((current) => ({ ...current, error: error.message }));
          }
        }}
        onFinish={async () => {
          try {
            const response = await request("quiz:finish", {
              roomCode: app.roomCode,
            });
            if (!response.success) throw new Error(response.message);
          } catch (error) {
            setApp((current) => ({ ...current, error: error.message }));
          }
        }}
        onClose={async () => {
          if (!window.confirm("Close this room for everyone?")) return;
          try {
            const response = await request("room:close", {
              roomCode: app.roomCode,
            });
            if (!response.success) throw new Error(response.message);
          } catch (error) {
            setApp((current) => ({ ...current, error: error.message }));
          }
        }}
      />
    );

  return (
    <Player
      app={app}
      connected={connected}
      secondsLeft={secondsLeft}
      message={message}
      onSelect={(selected) => {
        setApp((current) => ({ ...current, selected }));
        mergeSession({ selectedOptionId: selected });
      }}
      onSubmit={async () => {
        try {
          const response = await request("answer:submit", {
            roomCode: app.roomCode,
            questionId: app.question.id,
            selectedOptionId: app.selected,
            actionId: crypto.randomUUID(),
          });
          if (!response.success) throw new Error(response.message);
        } catch (error) {
          setApp((current) => ({ ...current, error: error.message }));
        }
      }}
      onSync={async () => {
        try {
          const response = await request("room:sync", {
            roomCode: app.roomCode,
          });
          if (!response.success) throw new Error(response.message);
        } catch (error) {
          setApp((current) => ({ ...current, error: error.message }));
        }
      }}
    />
  );
}

function Shell({ children, connected }) {
  return (
    <main>
      <div className="topbar">
        <div className="brand">
          <span className="logo">Q</span>
          <span>
            QForge <small>REALTIME POC</small>
          </span>
        </div>
        <span className={`connection ${connected ? "online" : ""}`}>
          {connected ? "Connected" : "Disconnected · reconnecting"}
        </span>
      </div>
      {children}
    </main>
  );
}

function Landing({ connected, name, setName, joinCode, setJoinCode, onHost, onJoin }) {
  return (
    <Shell connected={connected}>
      <section className="hero">
        <p className="eyebrow">REALTIME QUIZ LAB</p>
        <h1>
          Make every answer
          <br />
          <em>count.</em>
        </h1>
        <p className="sub">
          A tiny, fast demo of live quiz synchronization with Socket.IO.
        </p>
        <div className="card launch">
          <label>
            Your nickname
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Alex"
            />
          </label>
          <div className="split">
            <button onClick={onHost}>
              Create room <span>→</span>
            </button>
            <div className="join">
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="ROOM PIN"
                maxLength={6}
              />
              <button className="secondary" onClick={onJoin}>
                Join
              </button>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function Host({ app, connected, secondsLeft, message, onStart, onNext, onFinish, onClose }) {
  const active = app.state?.status === "ACTIVE";
  return (
    <Shell connected={connected}>
      <section className="workspace">
        <div className="workspace-head">
          <div>
            <p className="eyebrow">HOST CONTROL ROOM</p>
            <h2>
              Room <strong>{app.roomCode}</strong>
            </h2>
          </div>
          <div className="controls" style={{ marginTop: 0, alignItems: "center" }}>
            <span className={`pill ${active ? "active" : ""}`}>
              {active ? "LIVE" : "WAITING"}
            </span>
            <button className="danger" onClick={onClose}>
              Close room
            </button>
          </div>
        </div>
        {message}
        <div className="grid">
          <div className="card main-card">
            {active && app.question ? (
              <QuestionPreview question={app.question} secondsLeft={secondsLeft} />
            ) : (
              <div className="empty">
                <div className="big-pin">{app.roomCode}</div>
                <h3>Ready when you are.</h3>
                <p>Share this room PIN with your players.</p>
              </div>
            )}
            {active && (
              <div className="controls">
                <button className="secondary" onClick={onNext}>
                  Next question →
                </button>
                <button className="danger" onClick={onFinish}>
                  Finish quiz
                </button>
              </div>
            )}
            {!active && (
              <button onClick={onStart} disabled={!app.state?.players?.length}>
                Start quiz <span>→</span>
              </button>
            )}
          </div>
          <aside className="card sidebar">
            <div className="side-title">
              <h3>Players</h3>
              <span className="count">{app.state?.players?.length || 0}</span>
            </div>
            {app.state?.players?.length ? (
              app.state.players.map((player) => (
                <div className="player" key={player.id}>
                  <span className="avatar">{player.nickname[0]?.toUpperCase()}</span>
                  {player.nickname}
                  <span className={`dot ${player.connected ? "" : "offline"}`} />
                </div>
              ))
            ) : (
              <p className="muted">Waiting for players to join...</p>
            )}
            {active && (
              <div className="progress">
                <span>Answer progress</span>
                <b>
                  {app.progress?.answered || 0} / {app.progress?.total || app.state.players.length}
                </b>
              </div>
            )}
          </aside>
        </div>
      </section>
    </Shell>
  );
}

function QuestionPreview({ question, secondsLeft }) {
  return (
    <div className="question-preview">
      <div className="question-meta">
        <span>
          Question {question.index + 1} of {question.totalQuestions}
        </span>
        <b className={secondsLeft <= 3 ? "urgent" : ""}>{secondsLeft}s</b>
      </div>
      <h3>{question.text}</h3>
      <div className="options">
        {question.options.map((option, index) => (
          <div className="option" key={option.id}>
            <span>{String.fromCharCode(65 + index)}</span>
            {option.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function Player({ app, connected, secondsLeft, message, onSelect, onSubmit, onSync }) {
  return (
    <Shell connected={connected}>
      <section className="workspace player-view">
        <div className="workspace-head">
          <div>
            <p className="eyebrow">LIVE QUIZ · ROOM {app.roomCode}</p>
            <h2>{app.state?.status === "WAITING" ? "You are in." : "Your turn."}</h2>
          </div>
          <button className="link-button" onClick={onSync}>
            Sync state ↻
          </button>
        </div>
        {message}
        {app.state?.status === "WAITING" && (
          <div className="card waiting">
            <div className="loader">•••</div>
            <h3>Waiting for the host to start</h3>
            <p>Stay on this screen. Your question will appear here.</p>
            <div className="waiting-players">
              {app.state.players?.length || 0} players in the room
            </div>
          </div>
        )}
        {app.question && (
          <div className="card player-question">
            <div className="question-meta">
              <span>
                Question {app.question.index + 1} of {app.question.totalQuestions}
              </span>
              <b className={secondsLeft <= 3 ? "urgent" : ""}>{secondsLeft}s</b>
            </div>
            <h3>{app.question.text}</h3>
            <div className="answer-options">
              {app.question.options.map((option, index) => (
                <button
                  disabled={app.submitted || secondsLeft === 0}
                  className={app.selected === option.id ? "selected" : ""}
                  onClick={() => onSelect(option.id)}
                  key={option.id}
                >
                  <span>{String.fromCharCode(65 + index)}</span>
                  {option.text}
                </button>
              ))}
            </div>
            <button
              onClick={onSubmit}
              disabled={!app.selected || app.submitted || secondsLeft === 0}
            >
              {app.submitted ? "Answer submitted ✓" : "Submit answer →"}
            </button>
          </div>
        )}
      </section>
    </Shell>
  );
}

function Result({ app, connected, onReset }) {
  const own = app.result;
  const rows = app.report?.participants || (own ? [own] : []);
  return (
    <Shell connected={connected}>
      <section className="workspace result-view">
        <p className="eyebrow">QUIZ COMPLETE</p>
        <h2>Nice work.</h2>
        {own && (
          <div className="score-card">
            <span>Your score</span>
            <strong>{own.score}</strong>
            <p>
              {own.correct} correct · {own.accuracy}% accuracy
            </p>
          </div>
        )}
        <div className="card report">
          <div className="side-title">
            <h3>{app.report ? "Session report" : "Your result"}</h3>
            <span className="count">{rows.length}</span>
          </div>
          {rows.map((row, index) => (
            <div className="result-row" key={row.playerId}>
              <span className="rank">{index + 1}</span>
              <b>{row.nickname}</b>
              <span>{row.correct} correct</span>
              <strong>{row.score}</strong>
            </div>
          ))}
        </div>
        <button onClick={onReset}>Back to start</button>
      </section>
    </Shell>
  );
}

createRoot(document.getElementById("root")).render(<App />);

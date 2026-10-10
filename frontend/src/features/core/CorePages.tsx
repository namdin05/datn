import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { applySnapshot, participantCredentialSchema } from '@qforge/shared';
import type { ParticipantCredential, ParticipantSnapshot, QuizInput } from '@qforge/shared';
import { databaseApi, HttpApiError, sessionGateway, teacherApi } from '../../lib/api';
import { PublicHeader, Footer } from '../../components/Common';
import { PageState } from '../../components/PageState';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

function message(error: unknown) {
  if (error instanceof HttpApiError) return [error.message, ...(error.error.details ?? []).map(d => `${d.field}: ${d.message}`)].join(' · ');
  return error instanceof Error ? error.message : 'Không hoàn thành được yêu cầu.';
}
const emptyQuestion = () => ({ content: '', options: Array.from({ length: 4 }, () => ({ content: '', isCorrect: false })) });
export function QuizEditor() {
  const { id } = useParams(); const navigate = useNavigate();
  const [input, setInput] = useState<QuizInput>({ title: '', description: '', questions: [] });
  const [status, setStatus] = useState('DRAFT'); const [loading, setLoading] = useState(!!id); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!id) { setInput({ title: '', description: '', questions: [] }); setStatus('DRAFT'); setLoading(false); setError(''); setNotice(''); return; }
    setError(''); setNotice('');
    const controller = new AbortController(); setLoading(true);
    databaseApi.quiz(id, controller.signal).then(q => { if (!controller.signal.aborted) { setInput({ title: q.title, description: q.description, questions: q.questions?.map(item => ({ content: item.content, options: item.options.map(o => ({ content: o.content, isCorrect: o.isCorrect })) })) ?? [] }); setStatus(q.status); setLoading(false); } }).catch(e => { if (!controller.signal.aborted) { setError(message(e)); setLoading(false); } });
    return () => controller.abort();
  }, [id]);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { const q = await teacherApi.saveQuiz(input, id); setStatus(q.status); setNotice('Đã lưu bản nháp.'); if (!id) navigate(`/teacher/editor/${q.id}`, { replace: true }); }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  async function publish() {
    if (!id) return; setBusy(true); setError(''); setNotice('');
    try { const saved = await teacherApi.saveQuiz(input, id); const q = await teacherApi.publish(saved.id); setStatus(q.status); setNotice('Đã xuất bản đề.'); } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  async function host() {
    if (!id) return; setBusy(true); setError('');
    try { const s = await teacherApi.host(id); navigate(`/teacher/session/${s.sessionId}`); } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!id || !window.confirm('Xóa đề này?')) return; setBusy(true); setError('');
    try { await teacherApi.remove(id); navigate('/teacher/quizzes'); } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  function editQuestion(index: number, update: Partial<QuizInput['questions'][number]>) { setInput(old => ({ ...old, questions: old.questions.map((q, i) => i === index ? { ...q, ...update } : q) })); }
  if (loading) return <PageState kind="loading" title="Đang tải đề" />;
  return <><div className="page-heading"><h1>{id ? 'Soạn đề thi' : 'Tạo đề thi'}</h1><Link to="/teacher/quizzes">Về danh sách</Link></div>{error && <p role="alert" className="error">{error}</p>}{notice && <p role="status">{notice}</p>}<p>{status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'} · Mỗi câu đúng được 100 điểm</p><form onSubmit={e => { void save(e); }}><fieldset className="editor-fieldset" disabled={busy}><label>Tên đề<Input required maxLength={255} value={input.title} onChange={e => setInput(old => ({ ...old, title: e.target.value }))} /></label><label>Mô tả<Input maxLength={5000} value={input.description} onChange={e => setInput(old => ({ ...old, description: e.target.value }))} /></label>{input.questions.map((q, i) => <section className="card question-editor db-question" key={i}><label>Câu {i + 1}<Input maxLength={5000} value={q.content} onChange={e => editQuestion(i, { content: e.target.value })} /></label><div className="option-editor">{q.options.map((o, j) => <div key={j}><input type="radio" name={`correct-${i}`} checked={o.isCorrect} onChange={() => editQuestion(i, { options: q.options.map((option, k) => ({ ...option, isCorrect: k === j })) })} aria-label={`Đáp án đúng câu ${i + 1}: ${String.fromCharCode(65 + j)}`} /><Input aria-label={`Câu ${i + 1}, lựa chọn ${String.fromCharCode(65 + j)}`} maxLength={2000} value={o.content} onChange={e => editQuestion(i, { options: q.options.map((option, k) => k === j ? { ...option, content: e.target.value } : option) })} /></div>)}</div><Button variant="secondary" onClick={() => setInput(old => ({ ...old, questions: old.questions.filter((_, n) => n !== i) }))}>Xóa câu</Button></section>)}<div className="quiz-actions"><Button variant="secondary" disabled={input.questions.length >= 100} onClick={() => setInput(old => ({ ...old, questions: [...old.questions, emptyQuestion()] }))}>Thêm câu hỏi</Button><Button type="submit">Lưu bản nháp</Button>{id && <Button variant="secondary" onClick={() => { void publish(); }}>Lưu và xuất bản</Button>}{id && status === 'PUBLISHED' && <Button onClick={() => { void host(); }}>Mở phòng từ đề đã lưu</Button>}{id && <Button variant="destructive" onClick={() => { void remove(); }}>Xóa đề</Button>}</div></fieldset></form></>;
}

export function SessionControl() {
  const { id = '' } = useParams();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof teacherApi.snapshot>>>();
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    teacherApi.snapshot(id, controller.signal).then(s => { if (!controller.signal.aborted) { setSnapshot(old => old?.sessionId === s.sessionId && old.stateVersion > s.stateVersion ? old : s); setError(''); } }).catch(e => { if (!controller.signal.aborted) setError(message(e)); });
    return () => controller.abort();
  }, [id, version]);
  async function action(value: 'start' | 'next' | 'finish') {
    if (!snapshot) return; setBusy(true); setError('');
    try { setSnapshot(await teacherApi.action(id, value, snapshot.stateVersion)); } catch (e) { setError(message(e)); setVersion(v => v + 1); } finally { setBusy(false); }
  }
  return <>{error && <p role="alert" className="error">{error}</p>}{!snapshot ? <PageState kind={error ? 'error' : 'loading'} title={error ? 'Không tải được phòng' : 'Đang tải phiên'}><Button onClick={() => setVersion(v => v + 1)}>Thử lại</Button></PageState> : <><h1>{snapshot.title}</h1><p className="pin-display">PIN: <strong>{snapshot.pin}</strong></p><p>{snapshot.status === 'WAITING' ? 'Đang chờ học viên' : snapshot.status === 'ACTIVE' ? `Câu ${snapshot.currentPosition}/${snapshot.totalQuestions}` : 'Đã kết thúc'}</p><div className="quiz-actions"><Button variant="secondary" disabled={busy} onClick={() => setVersion(v => v + 1)}>Cập nhật phòng</Button>{snapshot.status === 'WAITING' && <Button disabled={busy} onClick={() => { void action('start'); }}>Bắt đầu</Button>}{snapshot.status === 'ACTIVE' && <><Button disabled={busy || snapshot.currentPosition === snapshot.totalQuestions} onClick={() => { void action('next'); }}>Câu tiếp theo</Button><Button variant="destructive" disabled={busy} onClick={() => { void action('finish'); }}>Kết thúc</Button></>}</div><h2>{snapshot.participants.length} người tham gia</h2>{!snapshot.participants.length && <PageState title="Chưa có học viên tham gia" description="Chia sẻ mã PIN và cập nhật phòng sau khi học viên vào." />}<div className="card table-wrap"><table><thead><tr><th>Học viên</th><th>Câu hiện tại</th><th>Đúng</th><th>Sai</th><th>Bỏ trống</th><th>Điểm</th><th>Accuracy</th></tr></thead><tbody>{snapshot.participants.map(p => <tr key={p.id}><td>{p.nickname} <small>({p.id.slice(0, 6)})</small></td><td>{p.hasAnsweredCurrentQuestion ? 'Đã trả lời' : 'Chưa trả lời'}</td><td>{p.result?.correct ?? '—'}</td><td>{p.result?.incorrect ?? '—'}</td><td>{p.result?.unanswered ?? '—'}</td><td>{p.result?.score ?? '—'}</td><td>{p.result ? `${p.result.accuracy}%` : '—'}</td></tr>)}</tbody></table></div></>}</>;
}

const credentialKey = (id: string) => `qforge-credential:${id}`;
export function readCredential(id: string): ParticipantCredential | undefined {
  try { const parsed = participantCredentialSchema.safeParse(JSON.parse(sessionStorage.getItem(credentialKey(id)) ?? 'null')); return parsed.success ? parsed.data : undefined; } catch { return undefined; }
}
export function JoinPage() {
  const navigate = useNavigate(); const [pin, setPin] = useState(''); const [nickname, setNickname] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const last = sessionStorage.getItem('qforge-last-session');
  async function join(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      let pending: { pin: string; nickname: string; requestId: string } | undefined;
      try { pending = JSON.parse(sessionStorage.getItem('qforge-pending-join') ?? 'null'); } catch { /* Start a new private retry key. */ }
      if (!pending || pending.pin !== pin || pending.nickname !== nickname.trim()) pending = { pin, nickname: nickname.trim(), requestId: crypto.randomUUID() };
      sessionStorage.setItem('qforge-pending-join', JSON.stringify(pending));
      const c = await sessionGateway.join(pending.pin, pending.nickname, pending.requestId);
      sessionStorage.setItem(credentialKey(c.sessionId), JSON.stringify(c)); sessionStorage.setItem('qforge-last-session', c.sessionId); sessionStorage.removeItem('qforge-pending-join');
      navigate(`/student/session/${c.sessionId}`);
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <><PublicHeader /><main id="main-content" className="welcome"><h1>Tham gia cùng QForge</h1><form className="card join-card" onSubmit={e => { void join(e); }}><label>Mã PIN<Input inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} /></label><label>Tên hiển thị<Input required maxLength={100} value={nickname} onChange={e => setNickname(e.target.value)} /></label><Button type="submit" disabled={busy}>{busy ? 'Đang tham gia…' : 'Tham gia'}</Button>{error && <p role="alert" className="error">{error}</p>}</form>{last && readCredential(last) && <Button variant="secondary" asChild><Link to={`/student/session/${last}`}>Tiếp tục phiên đã tham gia</Link></Button>}</main><Footer /></>;
}

export function StudentSession() {
  const { id = '' } = useParams(); const navigate = useNavigate();
  const credential = useRef(readCredential(id));
  const [snapshot, setSnapshot] = useState<ParticipantSnapshot>(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [version, setVersion] = useState(0);
  const [selection, setSelection] = useState<{ questionId: string; optionId: string }>();
  const generation = useRef(0);
  const submitting = useRef(false);
  const refresh = useCallback(() => setVersion(v => v + 1), []);
  useEffect(() => { credential.current = readCredential(id); setSnapshot(undefined); setSelection(undefined); }, [id]);
  useEffect(() => {
    const c = credential.current; if (!c) return;
    const controller = new AbortController(); const current = ++generation.current;
    sessionGateway.snapshot(c, controller.signal).then(next => { if (!controller.signal.aborted && current === generation.current) { setSnapshot(old => applySnapshot(old, next)); setError(''); } }).catch(e => { if (!controller.signal.aborted && current === generation.current) setError(message(e)); });
    return () => controller.abort();
  }, [id, version]);
  async function submit(optionId: string) {
    const c = credential.current; const q = snapshot?.currentQuestion; if (!c || !q || submitting.current || snapshot.hasAnsweredCurrentQuestion) return;
    submitting.current = true;
    setSelection({ questionId: q.id, optionId });
    setBusy(true); setError(''); ++generation.current;
    try { const next = await sessionGateway.answer(c, q.id, optionId); setSnapshot(old => applySnapshot(old, next)); } catch (e) { setSelection(undefined); setError(message(e)); refresh(); } finally { submitting.current = false; setBusy(false); }
  }
  async function leave() {
    const c = credential.current; if (!c) return; setBusy(true); setError('');
    try { await sessionGateway.revoke(c); sessionStorage.removeItem(credentialKey(id)); sessionStorage.removeItem('qforge-last-session'); navigate('/join'); } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  const q = snapshot?.currentQuestion;
  return <><PublicHeader /><main id="main-content" className="setup-container">{!credential.current ? <PageState title="Chưa có phiên tham gia"><Button asChild><Link to="/join">Nhập PIN để tham gia</Link></Button></PageState> : <>{error && <p role="alert" className="error">{error}</p>}{!snapshot ? <PageState kind={error ? 'error' : 'loading'} title={error ? 'Không tải được phiên' : 'Đang tải phiên'}><Button onClick={refresh}>Thử lại</Button><Link to="/join">Về trang tham gia</Link></PageState> : <><h1>{snapshot.title}</h1><p>Xin chào {snapshot.participant.nickname}</p>{snapshot.status === 'WAITING' && <PageState title="Đang đợi giảng viên bắt đầu" />}{q && <section className="card question-editor"><h2>Câu {q.position}/{snapshot.totalQuestions}: {q.content}</h2><fieldset className="student-options" disabled={busy || snapshot.hasAnsweredCurrentQuestion}>{q.options.map(o => <label className={`student-option ${selection?.questionId === q.id && selection.optionId === o.id ? 'chosen' : ''}`} key={o.id}><input type="radio" name="answer" checked={selection?.questionId === q.id && selection.optionId === o.id} onChange={() => { void submit(o.id); }} /><span>{String.fromCharCode(64 + o.position)}. {o.content}</span></label>)}</fieldset>{busy && <p role="status">Đang lưu câu trả lời…</p>}{snapshot.hasAnsweredCurrentQuestion && <p role="status">Đã lưu câu trả lời. Chờ câu tiếp theo.</p>}</section>}{snapshot.result && <section className="card setup-panel"><h2>Kết quả</h2><p>Điểm: {snapshot.result.score}</p><p>Đúng: {snapshot.result.correct}/{snapshot.result.total} · Sai: {snapshot.result.incorrect} · Bỏ trống: {snapshot.result.unanswered}</p><p>Accuracy: {snapshot.result.accuracy}%</p></section>}<div className="quiz-actions"><Button variant="secondary" disabled={busy} onClick={refresh}>Cập nhật phiên</Button><Button variant="secondary" disabled={busy} onClick={() => { void leave(); }}>Rời phiên</Button></div></>}</>}</main><Footer /></>;
}

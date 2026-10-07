import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { SetupPage } from '../features/setup/SetupPage';
import { demoGateway, metrics, readStore } from '../lib/demo';
import type { Question, Quiz, Session } from '../lib/demo';
import { Icon } from '../components/Icon';
import { ActionButton, notifySuccess } from '../components/Feedback';

function useStore() {
  const [store, setStore] = useState(readStore);
  useEffect(() => {
    const update = () => setStore(readStore());
    window.addEventListener('storage', update); window.addEventListener('qforge-update', update);
    return () => { window.removeEventListener('storage', update); window.removeEventListener('qforge-update', update); };
  }, []);
  return store;
}
function Brand() { return <Link to="/" className="brand"><span className="brand-mark"><Icon name="◇" /></span>QForge</Link>; }
function Badge({ children, tone = '' }: { children: ReactNode; tone?: string }) { return <span className={`badge ${tone}`}>{children}</span>; }
function PublicHeader() { return <header className="public-header"><Brand /><nav><Link to="/login">Đăng nhập</Link><Link className="button small" to="/login?mode=register">Đăng ký</Link></nav></header>; }
function ErrorMessage({ message }: { message: string }) { return message ? <p className="error" role="alert">{message}</p> : null; }
function Footer() { return <footer>© 2026 QForge · Cùng học, cùng tiến bộ.</footer>; }

function Welcome() {
  const [pin, setPin] = useState(''); const [name, setName] = useState(''); const [error, setError] = useState(''); const navigate = useNavigate();
  function join(e: FormEvent) {
    e.preventDefault();
    try { const identity = demoGateway.join(pin, name); sessionStorage.setItem('qforge-participant', JSON.stringify(identity)); navigate(`/student/session/${identity.sessionId}`); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể vào phòng.'); }
  }
  return <><PublicHeader /><main className="welcome">
    <Badge>● Cổng tham gia trực tiếp sinh viên · <Link to="/login">Bạn là giảng viên? <Icon name="↗" /></Link></Badge>
    <h1>Sẵn sàng chinh phục<br /><em>kiến thức</em> cùng QForge</h1>
    <p className="intro">Nhập mã PIN gồm 6 chữ số do giảng viên cung cấp để vào phòng<br className="desktop-break" /> làm bài tức thì mà không cần tạo tài khoản.</p>
    <form className="join-card card" onSubmit={join}>
      <div className="label-line"><label htmlFor="pin"><Icon name="▣" /> MÃ PHÒNG THI (PIN)</label><span>{pin.length} / 6 chữ số</span></div>
      <div className="pin-control"><input id="pin" aria-label="Mã PIN 6 chữ số" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} required value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }} /><div className="pin-boxes" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i} className={i === pin.length ? 'focused' : ''}>{pin[i]}</span>)}</div></div>
      <label>Họ và tên <b>*</b><input placeholder="Ví dụ: Nguyễn Văn Nam" value={name} onChange={e => setName(e.target.value)} maxLength={100} required /></label>
      <ErrorMessage message={error} /><button className="button full">Vào phòng thi ngay <span><Icon name="→" /></span></button><p className="tiny centered">Không cần tài khoản · Tham gia bằng mã PIN</p>
    </form>
    <div className="welcome-features">{[['◇', 'Không cần đăng nhập', 'Tham gia lớp học trực tiếp chỉ với mã PIN và tên của bạn.'], ['↻', 'Đồng bộ từng giây', 'Theo dõi câu hỏi và tiến độ trong cùng một phiên học.'], ['▤', 'Kết quả trực quan', 'Xem điểm số và độ chính xác sau khi phiên học kết thúc.']].map(([icon, title, body]) => <article key={title}><span className="feature-icon"><Icon name={String(icon)} /></span><h3>{title}</h3><p>{body}</p></article>)}</div>
    <div className="teacher-invite"><div><strong>Bạn muốn tổ chức một giờ học thú vị?</strong><p>Tạo đề và mở phòng trong không gian giảng viên.</p></div><Link to="/login">Trở thành giảng viên <Icon name="→" /></Link></div>
  </main><Footer /></>;
}
function Login() {
  const [params] = useSearchParams(); const [register, setRegister] = useState(params.get('mode') === 'register'); const [email, setEmail] = useState(''); const [show, setShow] = useState(false); const navigate = useNavigate();
  function submit(e: FormEvent) { e.preventDefault(); sessionStorage.setItem('qforge-teacher', email); navigate('/teacher/quizzes'); }
  return <><PublicHeader /><main className="auth-layout"><section className="auth-story"><Badge>● Hệ sinh thái khảo thí chuẩn mực 4.0</Badge><h1>Nền tảng kiểm tra & đánh giá trực tuyến <em>tức thì</em></h1><p>Tạo đề, tổ chức phiên học và theo dõi kết quả trong một không gian giảng dạy đơn giản, trực quan.</p><div className="story-decoration" aria-hidden="true"><span>Q</span><div>Chuẩn bị dễ dàng.<br />Kết nối cả lớp.<br />Hiểu từng kết quả.</div></div></section><section><Link className="auth-join" to="/"><Icon name="▣" /> Nhập mã PIN tham gia nhanh <Icon name="→" /></Link><form className="card auth-card" onSubmit={submit}>
    <div className="segmented"><button type="button" aria-pressed={!register} className={!register ? 'selected' : ''} onClick={() => setRegister(false)}><Icon name="↪" /> Đăng nhập</button><button type="button" aria-pressed={register} className={register ? 'selected' : ''} onClick={() => setRegister(true)}><Icon name="＋" /> Đăng ký tài khoản</button></div>
    <p className="eyebrow">KHÔNG GIAN GIẢNG VIÊN</p><h2>{register ? 'Bắt đầu cùng QForge' : 'Chào mừng trở lại'}</h2>
    {register && <label>Họ và tên<input required placeholder="Tên giảng viên" /></label>}
    <label>Email hoặc tên tài khoản <b>*</b><input type="email" required placeholder="tengv@daihoc.edu.vn" value={email} onChange={e => setEmail(e.target.value)} /></label>
    <label>Mật khẩu <b>*</b><div className="password-field"><input type={show ? 'text' : 'password'} required minLength={6} placeholder="Ít nhất 6 ký tự" autoComplete={register ? 'new-password' : 'current-password'} /><button type="button" aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShow(!show)}><Icon name={show ? 'eyeOff' : 'eye'} /></button></div></label>
    <p className="auth-demo">Đăng nhập demo: dùng email và mật khẩu bất kỳ (6 ký tự trở lên). Không dùng thông tin thật.</p><button className="button full">{register ? 'Tạo tài khoản demo' : 'Vào không gian giảng viên'} <Icon name="→" /></button><p className="tiny centered">Student tham gia bằng PIN, không cần tài khoản.</p>
  </form></section></main><Footer /></>;
}
function TeacherLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return <div className="teacher-shell"><aside className="sidebar"><Brand /><nav><NavLink aria-label="Dashboard" to="/teacher/quizzes"><Icon name="▦" /> <span>Home / Dashboard</span></NavLink><NavLink aria-label="Tạo đề mới" to="/teacher/editor/new"><Icon name="▤" /> <span>My Quizzes</span></NavLink><NavLink aria-label="Phiên trực tiếp" to="/teacher/sessions"><Icon name="◉" /> <span>Live Sessions</span></NavLink><NavLink aria-label="Báo cáo" to="/teacher/reports"><Icon name="▥" /> <span>Reports</span></NavLink></nav><div className="sidebar-bottom"><span className="avatar">GV</span><div><strong>Giảng viên QForge</strong><small>Không gian giảng dạy</small></div><button className="icon-button" aria-label="Đăng xuất" onClick={() => { sessionStorage.removeItem('qforge-teacher'); navigate('/login'); }}><Icon name="↪" /></button></div></aside><div className="teacher-body"><header className="teacher-header"><span>QForge <span className="muted"> / </span> Không gian giảng viên</span><div><Link to="/" className="muted">Cổng sinh viên <Icon name="↗" /></Link><span className="avatar">GV</span></div></header><main key={window.location.pathname} className="teacher-main">{children}</main></div></div>;
}
function RequireTeacher({ children }: { children: ReactNode }) { return sessionStorage.getItem('qforge-teacher') ? <TeacherLayout>{children}</TeacherLayout> : <Navigate to="/login" replace />; }
function Dashboard() {
  const { quizzes, sessions } = useStore(); const [search, setSearch] = useState(''); const [error, setError] = useState(''); const navigate = useNavigate();
  function host(q: Quiz) { const session = demoGateway.createSession(q); navigate(`/teacher/session/${session.id}`); }
  const filtered = quizzes.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));
  return <><div className="page-heading"><div><p className="eyebrow">KHÔNG GIAN GIẢNG DẠY · QFORGE</p><h1>Chào mừng trở lại, Giảng viên <span className="wave"><Icon name="✦" /></span></h1><p className="muted">Sẵn sàng tạo nên một giờ học thú vị cho cả lớp?</p></div><Link className="button" to="/teacher/editor/new"><Icon name="＋" /> Tạo đề thi mới</Link></div>
    <div className="stats">{[['TỔNG SỐ ĐỀ THI', quizzes.length, 'bộ đề', '▤'], ['ĐỀ ĐÃ CÔNG BỐ', quizzes.filter(q => q.published).length, 'sẵn sàng sử dụng', '⚑'], ['PHIÊN LÀM BÀI', sessions.length, 'phiên đã tạo', '♧'], ['NGƯỜI THAM GIA', sessions.reduce((n, s) => n + s.participants.length, 0), 'trong các phiên', '◎']].map(([title, count, unit, icon]) => <article className="card stat" key={title}><div><p className="eyebrow">{title}</p><span className="stat-icon"><Icon name={String(icon)} /></span></div><p><strong>{count}</strong> <small>{unit}</small></p><div className="stat-line" /></article>)}</div>
    <div className="section-heading"><div><h2>Đề thi của tôi</h2><p className="muted">Chuẩn bị, chỉnh sửa và bắt đầu một phiên học mới.</p></div><input className="search" aria-label="Tìm đề thi" placeholder="⌕ Tìm kiếm đề thi…" value={search} onChange={e => setSearch(e.target.value)} /></div><ErrorMessage message={error} />
    <div className="quiz-grid">{filtered.map(q => <article className="card quiz-card" key={q.id}><div className="between"><Badge tone={q.published ? 'orange' : ''}>{q.published ? '● Đã xuất bản' : '● Bản nháp'}</Badge><small>{q.questions.length} câu hỏi</small></div><h3>{q.title}</h3><p>{q.description}</p><div className="quiz-meta"><Icon name="◷" /> Single-choice · 4 lựa chọn</div><div className="quiz-actions"><Link className="button secondary small" to={`/teacher/editor/${q.id}`}><Icon name="✎" /> Chỉnh sửa</Link><button className="button small" disabled={!q.published} onClick={() => host(q)}><Icon name="▷" /> Bắt đầu thi</button><button className="icon-button" aria-label={`Xóa ${q.title}`} onClick={() => { if (window.confirm(`Xóa đề “${q.title}”?`)) { try { demoGateway.deleteQuiz(q.id); } catch (e) { setError((e as Error).message); } } }}><Icon name="×" /></button></div></article>)}</div>
    {!filtered.length && <div className="empty">Không tìm thấy đề thi. <Link to="/teacher/editor/new">Tạo đề mới <Icon name="→" /></Link></div>}<SessionList sessions={sessions.slice(0, 5)} title="Phiên thi trực tiếp gần đây" />
  </>;
}
function SessionList({ sessions, title }: { sessions: Session[]; title: string }) {
  return <section className="session-list"><div className="section-heading"><div><h2>{title}</h2><p className="muted">Theo dõi phiên học và xem kết quả của lớp.</p></div></div>{sessions.length ? <div className="card table-wrap"><table><thead><tr><th>MÃ PIN</th><th>TÊN ĐỀ THI</th><th>TRẠNG THÁI</th><th>THAM GIA</th><th>THAO TÁC</th></tr></thead><tbody>{sessions.map(s => <tr key={s.id}><td className="pin-text">{s.pin}</td><td>{s.quiz.title}</td><td><Badge tone={s.status === 'ACTIVE' ? 'orange' : ''}>{s.status === 'WAITING' ? 'Đang chờ' : s.status === 'ACTIVE' ? 'Đang diễn ra' : 'Đã kết thúc'}</Badge></td><td>{s.participants.length} sinh viên</td><td><Link className="button secondary small" to={`/teacher/session/${s.id}`}>{s.status === 'FINISHED' ? 'Xem báo cáo' : 'Vào phòng'} <Icon name="→" /></Link></td></tr>)}</tbody></table></div> : <div className="card empty">Chưa có phiên học. Chọn một đề đã xuất bản để mở phòng.</div>}</section>;
}
function TeacherSessions({ reports = false }: { reports?: boolean }) { const { sessions } = useStore(); return <SessionList title={reports ? 'Báo cáo kết quả' : 'Phiên thi trực tiếp'} sessions={reports ? sessions.filter(s => s.status === 'FINISHED') : sessions} />; }
function newQuestion(): Question { return { id: crypto.randomUUID(), text: '', options: ['', '', '', ''], correct: 0 }; }
function EditorLoader() { const { id } = useParams(); const { quizzes } = useStore(); const existing = quizzes.find(q => q.id === id); return id !== 'new' && !existing ? <div className="empty">Không tìm thấy đề thi. <Link to="/teacher/quizzes">Về dashboard</Link></div> : <Editor key={id} existing={existing} />; }
function Editor({ existing }: { existing?: Quiz }) {
  const { id } = useParams(); const { sessions } = useStore(); const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz>(() => existing ? structuredClone(existing) : { id: crypto.randomUUID(), title: '', description: '', published: false, questions: [newQuestion()] });
  const [index, setIndex] = useState(0); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const q = quiz.questions[index];
  const locked = sessions.some(s => s.quiz.id === quiz.id && s.status !== 'FINISHED');
  function updateQuestion(next: Question) { setQuiz({ ...quiz, published: false, questions: quiz.questions.map((item, i) => i === index ? next : item) }); setMessage(''); }
  function save(publish: boolean) {
    setError('');
    if (!quiz.title.trim()) { setError('Nhập tiêu đề đề thi.'); return; }
    if (publish && (!quiz.questions.length || quiz.questions.some(q => !q.text.trim() || q.options.length !== 4 || q.options.some(o => !o.trim()) || q.correct < 0 || q.correct > 3))) { setError('Mỗi câu cần nội dung, đủ 4 lựa chọn và một đáp án đúng trước khi xuất bản.'); return; }
    demoGateway.saveQuiz({ ...quiz, published: publish }); notifySuccess(publish ? 'Đã xuất bản đề thi' : 'Đã lưu bản nháp'); setQuiz({ ...quiz, published: publish }); setMessage(publish ? 'Đã xuất bản đề thi. Bạn có thể bắt đầu phiên học.' : 'Đã lưu bản nháp.');
    if (id === 'new') navigate(`/teacher/editor/${quiz.id}`, { replace: true });
  }
  return <><div className="editor-top"><Link to="/teacher/quizzes"><Icon name="←" /> Đề thi của tôi</Link><Badge>{quiz.published ? 'Đã xuất bản' : 'Bản nháp'}</Badge><div><Link className="button secondary small" to="/teacher/quizzes">Hủy bỏ</Link><button className="button secondary small" disabled={locked} onClick={() => save(false)}><Icon name="▣" /> Lưu bản nháp</button><button className="button small" disabled={locked} onClick={() => save(true)}><Icon name="↗" /> Xuất bản đề thi</button></div></div>
    {locked && <p className="error">Đề đang có phiên trực tiếp. Kết thúc phiên trước khi chỉnh sửa.</p>}<ErrorMessage message={error} />{message && <p className="success" role="status">{message}</p>}
    <fieldset disabled={locked} className="editor-fieldset"><div className="quiz-info"><label><Icon name="✦" /> TIÊU ĐỀ ĐỀ THI<input value={quiz.title} placeholder="Nhập tiêu đề đề thi" onChange={e => setQuiz({ ...quiz, title: e.target.value, published: false })} maxLength={255} /></label><label>MÔ TẢ CHI TIẾT<input value={quiz.description} placeholder="Đề thi này giúp sinh viên ôn tập điều gì?" onChange={e => setQuiz({ ...quiz, description: e.target.value, published: false })} /></label></div>
    <div className="editor-grid"><aside className="question-list"><p className="eyebrow"><Icon name="☷" /> DANH SÁCH CÂU HỎI <Badge>{quiz.questions.length}</Badge></p>{quiz.questions.map((item, i) => <button key={item.id} className={i === index ? 'active' : ''} onClick={() => setIndex(i)}><span>{i + 1}</span><div>{item.text || 'Câu hỏi mới'}<small>{item.text && item.options.every(Boolean) ? 'Đã nhập nội dung' : 'Chưa hoàn thành'}</small></div></button>)}<button className="add-question" onClick={() => { setQuiz({ ...quiz, published: false, questions: [...quiz.questions, newQuestion()] }); setIndex(quiz.questions.length); }}><Icon name="＋" /> Thêm câu hỏi mới</button><div className="hint">Mỗi câu có 4 lựa chọn.<br />Chọn đúng một đáp án đúng.</div></aside>
    {q && <section className="card question-editor"><div className="between"><h2>Câu hỏi {index + 1} / {quiz.questions.length}</h2><Badge>Single-Choice</Badge><button className="text-danger" disabled={quiz.questions.length === 1} onClick={() => { setQuiz({ ...quiz, published: false, questions: quiz.questions.filter(item => item.id !== q.id) }); setIndex(Math.max(0, index - 1)); }}><Icon name="×" /> Xóa câu hỏi</button></div>
      <label className="question-text-label">NỘI DUNG CÂU HỎI<textarea value={q.text} placeholder="Nhập nội dung câu hỏi…" rows={4} onChange={e => updateQuestion({ ...q, text: e.target.value })} /></label><p className="eyebrow">ĐÁP ÁN LỰA CHỌN · CHỌN MỘT ĐÁP ÁN ĐÚNG</p>
      <div className="option-editor">{q.options.map((option, i) => <div className={q.correct === i ? 'correct' : ''} key={i}><input type="radio" name="correct" aria-label={`Đặt ${'ABCD'[i]} là đáp án đúng`} checked={q.correct === i} onChange={() => updateQuestion({ ...q, correct: i })} /><span className="option-letter">{'ABCD'[i]}</span><input aria-label={`Nội dung đáp án ${'ABCD'[i]}`} value={option} placeholder={`Nhập đáp án ${'ABCD'[i]}`} onChange={e => updateQuestion({ ...q, options: q.options.map((o, j) => j === i ? e.target.value : o) })} />{q.correct === i && <small><Icon name="✓" /> Đáp án đúng</small>}</div>)}</div><div className="hint"><Icon name="◇" /> Sinh viên chỉ chọn một đáp án. Mỗi câu đúng được 100 điểm.</div>
      <div className="editor-bottom"><button className="button secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}><Icon name="←" /> Câu trước</button><button className="button secondary" disabled={index === quiz.questions.length - 1} onClick={() => setIndex(index + 1)}>Câu tiếp <Icon name="→" /></button><button className="button" onClick={() => save(false)}>Lưu bản nháp</button></div>
    </section>}</div></fieldset>
  </>;
}
function Participants({ session, questionId }: { session: Session; questionId?: string }) { return <div className="participant-grid">{session.participants.map(p => <div className="person" key={p.id}><span className="avatar">{p.name.split(' ').slice(-2).map(w => w[0]).join('')}</span><div><strong>{p.name}</strong><small><i className="online-dot" /> {questionId && p.answers[questionId] !== undefined ? 'Đã nộp' : questionId ? 'Đang trả lời' : 'Đã vào phòng'}</small></div></div>)}{!session.participants.length && <p className="muted">Chưa có sinh viên. Chia sẻ PIN để mời cả lớp.</p>}</div>; }
function Result({ session, participantId }: { session: Session; participantId?: string }) {
  const people = participantId ? session.participants.filter(p => p.id === participantId) : session.participants;
  return <><div className="result-heading"><span className="celebration"><Icon name="✦" /></span><Badge tone="green">Phiên học đã kết thúc</Badge><h1>{participantId ? 'Bạn đã hoàn thành!' : 'Báo cáo phiên học'}</h1><p className="muted">{session.quiz.title}</p></div><div className="card table-wrap"><table><thead><tr><th>SINH VIÊN</th><th>ĐÚNG</th><th>SAI</th><th>CHƯA TRẢ LỜI</th><th>ĐIỂM</th><th>ACCURACY</th></tr></thead><tbody>{people.map(p => { const m = metrics(session, p); return <tr key={p.id}><td>{p.name}</td><td>{m.correct}</td><td>{m.incorrect}</td><td>{m.unanswered}</td><td className="pin-text">{m.score}</td><td>{m.accuracy}%</td></tr>; })}</tbody></table>{!people.length && <p className="empty">Phiên chưa có người tham gia.</p>}</div><div className="centered result-return"><Link className="button" to={participantId ? '/' : '/teacher/quizzes'}>Về {participantId ? 'trang chủ' : 'dashboard'} <Icon name="→" /></Link></div></>;
}
function TeacherLive() {
  const { id } = useParams(); const { sessions } = useStore(); const s = sessions.find(s => s.id === id); const [copied, setCopied] = useState(false); const [copyError, setCopyError] = useState('');
  if (!s) return <div className="empty">Không tìm thấy phiên học. <Link to="/teacher/quizzes">Về dashboard</Link></div>;
  if (s.status === 'FINISHED') return <Result session={s} />;
  const q = s.quiz.questions[s.current]; const count = s.participants.filter(p => q && p.answers[q.id] !== undefined).length;
  return <><section className="card live-banner"><div><Badge tone={s.status === 'ACTIVE' ? 'red' : 'green'}>● {s.status === 'ACTIVE' ? 'ĐANG PHÁT TRỰC TIẾP (LIVE)' : 'PHÒNG CHỜ'}</Badge><p className="pin-display">MÃ PIN: <strong>{s.pin.slice(0, 3)} {s.pin.slice(3)}</strong><button className="icon-button" aria-label="Sao chép PIN" onClick={() => { void navigator.clipboard.writeText(s.pin).then(() => setCopied(true)).catch(() => setCopyError('Không thể sao chép tự động. Hãy chọn mã PIN để sao chép.')); }}><Icon name={copied ? '✓' : '▣'} /></button></p></div><div><p className="eyebrow">KỲ THI TRỰC TUYẾN</p><h2>{s.quiz.title}</h2></div>{s.status === 'ACTIVE' && <button className="button danger small" onClick={() => { if (window.confirm('Kết thúc phiên và mở kết quả cho sinh viên?')) demoGateway.action(s.id, 'finish'); }}><Icon name="⊗" /> Kết thúc phiên thi</button>}</section><ErrorMessage message={copyError} />
    {s.status === 'WAITING' ? <div className="live-grid"><section className="card live-question"><h2>Sinh viên trong sảnh chờ</h2><p className="muted">Chia sẻ PIN cho lớp. Mở cổng sinh viên trên một tab cùng trình duyệt để thử demo.</p><Participants session={s} /><Link className="button secondary" to="/" target="_blank">Mở cổng sinh viên <Icon name="↗" /></Link></section><section className="card waiting-control"><div className="hourglass"><Icon name="◷" /></div><h2>Sẵn sàng bắt đầu?</h2><p>{s.participants.length} sinh viên đã vào phòng</p><p className="muted">{s.quiz.questions.length} câu hỏi · Single-choice · 100 điểm/câu</p><button className="button full" onClick={() => demoGateway.action(s.id, 'start')}><Icon name="▷" /> Bắt đầu phiên học</button></section></div>
    : q && <div className="live-grid"><section className="card live-question"><div className="between"><Badge tone="orange">CÂU HỎI {s.current + 1} / {s.quiz.questions.length}</Badge><Badge>Chế độ Giảng viên điều khiển</Badge></div><p className="eyebrow">ĐỀ BÀI</p><h1>{q.text}</h1><div className="teacher-options">{q.options.map((o, i) => <div className={q.correct === i ? 'correct' : ''} key={i}><span className="option-letter">{'ABCD'[i]}</span><span>{o}</span>{q.correct === i && <Badge tone="orange">ĐÁP ÁN ĐÚNG</Badge>}</div>)}</div></section><aside className="live-side"><section className="card"><p className="eyebrow">TIẾN ĐỘ NỘP BÀI</p><h2>{count} / {s.participants.length} <small>sinh viên</small></h2><progress value={count} max={Math.max(1, s.participants.length)} /><p className="muted">● {count} đã hoàn thành · {s.participants.length - count} đang trả lời</p></section><section className="card"><div className="between"><h3>Trạng thái phòng thi</h3><Badge>{s.participants.length} tham gia</Badge></div><Participants session={s} questionId={q.id} /></section><section className="card"><p className="muted">Chuyển câu khi cả lớp đã sẵn sàng.</p><button className="button full" onClick={() => demoGateway.action(s.id, 'next')}>{s.current === s.quiz.questions.length - 1 ? 'Hoàn thành phiên' : 'Chuyển câu hỏi kế tiếp'} <Icon name="→" /></button></section></aside></div>}
  </>;
}
function StudentSession() {
  const { id } = useParams(); const { sessions } = useStore();
  let identity: { sessionId: string; participantId: string } | null = null;
  try { identity = JSON.parse(sessionStorage.getItem('qforge-participant') ?? 'null'); } catch { /* No saved identity. */ }
  const s = sessions.find(s => s.id === id); const p = s?.participants.find(p => p.id === identity?.participantId);
  if (!s || !p || identity?.sessionId !== id) return <><PublicHeader /><div className="empty">Bạn chưa tham gia phòng này. <Link to="/">Nhập PIN <Icon name="→" /></Link></div></>;
  return <><header className="student-header"><Brand /><div><Badge tone="green">● Demo cùng trình duyệt</Badge><span className="avatar">{p.name[0]}</span><strong>{p.name}</strong></div></header><main className="student-main">{s.status === 'FINISHED' ? <Result session={s} participantId={p.id} /> : s.status === 'WAITING' ? <Lobby session={s} participantId={p.id} /> : <StudentQuestion key={s.quiz.questions[s.current]?.id} session={s} participantId={p.id} />}</main><Footer /></>;
}
function Lobby({ session: s, participantId }: { session: Session; participantId: string }) {
  const navigate = useNavigate();
  return <><div className="card student-room-bar"><div><p className="eyebrow">PHÒNG THI TRỰC TUYẾN</p><strong>PIN: {s.pin.slice(0, 3)} {s.pin.slice(3)}</strong></div><button className="text-danger" onClick={() => { demoGateway.leave(s.id, participantId); sessionStorage.removeItem('qforge-participant'); navigate('/'); }}><Icon name="↪" /> Rời phòng thi</button></div><div className="lobby-grid"><section className="card lobby-info"><Badge tone="orange">HỌC PHẦN · KIỂM TRA KIẾN THỨC</Badge><h1>{s.quiz.title}</h1><p className="muted">{s.quiz.description}</p><div className="lobby-facts"><div><small><Icon name="♧" /> Giảng viên</small><strong>Giảng viên QForge</strong></div><div><small><Icon name="▤" /> Định dạng đề</small><strong>{s.quiz.questions.length} câu trắc nghiệm</strong></div><div><small><Icon name="◎" /> Cách tính điểm</small><strong>100 điểm / câu đúng</strong></div></div><div className="hint"><Icon name="◇" /> Chọn một trong bốn đáp án A, B, C, D rồi nhấn gửi. Mỗi câu chỉ được nộp một lần.</div></section><section className="waiting-card"><Badge>● Máy chủ demo</Badge><div className="hourglass"><Icon name="◷" /></div><h2>Đang đợi giảng viên bắt đầu…</h2><p>Trang sẽ tự chuyển sang câu hỏi khi giảng viên mở phiên. Giữ tab này để tham gia.</p><span className="waiting-dots" aria-label="Đang chờ">● ● ●</span></section></div><section className="card lobby-people"><div className="section-heading"><h2>Sinh viên trong sảnh chờ</h2><Badge>{s.participants.length} sinh viên đã vào</Badge></div><Participants session={s} /></section><div className="lobby-tips"><article><h3><Icon name="◉" /> Giữ kết nối</h3><p>Giữ tab mở để nhận câu hỏi của phiên học.</p></article><article><h3><Icon name="◇" /> Một đáp án duy nhất</h3><p>Kiểm tra lựa chọn trước khi gửi câu trả lời.</p></article><article><h3><Icon name="▤" /> Theo dõi kết quả</h3><p>Xem điểm và độ chính xác sau khi kết thúc.</p></article></div></>;
}
function StudentQuestion({ session: s, participantId }: { session: Session; participantId: string }) {
  const [selected, setSelected] = useState<number | null>(null); const [error, setError] = useState(''); const q = s.quiz.questions[s.current]; const p = s.participants.find(p => p.id === participantId); if (!q || !p) return null; const saved = p.answers[q.id];
  return <><section className="card student-room-bar"><div><p className="eyebrow">QFORGE · SESSION LIVE</p><strong>{s.quiz.title}</strong><small>PIN: {s.pin}</small></div><Badge tone="orange">● Đang diễn ra</Badge></section><div className="card student-progress"><span><b>TIẾN ĐỘ BÀI THI</b> · Câu hỏi {s.current + 1} trên {s.quiz.questions.length}</span><div>{s.quiz.questions.map((item, i) => <span key={item.id} className={i <= s.current ? 'active' : ''} />)}</div></div><section className="card student-question"><p className="eyebrow"><Icon name="◇" /> CÂU HỎI SỐ {String(s.current + 1).padStart(2, '0')}</p><h1>{q.text}</h1></section><fieldset className="student-options" disabled={saved !== undefined}><legend className="sr-only">Chọn một đáp án</legend>{q.options.map((option, i) => <label key={i} className={(saved ?? selected) === i ? 'chosen' : ''}><input type="radio" name="answer" value={i} checked={(saved ?? selected) === i} onChange={() => setSelected(i)} /><span className="option-letter">{'ABCD'[i]}</span><span>{option}</span>{(saved ?? selected) === i && <span className="selected-check"><Icon name="✓" /></span>}</label>)}</fieldset><section className="card student-submit"><p role="status">{saved !== undefined ? '✓ Đã ghi nhận câu trả lời. Đợi giảng viên chuyển câu tiếp theo.' : '◇ Chọn một đáp án và gửi khi bạn đã sẵn sàng.'}</p><ActionButton className="button" disabled={selected === null || saved !== undefined} onClick={() => { if (selected !== null) { try { demoGateway.answer(s.id, p.id, q.id, selected); } catch (e) { setError((e as Error).message); } } }}>{saved !== undefined ? 'Đã gửi ✓' : 'Gửi câu trả lời →'}</ActionButton></section><ErrorMessage message={error} /></>;
}
export function App() {
  const location = useLocation();
  const [toast, setToast] = useState('');
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const show = (event: Event) => {
      clearTimeout(timeout);
      setToast((event as CustomEvent<string>).detail);
      timeout = setTimeout(() => setToast(''), 4000);
    };
    window.addEventListener('qforge-toast', show);
    return () => { clearTimeout(timeout); window.removeEventListener('qforge-toast', show); };
  }, []);
  return <><div className="demo-notice">Bản demo giao diện · Dữ liệu lưu trên trình duyệt · Chưa kết nối API nghiệp vụ</div><Routes>
    <Route path="/" element={<Welcome />} /><Route path="/join" element={<Welcome />} /><Route path="/login" element={<Login key={location.search} />} />
    <Route path="/teacher/quizzes" element={<RequireTeacher><Dashboard /></RequireTeacher>} /><Route path="/teacher/editor/:id" element={<RequireTeacher><EditorLoader /></RequireTeacher>} />
    <Route path="/teacher/sessions" element={<RequireTeacher><TeacherSessions /></RequireTeacher>} /><Route path="/teacher/reports" element={<RequireTeacher><TeacherSessions reports /></RequireTeacher>} />
    <Route path="/teacher/session/:id" element={<RequireTeacher><TeacherLive /></RequireTeacher>} /><Route path="/student/session/:id" element={<StudentSession />} />
    <Route path="/setup" element={<div className="setup-container"><SetupPage /></div>} />
    <Route path="*" element={<><PublicHeader /><div className="empty"><h1>Không tìm thấy trang</h1><Link className="button" to="/">Về trang chủ</Link></div></>} />
  </Routes>{toast && <div className="toast" role="status"><span className="toast-check"><Icon name="✓" /></span><span>{toast}</span><button className="icon-button" aria-label="Đóng thông báo" onClick={() => setToast('')}><Icon name="×" /></button></div>}</>;
}

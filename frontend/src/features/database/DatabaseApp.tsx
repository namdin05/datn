import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router';
import type { DbDashboard, DbQuiz, DbSession, DbSessionDetail } from '@qforge/shared';
import { databaseApi } from '../../lib/api';
import { TeacherLayout } from '../../app/layouts/TeacherLayout';
import { RouteEffects } from '../../app/RouteEffects';
import { Badge, PublicHeader, Footer } from '../../components/Common';
import { PageState } from '../../components/PageState';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { SetupPage } from '../setup/SetupPage';
import { LandingPage } from '../landing/LandingPage';

function useResource<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [state,setState] = useState<{data?:T;error?:string;loading:boolean}>({loading:true});
  const [version,setVersion] = useState(0);
  useEffect(()=>{
    const controller = new AbortController();
    setState({loading:true});
    load(controller.signal).then(data=>{if(!controller.signal.aborted)setState({data,loading:false});}).catch(error=>{
      if(!controller.signal.aborted)setState({loading:false,error:error instanceof Error && error.name!=='TypeError' ? error.message : 'Không kết nối được backend. Hãy kiểm tra server và thử lại.'});
    });
    return()=>controller.abort();
  },[load,version]);
  return {...state,reload:()=>setVersion(v=>v+1)};
}
function ResourceState({loading,error,reload}: {loading:boolean;error?:string;reload:()=>void}) {
  return <PageState kind={loading?'loading':'error'} title={loading?'Đang tải dữ liệu DB':'Không thể tải dữ liệu'} description={error}><Button onClick={reload} disabled={loading}>Thử lại</Button></PageState>;
}
function Refresh({reload}: {reload:()=>void}) { return <Button variant="secondary" onClick={reload}>Tải lại dữ liệu</Button>; }
function DevLayout({children}: {children:ReactNode}) {
  return <TeacherLayout><p className="hint">Môi trường test · Đang dùng Teacher mẫu từ DB · Chưa triển khai đăng nhập thật.</p>{children}</TeacherLayout>;
}
function SessionTable({sessions}: {sessions:DbSession[]}) {
  if(!sessions.length)return <PageState title="Chưa có phiên thi trong DB" />;
  return <div className="card table-wrap"><table><thead><tr><th>PIN</th><th>ĐỀ THI</th><th>TRẠNG THÁI</th><th>THAM GIA</th><th></th></tr></thead><tbody>{sessions.map(s=><tr key={s.id}><td className="pin-text">{s.pin}</td><td>{s.title}</td><td><Badge>{s.status==='WAITING'?'Đang chờ':s.status==='ACTIVE'?'Đang diễn ra':'Đã kết thúc'}</Badge></td><td>{s.participantCount}</td><td><Button size="sm" variant="secondary" asChild><Link to={`/teacher/session/${s.id}`}>Xem chi tiết</Link></Button></td></tr>)}</tbody></table></div>;
}
function Dashboard() {
  const resource = useResource<DbDashboard>(databaseApi.dashboard); const [search,setSearch]=useState('');
  if(!resource.data)return <ResourceState {...resource} />;
  const {teacher,quizzes,sessions}=resource.data;
  const filtered=quizzes.filter(q=>q.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <><div className="page-heading"><div><p className="eyebrow">DỮ LIỆU POSTGRESQL</p><h1>Xin chào, {teacher.name}</h1><p className="muted">Đề thi và phiên học được đọc trực tiếp từ DB qua backend.</p></div><Refresh reload={resource.reload}/></div>
    <div className="stats">{[['TỔNG ĐỀ THI',quizzes.length],['ĐÃ XUẤT BẢN',quizzes.filter(q=>q.status==='PUBLISHED').length],['PHIÊN THI',sessions.length],['NGƯỜI THAM GIA',sessions.reduce((n,s)=>n+s.participantCount,0)]].map(([title,count])=><article key={title} className="card stat"><p className="eyebrow">{title}</p><p><strong>{count}</strong></p></article>)}</div>
    <div className="section-heading"><h2>Đề thi của tôi</h2><Input className="search" aria-label="Tìm đề thi" placeholder="Tìm kiếm đề thi…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
    <div className="quiz-grid">{filtered.map(q=><article className="card quiz-card" key={q.id}><div className="between"><Badge tone={q.status==='PUBLISHED'?'orange':''}>{q.status==='PUBLISHED'?'Đã xuất bản':'Bản nháp'}</Badge><small>{q.questionCount} câu hỏi</small></div><h3>{q.title}</h3><p>{q.description}</p><div className="quiz-actions"><Button variant="secondary" size="sm" asChild><Link to={`/teacher/editor/${q.id}`}>Xem câu hỏi</Link></Button></div></article>)}</div>
    {!filtered.length&&<PageState title={quizzes.length?'Không tìm thấy đề thi':'Chưa có đề thi trong DB'} description="Thử đổi từ khóa hoặc tạo dữ liệu qua backend."/>}
    <section className="session-list"><h2>Phiên thi gần đây</h2><SessionTable sessions={sessions.slice(0,5)}/></section></>;
}
function QuizPage() {
  const {id=''}=useParams();const load=useCallback((signal:AbortSignal)=>databaseApi.quiz(id,signal),[id]);const resource=useResource<DbQuiz>(load);
  if(!resource.data)return <ResourceState {...resource}/>;
  const q=resource.data;
  return <><div className="page-heading"><div><Button variant="secondary" asChild><Link to="/teacher/quizzes">Về danh sách</Link></Button><h1>{q.title}</h1><p className="muted">{q.description}</p></div><Refresh reload={resource.reload}/></div><Badge tone="orange">{q.questionCount} câu · {q.status==='PUBLISHED'?'Đã xuất bản':'Bản nháp'}</Badge>
    <p className="hint">Đang xem dữ liệu thật. Tạo/sửa/xuất bản cần API ghi dữ liệu, chưa triển khai trong bước kết nối đọc.</p>
    {!q.questions?.length&&<PageState title="Đề chưa có câu hỏi"/>}
    {q.questions?.map(item=><section className="card question-editor db-question" key={item.id}><div className="between"><h2>Câu {item.position}: {item.content}</h2><Badge>{item.points} điểm</Badge></div><div className="teacher-options">{item.options.map(o=><div className={o.isCorrect?'correct':''} key={o.id}><span className="option-letter">{String.fromCharCode(64+o.position)}</span><span>{o.content}</span>{o.isCorrect&&<Badge tone="orange">Đáp án đúng</Badge>}</div>)}</div></section>)}</>;
}
function SessionsPage({reports=false}:{reports?:boolean}) {
  const resource=useResource<DbDashboard>(databaseApi.dashboard);if(!resource.data)return <ResourceState {...resource}/>;
  return <><div className="section-heading"><h1>{reports?'Báo cáo kết quả':'Phiên thi trực tiếp'}</h1><Refresh reload={resource.reload}/></div><SessionTable sessions={reports?resource.data.sessions.filter(s=>s.status==='FINISHED'):resource.data.sessions}/></>;
}
function SessionPage() {
  const {id=''}=useParams();const load=useCallback((signal:AbortSignal)=>databaseApi.session(id,signal),[id]);const resource=useResource<DbSessionDetail>(load);
  if(!resource.data)return <ResourceState {...resource}/>;
  const s=resource.data;
  return <><div className="page-heading"><div><p className="eyebrow">PHIÊN THI TRONG DB</p><h1>{s.title}</h1><p className="pin-display">PIN: <strong>{s.pin}</strong></p><Badge>{s.status==='WAITING'?'Đang chờ':s.status==='ACTIVE'?'Đang diễn ra':'Đã kết thúc'}</Badge></div><Refresh reload={resource.reload}/></div>
    <p className="hint">Danh sách người tham gia và từng lượt làm được đọc từ DB. Điều khiển phiên và nộp bài sẽ được nối khi có API nghiệp vụ.</p>
    {!s.participants.length?<PageState title="Chưa có người tham gia"/>:<div className="card table-wrap"><table><thead><tr><th>NGƯỜI THAM GIA</th><th>TRẠNG THÁI</th><th>LƯỢT</th><th>ĐÚNG</th><th>SAI</th><th>CHƯA TRẢ LỜI</th><th>ĐIỂM</th><th>ACCURACY</th></tr></thead><tbody>{s.participants.flatMap(p=>p.attempts.length?p.attempts.map(a=><tr key={`${p.id}-${a.number}`}><td>{p.name}</td><td>{p.status}</td><td>{a.number}</td><td>{a.correct}</td><td>{a.incorrect}</td><td>{a.unanswered}</td><td>{a.score}</td><td>{a.accuracy}%</td></tr>):[<tr key={p.id}><td>{p.name}</td><td>{p.status}</td><td colSpan={6}>Chưa có lượt làm bài</td></tr>])}</tbody></table></div>}</>;
}
function Welcome() {
  const [pin,setPin]=useState('');const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [room,setRoom]=useState<Awaited<ReturnType<typeof databaseApi.room>>>();
  async function lookup(e:FormEvent){e.preventDefault();setLoading(true);setError('');setRoom(undefined);try{setRoom(await databaseApi.room(pin));}catch(e){setError(e instanceof Error?e.message:'Không tìm thấy phòng.');}finally{setLoading(false);}}
  return <><PublicHeader/><main id="main-content" className="welcome"><h1>Tham gia cùng <em>QForge</em></h1><p className="intro">Tra cứu phòng bằng mã PIN trong DB.</p><form className="card join-card" onSubmit={e=>{void lookup(e);}}><label>Mã PIN<Input inputMode="numeric" pattern="[0-9]{1,12}" maxLength={12} required value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,''))}/></label><Button size="full" type="submit" disabled={loading} aria-busy={loading}>{loading?'Đang tra cứu…':'Tìm phòng thi'}</Button></form>{error&&<PageState kind="error" title="Không thể tìm phòng" description={error}/>} {room&&<PageState title={room.title} description={`PIN ${room.pin} · ${room.participantCount} người tham gia · ${room.status==='WAITING'?'Đang chờ':'Đang diễn ra'}`}><p>Đã đọc được phòng thật. API đăng ký participant và chơi chưa triển khai.</p></PageState>}<div className="teacher-invite"><p>Không gian giảng viên</p><Button asChild><Link to="/teacher/quizzes">Vào chế độ test</Link></Button></div></main><Footer/></>;
}
function Login() {return <><PublicHeader/><main id="main-content" className="setup-container"><PageState title="Không gian giảng viên" description="Đang test bằng Teacher mẫu có sẵn trong DB, chưa dùng email hoặc mật khẩu."><Button asChild><Link to="/teacher/quizzes">Vào chế độ test</Link></Button></PageState></main></>;}
export function DatabaseApp(){const {pathname}=useLocation();return <><RouteEffects/><a className="skip-link" href="#main-content">Đến nội dung chính</a>{pathname!=='/'&&<div className="demo-notice">Dữ liệu từ PostgreSQL qua backend · Đang test đọc DB · Chưa có auth/API ghi</div>}<Routes>
  <Route path="/" element={<LandingPage/>}/><Route path="/join" element={<Welcome/>}/><Route path="/login" element={<Login/>}/>
  <Route path="/teacher/quizzes" element={<DevLayout><Dashboard/></DevLayout>}/><Route path="/teacher/editor/new" element={<DevLayout><PageState title="Chưa có API tạo đề" description="Đọc đề có sẵn từ danh sách để kiểm tra kết nối DB."><Button asChild><Link to="/teacher/quizzes">Xem đề thi</Link></Button></PageState></DevLayout>}/><Route path="/teacher/editor/:id" element={<DevLayout><QuizPage/></DevLayout>}/>
  <Route path="/teacher/sessions" element={<DevLayout><SessionsPage/></DevLayout>}/><Route path="/teacher/reports" element={<DevLayout><SessionsPage reports/></DevLayout>}/><Route path="/teacher/session/:id" element={<DevLayout><SessionPage/></DevLayout>}/>
  <Route path="/student/session/:id" element={<Navigate to="/" replace/>}/><Route path="/setup" element={<main id="main-content" className="setup-container"><SetupPage/></main>}/><Route path="*" element={<main id="main-content" className="setup-container"><PageState title="Không tìm thấy trang"><Button asChild><Link to="/">Về trang chủ</Link></Button></PageState></main>}/>
</Routes></>;}

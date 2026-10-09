import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router';
import type { DbDashboard, DbSession } from '@qforge/shared';
import { databaseApi } from '../../lib/api';
import { AuthProvider } from '../auth/AuthProvider';
import { ProtectedTeacher, TeacherLogin } from '../auth/TeacherAuth';
import { JoinPage, QuizEditor, SessionControl, StudentSession } from '../core/CorePages';
import { RouteEffects } from '../../app/RouteEffects';
import { Badge } from '../../components/Common';
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
function SessionTable({sessions}: {sessions:DbSession[]}) {
  if(!sessions.length)return <PageState title="Chưa có phiên thi trong DB" />;
  return <div className="card table-wrap"><table><thead><tr><th>PIN</th><th>ĐỀ THI</th><th>TRẠNG THÁI</th><th>THAM GIA</th><th></th></tr></thead><tbody>{sessions.map(s=><tr key={s.id}><td className="pin-text">{s.pin}</td><td>{s.title}</td><td><Badge>{s.status==='WAITING'?'Đang chờ':s.status==='ACTIVE'?'Đang diễn ra':'Đã kết thúc'}</Badge></td><td>{s.participantCount}</td><td><Button size="sm" variant="secondary" asChild><Link to={`/teacher/session/${s.id}`}>Xem chi tiết</Link></Button></td></tr>)}</tbody></table></div>;
}
function Dashboard() {
  const resource = useResource<DbDashboard>(databaseApi.dashboard); const [search,setSearch]=useState('');
  if(!resource.data)return <ResourceState {...resource} />;
  const {teacher,quizzes,sessions}=resource.data;
  const filtered=quizzes.filter(q=>q.title.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <><div className="page-heading"><div><p className="eyebrow">DỮ LIỆU POSTGRESQL</p><h1>Xin chào, {teacher.name}</h1><p className="muted">Đề thi và phiên học được đọc trực tiếp từ DB qua backend.</p></div><div className="quiz-actions"><Button asChild><Link to="/teacher/editor/new">Tạo đề mới</Link></Button><Refresh reload={resource.reload}/></div></div>
    <div className="stats">{[['TỔNG ĐỀ THI',quizzes.length],['ĐÃ XUẤT BẢN',quizzes.filter(q=>q.status==='PUBLISHED').length],['PHIÊN THI',sessions.length],['NGƯỜI THAM GIA',sessions.reduce((n,s)=>n+s.participantCount,0)]].map(([title,count])=><article key={title} className="card stat"><p className="eyebrow">{title}</p><p><strong>{count}</strong></p></article>)}</div>
    <div className="section-heading"><h2>Đề thi của tôi</h2><Input className="search" aria-label="Tìm đề thi" placeholder="Tìm kiếm đề thi…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
    <div className="quiz-grid">{filtered.map(q=><article className="card quiz-card" key={q.id}><div className="between"><Badge tone={q.status==='PUBLISHED'?'orange':''}>{q.status==='PUBLISHED'?'Đã xuất bản':'Bản nháp'}</Badge><small>{q.questionCount} câu hỏi</small></div><h3>{q.title}</h3><p>{q.description}</p><div className="quiz-actions"><Button variant="secondary" size="sm" asChild><Link to={`/teacher/editor/${q.id}`}>Xem câu hỏi</Link></Button></div></article>)}</div>
    {!filtered.length&&<PageState title={quizzes.length?'Không tìm thấy đề thi':'Chưa có đề thi trong DB'} description="Thử đổi từ khóa hoặc tạo dữ liệu qua backend."/>}
    <section className="session-list"><h2>Phiên thi gần đây</h2><SessionTable sessions={sessions.slice(0,5)}/></section></>;
}
function SessionsPage({reports=false}:{reports?:boolean}) {
  const resource=useResource<DbDashboard>(databaseApi.dashboard);if(!resource.data)return <ResourceState {...resource}/>;
  return <><div className="section-heading"><h1>{reports?'Báo cáo kết quả':'Phiên thi trực tiếp'}</h1><Refresh reload={resource.reload}/></div><SessionTable sessions={reports?resource.data.sessions.filter(s=>s.status==='FINISHED'):resource.data.sessions}/></>;
}
export function DatabaseApp(){const {pathname}=useLocation();return <AuthProvider><RouteEffects/><a className="skip-link" href="#main-content">Đến nội dung chính</a>{pathname!=='/'&&<div className="demo-notice">QForge · Dùng nút cập nhật để tải trạng thái phiên</div>}<Routes>
  <Route path="/" element={<LandingPage/>}/><Route path="/join" element={<JoinPage/>}/><Route path="/login" element={<TeacherLogin/>}/>
  <Route path="/teacher/quizzes" element={<ProtectedTeacher><Dashboard/></ProtectedTeacher>}/><Route path="/teacher/editor/new" element={<ProtectedTeacher><QuizEditor/></ProtectedTeacher>}/><Route path="/teacher/editor/:id" element={<ProtectedTeacher><QuizEditor/></ProtectedTeacher>}/>
  <Route path="/teacher/sessions" element={<ProtectedTeacher><SessionsPage/></ProtectedTeacher>}/><Route path="/teacher/reports" element={<ProtectedTeacher><SessionsPage reports/></ProtectedTeacher>}/><Route path="/teacher/session/:id" element={<ProtectedTeacher><SessionControl/></ProtectedTeacher>}/>
  <Route path="/student/session/:id" element={<StudentSession/>}/><Route path="/setup" element={<main id="main-content" className="setup-container"><SetupPage/></main>}/><Route path="*" element={<main id="main-content" className="setup-container"><PageState title="Không tìm thấy trang"><Button asChild><Link to="/">Về trang chủ</Link></Button></PageState></main>}/>
</Routes></AuthProvider>;}

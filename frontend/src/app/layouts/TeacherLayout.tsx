import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router';
import { Brand } from '../../components/Common';
import { Icon } from '../../components/Icon';

export function TeacherLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate(); const location = useLocation();
  return <div className="teacher-shell"><aside className="sidebar"><Brand /><nav><NavLink aria-label="Dashboard" to="/teacher/quizzes"><Icon name="▦" /> <span>Home / Dashboard</span></NavLink><NavLink aria-label="Tạo đề mới" to="/teacher/editor/new"><Icon name="▤" /> <span>My Quizzes</span></NavLink><NavLink aria-label="Phiên trực tiếp" to="/teacher/sessions"><Icon name="◉" /> <span>Live Sessions</span></NavLink><NavLink aria-label="Báo cáo" to="/teacher/reports"><Icon name="▥" /> <span>Reports</span></NavLink></nav><div className="sidebar-bottom"><span className="avatar">GV</span><div><strong>Giảng viên QForge</strong><small>Không gian giảng dạy</small></div><button className="icon-button" aria-label="Đăng xuất" onClick={() => { sessionStorage.removeItem('qforge-teacher'); navigate('/login'); }}><Icon name="↪" /></button></div></aside><div className="teacher-body"><header className="teacher-header"><span>QForge <span className="muted"> / </span> Không gian giảng viên</span><div><Link to="/" className="muted">Cổng sinh viên <Icon name="↗" /></Link><span className="avatar">GV</span></div></header><main id="main-content" key={location.pathname} className="teacher-main">{children}</main></div></div>;
}

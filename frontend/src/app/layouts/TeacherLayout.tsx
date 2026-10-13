import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router';
import { Brand } from '../../components/Common';
import { Icon } from '../../components/Icon';

export function TeacherLayout({ children, teacherName = 'Giảng viên QForge', onLogout }: { children: ReactNode; teacherName?: string; onLogout?: () => void }) {
  const navigate = useNavigate(); const location = useLocation();
  return <div className="teacher-shell"><aside className="sidebar"><Brand /><nav><NavLink aria-label="Trang chủ" to="/teacher/quizzes"><Icon name="▦" /> <span>Trang chủ</span></NavLink><NavLink aria-label="Tạo đề mới" to="/teacher/editor/new"><Icon name="▤" /> <span>Tạo đề mới</span></NavLink><NavLink aria-label="Phiên trực tiếp" to="/teacher/sessions"><Icon name="◉" /> <span>Phiên trực tiếp</span></NavLink><NavLink aria-label="Báo cáo" to="/teacher/reports"><Icon name="▥" /> <span>Báo cáo</span></NavLink></nav><div className="sidebar-bottom"><span className="avatar">GV</span><div><strong>{teacherName}</strong><small>Không gian giảng dạy</small></div><button className="icon-button" aria-label="Đăng xuất" onClick={() => { if (onLogout) { onLogout(); return; } sessionStorage.removeItem('qforge-teacher'); navigate('/login'); }}><Icon name="↪" /></button></div></aside><div className="teacher-body"><header className="teacher-header"><span>QForge <span className="muted"> / </span> Không gian giảng viên</span><div><Link to="/join" className="muted">Cổng sinh viên <Icon name="↗" /></Link><span className="avatar">GV</span></div></header><main id="main-content" key={location.pathname} className="teacher-main">{children}</main></div></div>;
}

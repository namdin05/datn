import { useEffect } from 'react';
import { useLocation } from 'react-router';

export function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    const title = pathname.startsWith('/teacher/editor') ? 'Soạn đề thi' : pathname.startsWith('/teacher/session/') ? 'Phòng thi' : pathname === '/teacher/sessions' ? 'Phiên trực tiếp' : pathname === '/teacher/reports' ? 'Báo cáo' : pathname === '/teacher/quizzes' ? 'Đề thi của tôi' : pathname.startsWith('/student/') ? 'Phiên học' : pathname === '/login' ? 'Tài khoản giảng viên' : pathname === '/setup' ? 'Kiểm tra kết nối' : 'Tham gia phòng thi';
    document.title = `${title} · QForge`;
    window.scrollTo({ top: 0, behavior: 'instant' });
    const frame = requestAnimationFrame(() => {
      const main = document.getElementById('main-content');
      main?.setAttribute('tabindex', '-1');
      main?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  return null;
}

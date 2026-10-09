import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useTeacherAuth } from './AuthProvider';
import { authClient } from '../../lib/auth';
import { PublicHeader } from '../../components/Common';
import { PageState } from '../../components/PageState';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { TeacherLayout } from '../../app/layouts/TeacherLayout';

export function TeacherLogin() {
  const auth = useTeacherAuth(); const location = useLocation();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const from = typeof location.state?.from === 'string' && location.state.from.startsWith('/teacher/') ? location.state.from : '/teacher/quizzes';
  if (auth.actor) return <Navigate to={from} replace />;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try { await auth.signIn(email, password); setPassword(''); } catch (e) { setError(e instanceof Error ? e.message : 'Không đăng nhập được.'); } finally { setBusy(false); }
  }
  return <><PublicHeader /><main id="main-content" className="setup-container"><form className="card auth-card" onSubmit={e => { void submit(e); }}><h1>Đăng nhập giảng viên</h1><p>Dùng tài khoản giảng viên đã được cấp.</p><label>Email<Input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>Mật khẩu<Input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>{!authClient && <p role="alert">Đăng nhập chưa được cấu hình.</p>}{(error || auth.error) && <p role="alert" className="error">{error || auth.error}</p>}<Button type="submit" disabled={busy || auth.loading || !authClient}>{busy || auth.loading ? 'Đang xác minh…' : 'Đăng nhập'}</Button></form></main></>;
}
export function ProtectedTeacher({ children }: { children: ReactNode }) {
  const auth = useTeacherAuth(); const location = useLocation(); const [logoutError, setLogoutError] = useState('');
  if (auth.loading) return <main id="main-content" className="setup-container"><PageState kind="loading" title="Đang xác minh tài khoản" /></main>;
  if (!auth.actor) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <TeacherLayout teacherName={auth.actor.name} onLogout={() => { setLogoutError(''); void auth.signOut().catch(e => setLogoutError(e.message)); }}>{logoutError && <p role="alert" className="error">{logoutError}</p>}{children}</TeacherLayout>;
}

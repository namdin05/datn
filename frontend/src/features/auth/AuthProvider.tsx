import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { TeacherActor } from '@qforge/shared';
import { authClient } from '../../lib/auth';
import { teacherApi } from '../../lib/api';

type AuthState = { actor?: TeacherActor; loading: boolean; error?: string; signIn: (email: string, password: string) => Promise<void>; signOut: () => Promise<void> };
export const AuthContext = createContext<AuthState | undefined>(undefined);
export function useTeacherAuth() {
  const state = useContext(AuthContext);
  if (!state) throw new Error('AuthProvider is required.');
  return state;
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(!authClient);
  const subject = useRef<string | undefined>(undefined);
  const [state, setState] = useState<{ actor?: TeacherActor; loading: boolean; error?: string }>({ loading: !!authClient });
  useEffect(() => {
    if (!authClient) return;
    let active = true;
    // INITIAL_SESSION avoids a competing getSession promise restoring stale login.
    const { data } = authClient.auth.onAuthStateChange((_event, next) => {
      if (active) {
        if (!next || next.user.id !== subject.current) setState({ loading: !!next });
        subject.current = next?.user.id;
        setSession(next); setInitialized(true);
      }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!initialized) return;
    if (!session) { setState({ loading: false }); return; }
    const controller = new AbortController();
    setState(previous => ({ actor: previous.actor, loading: !previous.actor }));
    teacherApi.me(session.access_token, controller.signal).then(actor => {
      if (!controller.signal.aborted) setState({ actor, loading: false });
    }).catch(error => { if (!controller.signal.aborted) setState({ loading: false, error: error instanceof Error ? error.message : 'Không xác minh được tài khoản.' }); });
    return () => controller.abort();
  }, [session, initialized]);
  async function signIn(email: string, password: string) {
    if (!authClient) throw new Error('Chưa cấu hình Supabase Auth.');
    const { error } = await authClient.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Email hoặc mật khẩu không hợp lệ, hoặc dịch vụ đăng nhập chưa sẵn sàng.');
  }
  async function signOut() {
    if (authClient) {
      const { error } = await authClient.auth.signOut({ scope: 'local' });
      if (error) throw new Error('Chưa đăng xuất được. Hãy thử lại.');
    }
    setSession(null); setState({ loading: false });
  }
  return <AuthContext.Provider value={{ ...state, signIn, signOut }}>{children}</AuthContext.Provider>;
}

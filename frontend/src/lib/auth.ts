import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.VITE_SUPABASE_URL;
const key = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;
export const authClient = url && key ? createClient(url, key, {
  auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
}) : undefined;

export async function getTeacherToken() {
  if (!authClient) throw new Error('Chưa cấu hình Supabase Auth.');
  const { data, error } = await authClient.auth.getSession();
  if (error || !data.session) throw new Error('Vui lòng đăng nhập tài khoản giảng viên.');
  return data.session.access_token;
}

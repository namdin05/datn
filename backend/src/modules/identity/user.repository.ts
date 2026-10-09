import type { Database } from '../../common/database.js';

interface UserRow {
  id: string;
  display_name: string;
  role: 'TEACHER' | 'STUDENT';
}
export function userRepository(db: Database) {
  return {
    async findByAuthSubject(subject: string) {
      return (await db.query<UserRow>('SELECT id,display_name,role FROM public.users WHERE auth_user_id=$1', [subject])).rows[0];
    },
    async findById(id: string) {
      return (await db.query<UserRow>('SELECT id, display_name, role FROM public.users WHERE id=$1', [id])).rows[0] ?? null;
    },
    async findDemoTeacher() {
      return (await db.query<UserRow>("SELECT id, display_name, role FROM public.users WHERE role='TEACHER' ORDER BY created_at, id LIMIT 1")).rows[0] ?? null;
    },
  };
}

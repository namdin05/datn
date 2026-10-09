import 'dotenv/config';
import { z } from 'zod';
import { createDb, dbErrorCode, transaction } from '../src/config/db.js';

const args = z.tuple([z.guid(), z.guid(), z.string().trim().min(1).max(100).optional()]).safeParse(process.argv.slice(2));
if (!args.success) {
  console.error('Usage: npm run auth:link -w @qforge/backend -- <qforge-user-id> <supabase-user-id> [display-name-for-new-teacher]');
  process.exitCode = 1;
} else {
  const [userId, authId, name] = args.data;
  const pool = createDb();
  try {
    await transaction(pool, async db => {
      const user = (await db.query('SELECT role,auth_user_id FROM public.users WHERE id=$1 FOR UPDATE', [userId])).rows[0];
      if (!user) {
        if (!name) throw new Error('TEACHER_MISSING_PROVIDE_DISPLAY_NAME');
        await db.query("INSERT INTO public.users(id,display_name,role,auth_user_id) VALUES($1,$2,'TEACHER',$3)", [userId, name, authId]);
      } else {
        if (user.role !== 'TEACHER') throw new Error('USER_IS_NOT_TEACHER');
        if (user.auth_user_id && user.auth_user_id !== authId) throw new Error('TEACHER_ALREADY_LINKED');
        await db.query('UPDATE public.users SET auth_user_id=$2,updated_at=now() WHERE id=$1', [userId, authId]);
      }
    });
    console.log('Teacher mapping saved. Existing quiz ownership was preserved.');
  } catch (error) { console.error('Teacher mapping failed: ' + dbErrorCode(error)); process.exitCode = 1; }
  finally { await pool.end(); }
}

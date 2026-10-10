import type { Database } from '../../common/database.js';
import type { SessionRow } from './session.types.js';

export function sessionRepository(db: Database) {
  return {
    async findById(id: string, lock = false) {
      const row = (await db.query<SessionRow>(
        `SELECT s.*,q.title,ss.leaderboard_every FROM public.sessions s JOIN public.quizzes q ON q.id=s.quiz_id
          LEFT JOIN public.session_settings ss ON ss.session_id=s.id WHERE s.id=$1${lock ? ' FOR UPDATE OF s' : ''}`, [id],
      )).rows[0];
      // Sessions driven by pre-003 code have no phase: an open session is on its question.
      if (row) row.live_phase = row.status === 'IN_PROGRESS' ? row.live_phase ?? 'QUESTION' : null;
      return row;
    },
    async findOpenByPin(pin: string) {
      return (await db.query<{ id: string }>("SELECT id FROM public.sessions WHERE pin=$1 AND status IN ('WAITING','IN_PROGRESS') FOR UPDATE", [pin])).rows[0];
    },
    async totalQuestions(quizId: string) {
      return Number((await db.query<{ n: number }>('SELECT count(*)::int AS n FROM public.questions WHERE quiz_id=$1', [quizId])).rows[0]!.n);
    },
    // Savepoints are part of this caller-owned transaction. Retry only a PIN collision;
    // unrelated constraint or infrastructure failures must propagate and roll back.
    async tryCreate(quizId: string, hostId: string, pin: string) {
      await db.query('SAVEPOINT pin_attempt');
      try {
        const row = (await db.query<{ id: string }>('INSERT INTO public.sessions(quiz_id,host_id,pin) VALUES($1,$2,$3) RETURNING id', [quizId, hostId, pin])).rows[0]!;
        await db.query('RELEASE SAVEPOINT pin_attempt');
        return row.id;
      } catch (error) {
        await db.query('ROLLBACK TO SAVEPOINT pin_attempt');
        const failure = error as { code?: string; constraint?: string };
        if (failure.code !== '23505' || failure.constraint !== 'uq_sessions_active_pin') throw error;
        return null;
      }
    },
    // The final leaderboard is always shown. Re-applying the demo rules at start keeps
    // the leaderboard cadence the Teacher chose when hosting.
    async configureDemo(id: string, leaderboardEvery: number | null = null) {
      await db.query(`INSERT INTO public.session_settings(session_id,timer_mode,shuffle_questions,shuffle_answers,show_leaderboard,allow_skip_questions,participant_attempt_limit,leaderboard_every)
        VALUES($1,'OFF',false,false,true,true,1,$2) ON CONFLICT(session_id) DO UPDATE SET timer_mode='OFF',shuffle_questions=false,shuffle_answers=false,show_leaderboard=true,allow_skip_questions=true,participant_attempt_limit=1`, [id, leaderboardEvery]);
    },
    async start(id: string) {
      await db.query("UPDATE public.sessions SET status='IN_PROGRESS',started_at=now(),current_question_position=1,live_phase='QUESTION',state_version=state_version+1 WHERE id=$1", [id]);
    },
    async showLeaderboard(id: string) {
      await db.query("UPDATE public.sessions SET live_phase='LEADERBOARD',state_version=state_version+1 WHERE id=$1", [id]);
    },
    async next(id: string) {
      await db.query("UPDATE public.sessions SET current_question_position=current_question_position+1,live_phase='QUESTION',state_version=state_version+1 WHERE id=$1", [id]);
    },
    async finish(id: string) {
      await db.query("UPDATE public.sessions SET status='FINISHED',ended_at=now(),live_phase=NULL,state_version=state_version+1 WHERE id=$1", [id]);
    },
  };
}

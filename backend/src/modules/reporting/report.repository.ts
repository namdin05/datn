import type { Database } from '../../common/database.js';

interface QuizSummaryRow {
  id: string; title: string; description: string; status: string; questionCount: number;
}
interface SessionSummaryRow {
  id: string; quizId: string; title: string; pin: string; status: string; participantCount: number;
}
interface ParticipantReportRow {
  id: string; name: string; status: string;
  attempts: { number: number; score: number; correct: number; incorrect: number; unanswered: number; accuracy: number }[];
}
const sessionSql = `SELECT s.id,s.quiz_id AS "quizId",q.title,s.pin,s.status,
  (SELECT count(*)::int FROM public.participants p WHERE p.session_id=s.id) AS "participantCount"
  FROM public.sessions s JOIN public.quizzes q ON q.id=s.quiz_id`;

export function reportRepository(db: Database) {
  return {
    async quizzes(creatorId: string) {
      return (await db.query<QuizSummaryRow>(`SELECT q.id,q.title,COALESCE(q.description,'') AS description,q.status,
        (SELECT count(*)::int FROM public.questions WHERE quiz_id=q.id) AS "questionCount"
        FROM public.quizzes q WHERE q.creator_id=$1 ORDER BY q.created_at DESC,q.id`, [creatorId])).rows;
    },
    async sessions(hostId: string) {
      return (await db.query<SessionSummaryRow>(sessionSql + ' WHERE s.host_id=$1 ORDER BY s.created_at DESC,s.id', [hostId])).rows;
    },
    async session(id: string, hostId: string) {
      return (await db.query<SessionSummaryRow>(sessionSql + ' WHERE s.id=$1 AND s.host_id=$2', [id, hostId])).rows[0];
    },
    async participants(sessionId: string) {
      return (await db.query<ParticipantReportRow>(`SELECT p.id,p.nickname AS name,p.status,
        COALESCE(jsonb_agg(jsonb_build_object('number',a.attempt_number,'score',a.session_score,
          'correct',a.correct_count,'incorrect',a.incorrect_count,'unanswered',GREATEST(0,a.total_questions-a.answered_count),
          'accuracy',CASE WHEN a.total_questions>0 THEN round(100.0*a.correct_count/a.total_questions,2) ELSE 0 END)
          ORDER BY a.attempt_number) FILTER(WHERE a.id IS NOT NULL),'[]') AS attempts
        FROM public.participants p LEFT JOIN public.attempts a ON a.participant_id=p.id
        WHERE p.session_id=$1 GROUP BY p.id ORDER BY p.joined_at,p.id`, [sessionId])).rows;
    },
    async openRoom(pin: string) {
      return (await db.query<{ title: string; pin: string; status: string; participantCount: number }>(`SELECT q.title,s.pin,s.status,(SELECT count(*)::int FROM public.participants WHERE session_id=s.id) AS "participantCount"
        FROM public.sessions s JOIN public.quizzes q ON q.id=s.quiz_id WHERE s.pin=$1 AND s.status IN ('WAITING','IN_PROGRESS')`, [pin])).rows[0];
    },
  };
}

import type { PublicQuestion } from '@qforge/shared';
import type { Database } from '../../common/database.js';

interface ParticipantProgressRow {
  id: string;
  nickname: string;
  total_questions: number | null;
  correct_count: number;
  incorrect_count: number;
  answered: boolean;
}
export function snapshotRepository(db: Database) {
  return {
    async question(quizId: string, position: number): Promise<PublicQuestion | null> {
      const question = (await db.query<{ id: string; content: string; position: number }>(
        'SELECT id,content,position FROM public.questions WHERE quiz_id=$1 AND position=$2', [quizId, position],
      )).rows[0];
      if (!question) return null;
      // Security boundary: Student reads use an explicit projection without is_correct.
      const options = (await db.query<PublicQuestion['options'][number]>(
        'SELECT id,content,position FROM public.question_options WHERE question_id=$1 ORDER BY position', [question.id],
      )).rows;
      return { ...question, points: 100, options };
    },
    async hasAnswered(attemptId: string, questionId: string) {
      return !!(await db.query('SELECT id FROM public.answers WHERE attempt_id=$1 AND question_id=$2', [attemptId, questionId])).rowCount;
    },
    async participantProgress(sessionId: string, position: number | null) {
      return (await db.query<ParticipantProgressRow>(`SELECT p.id,p.nickname,a.total_questions,a.correct_count,a.incorrect_count,
        EXISTS(SELECT 1 FROM public.answers ans JOIN public.questions q ON q.id=ans.question_id WHERE ans.attempt_id=a.id AND q.position=$2) AS answered
        FROM public.participants p LEFT JOIN public.attempts a ON a.participant_id=p.id AND a.attempt_number=1 WHERE p.session_id=$1 ORDER BY p.joined_at,p.id`, [sessionId, position])).rows;
    },
  };
}

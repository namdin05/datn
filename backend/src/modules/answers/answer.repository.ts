import type { Database } from '../../common/database.js';

export interface AttemptRow {
  id: string;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
}
export function answerRepository(db: Database) {
  return {
    async attempt(participantId: string) {
      return (await db.query<AttemptRow>('SELECT * FROM public.attempts WHERE participant_id=$1 AND attempt_number=1', [participantId])).rows[0];
    },
    async existingOption(attemptId: string, questionId: string) {
      return (await db.query<{ option_id: string }>('SELECT ao.option_id FROM public.answers a JOIN public.answer_options ao ON ao.answer_id=a.id WHERE a.attempt_id=$1 AND a.question_id=$2', [attemptId, questionId])).rows[0];
    },
    async activeOption(optionId: string, questionId: string, quizId: string, position: number | null) {
      return (await db.query<{ is_correct: boolean }>(`SELECT o.is_correct FROM public.question_options o JOIN public.questions q ON q.id=o.question_id WHERE o.id=$1 AND q.id=$2 AND q.quiz_id=$3 AND q.position=$4`, [optionId, questionId, quizId, position])).rows[0];
    },
    async insert(attemptId: string, questionId: string, optionId: string, correct: boolean, score: number) {
      const row = (await db.query<{ id: string }>(`INSERT INTO public.answers(attempt_id,question_id,is_correct,accuracy_points_awarded,session_score_awarded,response_time_ms) VALUES($1,$2,$3,$4,$5,0) RETURNING id`, [attemptId, questionId, correct, score, score])).rows[0]!;
      await db.query('INSERT INTO public.answer_options(answer_id,option_id) VALUES($1,$2)', [row.id, optionId]);
      await db.query(`UPDATE public.attempts SET correct_count=correct_count+$2,incorrect_count=incorrect_count+$3,answered_count=answered_count+1,accuracy_points=accuracy_points+$4,session_score=session_score+$4 WHERE id=$1`, [attemptId, correct ? 1 : 0, correct ? 0 : 1, score]);
    },
    async createAttempts(sessionId: string, total: number) {
      await db.query(`INSERT INTO public.attempts(participant_id,attempt_number,total_questions,max_accuracy_points)
        SELECT id,1,$2,$2*100 FROM public.participants WHERE session_id=$1 ON CONFLICT(participant_id,attempt_number) DO NOTHING`, [sessionId, total]);
    },
    async finishAttempts(sessionId: string) {
      await db.query("UPDATE public.attempts SET status='SUBMITTED',submitted_at=now() WHERE participant_id IN(SELECT id FROM public.participants WHERE session_id=$1) AND status='IN_PROGRESS'", [sessionId]);
    },
  };
}

import type { QuizInput } from '@qforge/shared';
import type { Database } from '../../common/database.js';
import type { QuestionRow, QuizRow } from './quiz.types.js';

export function quizRepository(db: Database) {
  return {
    async findById(id: string, lock = false) {
      return (await db.query<QuizRow>(
        `SELECT * FROM public.quizzes WHERE id=$1${lock ? ' FOR UPDATE' : ''}`, [id],
      )).rows[0];
    },
    async questions(id: string) {
      return (await db.query<QuestionRow>(`SELECT q.id,q.content,q.position,q.points,
        COALESCE(jsonb_agg(jsonb_build_object('id',o.id,'content',o.content,'position',o.position,'is_correct',o.is_correct) ORDER BY o.position) FILTER(WHERE o.id IS NOT NULL),'[]') AS options
        FROM public.questions q LEFT JOIN public.question_options o ON o.question_id=q.id
        WHERE q.quiz_id=$1 GROUP BY q.id ORDER BY q.position`, [id])).rows;
    },
    async hasSessions(id: string) {
      return !!(await db.query('SELECT id FROM public.sessions WHERE quiz_id=$1 LIMIT 1', [id])).rowCount;
    },
    async create(creatorId: string, input: QuizInput) {
      return (await db.query<{ id: string }>(
        'INSERT INTO public.quizzes(creator_id,title,description) VALUES($1,$2,$3) RETURNING id',
        [creatorId, input.title, input.description],
      )).rows[0]!.id;
    },
    async update(id: string, input: QuizInput) {
      await db.query("UPDATE public.quizzes SET title=$2,description=$3,status='DRAFT',published_at=NULL,updated_at=now() WHERE id=$1", [id, input.title, input.description]);
      await db.query('DELETE FROM public.questions WHERE quiz_id=$1', [id]);
    },
    async insertQuestions(quizId: string, questions: QuizInput['questions']) {
      for (const [index, question] of questions.entries()) {
        const row = (await db.query<{ id: string }>(
          'INSERT INTO public.questions(quiz_id,content,points,time_limit_seconds,position) VALUES($1,$2,100,30,$3) RETURNING id',
          [quizId, question.content, index + 1],
        )).rows[0]!;
        for (const [position, option] of question.options.entries()) {
          await db.query('INSERT INTO public.question_options(question_id,content,is_correct,position) VALUES($1,$2,$3,$4)', [row.id, option.content, option.isCorrect, position + 1]);
        }
      }
    },
    async publish(id: string) {
      await db.query("UPDATE public.quizzes SET status='PUBLISHED',published_at=COALESCE(published_at,now()),updated_at=now() WHERE id=$1", [id]);
    },
    async delete(id: string) {
      await db.query('DELETE FROM public.quizzes WHERE id=$1', [id]);
    },
  };
}

import { Router } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { repositories, apiStatus } from '../repositories/index.js';
import { ApiError } from '../common/api-error.js';
import { sendSuccess } from '../common/response.js';
import { validateRequest } from '../middleware/validate.js';
import type { ValidatedRequestHandler } from '../middleware/validate.js';

const idSchemas = { params: z.object({ id: z.guid() }) };
const pinSchemas = { params: z.object({ pin: z.string().regex(/^\d{1,12}$/, 'PIN không hợp lệ.') }) };

// API đọc phục vụ môi trường phát triển, actor cố định từ DB; không phải auth.
export function databaseReadRouter(db: Pool) {
  const router = Router();
  const repo = repositories(db);
  async function teacher() {
    const row = await repo.users.findTeacher();
    if (!row) throw new Error('DEMO_TEACHER_MISSING');
    return row;
  }
  const sessionSql = `SELECT s.id,s.quiz_id AS "quizId",q.title,s.pin,s.status,
    (SELECT count(*)::int FROM public.participants p WHERE p.session_id=s.id) AS "participantCount"
    FROM public.sessions s JOIN public.quizzes q ON q.id=s.quiz_id`;
  router.get('/dashboard', async (_req,res) => {
    const actor = await teacher();
    const quizzes = (await db.query(`SELECT q.id,q.title,COALESCE(q.description,'') AS description,q.status,
      (SELECT count(*)::int FROM public.questions WHERE quiz_id=q.id) AS "questionCount"
      FROM public.quizzes q WHERE q.creator_id=$1 ORDER BY q.created_at DESC,q.id`,[actor.id])).rows;
    const sessions = (await db.query(sessionSql+' WHERE s.host_id=$1 ORDER BY s.created_at DESC,s.id',[actor.id])).rows.map(s => ({...s,status:apiStatus(s.status)}));
    sendSuccess(res, {teacher:{id:actor.id,name:actor.display_name},quizzes,sessions});
  });
  const quizHandler: ValidatedRequestHandler<typeof idSchemas> = async (_req,res) => {
    const { id } = res.locals.validated.params;
    const actor = await teacher(); const quiz = await repo.quizzes.findById(id);
    if (!quiz || quiz.creator_id !== actor.id) throw new ApiError('NOT_FOUND', {message:'Không tìm thấy đề thi.'});
    const questions = (await repo.quizzes.questions(quiz.id)).map(q => ({id:q.id,content:q.content,position:q.position,points:Number(q.points),options:q.options.map((o: {id:string;content:string;position:number;is_correct:boolean})=>({id:o.id,content:o.content,position:o.position,isCorrect:o.is_correct}))}));
    sendSuccess(res, {id:quiz.id,title:quiz.title,description:quiz.description??'',status:quiz.status,questionCount:questions.length,questions});
  };
  router.get('/quizzes/:id', validateRequest(idSchemas), quizHandler);
  const sessionHandler: ValidatedRequestHandler<typeof idSchemas> = async (_req,res) => {
    const { id } = res.locals.validated.params;
    const actor = await teacher();
    const session = (await db.query(sessionSql+' WHERE s.id=$1 AND s.host_id=$2',[id,actor.id])).rows[0];
    if (!session) throw new ApiError('NOT_FOUND', {message:'Không tìm thấy phiên.'});
    const participants = (await db.query(`SELECT p.id,p.nickname AS name,p.status,
      COALESCE(jsonb_agg(jsonb_build_object('number',a.attempt_number,'score',a.session_score,
        'correct',a.correct_count,'incorrect',a.incorrect_count,'unanswered',GREATEST(0,a.total_questions-a.answered_count),
        'accuracy',CASE WHEN a.max_accuracy_points>0 THEN round(100*a.accuracy_points/a.max_accuracy_points,2) ELSE 0 END)
        ORDER BY a.attempt_number) FILTER(WHERE a.id IS NOT NULL),'[]') AS attempts
      FROM public.participants p LEFT JOIN public.attempts a ON a.participant_id=p.id
      WHERE p.session_id=$1 GROUP BY p.id ORDER BY p.joined_at,p.id`,[id])).rows;
    sendSuccess(res, {...session,status:apiStatus(session.status),participants});
  };
  router.get('/sessions/:id', validateRequest(idSchemas), sessionHandler);
  return router;
}

export function publicRoomRouter(db: Pool) {
  const router = Router();
  const roomHandler: ValidatedRequestHandler<typeof pinSchemas> = async (_req,res) => {
    const { pin } = res.locals.validated.params;
    const row = (await db.query(`SELECT q.title,s.pin,s.status,(SELECT count(*)::int FROM public.participants WHERE session_id=s.id) AS "participantCount"
      FROM public.sessions s JOIN public.quizzes q ON q.id=s.quiz_id WHERE s.pin=$1 AND s.status IN ('WAITING','IN_PROGRESS')`,[pin])).rows[0];
    if (!row) throw new ApiError('NOT_FOUND', {message:'Không tìm thấy phòng đang mở.'});
    // Không trả câu hỏi, đáp án, danh tính hoặc report cho người chỉ có PIN.
    sendSuccess(res, {...row,status:apiStatus(row.status)});
  };
  router.get('/:pin', validateRequest(pinSchemas), roomHandler);
  return router;
}

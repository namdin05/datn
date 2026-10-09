import type { TeacherActor } from '@qforge/shared';
import { ApiError } from '../../common/api-error.js';
import type { QuestionRow, QuizRow } from './quiz.types.js';

export function assertQuizOwner(quiz: QuizRow | undefined, actor: TeacherActor): asserts quiz is QuizRow {
  if (!quiz || quiz.creator_id !== actor.id) throw new ApiError('NOT_FOUND');
}

export function assertQuizEditable(hasSessions: boolean) {
  if (hasSessions) {
    throw new ApiError('CONFLICT', { message: 'Đề đã được dùng trong một phiên học; hãy tạo đề mới để giữ nguyên dữ liệu phiên.' });
  }
}

export function assertPublishable(questions: QuestionRow[]) {
  if (!questions.length || questions.some(question =>
    !question.content.trim() || Number(question.points) !== 100 || question.options.length !== 4 ||
    question.options.some(option => !option.content.trim()) ||
    question.options.filter(option => option.is_correct).length !== 1,
  )) {
    throw new ApiError('INVALID_INPUT', {
      message: 'Đề phải có câu hỏi; mỗi câu cần nội dung, 4 lựa chọn đầy đủ, 1 đáp án đúng và 100 điểm.',
      details: [{ field: 'questions', source: 'body', message: 'Hoàn thiện các câu hỏi trước khi xuất bản.' }],
    });
  }
}

import type { QuestionRow, QuizRow } from './quiz.types.js';

export function toTeacherQuiz(quiz: QuizRow, rows: QuestionRow[]) {
  const questions = rows.map(question => ({
    id: question.id,
    content: question.content,
    position: question.position,
    points: Number(question.points),
    options: question.options.map(option => ({
      id: option.id, content: option.content, position: option.position, isCorrect: option.is_correct,
    })),
  }));
  return {
    id: quiz.id, title: quiz.title, description: quiz.description ?? '',
    status: quiz.status, questionCount: questions.length, questions,
  };
}

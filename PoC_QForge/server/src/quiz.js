export const quiz = { id: 'qforge-demo', title: 'Realtime QForge Demo', questions: [
  { id: 'q1', text: 'Which protocol powers this realtime PoC?', options: [{ id: 'a', text: 'HTTP only' }, { id: 'b', text: 'Socket.IO' }, { id: 'c', text: 'FTP' }, { id: 'd', text: 'SMTP' }], correctOptionId: 'b', durationSeconds: 10 },
  { id: 'q2', text: 'Where is the quiz state stored in this PoC?', options: [{ id: 'a', text: 'A database' }, { id: 'b', text: 'A browser cookie' }, { id: 'c', text: 'Server memory' }, { id: 'd', text: 'A spreadsheet' }], correctOptionId: 'c', durationSeconds: 10 },
  { id: 'q3', text: 'Who is allowed to move to the next question?', options: [{ id: 'a', text: 'The host' }, { id: 'b', text: 'Any player' }, { id: 'c', text: 'Nobody' }, { id: 'd', text: 'Only the browser' }], correctOptionId: 'a', durationSeconds: 10 }
] };
export function publicQuestion(q, index) { return { id: q.id, text: q.text, options: q.options, index, totalQuestions: quiz.questions.length, durationSeconds: q.durationSeconds }; }

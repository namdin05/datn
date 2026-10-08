export type Question = { id: string; text: string; options: string[]; correct: number };
export type Quiz = { id: string; title: string; description: string; published: boolean; questions: Question[] };
export type Participant = { id: string; name: string; answers: Record<string, number> };
export type Session = { id: string; pin: string; quiz: Quiz; status: 'WAITING' | 'ACTIVE' | 'FINISHED'; current: number; participants: Participant[] };
type Store = { quizzes: Quiz[]; sessions: Session[] };
const key = 'qforge-demo-v1';
const question = (text: string, options: string[], correct: number): Question => ({ id: crypto.randomUUID(), text, options, correct });
const initial: Store = { sessions: [], quizzes: [
  { id: 'software', title: 'Software Engineering Fundamentals', description: 'Kiểm tra kiến thức về quy trình phát triển phần mềm, thiết kế kiến trúc và cơ sở dữ liệu.', published: true, questions: [
    question('Mục đích chính của Primary Key (Khóa chính) trong cơ sở dữ liệu quan hệ là gì?', ['Mã hóa dữ liệu để tăng tính bảo mật', 'Định danh duy nhất mỗi bản ghi trong bảng', 'Tự động sao lưu cơ sở dữ liệu', 'Kết nối cơ sở dữ liệu với REST API'], 1),
    question('HTTP là viết tắt của cụm từ nào?', ['HyperText Transfer Protocol', 'High Transfer Text Process', 'Hyper Terminal Transfer Program', 'Host Transfer Protocol'], 0),
    question('Trong mô hình Agile, một Sprint là gì?', ['Một bản phát hành cuối cùng', 'Một giai đoạn làm việc có thời lượng cố định', 'Một tài liệu yêu cầu', 'Một loại kiểm thử'], 1),
    question('Git được sử dụng chủ yếu để làm gì?', ['Thiết kế giao diện', 'Quản lý phiên bản mã nguồn', 'Lưu trữ cơ sở dữ liệu', 'Triển khai máy chủ'], 1),
    question('Đâu là đặc điểm của REST API?', ['Mỗi request độc lập về trạng thái', 'Chỉ sử dụng XML', 'Không sử dụng HTTP', 'Bắt buộc dùng WebSocket'], 0),
  ] },
  { id: 'data', title: 'Cấu trúc dữ liệu & Giải thuật', description: 'Ôn tập danh sách, cây, đồ thị và các thuật toán tìm kiếm.', published: false, questions: [question('Cấu trúc nào hoạt động theo nguyên tắc FIFO?', ['Stack', 'Queue', 'Tree', 'Graph'], 1)] },
  { id: 'database', title: 'Nhập môn Cơ sở dữ liệu', description: 'Các truy vấn SELECT, JOIN và GROUP BY cơ bản.', published: true, questions: [question('Lệnh nào dùng để truy vấn dữ liệu?', ['INSERT', 'DELETE', 'SELECT', 'UPDATE'], 2)] },
] };
export function readStore(): Store {
  try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw) as Store; } catch { /* Reset invalid demo data. */ }
  localStorage.setItem(key, JSON.stringify(initial)); return initial;
}
function write(store: Store) { localStorage.setItem(key, JSON.stringify(store)); window.dispatchEvent(new Event('qforge-update')); }
export const demoGateway = {
  saveQuiz(quiz: Quiz) { const store = readStore(); const i = store.quizzes.findIndex(q => q.id === quiz.id); if (i < 0) store.quizzes.unshift(quiz); else store.quizzes[i] = quiz; write(store); },
  deleteQuiz(id: string) { const store = readStore(); if (store.sessions.some(s => s.quiz.id === id && s.status !== 'FINISHED')) throw new Error('Đề đang có phiên trực tiếp.'); store.quizzes = store.quizzes.filter(q => q.id !== id); write(store); },
  createSession(quiz: Quiz) { const store = readStore(); if (!quiz.published) throw new Error('Hãy xuất bản đề trước khi mở phòng.'); let pin: string; do { pin = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 900000 + 100000); } while (store.sessions.some(s => s.pin === pin && s.status !== 'FINISHED')); const session: Session = { id: crypto.randomUUID(), pin, quiz: structuredClone(quiz), status: 'WAITING', current: 0, participants: [] }; store.sessions.unshift(session); write(store); return session; },
  join(pin: string, name: string) { if (!name.trim()) throw new Error('Nhập họ tên để tham gia phòng.'); const store = readStore(); const s = store.sessions.find(s => s.pin === pin && s.status === 'WAITING'); if (!s) throw new Error('PIN không hợp lệ hoặc phòng đã bắt đầu. Hãy hỏi lại giảng viên.'); const participant: Participant = { id: crypto.randomUUID(), name: name.trim(), answers: {} }; s.participants.push(participant); write(store); return { sessionId: s.id, participantId: participant.id }; },
  action(id: string, action: 'start' | 'next' | 'finish') { const store = readStore(); const s = store.sessions.find(s => s.id === id); if (!s) return; if (action === 'start' && s.status === 'WAITING') s.status = 'ACTIVE'; if (action === 'next' && s.status === 'ACTIVE') { if (s.current < s.quiz.questions.length - 1) s.current++; else s.status = 'FINISHED'; } if (action === 'finish' && s.status === 'ACTIVE') s.status = 'FINISHED'; write(store); },
  answer(id: string, participantId: string, questionId: string, option: number) { const store = readStore(); const s = store.sessions.find(s => s.id === id); const p = s?.participants.find(p => p.id === participantId); const q = s?.quiz.questions[s.current]; if (!s || !p || !q || s.status !== 'ACTIVE' || q.id !== questionId || option < 0 || option > 3) throw new Error('Câu hỏi không còn nhận câu trả lời.'); if (p.answers[q.id] !== undefined) throw new Error('Bạn đã gửi câu trả lời cho câu này.'); p.answers[q.id] = option; write(store); },
  leave(id: string, participantId: string) { const store = readStore(); const s = store.sessions.find(s => s.id === id); if (s?.status === 'WAITING') s.participants = s.participants.filter(p => p.id !== participantId); write(store); },
};
export function metrics(s: Session, p: Participant) { const correct = s.quiz.questions.filter(q => p.answers[q.id] === q.correct).length; const answered = Object.keys(p.answers).length; return { correct, incorrect: answered - correct, unanswered: s.quiz.questions.length - answered, score: correct * 100, accuracy: Math.round(correct / s.quiz.questions.length * 100) }; }

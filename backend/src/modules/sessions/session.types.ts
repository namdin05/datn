export interface SessionRow {
  id: string;
  quiz_id: string;
  host_id: string;
  pin: string;
  title: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
  state_version: number;
  current_question_position: number | null;
}
export type SessionAction = 'start' | 'next' | 'finish';

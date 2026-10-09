export interface QuizRow {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED';
}

export interface QuestionRow {
  id: string;
  content: string;
  position: number;
  points: string | number;
  options: { id: string; content: string; position: number; is_correct: boolean }[];
}

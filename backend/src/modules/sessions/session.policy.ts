import type { TeacherActor } from '@qforge/shared';
import { ApiError } from '../../common/api-error.js';
import type { SessionAction, SessionRow } from './session.types.js';

export function requireSession(row: SessionRow | undefined): SessionRow {
  if (!row) throw new ApiError('NOT_FOUND');
  return row;
}
export function assertSessionHost(session: SessionRow, actor: TeacherActor) {
  if (session.host_id !== actor.id) throw new ApiError('NOT_FOUND');
}
export function assertSessionAction(session: SessionRow, action: SessionAction, expectedVersion: number, total: number) {
  if (session.state_version !== expectedVersion) {
    throw new ApiError('CONFLICT', { message: 'Trạng thái phiên đã đổi. Tải lại trước khi điều khiển.' });
  }
  if (action === 'start') {
    if (session.status !== 'WAITING' || !total) throw new ApiError('CONFLICT');
  } else if (action === 'next') {
    if (session.status !== 'IN_PROGRESS' || !session.current_question_position || session.current_question_position >= total) {
      throw new ApiError('CONFLICT', { message: 'Không còn câu tiếp theo; hãy kết thúc phiên.' });
    }
  } else if (session.status !== 'IN_PROGRESS') {
    throw new ApiError('CONFLICT');
  }
}

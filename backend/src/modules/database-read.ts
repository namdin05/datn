import type { Pool } from 'pg';
import { userRepository } from './identity/user.repository.js';
import { createReportService } from './reporting/report.service.js';
import { reportRouter } from './reporting/report.routes.js';
import { quizQueries } from './quizzes/quiz.queries.js';

// Legacy development-only adapter. Production routes receive verified actors
// via apiRouter; the fixed DB actor must remain behind ENABLE_DEV_ROUTES.
export function databaseReadRouter(db: Pool) {
  const service = createReportService(db, quizQueries);
  return reportRouter(service, async () => {
    const row = await userRepository(db).findDemoTeacher();
    if (!row) throw new Error('DEMO_TEACHER_MISSING');
    return { id: row.id, name: row.display_name, role: 'TEACHER' };
  });
}

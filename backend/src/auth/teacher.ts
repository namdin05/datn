import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { RequestHandler } from 'express';
import type { TeacherActor } from '@qforge/shared';
import { userRepository } from '../modules/identity/user.repository.js';
import { ApiError } from '../common/api-error.js';

export type VerifyTeacherToken = (token: string) => Promise<string>;

// Exported for reuse by the socket adapter. Only subjects from verified tokens are accepted.
export function createTeacherVerifier(supabaseUrl: string): VerifyTeacherToken {
  const issuer = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;
  const keys = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`), { timeoutDuration: 5000 });
  return async token => {
    try {
      const { payload } = await jwtVerify(token, keys, { issuer, audience: 'authenticated', algorithms: ['ES256', 'RS256'], requiredClaims: ['sub', 'exp'] });
      return z.guid().parse(payload.sub);
    } catch { throw new ApiError('UNAUTHORIZED', { message: 'Token không hợp lệ hoặc đã hết hạn.' }); }
  };
}

export async function resolveTeacher(db: Pool, verify: VerifyTeacherToken, token: string): Promise<TeacherActor> {
  const subject = await verify(token);
  const row = await userRepository(db).findByAuthSubject(subject);
  if (!row || row.role !== 'TEACHER') throw new ApiError('FORBIDDEN', { message: 'Tài khoản chưa được liên kết với Teacher QForge.' });
  return { id: row.id, name: row.display_name, role: 'TEACHER' };
}

export function bearerToken(header: string | undefined) {
  const match = header?.match(/^Bearer ([A-Za-z0-9._~-]+)$/i);
  if (!match?.[1]) throw new ApiError('UNAUTHORIZED');
  return match[1];
}

export function requireTeacher(db: Pool, verify?: VerifyTeacherToken): RequestHandler {
  return async (req, res, next) => {
    if (!verify) throw new ApiError('DB_UNAVAILABLE', { message: 'Supabase Auth chưa được cấu hình.' });
    res.locals.teacher = await resolveTeacher(db, verify, bearerToken(req.headers.authorization));
    next();
  };
}

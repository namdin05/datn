import { healthResponseSchema } from "@qforge/shared";
import { z } from 'zod';
import { dbDashboardSchema, dbQuizSchema, dbSessionDetailSchema, publicRoomSchema } from '@qforge/shared';

const apiUrl = (import.meta.env?.VITE_API_URL || "http://127.0.0.1:3002").replace(/\/$/, "");

export async function fetchHealth() {
  const response = await fetch(`${apiUrl}/health`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`API returned HTTP ${response.status}.`);
  return healthResponseSchema.parse(await response.json());
}

async function readApi<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { signal: signal ? AbortSignal.any([signal,AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000) });
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.error?.message === 'string' ? body.error.message : 'Không đọc được dữ liệu từ server.');
  return z.object({success:z.literal(true),data:schema}).parse(body).data;
}
export const databaseApi = {
  dashboard: (signal?: AbortSignal) => readApi('/api/dev/dashboard',dbDashboardSchema,signal),
  quiz: (id: string,signal?: AbortSignal) => readApi(`/api/dev/quizzes/${encodeURIComponent(id)}`,dbQuizSchema,signal),
  session: (id: string,signal?: AbortSignal) => readApi(`/api/dev/sessions/${encodeURIComponent(id)}`,dbSessionDetailSchema,signal),
  room: (pin: string,signal?: AbortSignal) => readApi(`/api/rooms/${encodeURIComponent(pin)}`,publicRoomSchema,signal),
};

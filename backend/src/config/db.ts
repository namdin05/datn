import pg from 'pg';
import { z } from 'zod';
import type { PoolClient } from 'pg';

export function createDb(source: NodeJS.ProcessEnv = process.env) {
  const cfg = z.object({
    DATABASE_URL: z.string().min(1),
    DATABASE_SSL_MODE: z.enum(['disable', 'verify-full']).default('verify-full'),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
    DATABASE_CONNECTION_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
    DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  }).safeParse(source);
  if (!cfg.success) throw new Error('DB_CONFIG_INVALID');
  let uri: URL;
  try { uri = new URL(cfg.data.DATABASE_URL); } catch { throw new Error('DB_CONFIG_INVALID'); }
  if (!['postgres:', 'postgresql:'].includes(uri.protocol)) throw new Error('DB_CONFIG_INVALID');
  for (const name of ['ssl', 'sslmode', 'sslcert', 'sslkey', 'sslrootcert']) uri.searchParams.delete(name);
  const pool = new pg.Pool({
    connectionString: uri.toString(),
    ssl: cfg.data.DATABASE_SSL_MODE === 'disable' ? false : { rejectUnauthorized: true },
    max: cfg.data.DATABASE_POOL_MAX,
    connectionTimeoutMillis: cfg.data.DATABASE_CONNECTION_TIMEOUT_MS,
    idleTimeoutMillis: cfg.data.DATABASE_IDLE_TIMEOUT_MS,
    statement_timeout: 10000,
    application_name: 'qforge-backend',
  });
  pool.on('error', () => console.error('DB_POOL_ERROR'));
  return pool;
}

export async function transaction<T>(pool: pg.Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { client.release(); }
}

export function dbErrorCode(error: unknown) {
  const e = error as { code?: string; message?: string };
  const code = e?.code || e?.message || 'DB_ERROR';
  return /^[A-Z0-9_]+$/.test(code) ? code : 'DB_ERROR';
}

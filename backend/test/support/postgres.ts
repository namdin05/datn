import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import type { Pool } from 'pg';

// Real PostgreSQL engine in WASM. This adapter serializes access to its single
// connection; it does not emulate SQL or PostgreSQL's row-lock scheduler.
export async function isolatedPostgres() {
  const engine = new PGlite({ extensions: { pgcrypto } });
  await engine.waitReady;
  for (const name of ['001_initial_schema.sql', '002_identity_live_state.sql', '003_live_leaderboard.sql']) await engine.exec(await readFile(new URL(`../../../database/migrations/${name}`, import.meta.url), 'utf8'));
  let tail = Promise.resolve();
  async function lock() {
    const previous = tail; let release = () => {};
    tail = new Promise<void>(resolve => { release = resolve; }); await previous;
    return release;
  }
  let failure: string | undefined;
  async function query(sql: string, params?: unknown[]) {
    if (failure && sql.includes(failure)) { failure = undefined; throw new Error('INJECTED_WRITE_FAILURE'); }
    const result = await engine.query(sql, params);
    return { rows: result.rows, rowCount: result.rows.length || result.affectedRows || 0 };
  }
  const pool = {
    async query(sql: string, params?: unknown[]) { const release = await lock(); try { return await query(sql, params); } finally { release(); } },
    async connect() { const release = await lock(); return { query, release }; },
  } as unknown as Pool;
  return { pool, engine, failNext: (fragment: string) => { failure = fragment; }, close: () => engine.close() };
}

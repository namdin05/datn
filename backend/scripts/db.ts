import { config } from 'dotenv';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { PoolClient } from 'pg';
import { createDb, dbErrorCode } from '../src/config/db.js';
import { repositories } from '../src/repositories/index.js';
import { createApp } from '../src/app.js';
import { readEnv } from '../src/config/env.js';

config({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });
const root = new URL('../../database/', import.meta.url);
const tables = ['users','quizzes','questions','question_options','sessions','session_settings','participants','attempts','answers','answer_options'];
const command = process.argv[2] || 'check';
const stripTransaction = (sql: string) => sql.replace(/^\s*(BEGIN|COMMIT);\s*$/gm, '');
async function files(folder: string) {
  const url = new URL(folder + '/', root);
  return Promise.all((await readdir(url)).filter(f => /^\d+_[\w-]+\.sql$/.test(f)).sort().map(async name => {
    const sql = await readFile(new URL(name, url), 'utf8');
    return { name, sql, checksum: createHash('sha256').update(sql.replace(/\r\n/g,'\n')).digest('hex') };
  }));
}
async function present(c: PoolClient) {
  return (await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name=ANY($1::text[]) ORDER BY table_name",[tables])).rows.map(r => r.table_name as string);
}
async function tracking(c: PoolClient) {
  await c.query(`CREATE TABLE IF NOT EXISTS public.qforge_migrations(
    name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now(), baseline boolean NOT NULL DEFAULT false)`);
}
// Đối chiếu schema thực tế với migration trong schema tạm, cùng một transaction.
async function signature(c: PoolClient, schema: string) {
  const result = await c.query(`SELECT t.relname AS table_name,
    (SELECT jsonb_agg(jsonb_build_array(a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,
      pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum)
     FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
     WHERE a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped) AS columns,
    (SELECT jsonb_agg(def ORDER BY def) FROM (SELECT pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid=t.oid) x) AS constraints,
    (SELECT jsonb_agg(indexdef ORDER BY indexname) FROM pg_indexes WHERE schemaname=$1 AND tablename=t.relname) AS indexes
    FROM pg_class t JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname=$1 AND t.relname=ANY($2::text[]) AND t.relkind='r' ORDER BY t.relname`,[schema,tables]);
  const enums = await c.query(`SELECT t.typname,jsonb_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
    FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid
    WHERE n.nspname=$1 GROUP BY t.typname ORDER BY t.typname`,[schema]);
  const normalize = (value: unknown) => JSON.stringify(value).replaceAll(schema+'.','').replaceAll('public.','');
  return normalize({ tables: result.rows, enums: enums.rows.filter(r => ['user_role','quiz_status','question_type','session_mode','session_status','timer_mode','participant_status','attempt_status'].includes(r.typname)) });
}
async function validateFixture(c: PoolClient) {
  const repo = repositories(c);
  const q = await repo.quizzes.findById('10000000-0000-0000-0000-000000000004');
  const questions = await repo.quizzes.questions('10000000-0000-0000-0000-000000000004');
  if (!q || q.status !== 'PUBLISHED' || questions.length !== 5 || questions.some(row => row.options.length !== 4 || row.options.filter((o: {is_correct: boolean}) => o.is_correct).length !== 1 || Number(row.points)!==100)) throw new Error('SEED_FIXTURE_INVALID');
  const teacher = await repo.users.findById(q.creator_id);
  if (teacher?.role !== 'TEACHER') throw new Error('SEED_TEACHER_INVALID');
}
async function counts(c: PoolClient) {
  const result: Record<string, number> = {};
  for (const table of tables) result[table] = (await c.query(`SELECT count(*)::int AS n FROM public.${table}`)).rows[0].n;
  return JSON.stringify(result);
}

let pool;
let client: PoolClient | undefined;
try {
  if (!['check','status','migrate','baseline','seed','test'].includes(command)) throw new Error('UNKNOWN_DB_COMMAND');
  pool = createDb(); client = await pool.connect();
  if (['check','status'].includes(command)) {
    await client.query('BEGIN READ ONLY');
    await client.query('SELECT 1');
    console.log(`Kết nối DB thành công. Bảng core: ${(await present(client)).length}/10.`);
    const hasTracking = (await client.query("SELECT to_regclass('public.qforge_migrations') AS name")).rows[0].name;
    console.log('Migration tracking: ' + (hasTracking ? 'đã có' : 'chưa có'));
    if (hasTracking) console.table((await client.query('SELECT name,baseline FROM public.qforge_migrations ORDER BY name')).rows);
    if (command === 'check' && (await present(client)).length === 10) {
      const repo = repositories(client);
      const teacher = await repo.users.findTeacher();
      console.log('Đọc repository Teacher: ' + (teacher ? 'OK' : 'chưa có dữ liệu'));
      if (teacher) console.log('Số quiz của Teacher: ' + (await repo.quizzes.listByCreator(teacher.id)).length);
    }
    await client.query('ROLLBACK');
  } else {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(70404)");
    await client.query('SET LOCAL search_path TO public');
    const migrations = await files('migrations');
    const existing = await present(client);
    if (command === 'baseline') {
      if (existing.length !== 10) throw new Error('BASELINE_REQUIRES_FULL_SCHEMA');
      const first = migrations[0]; if (!first) throw new Error('NO_MIGRATIONS');
      const actual = await signature(client,'public');
      await client.query('CREATE SCHEMA qforge_s04_verify');
      await client.query('SET LOCAL search_path TO qforge_s04_verify, public');
      await client.query(stripTransaction(first.sql).replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;/,'').replaceAll('public.','qforge_s04_verify.'));
      const expected = await signature(client,'qforge_s04_verify');
      if (actual !== expected) throw new Error('BASELINE_SCHEMA_MISMATCH');
      await client.query('DROP SCHEMA qforge_s04_verify CASCADE');
      await client.query('SET LOCAL search_path TO public');
      await tracking(client);
      const previous = (await client.query('SELECT checksum FROM public.qforge_migrations WHERE name=$1',[first.name])).rows[0];
      if (previous && previous.checksum !== first.checksum) throw new Error('MIGRATION_CHECKSUM_MISMATCH');
      await client.query('INSERT INTO public.qforge_migrations(name,checksum,baseline) VALUES($1,$2,true) ON CONFLICT(name) DO NOTHING',[first.name,first.checksum]);
      console.log('Schema khớp migration đầu tiên; ghi nhận baseline, không tạo lại bảng core.');
    } else if (command === 'migrate') {
      const tracked = (await client.query("SELECT to_regclass('public.qforge_migrations') AS name")).rows[0].name;
      if (existing.length && !tracked) throw new Error('RUN_BASELINE_FIRST');
      await tracking(client);
      for (const migration of migrations) {
        const previous = (await client.query('SELECT checksum FROM public.qforge_migrations WHERE name=$1',[migration.name])).rows[0];
        if (previous) { if(previous.checksum !== migration.checksum) throw new Error('MIGRATION_CHECKSUM_MISMATCH'); continue; }
        await client.query(stripTransaction(migration.sql));
        await client.query('INSERT INTO public.qforge_migrations(name,checksum) VALUES($1,$2)',[migration.name,migration.checksum]);
        console.log('Đã áp dụng: ' + migration.name);
      }
    } else {
      if (existing.length !== 10) throw new Error('RUN_MIGRATIONS_FIRST');
      const seeds = await files('seeds');
      for (const seed of seeds) await client.query(stripTransaction(seed.sql));
      await validateFixture(client);
      if (command === 'test') {
        const before = await counts(client);
        for (const seed of seeds) await client.query(stripTransaction(seed.sql));
        await validateFixture(client);
        const after = await counts(client);
        if (before !== after) throw new Error('SEED_NOT_IDEMPOTENT');
        const repo = repositories(client); const teacher = await repo.users.findTeacher();
        const draft = await repo.quizzes.createDraft(teacher.id,'S04 rollback test');
        if (!(await repo.quizzes.findById(draft.id))) throw new Error('REPOSITORY_WRITE_FAILED');
        await client.query('ROLLBACK');
        if ((await client.query('SELECT id FROM public.quizzes WHERE id=$1',[draft.id])).rowCount) throw new Error('ROLLBACK_FAILED');
        const server = createApp(readEnv(), pool).listen(0,'127.0.0.1');
        try {
          await new Promise<void>((resolve,reject) => { server.once('listening',resolve); server.once('error',reject); });
          const address = server.address();
          if (!address || typeof address === 'string') throw new Error('READY_TEST_FAILED');
          const response = await fetch(`http://127.0.0.1:${address.port}/ready`);
          if (response.status !== 200 || (await response.json()).data?.database !== 'ok') throw new Error('READY_TEST_FAILED');
        } finally { await new Promise<void>((resolve,reject) => server.close(error => error ? reject(error) : resolve())); }
        console.log('PASS: seed hai lần, fixture 5 câu/4 lựa chọn/1 đúng, repository đọc/ghi và rollback. Không giữ dữ liệu test.');
        console.log('PASS: HTTP /ready trả 200 với DB thật.');
      } else console.log('Seed thành công: Teacher và bộ demo 5 câu, không nhân đôi dữ liệu.');
    }
    if (command !== 'test') await client.query('COMMIT');
  }
} catch (error) {
  if (client) await client.query('ROLLBACK').catch(() => {});
  console.error('DB task thất bại: ' + dbErrorCode(error));
  process.exitCode = 1;
} finally { client?.release(); await pool?.end(); }

import type { Pool, PoolClient } from 'pg';

// Repositories accept either a pool for reads or the caller's transaction client.
// They never acquire another connection or start/commit a transaction themselves.
export type Database = Pool | PoolClient;

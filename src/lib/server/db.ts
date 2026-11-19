import "server-only";
import { createClient, type Client, type InArgs, type Row } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

/**
 * Database access.
 * - Docker / self-hosted: local SQLite file (default: ./data/homepage.db or $DATA_DIR)
 * - Vercel / serverless: any libSQL server, e.g. Turso (DATABASE_URL=libsql://…)
 * Both speak the same SQLite dialect, so there is exactly one code path.
 */

export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "data"));
const DATABASE_URL = process.env.DATABASE_URL || `file:${path.join(DATA_DIR, "homepage.db")}`;
export const IS_LOCAL_DB = DATABASE_URL.startsWith("file:");

const MIGRATIONS: string[] = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL DEFAULT '',
    display_name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner','admin','editor')),
    created_at INTEGER NOT NULL,
    last_login_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    user_agent TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
  `CREATE TABLE IF NOT EXISTS config_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS widget_data (
    widget_id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    storage TEXT NOT NULL,
    data BLOB,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS stats_views (
    day TEXT NOT NULL,
    path TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, path)
  )`,
  `CREATE TABLE IF NOT EXISTS stats_visitors (
    day TEXT NOT NULL,
    hash TEXT NOT NULL,
    PRIMARY KEY (day, hash)
  )`,
  `CREATE TABLE IF NOT EXISTS stats_referrers (
    day TEXT NOT NULL,
    host TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, host)
  )`,
  `CREATE TABLE IF NOT EXISTS system (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS backups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, expires_at INTEGER NOT NULL)`,
];

type G = typeof globalThis & { __hpDb?: Client; __hpDbReady?: Promise<void> };
const g = globalThis as G;

function client(): Client {
  if (!g.__hpDb) {
    if (IS_LOCAL_DB) fs.mkdirSync(DATA_DIR, { recursive: true });
    else if (process.env.VERCEL && !process.env.DATABASE_URL)
      throw new Error("DATABASE_URL is required on Vercel (e.g. a Turso libsql:// URL).");
    g.__hpDb = createClient({ url: DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
  }
  return g.__hpDb;
}

async function migrate() {
  const c = client();
  if (IS_LOCAL_DB) {
    await c.execute("PRAGMA journal_mode = WAL");
    await c.execute("PRAGMA busy_timeout = 5000");
  }
  await c.execute("PRAGMA foreign_keys = ON");
  await c.batch(MIGRATIONS, "write");
}

export async function db(): Promise<Client> {
  if (!g.__hpDbReady) {
    g.__hpDbReady = migrate().catch((e) => {
      g.__hpDbReady = undefined;
      throw e;
    });
  }
  await g.__hpDbReady;
  return client();
}

export async function all<T = Row>(sql: string, args: InArgs = []): Promise<T[]> {
  const r = await (await db()).execute({ sql, args });
  return r.rows as unknown as T[];
}

export async function one<T = Row>(sql: string, args: InArgs = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0];
}

export async function run(sql: string, args: InArgs = []) {
  return (await db()).execute({ sql, args });
}

export const now = () => Date.now();

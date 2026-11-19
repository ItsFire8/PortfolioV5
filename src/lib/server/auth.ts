import "server-only";
import { cookies, headers } from "next/headers";
import { all, now, one, run } from "./db";
import { hashPassword, id, randomToken, sha256 } from "./crypto";

export type Role = "owner" | "admin" | "editor";
export interface SessionUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: Role;
}
export interface Session {
  user: SessionUser;
  csrf: string;
  sessionId: string;
}

export const SESSION_COOKIE = "hp_session";
const SESSION_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

type Perm = "content" | "media" | "users" | "system" | "messages" | "stats";
const PERMISSIONS: Record<Role, Perm[]> = {
  owner: ["content", "media", "users", "system", "messages", "stats"],
  admin: ["content", "media", "users", "system", "messages", "stats"],
  editor: ["content", "media"],
};
export const can = (role: Role | undefined, perm: Perm) => !!role && PERMISSIONS[role].includes(perm);

async function isSecureRequest(): Promise<boolean> {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const h = await headers();
  return (h.get("x-forwarded-proto") ?? "").split(",")[0].trim() === "https";
}

export async function createSession(userId: string): Promise<void> {
  const token = randomToken(32);
  const h = await headers();
  await run(
    "INSERT INTO sessions (id, user_id, csrf, created_at, expires_at, user_agent) VALUES (?,?,?,?,?,?)",
    [sha256(token), userId, randomToken(24), now(), now() + SESSION_TTL, (h.get("user-agent") ?? "").slice(0, 200)],
  );
  await run("UPDATE users SET last_login_at = ? WHERE id = ?", [now(), userId]);
  await run("DELETE FROM sessions WHERE expires_at < ?", [now()]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureRequest(),
    path: "/",
    maxAge: SESSION_TTL / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await run("DELETE FROM sessions WHERE id = ?", [sha256(token)]);
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const row = await one<{
    sid: string;
    csrf: string;
    expires_at: number;
    id: string;
    username: string;
    email: string;
    display_name: string;
    role: Role;
  }>(
    `SELECT s.id AS sid, s.csrf, s.expires_at, u.id, u.username, u.email, u.display_name, u.role
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
    [sha256(token)],
  );
  if (!row || Number(row.expires_at) < now()) return null;
  return {
    sessionId: row.sid,
    csrf: row.csrf,
    user: { id: row.id, username: row.username, email: row.email, displayName: row.display_name, role: row.role },
  };
}

export async function userCount(): Promise<number> {
  const r = await one<{ n: number }>("SELECT COUNT(*) AS n FROM users");
  return Number(r?.n ?? 0);
}

export async function createUser(input: {
  username: string;
  password: string;
  role: Role;
  email?: string;
  displayName?: string;
}): Promise<string> {
  const uid = id("u");
  await run(
    "INSERT INTO users (id, username, email, display_name, password_hash, role, created_at) VALUES (?,?,?,?,?,?,?)",
    [uid, input.username, input.email ?? "", input.displayName ?? "", await hashPassword(input.password), input.role, now()],
  );
  return uid;
}

export async function listUsers() {
  return all<{
    id: string;
    username: string;
    email: string;
    display_name: string;
    role: Role;
    created_at: number;
    last_login_at: number | null;
  }>("SELECT id, username, email, display_name, role, created_at, last_login_at FROM users ORDER BY created_at");
}

/** Optional bootstrap via env (ADMIN_USERNAME / ADMIN_PASSWORD) for unattended installs. */
let bootstrapped = false;
export async function bootstrapAdminFromEnv(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p || p.length < 10) return;
  if ((await userCount()) > 0) return;
  await createUser({ username: u, password: p, role: "owner", displayName: u });
}

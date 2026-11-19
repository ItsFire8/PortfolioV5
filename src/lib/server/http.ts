import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { can, getSession, type Session } from "./auth";
import { safeEqual } from "./crypto";
import { all, now, run } from "./db";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const json = (data: unknown, init?: number | ResponseInit) =>
  NextResponse.json(data, typeof init === "number" ? { status: init } : init);

/** Wraps a route handler with uniform error handling. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      if (e instanceof ZodError)
        return json({ error: "Validation failed", issues: e.issues.slice(0, 20).map((i) => ({ path: i.path.join("."), message: i.message })) }, 422);
      console.error("[api]", e);
      return json({ error: "Internal server error" }, 500);
    }
  };
}

/**
 * CSRF protection for state-changing requests:
 *  1. Same-origin check on Origin / Sec-Fetch-Site
 *  2. Per-session synchronizer token in the `x-csrf-token` header
 * Session cookies are additionally SameSite=Lax and HttpOnly.
 */
export function assertSameOrigin(req: Request) {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") throw new HttpError(403, "Cross-site request blocked");
  const origin = req.headers.get("origin");
  if (origin) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    try {
      if (new URL(origin).host !== host) throw new HttpError(403, "Origin mismatch");
    } catch (e) {
      if (e instanceof HttpError) throw e;
      throw new HttpError(403, "Invalid origin");
    }
  }
}

type Perm = Parameters<typeof can>[1];

export async function requireAuth(req: Request, perm: Perm = "content"): Promise<Session> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Not authenticated");
  if (!can(session.user.role, perm)) throw new HttpError(403, "Forbidden");
  if (req.method !== "GET" && req.method !== "HEAD") {
    assertSameOrigin(req);
    const token = req.headers.get("x-csrf-token") ?? "";
    if (!token || !safeEqual(token, session.csrf)) throw new HttpError(403, "Invalid CSRF token");
  }
  return session;
}

export async function readJson<T = unknown>(req: Request, maxBytes = 2_000_000): Promise<T> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) throw new HttpError(413, "Payload too large");
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "Payload too large");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON");
  }
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Fixed-window rate limiter persisted in the DB (works across serverless instances). */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const t = now();
  const [row] = await all<{ count: number; reset_at: number }>("SELECT count, reset_at FROM rate_limits WHERE key = ?", [key]);
  if (!row || Number(row.reset_at) < t) {
    await run("INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?,?,?)", [key, 1, t + windowMs]);
    if (Math.random() < 0.02) await run("DELETE FROM rate_limits WHERE reset_at < ?", [t]);
    return;
  }
  if (Number(row.count) >= limit) throw new HttpError(429, "Too many requests");
  await run("UPDATE rate_limits SET count = count + 1 WHERE key = ?", [key]);
}

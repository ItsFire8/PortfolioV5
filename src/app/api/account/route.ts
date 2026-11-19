import { z } from "zod";
import { hashPassword, verifyPassword } from "@/lib/server/crypto";
import { one, run } from "@/lib/server/db";
import { handler, HttpError, json, readJson, requireAuth } from "@/lib/server/http";

const body = z.object({
  displayName: z.string().trim().max(120).optional(),
  email: z.union([z.literal(""), z.email().max(200)]).optional(),
  currentPassword: z.string().max(500).optional(),
  newPassword: z.string().min(10).max(500).optional(),
});

export const GET = handler(async (req: Request) => {
  const s = await requireAuth(req, "content");
  return json({ user: s.user });
});

export const PATCH = handler(async (req: Request) => {
  const s = await requireAuth(req, "content");
  const input = body.parse(await readJson(req, 10_000));
  if (input.displayName !== undefined) await run("UPDATE users SET display_name = ? WHERE id = ?", [input.displayName, s.user.id]);
  if (input.email !== undefined) await run("UPDATE users SET email = ? WHERE id = ?", [input.email, s.user.id]);
  if (input.newPassword) {
    const row = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id = ?", [s.user.id]);
    if (!row || !(await verifyPassword(input.currentPassword ?? "", row.password_hash))) throw new HttpError(400, "Current password is wrong");
    await run("UPDATE users SET password_hash = ? WHERE id = ?", [await hashPassword(input.newPassword), s.user.id]);
    // sign out all other sessions
    await run("DELETE FROM sessions WHERE user_id = ? AND id != ?", [s.user.id, s.sessionId]);
  }
  return json({ ok: true });
});

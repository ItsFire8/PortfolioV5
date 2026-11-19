import { z } from "zod";
import { hashPassword } from "@/lib/server/crypto";
import { one, run } from "@/lib/server/db";
import { handler, HttpError, json, readJson, requireAuth } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };
const body = z.object({
  displayName: z.string().trim().max(120).optional(),
  email: z.union([z.literal(""), z.email().max(200)]).optional(),
  role: z.enum(["admin", "editor"]).optional(),
  password: z.string().min(10).max(500).optional(),
});

async function target(id: string) {
  const u = await one<{ id: string; role: string }>("SELECT id, role FROM users WHERE id = ?", [id]);
  if (!u) throw new HttpError(404, "User not found");
  return u;
}

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const s = await requireAuth(req, "users");
  const u = await target((await params).id);
  const input = body.parse(await readJson(req, 10_000));
  if (u.role === "owner" && s.user.role !== "owner") throw new HttpError(403, "Only the owner can modify the owner account");
  if (input.role && u.role === "owner") throw new HttpError(400, "The owner role cannot be changed");
  if (input.displayName !== undefined) await run("UPDATE users SET display_name = ? WHERE id = ?", [input.displayName, u.id]);
  if (input.email !== undefined) await run("UPDATE users SET email = ? WHERE id = ?", [input.email, u.id]);
  if (input.role) await run("UPDATE users SET role = ? WHERE id = ?", [input.role, u.id]);
  if (input.password) {
    await run("UPDATE users SET password_hash = ? WHERE id = ?", [await hashPassword(input.password), u.id]);
    await run("DELETE FROM sessions WHERE user_id = ?", [u.id]);
  }
  return json({ ok: true });
});

export const DELETE = handler(async (req: Request, { params }: Ctx) => {
  const s = await requireAuth(req, "users");
  const u = await target((await params).id);
  if (u.role === "owner") throw new HttpError(400, "The owner account cannot be deleted");
  if (u.id === s.user.id) throw new HttpError(400, "You cannot delete yourself");
  await run("DELETE FROM sessions WHERE user_id = ?", [u.id]);
  await run("DELETE FROM users WHERE id = ?", [u.id]);
  return json({ ok: true });
});

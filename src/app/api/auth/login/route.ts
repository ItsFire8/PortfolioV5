import { z } from "zod";
import { createSession } from "@/lib/server/auth";
import { verifyPassword } from "@/lib/server/crypto";
import { one } from "@/lib/server/db";
import { assertSameOrigin, clientIp, handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";

const body = z.object({ username: z.string().min(1).max(200), password: z.string().min(1).max(500) });
// Well-formed dummy hash so that unknown users take as long as known ones.
const DUMMY = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);

export const POST = handler(async (req: Request) => {
  assertSameOrigin(req);
  const { username, password } = body.parse(await readJson(req, 10_000));
  const ip = clientIp(req);
  try {
    await rateLimit(`login:ip:${ip}`, 20, 15 * 60_000);
    await rateLimit(`login:user:${username.toLowerCase()}`, 10, 15 * 60_000);
  } catch {
    throw new HttpError(429, "too_many");
  }
  const user = await one<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE username = ? COLLATE NOCASE OR (email != '' AND email = ? COLLATE NOCASE)",
    [username, username],
  );
  const ok = await verifyPassword(password, user?.password_hash ?? DUMMY);
  if (!user || !ok) throw new HttpError(401, "invalid");
  await createSession(user.id);
  return json({ ok: true });
});

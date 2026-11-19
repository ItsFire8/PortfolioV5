import { run } from "@/lib/server/db";
import { handler, json, readJson, requireAuth } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAuth(req, "messages");
  const { read } = await readJson<{ read?: boolean }>(req, 1000);
  await run("UPDATE messages SET is_read = ? WHERE id = ?", [read ? 1 : 0, (await params).id]);
  return json({ ok: true });
});

export const DELETE = handler(async (req: Request, { params }: Ctx) => {
  await requireAuth(req, "messages");
  await run("DELETE FROM messages WHERE id = ?", [(await params).id]);
  return json({ ok: true });
});

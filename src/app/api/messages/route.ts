import { all, one } from "@/lib/server/db";
import { handler, json, requireAuth } from "@/lib/server/http";

export const GET = handler(async (req: Request) => {
  await requireAuth(req, "messages");
  const messages = await all<{ id: string; name: string; email: string; subject: string; body: string; is_read: number; created_at: number }>(
    "SELECT id, name, email, subject, body, is_read, created_at FROM messages ORDER BY created_at DESC LIMIT 500",
  );
  const unread = await one<{ n: number }>("SELECT COUNT(*) AS n FROM messages WHERE is_read = 0");
  return json({
    unread: Number(unread?.n ?? 0),
    messages: messages.map((m) => ({ ...m, is_read: Number(m.is_read) === 1, created_at: Number(m.created_at) })),
  });
});

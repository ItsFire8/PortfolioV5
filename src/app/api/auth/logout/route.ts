import { destroySession } from "@/lib/server/auth";
import { assertSameOrigin, handler, json } from "@/lib/server/http";

export const POST = handler(async (req: Request) => {
  assertSameOrigin(req);
  await destroySession();
  return json({ ok: true });
});

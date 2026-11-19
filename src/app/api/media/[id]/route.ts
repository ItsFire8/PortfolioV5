import { deleteMedia } from "@/lib/server/media";
import { handler, HttpError, json, requireAuth } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handler(async (req: Request, { params }: Ctx) => {
  await requireAuth(req, "media");
  if (!(await deleteMedia((await params).id))) throw new HttpError(404, "Not found");
  return json({ ok: true });
});

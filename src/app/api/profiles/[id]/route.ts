import { z } from "zod";
import { activateProfile, deleteProfile, renameProfile } from "@/lib/server/config-repo";
import { handler, HttpError, json, readJson, requireAuth } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };
const body = z.object({ name: z.string().trim().min(1).max(80).optional(), activate: z.boolean().optional() });

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAuth(req, "content");
  const { id } = await params;
  const input = body.parse(await readJson(req, 10_000));
  if (input.name) await renameProfile(id, input.name);
  if (input.activate && !(await activateProfile(id))) throw new HttpError(404, "Profile not found");
  return json({ ok: true });
});

export const DELETE = handler(async (req: Request, { params }: Ctx) => {
  await requireAuth(req, "content");
  const { id } = await params;
  try {
    if (!(await deleteProfile(id))) throw new HttpError(404, "Profile not found");
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(409, (e as Error).message);
  }
  return json({ ok: true });
});

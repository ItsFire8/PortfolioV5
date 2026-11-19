import { getBackup, restoreBackup, storeBackup } from "@/lib/server/backup";
import { handler, HttpError, json, readJson, requireAuth } from "@/lib/server/http";

/** Restore either a stored backup ({ id }) or an uploaded backup file ({ backup }). A safety snapshot is taken first. */
export const POST = handler(async (req: Request) => {
  await requireAuth(req, "system");
  const body = await readJson<{ id?: string; backup?: unknown }>(req, 20_000_000);
  const payload = body.id ? await getBackup(body.id) : body.backup;
  if (!payload) throw new HttpError(404, "Backup not found");
  await storeBackup(`Auto: before restore ${new Date().toISOString().slice(0, 16).replace("T", " ")}`);
  try {
    await restoreBackup(payload);
  } catch (e) {
    throw new HttpError(422, (e as Error).message);
  }
  return json({ ok: true });
});

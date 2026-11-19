import { deleteBackup, getBackup } from "@/lib/server/backup";
import { handler, HttpError, json, requireAuth } from "@/lib/server/http";

type Ctx = { params: Promise<{ id: string }> };

/** Download a stored backup as JSON file. */
export const GET = handler(async (req: Request, { params }: Ctx) => {
  await requireAuth(req, "system");
  const backup = await getBackup((await params).id);
  if (!backup) throw new HttpError(404, "Backup not found");
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="homepage-backup-${backup.createdAt.slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
});

export const DELETE = handler(async (req: Request, { params }: Ctx) => {
  await requireAuth(req, "system");
  await deleteBackup((await params).id);
  return json({ ok: true });
});

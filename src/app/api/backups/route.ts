import { z } from "zod";
import { listBackups, storeBackup } from "@/lib/server/backup";
import { handler, json, readJson, requireAuth } from "@/lib/server/http";

export const GET = handler(async (req: Request) => {
  await requireAuth(req, "system");
  return json({ backups: await listBackups() });
});

export const POST = handler(async (req: Request) => {
  await requireAuth(req, "system");
  const { name } = z.object({ name: z.string().trim().max(100).default("") }).parse(await readJson(req, 10_000));
  const id = await storeBackup(name || new Date().toISOString().slice(0, 16).replace("T", " "));
  return json({ id }, 201);
});

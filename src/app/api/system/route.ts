import { z } from "zod";
import { handler, json, readJson, requireAuth } from "@/lib/server/http";
import { getSystemSettings, updateSystemSettings } from "@/lib/server/system";

const body = z.object({
  maintenance: z.boolean().optional(),
  maintenanceMessage: z.string().max(1000).optional(),
  statsEnabled: z.boolean().optional(),
  contactEnabled: z.boolean().optional(),
  allowSearchIndexing: z.boolean().optional(),
});

export const GET = handler(async (req: Request) => {
  await requireAuth(req, "system");
  return json({ settings: await getSystemSettings() });
});

export const PUT = handler(async (req: Request) => {
  await requireAuth(req, "system");
  return json({ settings: await updateSystemSettings(body.parse(await readJson(req, 10_000))) });
});

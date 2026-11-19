import { getActiveConfig, saveConfig } from "@/lib/server/config-repo";
import { handler, json, readJson, requireAuth } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export const GET = handler(async (req: Request) => {
  await requireAuth(req, "content");
  const { id, config, updatedAt } = await getActiveConfig();
  return json({ profileId: id, config, updatedAt });
});

export const PUT = handler(async (req: Request) => {
  await requireAuth(req, "content");
  const body = await readJson<{ config: unknown }>(req, 3_000_000);
  const { id } = await getActiveConfig();
  const saved = await saveConfig(id, body.config);
  return json({ profileId: id, ...saved });
});

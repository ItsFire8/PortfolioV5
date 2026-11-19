import { createDefaultConfig } from "@/lib/config/defaults";
import { getActiveConfig, saveConfig } from "@/lib/server/config-repo";
import { run } from "@/lib/server/db";
import { handler, json, requireAuth } from "@/lib/server/http";

/** Factory reset of the active profile. Identity (name, username, language, time zone) is kept. */
export const POST = handler(async (req: Request) => {
  await requireAuth(req, "system");
  const { id, config: current } = await getActiveConfig();
  const fresh = createDefaultConfig(current.general.locale);
  fresh.general.name = current.general.name;
  fresh.general.username = current.general.username;
  fresh.general.timezone = current.general.timezone;
  if (new URL(req.url).searchParams.get("data") === "1") await run("DELETE FROM widget_data");
  const saved = await saveConfig(id, fresh);
  return json({ profileId: id, ...saved });
});

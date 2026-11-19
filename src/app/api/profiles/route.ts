import { z } from "zod";
import { createDefaultConfig } from "@/lib/config/defaults";
import { createProfile, getActiveConfig, listProfiles } from "@/lib/server/config-repo";
import { handler, json, readJson, requireAuth } from "@/lib/server/http";

const body = z.object({
  name: z.string().trim().min(1).max(80),
  from: z.enum(["current", "defaults", "data"]).default("current"),
  data: z.unknown().optional(),
});

export const GET = handler(async (req: Request) => {
  await requireAuth(req, "content");
  return json({ profiles: await listProfiles() });
});

export const POST = handler(async (req: Request) => {
  await requireAuth(req, "content");
  const input = body.parse(await readJson(req, 3_000_000));
  let data: unknown;
  if (input.from === "defaults") data = createDefaultConfig((await getActiveConfig()).config.general.locale);
  else if (input.from === "data") data = input.data;
  const profile = await createProfile(input.name, data);
  return json({ profile }, 201);
});

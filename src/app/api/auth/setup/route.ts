import { z } from "zod";
import { createSession, createUser, userCount } from "@/lib/server/auth";
import { getActiveConfig, saveConfig } from "@/lib/server/config-repo";
import { assertSameOrigin, clientIp, handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";

const body = z.object({
  username: z.string().trim().min(2).max(60).regex(/^[\w.\-@]+$/),
  displayName: z.string().trim().max(120),
  password: z.string().min(10).max(500),
  locale: z.enum(["de", "en"]),
});

export const POST = handler(async (req: Request) => {
  assertSameOrigin(req);
  await rateLimit(`setup:${clientIp(req)}`, 10, 15 * 60_000);
  if ((await userCount()) > 0) throw new HttpError(409, "Setup already completed");
  if (process.env.SETUP_TOKEN) {
    const token = req.headers.get("x-setup-token") ?? "";
    if (token !== process.env.SETUP_TOKEN) throw new HttpError(403, "Invalid setup token");
  }
  const input = body.parse(await readJson(req, 10_000));
  const uid = await createUser({ username: input.username, password: input.password, role: "owner", displayName: input.displayName });
  const { id, config } = await getActiveConfig();
  config.general.name = input.displayName || config.general.name;
  config.general.username = input.username;
  config.general.locale = input.locale;
  if (input.displayName) config.general.siteTitle = input.displayName;
  await saveConfig(id, config);
  await createSession(uid);
  return json({ ok: true });
});

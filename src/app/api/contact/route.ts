import { z } from "zod";
import { getActiveConfig } from "@/lib/server/config-repo";
import { id } from "@/lib/server/crypto";
import { now, run } from "@/lib/server/db";
import { assertSameOrigin, clientIp, handler, HttpError, json, rateLimit, readJson } from "@/lib/server/http";
import { getSystemSettings } from "@/lib/server/system";

const body = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  subject: z.string().trim().max(200).default(""),
  message: z.string().trim().min(5).max(5000),
  website: z.string().max(200).optional(), // honeypot – must stay empty
  t: z.number().optional(), // render timestamp – bots submit instantly
});

/** Public contact form. Messages are stored locally and shown in the admin inbox – no external mail service needed. */
export const POST = handler(async (req: Request) => {
  assertSameOrigin(req);
  const sys = await getSystemSettings();
  const { config } = await getActiveConfig();
  const enabled = config.widgets.some((w) => w.type === "contact" && w.enabled && w.visibility === "public");
  if (!sys.contactEnabled || !enabled) throw new HttpError(404, "Contact form disabled");
  await rateLimit(`contact:${clientIp(req)}`, 5, 60 * 60_000);
  const input = body.parse(await readJson(req, 20_000));
  if (input.website || (input.t && Date.now() - input.t < 2500)) return json({ ok: true }); // silently drop bots
  await run("INSERT INTO messages (id, name, email, subject, body, created_at) VALUES (?,?,?,?,?,?)", [
    id("msg"),
    input.name,
    input.email,
    input.subject,
    input.message,
    now(),
  ]);
  return json({ ok: true }, 201);
});

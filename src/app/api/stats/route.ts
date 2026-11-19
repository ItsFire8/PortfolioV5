import { getSession } from "@/lib/server/auth";
import { clientIp, handler, json, readJson, requireAuth } from "@/lib/server/http";
import { getStats, recordHit, resetStats } from "@/lib/server/stats";
import { getSystemSettings } from "@/lib/server/system";

/** Page-view beacon. Ignored when stats are disabled, for the owner, and when the browser sends DNT/GPC. */
export async function POST(req: Request) {
  try {
    if (req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1") return new Response(null, { status: 204 });
    const sys = await getSystemSettings();
    if (!sys.statsEnabled || (await getSession())) return new Response(null, { status: 204 });
    const body = await readJson<{ path?: string; referrer?: string }>(req, 2000);
    await recordHit({
      path: String(body.path ?? "/"),
      referrer: String(body.referrer ?? ""),
      ip: clientIp(req),
      ua: req.headers.get("user-agent") ?? "",
      ownHost: req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "",
    });
  } catch {
    /* analytics must never break the page */
  }
  return new Response(null, { status: 204 });
}

export const GET = handler(async (req: Request) => {
  await requireAuth(req, "stats");
  const days = Math.min(365, Math.max(7, Number(new URL(req.url).searchParams.get("days")) || 30));
  return json(await getStats(days));
});

export const DELETE = handler(async (req: Request) => {
  await requireAuth(req, "stats");
  await resetStats();
  return json({ ok: true });
});

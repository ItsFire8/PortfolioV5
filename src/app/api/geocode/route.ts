import { cached, safeFetch } from "@/lib/server/cache";
import { handler, HttpError, json, requireAuth } from "@/lib/server/http";

/** Owner-only place search (Open-Meteo geocoding) used by the weather widget settings. */
export const GET = handler(async (req: Request) => {
  await requireAuth(req, "content");
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 100);
  const lang = sp.get("lang") === "en" ? "en" : "de";
  if (q.length < 2) return json({ results: [] });
  const url = `https://geocoding-api.open-meteo.com/v1/search?count=6&format=json&language=${lang}&name=${encodeURIComponent(q)}`;
  try {
    const data = await cached(`geo:${lang}:${q.toLowerCase()}`, 7 * 86400_000, async () => JSON.parse(await safeFetch(url)));
    const results = ((data.results ?? []) as Record<string, unknown>[]).map((r) => ({
      name: String(r.name ?? ""),
      region: [r.admin1, r.country].filter(Boolean).join(", "),
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
    }));
    return json({ results });
  } catch (e) {
    throw new HttpError(502, (e as Error).message);
  }
});

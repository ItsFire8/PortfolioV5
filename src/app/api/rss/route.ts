import { XMLParser } from "fast-xml-parser";
import { cached, safeFetch } from "@/lib/server/cache";
import { handler, HttpError, json } from "@/lib/server/http";
import { resolveWidget } from "@/lib/server/widget-access";

export const dynamic = "force-dynamic";

interface FeedItem {
  title: string;
  link: string;
  date: string | null;
  source: string;
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", processEntities: true, htmlEntities: true });
const text = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object" && "#text" in (v as object)) return String((v as Record<string, unknown>)["#text"]);
  return "";
};
const strip = (s: string) => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 300);
const safeLink = (s: string) => (/^https?:\/\//i.test(s) ? s : "");
const toArr = <T,>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

function parseFeed(xml: string, fallbackLabel: string): FeedItem[] {
  const doc = parser.parse(xml);
  const channel = doc.rss?.channel ?? doc["rdf:RDF"]?.channel;
  if (channel || doc["rdf:RDF"]) {
    const source = fallbackLabel || strip(text(channel?.title));
    const items = toArr(doc.rss?.channel?.item ?? doc["rdf:RDF"]?.item);
    return items.map((it: Record<string, unknown>) => ({
      title: strip(text(it.title)),
      link: safeLink(text(it.link).trim()),
      date: text(it.pubDate ?? it["dc:date"]) || null,
      source,
    }));
  }
  if (doc.feed) {
    const source = fallbackLabel || strip(text(doc.feed.title));
    return toArr(doc.feed.entry).map((e: Record<string, unknown>) => {
      const links = toArr(e.link as Record<string, string> | Record<string, string>[]);
      const alt = links.find((x) => !x["@rel"] || x["@rel"] === "alternate") ?? links[0];
      return { title: strip(text(e.title)), link: safeLink(alt?.["@href"] ?? ""), date: text(e.updated ?? e.published) || null, source };
    });
  }
  throw new Error("Unknown feed format");
}

/** Aggregates the RSS/Atom feeds configured in the given widget (server-side, cached 15 min). */
export const GET = handler(async (req: Request) => {
  const { widget } = await resolveWidget(new URL(req.url).searchParams.get("widget") ?? "", "rss");
  const s = widget.settings as { feeds?: { url?: string; label?: string }[]; maxItems?: number };
  const feeds = (s.feeds ?? []).filter((f) => f.url && /^https?:\/\//i.test(f.url)).slice(0, 10);
  if (!feeds.length) throw new HttpError(400, "No feeds configured");
  const errors: string[] = [];
  const results = await Promise.all(
    feeds.map((f) =>
      cached(`rss:${f.url}`, 15 * 60_000, async () => parseFeed(await safeFetch(f.url!, { accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" }), f.label ?? "")).catch(
        (e: Error) => {
          errors.push(`${f.label || f.url}: ${e.message}`);
          return [] as FeedItem[];
        },
      ),
    ),
  );
  const items = results
    .flat()
    .filter((i) => i.title)
    .sort((a, b) => (Date.parse(b.date ?? "") || 0) - (Date.parse(a.date ?? "") || 0))
    .slice(0, Math.min(30, Math.max(3, Number(s.maxItems) || 8)));
  return json({ items, errors }, { headers: { "cache-control": "private, max-age=120" } });
});

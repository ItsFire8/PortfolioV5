import type { SiteConfig } from "./config/schema";
import { hostname, safeUrl } from "./utils";

export interface BookmarkEntry {
  label: string;
  url: string;
  category: string;
  icon?: string;
}

/** All links from link widgets + quick links – used by search, command palette and global search. */
export function collectBookmarks(config: SiteConfig): BookmarkEntry[] {
  const out: BookmarkEntry[] = [];
  for (const q of config.quickLinks) if (safeUrl(q.url)) out.push({ label: q.label || hostname(q.url), url: q.url, category: "Quick", icon: q.icon });
  for (const w of config.widgets) {
    if (w.type !== "links" || !w.enabled) continue;
    const cats = (w.settings.categories as { name?: string; links?: { label?: string; url?: string; icon?: string }[] }[]) ?? [];
    for (const c of cats)
      for (const l of c.links ?? []) if (l.url && safeUrl(l.url)) out.push({ label: l.label || hostname(l.url), url: l.url, category: c.name ?? "", icon: l.icon });
  }
  return out;
}

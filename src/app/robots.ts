import type { MetadataRoute } from "next";
import { getActiveConfig } from "@/lib/server/config-repo";
import { getSystemSettings } from "@/lib/server/system";
import { siteUrl } from "@/lib/server/site-url";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const [{ config }, sys] = await Promise.all([getActiveConfig(), getSystemSettings()]);
  const allow = config.seo.indexable && sys.allowSearchIndexing && !sys.maintenance;
  const base = await siteUrl();
  return {
    rules: allow ? { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/login", "/setup"] } : { userAgent: "*", disallow: "/" },
    sitemap: allow ? `${base}/sitemap.xml` : undefined,
  };
}

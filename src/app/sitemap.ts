import type { MetadataRoute } from "next";
import { getActiveConfig } from "@/lib/server/config-repo";
import { siteUrl } from "@/lib/server/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { updatedAt } = await getActiveConfig();
  return [{ url: `${await siteUrl()}/`, lastModified: new Date(updatedAt), changeFrequency: "weekly", priority: 1 }];
}

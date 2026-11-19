import type { MetadataRoute } from "next";
import { getActiveConfig } from "@/lib/server/config-repo";
import { safeUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { config } = await getActiveConfig();
  const g = config.general;
  const fav = safeUrl(g.favicon);
  return {
    name: g.siteTitle || g.name || "Homepage",
    short_name: (g.name || g.siteTitle || "Home").slice(0, 12),
    description: g.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: config.appearance.background.color,
    theme_color: config.appearance.primary,
    lang: g.locale,
    icons: [
      ...(fav ? [{ src: fav, sizes: "any" }] : []),
      { src: "/api/icon?size=192", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: "/api/icon?size=512", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
      { src: "/api/icon?size=512&maskable=1", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}

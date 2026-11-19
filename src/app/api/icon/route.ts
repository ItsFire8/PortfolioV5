import { getActiveConfig } from "@/lib/server/config-repo";
import { onColor } from "@/lib/color";

/** Generated app icon (initial on brand gradient) used when no favicon is configured. */
export async function GET(req: Request) {
  const { config } = await getActiveConfig();
  const sp = new URL(req.url).searchParams;
  const size = Math.min(1024, Math.max(16, Number(sp.get("size")) || 64));
  const maskable = sp.get("maskable") === "1";
  const a = config.appearance;
  const letter = (config.general.name || config.general.siteTitle || "H").trim().charAt(0).toUpperCase().replace(/[<>&"']/g, "");
  const radius = maskable ? 0 : Math.round(size * 0.22);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a.primary}"/><stop offset="1" stop-color="${a.accent}"/></linearGradient></defs>
<rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
<text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="700" font-size="${Math.round(size * (maskable ? 0.4 : 0.52))}" fill="${onColor(a.primary)}">${letter}</text>
</svg>`;
  return new Response(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=300", "x-content-type-options": "nosniff" } });
}

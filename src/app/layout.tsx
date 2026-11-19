import type { Viewport } from "next";
import { headers } from "next/headers";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { loadPageData } from "@/lib/server/page-data";
import { buildThemeCss, themeBootScript } from "@/lib/theme";
import { createDefaultConfig } from "@/lib/config/defaults";

/** The layout must render even if the database is unreachable (e.g. during a build). */
async function safeData() {
  try {
    return await loadPageData();
  } catch (e) {
    console.error("[layout] could not load configuration", e);
    return { fullConfig: createDefaultConfig(), initialLocale: null, isOwner: false };
  }
}

export const dynamic = "force-dynamic";

export async function generateViewport(): Promise<Viewport> {
  const { fullConfig } = await safeData();
  return {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
    themeColor: fullConfig.appearance.primary,
    colorScheme: fullConfig.appearance.mode === "light" ? "light" : fullConfig.appearance.mode === "system" ? "light dark" : "dark",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { fullConfig, initialLocale, isOwner } = await safeData();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const a = fullConfig.appearance;
  const initialTheme = a.mode === "system" ? "light" : a.mode;
  return (
    <html lang={initialLocale ?? fullConfig.general.locale} data-theme={initialTheme} className={a.animationSpeed === 0 ? "no-motion" : undefined} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeBootScript(a.mode, fullConfig.features.visitorThemeToggle || isOwner) }} />
        <style id="theme-ssr" dangerouslySetInnerHTML={{ __html: buildThemeCss(a, fullConfig.layout) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

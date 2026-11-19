import { ensureContrast, luminance, mix, onColor, rgba } from "./color";
import type { AppearanceConfig, FontId, LayoutConfig } from "./config/schema";

/**
 * Theme engine: turns the appearance config into CSS custom properties.
 * Rendered server-side (no flash) and re-rendered live while editing.
 * Light / dark / AMOLED palettes are selected with [data-theme] on <html>.
 */

export const FONT_STACKS: Record<FontId, string> = {
  grotesk: `"Helvetica Neue", Helvetica, "Inter Variable", Arial, ui-sans-serif, sans-serif`,
  inter: `"Inter Variable", "Inter", ui-sans-serif, system-ui, sans-serif`,
  manrope: `"Manrope Variable", "Manrope", ui-sans-serif, system-ui, sans-serif`,
  jakarta: `"Plus Jakarta Sans Variable", "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif`,
  "space-grotesk": `"Space Grotesk Variable", "Space Grotesk", ui-sans-serif, system-ui, sans-serif`,
  fraunces: `"Fraunces Variable", "Fraunces", ui-serif, Georgia, serif`,
  "jetbrains-mono": `"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, SFMono-Regular, monospace`,
  system: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", sans-serif`,
  serif: `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif`,
};

export const FONT_LABELS: Record<FontId, string> = {
  grotesk: "Neo Grotesk (Helvetica)",
  inter: "Inter",
  manrope: "Manrope",
  jakarta: "Plus Jakarta Sans",
  "space-grotesk": "Space Grotesk",
  fraunces: "Fraunces",
  "jetbrains-mono": "JetBrains Mono",
  system: "System UI",
  serif: "Classic Serif",
};

type Palette = "light" | "dark" | "amoled";
const BASE: Record<Palette, { bg: string; fg: string; muted: string; surface: string; border: string; borderStrong: string }> = {
  light: { bg: "#f4f3ef", fg: "#17161c", muted: "#5d5b68", surface: "#ffffff", border: "rgba(23,22,28,0.08)", borderStrong: "rgba(23,22,28,0.16)" },
  dark: { bg: "#0d0c12", fg: "#f2f1f6", muted: "#a2a0b2", surface: "#18171f", border: "rgba(255,255,255,0.07)", borderStrong: "rgba(255,255,255,0.16)" },
  amoled: { bg: "#000000", fg: "#f4f4f5", muted: "#9c9ca6", surface: "#000000", border: "rgba(255,255,255,0.10)", borderStrong: "rgba(255,255,255,0.22)" },
};

function paletteVars(a: AppearanceConfig, p: Palette): string {
  const custom = a.background.type === "solid" && !a.background.themed;
  const bg = custom ? (p === "light" ? a.background.color : p === "amoled" ? "#000000" : a.background.colorDark) : BASE[p].bg;
  // Text colours follow the real background brightness, so a custom dark colour
  // never ends up with dark text (and vice versa).
  const isLightBg = luminance(bg) > 0.3;
  const base = isLightBg ? BASE.light : p === "amoled" ? BASE.amoled : BASE.dark;
  const lightish = isLightBg;
  // Derive surfaces from the actual page background so custom colours (e.g. Nord) stay harmonious.
  const surface =
    p === "amoled" && !isLightBg ? "#000000" : a.background.type === "solid" && !a.background.themed ? mix(bg, "#ffffff", lightish ? 0.7 : 0.06) : base.surface;
  const style = a.cardStyle;
  const alpha = style === "solid" ? Math.max(a.transparency, 0.94) : style === "outline" ? Math.min(a.transparency, 0.35) * (lightish ? 1 : 0.6) : a.transparency;
  const primary = ensureContrast(a.primary, bg, 3);
  const accent = ensureContrast(a.accent, bg, 2.6);
  const secondary = ensureContrast(a.secondary, bg, 2.2);
  const shadowColor = lightish ? "20, 18, 30" : "0, 0, 0";
  const s = a.shadow;
  return [
    `--bg:${bg}`,
    `--fg:${base.fg}`,
    `--fg-muted:${base.muted}`,
    `--fg-subtle:${rgba(base.fg, 0.42)}`,
    `--surface:${rgba(surface, alpha)}`,
    `--surface-solid:${surface}`,
    `--surface-2:${lightish ? "rgba(23,22,28,0.04)" : "rgba(255,255,255,0.05)"}`,
    `--surface-3:${lightish ? "rgba(23,22,28,0.07)" : "rgba(255,255,255,0.09)"}`,
    `--border:${style === "flat" ? "transparent" : style === "outline" || style === "line" ? base.borderStrong : base.border}`,
    `--border-strong:${base.borderStrong}`,
    `--primary:${primary}`,
    `--primary-fg:${onColor(primary)}`,
    `--primary-soft:${rgba(primary, lightish ? 0.1 : 0.16)}`,
    `--secondary:${secondary}`,
    `--accent:${accent}`,
    `--accent-soft:${rgba(accent, lightish ? 0.12 : 0.18)}`,
    `--ring:${rgba(primary, 0.45)}`,
    `--shadow:${s === 0 || style === "flat" ? "none" : `0 1px 2px rgba(${shadowColor}, ${0.06 + s * 0.12}), 0 ${8 + s * 16}px ${24 + s * 40}px -12px rgba(${shadowColor}, ${0.1 + s * 0.45})`}`,
    `--bg-overlay:${rgba(bg, a.background.overlay)}`,
    `color-scheme:${lightish ? "light" : "dark"}`,
  ].join(";");
}

export function buildThemeCss(a: AppearanceConfig, layout: LayoutConfig): string {
  const speed = a.animationSpeed;
  const common = [
    `--font-body:${FONT_STACKS[a.font]}`,
    `--font-heading:${FONT_STACKS[a.headingFont]}`,
    `--font-size:${a.fontSize}px`,
    `--radius:${a.radius}px`,
    `--radius-sm:${Math.max(4, a.radius * 0.6)}px`,
    `--radius-lg:${a.radius * 1.35}px`,
    `--blur:${a.cardStyle === "glass" ? a.glassBlur : 0}px`,
    `--speed:${speed}`,
    `--dur-mult:${speed > 0 ? (1 / speed).toFixed(3) : 0}`,
    `--gap:${layout.gap}px`,
    `--page-pad:${layout.padding}px`,
    `--max-w:${layout.fullWidth ? "100%" : `${layout.maxWidth}px`}`,
    `--row-h:${layout.rowHeight}px`,
    `--cols:${layout.columns}`,
    `--mobile-cols:${layout.mobile.columns}`,
    `--sidebar-w:${layout.sidebarWidth}px`,
    `--bg-blur:${a.background.blur}px`,
    `--g-from:${a.background.gradientFrom}`,
    `--g-via:${a.background.gradientVia}`,
    `--g-to:${a.background.gradientTo}`,
    `--g-angle:${a.background.gradientAngle}deg`,
    `--c-primary-raw:${a.primary}`,
    `--c-accent-raw:${a.accent}`,
    `--c-secondary-raw:${a.secondary}`,
  ].join(";");
  const light = paletteVars(a, "light");
  const dark = paletteVars(a, "dark");
  const amoled = paletteVars(a, "amoled");
  // Forced modes ignore the visitor's system preference unless they chose an override.
  return [
    `:root{${common}}`,
    `:root,[data-theme="light"]{${light}}`,
    `[data-theme="dark"]{${dark}}`,
    `[data-theme="amoled"]{${amoled}}`,
  ].join("\n");
}

/** Sanitises owner-provided custom CSS so it cannot break out of its <style> element. */
export const sanitizeCss = (css: string) => css.replace(/<\/?\s*(style|script)/gi, "").replace(/</g, "\\3C ");

export const UI_STORAGE_KEY = "hp-ui";

/** Inline script (runs before paint) that resolves the effective theme. */
export function themeBootScript(mode: string, allowOverride: boolean) {
  return `(function(){try{var m=${JSON.stringify(mode)};var o=null;if(${allowOverride}){var raw=localStorage.getItem(${JSON.stringify(UI_STORAGE_KEY)});o=raw?(JSON.parse(raw).state||{}).themeOverride:null;}if(o&&/^(light|dark|amoled|system)$/.test(o))m=o;if(m==="system")m=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",m);}catch(e){}})();`;
}

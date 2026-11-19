import { z } from "zod";

/**
 * Single source of truth for the site configuration.
 * Everything a visitor sees is derived from this object – nothing personal
 * lives in source code. The schema is used for validation on import and
 * on every server-side write.
 */

const hex = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "invalid color");
const str = (max = 500) => z.string().max(max);
const url = z
  .string()
  .max(2048)
  .refine((v) => v === "" || /^(https?:\/\/|\/|mailto:|tel:)/i.test(v), "invalid url");

export const LOCALES = ["de", "en"] as const;
export const THEME_MODES = ["system", "light", "dark", "amoled"] as const;
export const FONTS = [
  "grotesk",
  "inter",
  "manrope",
  "jakarta",
  "space-grotesk",
  "fraunces",
  "jetbrains-mono",
  "system",
  "serif",
] as const;
export const BACKGROUND_TYPES = ["solid", "gradient", "image", "video", "animated"] as const;
export const ANIMATED_BACKGROUNDS = ["aurora", "mesh", "grid", "orbs", "noise"] as const;
export const TEMPLATES = ["dashboard", "sidebar", "portfolio", "bento", "editorial"] as const;
export const NAV_MODES = ["none", "top", "floating"] as const;
export const CARD_STYLES = ["glass", "solid", "outline", "flat", "line"] as const;

export const generalSchema = z.object({
  name: str(120),
  username: str(60),
  siteTitle: str(160),
  description: str(500),
  avatar: url,
  logo: url,
  favicon: url,
  locale: z.enum(LOCALES),
  timezone: str(80),
  dateFormat: z.enum(["short", "medium", "long", "full", "iso"]),
  timeFormat: z.enum(["24h", "12h"]),
  showSeconds: z.boolean(),
});

export const appearanceSchema = z.object({
  preset: str(60),
  mode: z.enum(THEME_MODES),
  primary: hex,
  secondary: hex,
  accent: hex,
  font: z.enum(FONTS),
  headingFont: z.enum(FONTS),
  fontSize: z.number().min(12).max(22),
  cardStyle: z.enum(CARD_STYLES),
  background: z.object({
    type: z.enum(BACKGROUND_TYPES),
    /** Use the theme's own base colour (adapts to light/dark) instead of `color`. */
    themed: z.boolean(),
    /** Solid background in light mode … */
    color: hex,
    /** … and in dark mode (AMOLED always uses true black). */
    colorDark: hex,
    gradientFrom: hex,
    gradientVia: hex,
    gradientTo: hex,
    gradientAngle: z.number().min(0).max(360),
    image: url,
    video: url,
    animated: z.enum(ANIMATED_BACKGROUNDS),
    overlay: z.number().min(0).max(1),
    blur: z.number().min(0).max(40),
  }),
  glassBlur: z.number().min(0).max(48),
  transparency: z.number().min(0).max(1),
  radius: z.number().min(0).max(40),
  shadow: z.number().min(0).max(1),
  animationSpeed: z.number().min(0).max(3),
  customCss: str(50_000),
});

export const layoutSchema = z.object({
  template: z.enum(TEMPLATES),
  columns: z.number().int().min(1).max(6),
  maxWidth: z.number().int().min(640).max(2400),
  fullWidth: z.boolean(),
  gap: z.number().min(0).max(48),
  padding: z.number().min(0).max(96),
  rowHeight: z.number().min(60).max(400),
  navigation: z.enum(NAV_MODES),
  sidebarPosition: z.enum(["left", "right"]),
  sidebarWidth: z.number().min(240).max(480),
  header: z.object({
    show: z.boolean(),
    sticky: z.boolean(),
    showLogo: z.boolean(),
    showSearch: z.boolean(),
    showQuickLinks: z.boolean(),
  }),
  footer: z.object({
    show: z.boolean(),
    text: str(500),
    showLogin: z.boolean(),
  }),
  /** Options of the "editorial" template (Swiss grid, oversized display type). */
  editorial: z.object({
    heroText: str(40),
    tagline: str(200),
    showGridLines: z.boolean(),
    showCursor: z.boolean(),
    grayscaleImages: z.boolean(),
    sectionNumbers: z.boolean(),
  }),
  mobile: z.object({
    columns: z.number().int().min(1).max(2),
    customOrder: z.boolean(),
    order: z.array(str(64)).max(500),
    compactHeader: z.boolean(),
  }),
});

export const widgetSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
  type: z.string().regex(/^[a-z0-9-]{1,40}$/),
  title: str(160),
  showTitle: z.boolean(),
  enabled: z.boolean(),
  visibility: z.enum(["public", "private"]),
  region: z.enum(["main", "sidebar"]),
  size: z.object({ w: z.number().int().min(1).max(6), h: z.number().int().min(1).max(6) }),
  mobile: z.object({ hidden: z.boolean(), w: z.number().int().min(1).max(2) }),
  style: z.enum(["inherit", ...CARD_STYLES]),
  showInNav: z.boolean(),
  settings: z.record(z.string(), z.unknown()),
});

export const quickLinkSchema = z.object({
  id: z.string().max(64),
  label: str(80),
  url,
  icon: str(40),
  shortcut: str(1),
});

export const siteConfigSchema = z.object({
  version: z.literal(1),
  general: generalSchema,
  appearance: appearanceSchema,
  layout: layoutSchema,
  widgets: z.array(widgetSchema).max(200),
  quickLinks: z.array(quickLinkSchema).max(50),
  seo: z.object({
    keywords: str(500),
    ogImage: url,
    indexable: z.boolean(),
  }),
  features: z.object({
    pwa: z.boolean(),
    commandPalette: z.boolean(),
    shortcuts: z.boolean(),
    visitorThemeToggle: z.boolean(),
  }),
});

export type SiteConfig = z.infer<typeof siteConfigSchema>;
export type GeneralConfig = SiteConfig["general"];
export type AppearanceConfig = SiteConfig["appearance"];
export type LayoutConfig = SiteConfig["layout"];
export type WidgetInstance = z.infer<typeof widgetSchema>;
export type QuickLink = z.infer<typeof quickLinkSchema>;
export type ThemeMode = (typeof THEME_MODES)[number];
export type Locale = (typeof LOCALES)[number];
export type FontId = (typeof FONTS)[number];
export type CardStyle = (typeof CARD_STYLES)[number];

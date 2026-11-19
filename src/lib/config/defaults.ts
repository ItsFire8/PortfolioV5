import { WIDGETS_BY_TYPE } from "@/widgets/definitions";
import type { SiteConfig, WidgetInstance } from "./schema";
import { siteConfigSchema } from "./schema";

export function newId(prefix = "w"): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `${prefix}_${rnd}`;
}

export function createWidget(type: string, overrides: Partial<WidgetInstance> = {}): WidgetInstance {
  const def = WIDGETS_BY_TYPE[type];
  if (!def) throw new Error(`Unknown widget type: ${type}`);
  return {
    id: newId(type.slice(0, 3)),
    type,
    title: "",
    showTitle: true,
    enabled: true,
    visibility: def.defaultVisibility,
    region: "main",
    size: { ...def.defaultSize },
    mobile: { hidden: false, w: def.defaultSize.w >= 2 ? 2 : 1 },
    style: "inherit",
    showInNav: ["about", "resume", "skills", "projects", "contact", "gallery"].includes(type),
    settings: structuredClone(def.defaultSettings),
    ...overrides,
  };
}

/**
 * Factory defaults. Intentionally free of personal content: the owner fills
 * in name, texts and links via the setup wizard and the configuration center.
 * Empty content widgets stay hidden from visitors until they have content.
 */
export function createDefaultConfig(locale: "de" | "en" = "de"): SiteConfig {
  const fixed = (type: string, id: string, extra: Partial<WidgetInstance> = {}) =>
    createWidget(type, { id, ...extra });

  const widgets: WidgetInstance[] = [
    fixed("greeting", "greeting", { showTitle: false, size: { w: 3, h: 1 }, region: "sidebar" }),
    fixed("clock", "clock", { showTitle: false, size: { w: 1, h: 1 } }),
    fixed("search", "search", { showTitle: false, size: { w: 4, h: 1 } }),
    fixed("profile", "profile", { showTitle: false, region: "sidebar" }),
    fixed("about", "about"),
    fixed("links", "links"),
    fixed("todo", "todo", { size: { w: 1, h: 2 } }),
    fixed("notes", "notes", { size: { w: 1, h: 2 } }),
    fixed("skills", "skills"),
    fixed("projects", "projects"),
    fixed("resume", "resume"),
    fixed("social", "social", { region: "sidebar" }),
    fixed("calendar", "calendar", { size: { w: 1, h: 2 } }),
    fixed("quote", "quote", { showTitle: false }),
    fixed("countdown", "countdown", { showTitle: false }),
    fixed("contact", "contact"),
    fixed("weather", "weather", { enabled: false }),
    fixed("rss", "rss", { enabled: false }),
    fixed("gallery", "gallery", { enabled: false }),
  ];

  const config: SiteConfig = {
    version: 1,
    general: {
      name: "",
      username: "",
      siteTitle: locale === "de" ? "Meine Homepage" : "My Homepage",
      description: locale === "de" ? "Persönliche Website & Dashboard" : "Personal website & dashboard",
      avatar: "",
      logo: "",
      favicon: "",
      locale,
      timezone: "Europe/Berlin",
      dateFormat: "long",
      timeFormat: locale === "de" ? "24h" : "12h",
      showSeconds: false,
    },
    appearance: {
      preset: "glassmorphism",
      mode: "system",
      primary: "#e0569f",
      secondary: "#8b8aa8",
      accent: "#4f8ff7",
      font: "jakarta",
      headingFont: "jakarta",
      fontSize: 16,
      cardStyle: "glass",
      background: {
        type: "animated",
        themed: true,
        color: "#f4f3ef",
        colorDark: "#0e0d14",
        gradientFrom: "#1e1b4b",
        gradientVia: "#4c1d95",
        gradientTo: "#0f172a",
        gradientAngle: 135,
        image: "",
        video: "",
        animated: "aurora",
        overlay: 0.15,
        blur: 0,
      },
      glassBlur: 24,
      transparency: 0.55,
      radius: 20,
      shadow: 0.25,
      animationSpeed: 1,
      customCss: "",
    },
    layout: {
      template: "dashboard",
      columns: 4,
      maxWidth: 1280,
      fullWidth: false,
      gap: 16,
      padding: 24,
      rowHeight: 140,
      navigation: "none",
      sidebarPosition: "left",
      sidebarWidth: 320,
      header: { show: true, sticky: true, showLogo: true, showSearch: true, showQuickLinks: true },
      footer: { show: true, text: "", showLogin: true },
      editorial: { heroText: "", tagline: "", showGridLines: true, showCursor: true, grayscaleImages: true, sectionNumbers: true },
      mobile: { columns: 1, customOrder: false, order: [], compactHeader: true },
    },
    widgets,
    quickLinks: [],
    seo: { keywords: "", ogImage: "", indexable: true },
    features: { pwa: true, commandPalette: true, shortcuts: true, visitorThemeToggle: true },
  };
  return siteConfigSchema.parse(config);
}

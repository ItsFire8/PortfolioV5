import { WIDGETS_BY_TYPE } from "@/widgets/definitions";
import { createDefaultConfig, createWidget } from "./defaults";
import { siteConfigSchema, type SiteConfig, type WidgetInstance } from "./schema";

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/** Deep merge for plain objects; arrays and primitives from `patch` win. */
export function deepMerge<T>(base: T, patch: unknown): T {
  if (!isObj(base) || !isObj(patch)) return (patch === undefined ? base : (patch as T)) as T;
  const out: Obj = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
    if (!(k in out)) continue; // drop unknown keys
    out[k] = isObj(out[k]) && isObj(v) ? deepMerge(out[k], v) : v;
  }
  return out as T;
}

/** Limits nesting/size of free-form widget settings (defence in depth). */
function cleanValue(v: unknown, depth = 0): unknown {
  if (depth > 6) return undefined;
  if (typeof v === "string") return v.slice(0, 20_000);
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "boolean" || v === null) return v;
  if (Array.isArray(v)) return v.slice(0, 500).map((x) => cleanValue(x, depth + 1));
  if (isObj(v)) {
    const o: Obj = {};
    for (const [k, x] of Object.entries(v).slice(0, 100)) {
      if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
      o[k.slice(0, 64)] = cleanValue(x, depth + 1);
    }
    return o;
  }
  return undefined;
}

function normalizeWidget(raw: unknown): WidgetInstance | null {
  if (!isObj(raw) || typeof raw.type !== "string" || !WIDGETS_BY_TYPE[raw.type]) return null;
  const def = WIDGETS_BY_TYPE[raw.type];
  const base = createWidget(raw.type, typeof raw.id === "string" ? { id: raw.id } : {});
  const merged = deepMerge(base, { ...raw, settings: {} });
  const settings = { ...structuredClone(def.defaultSettings) } as Obj;
  if (isObj(raw.settings)) {
    for (const [k, v] of Object.entries(raw.settings)) {
      if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
      settings[k] = cleanValue(v);
    }
  }
  return { ...merged, settings };
}

/**
 * Turns any (possibly old, partial or hand-edited) config into a valid one.
 * Throws a ZodError when values are present but invalid.
 */
export function normalizeConfig(input: unknown): SiteConfig {
  const raw = isObj(input) ? input : {};
  const locale = isObj(raw.general) && raw.general.locale === "en" ? "en" : "de";
  const defaults = createDefaultConfig(locale);
  const { widgets, quickLinks, ...rest } = raw;
  const merged = deepMerge(defaults, rest);
  const seen = new Set<string>();
  merged.widgets = Array.isArray(widgets)
    ? widgets
        .map(normalizeWidget)
        .filter((w): w is WidgetInstance => !!w && !seen.has(w.id) && !!seen.add(w.id))
    : defaults.widgets;
  merged.quickLinks = Array.isArray(quickLinks)
    ? quickLinks.filter(isObj).map((q, i) => ({
        id: String(q.id ?? `q${i}`).slice(0, 64),
        label: String(q.label ?? "").slice(0, 80),
        url: String(q.url ?? ""),
        icon: String(q.icon ?? "Link").slice(0, 40),
        shortcut: String(q.shortcut ?? "").slice(0, 1),
      }))
    : defaults.quickLinks;
  return siteConfigSchema.parse(merged);
}

/**
 * The view sent to anonymous visitors: no private, disabled or empty
 * widgets. Contains no secrets by design – secrets
 * (users, system settings, messages) never live in the site config.
 */
export function toPublicConfig(config: SiteConfig): SiteConfig {
  const widgets = config.widgets.filter((w) => {
    if (!w.enabled || w.visibility !== "public") return false;
    const def = WIDGETS_BY_TYPE[w.type];
    return !def?.isEmpty?.(w.settings, config);
  });
  const ids = new Set(widgets.map((w) => w.id));
  return {
    ...config,
    widgets,
    layout: {
      ...config.layout,
      mobile: { ...config.layout.mobile, order: config.layout.mobile.order.filter((id) => ids.has(id)) },
    },
  };
}

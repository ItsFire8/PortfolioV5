import type { Locale, SiteConfig, WidgetInstance } from "@/lib/config/schema";

/** Bilingual label. */
export type L = { de: string; en: string };
export const l = (de: string, en: string): L => ({ de, en });

interface FieldBase {
  key: string;
  label: L;
  help?: L;
  placeholder?: string;
  /** Show the field only when another setting has a given value. */
  when?: { key: string; equals: unknown | unknown[] };
}

export type FieldDef =
  | (FieldBase & {
      type:
        | "text"
        | "textarea"
        | "markdown"
        | "url"
        | "image"
        | "video"
        | "file"
        | "color"
        | "date"
        | "datetime"
        | "timezone"
        | "icon";
    })
  | (FieldBase & { type: "number" | "range"; min: number; max: number; step?: number; unit?: string })
  | (FieldBase & { type: "toggle" })
  | (FieldBase & { type: "select"; options: { value: string; label: L }[] })
  | (FieldBase & { type: "tags" })
  | (FieldBase & { type: "list"; itemLabel: L; titleKey: string; fields: FieldDef[]; max?: number });

export type WidgetCategory = "personal" | "productivity" | "information" | "media" | "custom";

/**
 * Server-safe widget metadata. React components live in ./components.tsx so
 * that this file can be imported from API routes and default-config builders.
 */
export interface WidgetDefinition {
  type: string;
  name: L;
  description: L;
  icon: string;
  category: WidgetCategory;
  defaultSize: { w: number; h: number };
  defaultVisibility: "public" | "private";
  defaultSettings: Record<string, unknown>;
  fields: FieldDef[];
  /** Uses /api/widget-data for its interactive state (notes, todos...). */
  dataBacked?: boolean;
  /** Calls an optional external service via the server. */
  external?: L;
  /** Returns true if the widget has no content yet (hidden for visitors). */
  isEmpty?: (settings: Record<string, unknown>, config: SiteConfig) => boolean;
  /** Allow only one instance (still duplicable manually if false). */
  singleton?: boolean;
}

export interface WidgetProps<S = Record<string, unknown>> {
  widget: WidgetInstance & { settings: S };
  config: SiteConfig;
  locale: Locale;
  isOwner: boolean;
  editMode: boolean;
}

"use client";

import { useLocale } from "@/hooks/use-i18n";
import { newId } from "@/lib/config/defaults";
import { bi } from "@/lib/i18n";
import type { QuickLink } from "@/lib/config/schema";
import { useConfigStore } from "@/store/config-store";
import { l, type FieldDef } from "@/widgets/types";
import { FieldControl } from "./field-renderer";

const field: FieldDef = {
  key: "quickLinks",
  type: "list",
  label: l("Schnellzugriffe", "Quick links"),
  itemLabel: l("Schnellzugriff", "Quick link"),
  titleKey: "label",
  max: 50,
  fields: [
    { key: "label", type: "text", label: l("Beschriftung", "Label") },
    { key: "url", type: "url", label: l("URL", "URL") },
    { key: "icon", type: "icon", label: l("Symbol", "Icon") },
    { key: "shortcut", type: "text", label: l("Taste (optional, ein Zeichen)", "Key (optional, one character)"), placeholder: "g" },
  ],
};

export function QuickLinksPanel() {
  const locale = useLocale();
  const links = useConfigStore((s) => s.config.quickLinks);
  const set = useConfigStore((s) => s.set);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {bi(
          locale,
          "Schnellzugriffe erscheinen im Header, in der Befehlspalette und lassen sich per Taste öffnen.",
          "Quick links appear in the header and command palette and can be opened with a single key.",
        )}
      </p>
      <FieldControl
        field={field}
        value={links}
        onChange={(v) =>
          set((c) => ({
            ...c,
            quickLinks: (v as Partial<QuickLink>[]).map((q) => ({
              id: q.id || newId("q"),
              label: String(q.label ?? ""),
              url: String(q.url ?? ""),
              icon: String(q.icon || "Link"),
              shortcut: String(q.shortcut ?? "").slice(0, 1),
            })),
          }))
        }
      />
    </div>
  );
}

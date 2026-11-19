"use client";

import { useState } from "react";
import { useLocale, useT } from "@/hooks/use-i18n";
import { tl } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { WIDGET_DEFINITIONS } from "@/widgets/definitions";
import type { WidgetCategory } from "@/widgets/types";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/misc";
import { Icon } from "@/components/icon";
import { toast } from "@/components/ui/toast";

const CATS: WidgetCategory[] = ["personal", "productivity", "information", "media", "custom"];

export function AddWidgetDialog() {
  const t = useT();
  const locale = useLocale();
  const open = useUIStore((s) => s.addWidgetOpen);
  const ui = useUIStore();
  const widgets = useConfigStore((s) => s.config.widgets);
  const addWidget = useConfigStore((s) => s.addWidget);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<WidgetCategory | "all">("all");
  const list = WIDGET_DEFINITIONS.filter((d) => (cat === "all" || d.category === cat) && `${tl(d.name, locale)} ${tl(d.description, locale)}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Dialog open={open} onClose={() => ui.setAddWidgetOpen(false)} title={t.widgets.library} size="xl">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${t.common.search} …`} data-autofocus className="sm:max-w-xs" />
          <div className="flex flex-wrap gap-1">
            {(["all", ...CATS] as const).map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", cat === c ? "bg-fg text-bg" : "bg-surface-2 text-muted hover:text-fg")}>
                {c === "all" ? (locale === "de" ? "Alle" : "All") : t.widgets.categories[c]}
              </button>
            ))}
          </div>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((d) => {
            const count = widgets.filter((w) => w.type === d.type).length;
            const disabled = !!d.singleton && count > 0;
            return (
              <li key={d.type}>
                <button
                  disabled={disabled}
                  onClick={() => {
                    const id = addWidget(d.type);
                    ui.setAddWidgetOpen(false);
                    ui.setEditMode(true);
                    toast.success(`${tl(d.name, locale)} ✓`);
                    setTimeout(() => document.getElementById(`w-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 150);
                    if (d.fields.length) setTimeout(() => ui.setEditingWidget(id), 250);
                  }}
                  className="group flex h-full w-full items-start gap-3 rounded-ui border border-border bg-surface-2 p-3 text-left transition enabled:hover:border-primary enabled:hover:bg-primary-soft disabled:opacity-50"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-ui bg-surface-3 text-primary">
                    <Icon name={d.icon} className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                      {tl(d.name, locale)}
                      {count > 0 && <Badge>{count}×</Badge>}
                      {d.external && <Badge tone="warning">{t.widgets.externalNote}</Badge>}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{tl(d.description, locale)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Dialog>
  );
}

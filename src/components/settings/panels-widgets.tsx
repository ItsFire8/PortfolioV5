"use client";

import { Copy, Eye, EyeOff, Globe, Lock, Plus, Settings2, Trash2 } from "lucide-react";
import { useLocale, useT } from "@/hooks/use-i18n";
import { bi } from "@/lib/i18n";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { getWidgetDefinition } from "@/widgets/definitions";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/ui/confirm";
import { Icon } from "@/components/icon";
import { widgetTitle } from "@/components/grid/widget-frame";
import { SortableList } from "./sortable-list";

export function WidgetsPanel() {
  const t = useT();
  const locale = useLocale();
  const widgets = useConfigStore((s) => s.config.widgets);
  const s = useConfigStore((st) => st);
  const ui = useUIStore();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted">{bi(locale, "Ziehen zum Sortieren. Reihenfolge = Position im Raster.", "Drag to sort. Order = position in the grid.")}</p>
        <Button size="sm" variant="primary" onClick={() => ui.setAddWidgetOpen(true)}>
          <Plus /> {t.widgets.add}
        </Button>
      </div>
      <SortableList
        items={widgets}
        onReorder={s.moveWidget}
        render={(w) => {
          const def = getWidgetDefinition(w.type);
          return (
            <div className={`flex min-w-0 flex-1 items-center gap-2 py-1.5 pr-1.5 ${w.enabled ? "" : "opacity-50"}`}>
              <span className="grid size-7 shrink-0 place-items-center rounded-[7px] bg-surface-3 text-primary">
                <Icon name={def?.icon} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{widgetTitle(w, locale)}</span>
                <span className="block text-[0.68rem] text-muted">
                  {w.size.w}×{w.size.h}
                  {w.region === "sidebar" ? ` · ${t.widgets.regionSidebar}` : ""}
                </span>
              </span>
              <Button size="icon-sm" variant="ghost" onClick={() => s.updateWidget(w.id, { visibility: w.visibility === "public" ? "private" : "public" })} title={w.visibility === "public" ? t.common.public : t.common.private} aria-label={t.widgets.visibility}>
                {w.visibility === "public" ? <Globe /> : <Lock className="text-amber-500" />}
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => s.updateWidget(w.id, { enabled: !w.enabled })} title={w.enabled ? t.widgets.hide : t.widgets.show} aria-label={w.enabled ? t.widgets.hide : t.widgets.show}>
                {w.enabled ? <Eye /> : <EyeOff />}
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => s.duplicateWidget(w.id)} aria-label={t.common.duplicate} title={t.common.duplicate}>
                <Copy />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => ui.setEditingWidget(w.id)} aria-label={t.widgets.configure} title={t.widgets.configure}>
                <Settings2 />
              </Button>
              <Button
                size="icon-sm"
                variant="danger-ghost"
                aria-label={t.common.remove}
                title={t.common.remove}
                onClick={async () => (await confirmDialog({ title: t.widgets.removeConfirm, message: widgetTitle(w, locale), danger: true, confirmLabel: t.common.remove, cancelLabel: t.common.cancel })) && s.removeWidget(w.id)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        }}
      />
    </div>
  );
}

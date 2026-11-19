"use client";

import { Database, LayoutGrid, LayoutTemplate, Palette, Settings, Shapes, X, Zap } from "lucide-react";
import { useT } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { useUIStore, type SettingsTab } from "@/store/ui-store";
import { Sheet } from "@/components/ui/dialog";
import { SaveIndicator } from "@/components/shell/save-indicator";
import { GeneralPanel } from "./panels-general";
import { AppearancePanel } from "./panels-appearance";
import { LayoutPanel } from "./panels-layout";
import { WidgetsPanel } from "./panels-widgets";
import { QuickLinksPanel } from "./panels-quicklinks";
import { DataPanel } from "./panels-data";

export function ConfigCenter() {
  const t = useT();
  const ui = useUIStore();
  const tabs: { id: SettingsTab; label: string; icon: typeof Settings }[] = [
    { id: "general", label: t.settings.general, icon: Settings },
    { id: "appearance", label: t.settings.appearance, icon: Palette },
    { id: "layout", label: t.settings.layout, icon: LayoutTemplate },
    { id: "widgets", label: t.settings.widgets, icon: Shapes },
    { id: "quicklinks", label: t.settings.quickLinks, icon: Zap },
    { id: "data", label: t.settings.data, icon: Database },
  ];
  return (
    <Sheet open={ui.settingsOpen} onClose={ui.closeSettings} label={t.settings.title} className="sm:w-[480px]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
            <LayoutGrid className="size-4 text-primary" /> {t.settings.title}
          </h2>
          <p className="text-xs text-muted">{t.settings.livePreview}</p>
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator />
          <button onClick={ui.closeSettings} className="rounded-ui p-1.5 text-muted hover:bg-surface-3 hover:text-fg" aria-label={t.common.close}>
            <X className="size-4" />
          </button>
        </div>
      </div>
      <nav role="tablist" aria-label={t.settings.title} className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={ui.settingsTab === tab.id}
            onClick={() => ui.setSettingsTab(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-ui px-2.5 py-1.5 text-xs font-medium transition",
              ui.settingsTab === tab.id ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-3 hover:text-fg",
            )}
          >
            <tab.icon className="size-3.5" /> {tab.label}
          </button>
        ))}
      </nav>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5" role="tabpanel">
        {ui.settingsTab === "general" && <GeneralPanel />}
        {ui.settingsTab === "appearance" && <AppearancePanel />}
        {ui.settingsTab === "layout" && <LayoutPanel />}
        {ui.settingsTab === "widgets" && <WidgetsPanel />}
        {ui.settingsTab === "quicklinks" && <QuickLinksPanel />}
        {ui.settingsTab === "data" && <DataPanel />}
      </div>
      <div className="border-t border-border px-5 py-3 text-xs text-muted">
        <a href="/admin" className="hover:text-fg">
          {t.header.admin} →
        </a>
      </div>
    </Sheet>
  );
}

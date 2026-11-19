"use client";

import { WidgetsPanel } from "@/components/settings/panels-widgets";
import { QuickLinksPanel } from "@/components/settings/panels-quicklinks";
import { GeneralPanel } from "@/components/settings/panels-general";
import { useLocale } from "@/hooks/use-i18n";
import { bi } from "@/lib/i18n";

export function ContentAdmin() {
  const locale = useLocale();
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="card p-5" data-style="glass">
        <h2 className="mb-4 font-heading font-semibold">{bi(locale, "Widgets & Module", "Widgets & modules")}</h2>
        <WidgetsPanel />
      </div>
      <div className="space-y-6">
        <div className="card p-5" data-style="glass">
          <h2 className="mb-4 font-heading font-semibold">{bi(locale, "Schnellzugriffe", "Quick links")}</h2>
          <QuickLinksPanel />
        </div>
        <div className="card p-5" data-style="glass">
          <h2 className="mb-4 font-heading font-semibold">{bi(locale, "Allgemein & SEO", "General & SEO")}</h2>
          <GeneralPanel />
        </div>
      </div>
    </div>
  );
}

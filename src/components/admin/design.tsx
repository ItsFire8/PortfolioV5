"use client";

import { Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/hooks/use-i18n";
import { bi } from "@/lib/i18n";
import { useConfigStore } from "@/store/config-store";
import { AppearancePanel } from "@/components/settings/panels-appearance";
import { LayoutPanel } from "@/components/settings/panels-layout";
import { Segmented } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

/** Design editor with a live visitor preview (iframe reloads after each autosave). */
export function DesignAdmin() {
  const locale = useLocale();
  const [tab, setTab] = useState<"appearance" | "layout">("appearance");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const savedConfig = useConfigStore((s) => s.savedConfig);
  const frame = useRef<HTMLIFrameElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    frame.current?.contentWindow?.location.reload();
  }, [savedConfig]);
  const width = { desktop: "100%", tablet: "820px", mobile: "390px" }[device];
  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <div className="card max-h-[calc(100dvh-8rem)] self-start overflow-y-auto p-5 xl:sticky xl:top-20" data-style="glass">
        <Segmented label="Tabs" className="mb-6" value={tab} onChange={setTab} options={[{ value: "appearance", label: bi(locale, "Erscheinung", "Appearance") }, { value: "layout", label: "Layout" }]} />
        {tab === "appearance" ? <AppearancePanel /> : <LayoutPanel />}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Segmented
            label="Device"
            value={device}
            onChange={setDevice}
            className="w-fit"
            options={[
              { value: "desktop", label: <Monitor />, title: "Desktop" },
              { value: "tablet", label: <Tablet />, title: "Tablet" },
              { value: "mobile", label: <Smartphone />, title: "Mobile" },
            ]}
          />
          <span className="text-xs text-muted">{bi(locale, "Vorschau als Besucher – aktualisiert sich nach dem Speichern.", "Visitor preview – refreshes after saving.")}</span>
          <Button size="icon-sm" variant="ghost" onClick={() => frame.current?.contentWindow?.location.reload()} aria-label="Reload">
            <RefreshCw />
          </Button>
        </div>
        <div className="overflow-hidden rounded-card border border-border-strong bg-surface-2 p-2">
          <iframe ref={frame} src="/?preview=visitor" title="Preview" className="mx-auto h-[75dvh] rounded-ui border-0 bg-bg transition-[width] duration-300" style={{ width, maxWidth: "100%" }} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { MotionConfig } from "framer-motion";
import { Eye, Wrench } from "lucide-react";
import { useEffect, useMemo } from "react";
import { setCsrfToken } from "@/lib/api";
import { toPublicConfig } from "@/lib/config/normalize";
import type { Locale, SiteConfig } from "@/lib/config/schema";
import { bi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ConfigStoreProvider, useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { LocaleProvider, useLocale, useT } from "@/hooks/use-i18n";
import { WidgetGrid } from "@/components/grid/widget-grid";
import { CommandPalette } from "@/components/command/command-palette";
import { ConfigCenter } from "@/components/settings/config-center";
import { WidgetSettingsDialog } from "@/components/settings/widget-settings-dialog";
import { AddWidgetDialog } from "@/components/settings/add-widget-dialog";
import { Toaster } from "@/components/ui/toast";
import { ConfirmHost } from "@/components/ui/confirm";
import { ThemeController } from "./theme-controller";
import { Background } from "./background";
import { Header } from "./header";
import { Footer } from "./footer";
import { FloatingNav } from "./floating-nav";
import { EditBar } from "./edit-bar";
import { AutoSaver } from "./auto-saver";
import { KeyboardShortcuts } from "./keyboard";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { BackgroundTasks } from "./background-tasks";

export interface ShellProps {
  config: SiteConfig;
  isOwner: boolean;
  csrf: string | null;
  user: { displayName: string; role: string } | null;
  statsEnabled: boolean;
  maintenance: boolean;
  initialLocale: Locale | null;
}

export function AppShell(props: ShellProps) {
  // The CSRF token must be available before the first owner request.
  if (typeof window !== "undefined" && props.csrf) setCsrfToken(props.csrf);
  return (
    <ConfigStoreProvider config={props.config} isOwner={props.isOwner}>
      <LocaleProvider initial={props.initialLocale}>
        <Shell {...props} />
      </LocaleProvider>
    </ConfigStoreProvider>
  );
}

function Shell({ user, statsEnabled, maintenance }: ShellProps) {
  const t = useT();
  const locale = useLocale();
  const stored = useConfigStore((s) => s.config);
  const isOwner = useConfigStore((s) => s.isOwner);
  const editMode = useUIStore((s) => s.editMode && isOwner);
  const preview = useUIStore((s) => s.previewVisitor && isOwner);
  const setPreview = useUIStore((s) => s.setPreviewVisitor);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Deep link from the admin area: /?edit=1 opens the live editor.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("edit") === "1") {
      if (isOwner) useUIStore.getState().setEditMode(true);
      url.searchParams.delete("edit");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }, [isOwner]);

  // Owner sees everything (incl. private & empty widgets). "Preview as visitor" applies the same filter the server uses.
  const config = useMemo(() => (preview ? toPublicConfig(stored) : stored), [preview, stored]);
  const ownerView = isOwner && !preview;
  const visible = useMemo(() => (editMode ? config.widgets : config.widgets.filter((w) => w.enabled)), [config.widgets, editMode]);
  const L = config.layout;
  const sidebar = L.template === "sidebar";
  const mainWidgets = sidebar ? visible.filter((w) => w.region !== "sidebar") : visible;
  const sideWidgets = sidebar ? visible.filter((w) => w.region === "sidebar") : [];
  const speed = config.appearance.animationSpeed;

  return (
    <MotionConfig reducedMotion={speed === 0 ? "always" : "user"} transition={{ duration: 0.3 / Math.max(speed, 0.25) }}>
      <ThemeController />
      <Background />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-ui focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg">
        {t.header.skip}
      </a>
      {isOwner && maintenance && (
        <div className="no-print flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-black">
          <Wrench className="size-3.5" /> {bi(locale, "Wartungsmodus aktiv – Besucher sehen eine Wartungsseite.", "Maintenance mode is on – visitors see a maintenance page.")}{" "}
          <a href="/admin/system" className="underline">
            {bi(locale, "Ändern", "Change")}
          </a>
        </div>
      )}
      {preview && (
        <div className="no-print sticky top-0 z-50 flex items-center justify-center gap-3 bg-primary px-4 py-1.5 text-xs font-medium text-primary-fg">
          <Eye className="size-3.5" /> {bi(locale, "Vorschau: So sehen Besucher deine Seite.", "Preview: this is what visitors see.")}
          <button className="rounded-full bg-black/15 px-2.5 py-0.5 hover:bg-black/25" onClick={() => setPreview(false)}>
            {t.header.exitPreview}
          </button>
        </div>
      )}
      <div id="top" className={cn("relative flex min-h-dvh flex-col", L.template === "portfolio" && "portfolio-template")}>
        <Header widgets={visible} user={ownerView ? user : null} />
        <main
          id="main"
          className={cn("mx-auto w-full flex-1 px-[var(--page-pad)] pt-6", (L.navigation === "floating" || editMode) && "pb-28")}
          style={{ maxWidth: `calc(${L.template === "portfolio" && !L.fullWidth ? `min(var(--max-w), 1100px)` : "var(--max-w)"} + var(--page-pad) * 2)` }}
        >
          {visible.length === 0 && !editMode ? (
            <div className="card mx-auto mt-16 max-w-md p-8 text-center" data-style="glass">
              <p className="text-muted">{t.widgets.noWidgets}</p>
            </div>
          ) : sidebar ? (
            <div className={cn("flex flex-col gap-[var(--gap)] lg:flex-row lg:items-start", L.sidebarPosition === "right" && "lg:flex-row-reverse")}>
              <aside className="w-full shrink-0 lg:sticky lg:top-24 lg:w-[var(--sidebar-w)]" aria-label="Sidebar">
                <WidgetGrid widgets={sideWidgets} config={config} isOwner={ownerView} editMode={editMode} single />
              </aside>
              <div className="min-w-0 flex-1">
                <WidgetGrid widgets={mainWidgets} config={config} isOwner={ownerView} editMode={editMode} />
              </div>
            </div>
          ) : (
            <WidgetGrid widgets={mainWidgets} config={config} isOwner={ownerView} editMode={editMode} />
          )}
        </main>
        <Footer />
      </div>
      {L.navigation === "floating" && !editMode && <FloatingNav widgets={visible} />}
      <CommandPalette />
      <ShortcutsDialog />
      <KeyboardShortcuts />
      <BackgroundTasks statsEnabled={statsEnabled} />
      {isOwner && (
        <>
          <AutoSaver />
          <EditBar />
          <ConfigCenter />
          <WidgetSettingsDialog />
          <AddWidgetDialog />
        </>
      )}
      <ConfirmHost />
      <Toaster />
    </MotionConfig>
  );
}

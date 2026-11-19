"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutDashboard, Moon, PencilRuler, Settings, SunMedium } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SiteConfig, WidgetInstance } from "@/lib/config/schema";
import { formatTime } from "@/lib/format";
import { bi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-i18n";
import { useNow } from "@/hooks/use-now";
import { useUIStore } from "@/store/ui-store";
import { WidgetGrid } from "@/components/grid/widget-grid";
import { widgetTitle } from "@/components/grid/widget-frame";
import { StageObject } from "@/components/stage/objects";

/** Jagged paper edge used by the "tear" page transition. */
function TornEdge({ flip }: { flip?: boolean }) {
  const d = useMemo(() => {
    let p = "M0 40 ";
    for (let x = 0; x <= 100; x += 2.5) p += `L${x} ${18 + Math.sin(x * 1.7) * 9 + Math.cos(x * 0.6) * 7} `;
    return p + "L100 40 Z";
  }, []);
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className={cn("block h-16 w-full", flip && "rotate-180")} aria-hidden>
      <path d={d} fill="currentColor" />
    </svg>
  );
}

function StatusBar({ config }: { config: SiteConfig }) {
  const now = useNow(1000);
  const g = config.general;
  const loc = (config.widgets.find((w) => w.type === "profile")?.settings.location as string) || g.timezone.split("/").pop()?.replace(/_/g, " ");
  const items: [string, string][] = [
    ["LOC", loc ?? "—"],
    ["TIME", now ? formatTime(now, { ...g, showSeconds: true }, undefined, true) : "--:--:--"],
    ["LANG", g.locale.toUpperCase()],
    ["BUILD", "OK"],
  ];
  return (
    <div className="no-print flex h-7 items-center gap-5 overflow-hidden border-b stage-line px-[var(--page-pad)] font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted" suppressHydrationWarning>
      {items.map(([k, v]) => (
        <span key={k} className="shrink-0">
          {k} <span className="text-fg/80">{v}</span>
        </span>
      ))}
    </div>
  );
}

export function StageShell({ widgets, config, isOwner, editMode }: { widgets: WidgetInstance[]; config: SiteConfig; isOwner: boolean; editMode: boolean }) {
  const locale = useLocale();
  const L = (de: string, en: string) => bi(locale, de, en);
  const ui = useUIStore();
  const st = config.layout.stage;
  const enabled = widgets.filter((w) => w.enabled);
  const flagged = enabled.filter((w) => w.showInNav);
  const sections = flagged.length >= 2 ? flagged : enabled;
  const [idx, setIdx] = useState(0);
  const [tear, setTear] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reduced = config.appearance.animationSpeed === 0;
  const cur = sections[Math.min(idx, Math.max(0, sections.length - 1))];

  const go = useCallback(
    (i: number) => {
      if (!sections.length) return;
      const next = (i + sections.length) % sections.length;
      if (next === idx) return;
      const id = sections[next].id;
      if (window.location.hash !== `#w-${id}`) window.history.replaceState(null, "", `#w-${id}`);
      clearTimeout(timer.current);
      if (st.transition === "tear" && !reduced) {
        setTear((t) => t + 1);
        timer.current = setTimeout(() => setIdx(next), 420);
      } else setIdx(next);
    },
    [idx, sections, st.transition, reduced],
  );

  // Deep links (#w-<id>), palette navigation and browser back/forward.
  useEffect(() => {
    const find = () => sections.findIndex((s) => s.id === window.location.hash.replace(/^#w-/, ""));
    const initial = find();
    if (initial >= 0) setIdx(initial); // no transition on first paint
    const sync = () => {
      const i = find();
      if (i >= 0) go(i);
    };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [sections, go]);

  useEffect(() => {
    if (editMode) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useUIStore.getState();
      if (s.paletteOpen || s.settingsOpen || s.editingWidget || document.querySelector("[aria-modal=true]")) return;
      if (e.key === "ArrowRight") go(idx + 1);
      if (e.key === "ArrowLeft") go(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, idx, editMode]);

  const title = cur ? widgetTitle(cur, locale) : config.general.siteTitle;
  const initial = (config.general.name || config.general.siteTitle || "·").charAt(0).toUpperCase();
  const dark = ui.resolvedTheme !== "light";

  return (
    <div className="stage-root relative flex min-h-dvh flex-col overflow-x-hidden">
      <div className="stage-texture" aria-hidden />
      {st.showTelemetry && <StatusBar config={config} />}
      <header className="no-print sticky top-0 z-40 grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 px-[var(--page-pad)]">
        <a href="#top" onClick={(e) => (e.preventDefault(), go(0))} className="flex w-fit items-center rounded-[5px] border border-fg/80 text-[0.8rem] font-medium leading-none">
          <span className="grid size-6 place-items-center border-r border-fg/80 font-semibold">{initial}</span>
          <AnimatePresence mode="wait">
            <motion.span key={title} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="px-2">
              {title}
            </motion.span>
          </AnimatePresence>
        </a>
        <nav aria-label="Main" className="flex max-w-[56vw] items-center gap-0.5 overflow-x-auto rounded-[7px] border stage-line bg-[color-mix(in_srgb,var(--fg)_6%,transparent)] p-0.5 text-[0.8rem]">
          {!editMode &&
            sections.map((s, i) => (
              <button key={s.id} onClick={() => go(i)} aria-current={s.id === cur?.id ? "page" : undefined} className={cn("shrink-0 rounded-[5px] px-2.5 py-1 transition", s.id === cur?.id ? "bg-[color-mix(in_srgb,var(--fg)_14%,transparent)] text-fg" : "text-muted hover:text-fg")}>
                {widgetTitle(s, locale)}
              </button>
            ))}
          {editMode && <span className="px-3 py-1 text-muted">{L("Bearbeitungsmodus", "Edit mode")}</span>}
          {config.features.commandPalette && (
            <button onClick={() => ui.setPaletteOpen(true)} className="shrink-0 rounded-[5px] px-2.5 py-1 font-medium text-muted hover:text-fg" aria-label={L("Befehlspalette", "Command palette")}>
              ⌘K
            </button>
          )}
        </nav>
        <div className="flex items-center justify-end gap-1">
          {(config.features.visitorThemeToggle || isOwner) && (
            <button onClick={() => ui.setThemeOverride(dark ? "light" : "dark")} className="grid size-8 place-items-center rounded-[6px] border stage-line text-muted hover:text-fg" aria-label={L("Farbschema wechseln", "Switch color scheme")}>
              {dark ? <SunMedium className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>
          )}
          {isOwner && (
            <>
              <button onClick={() => ui.setEditMode(!ui.editMode)} aria-pressed={ui.editMode} className={cn("grid size-8 place-items-center rounded-[6px] border stage-line text-muted hover:text-fg", ui.editMode && "text-primary")} aria-label={L("Bearbeitungsmodus", "Edit mode")}>
                <PencilRuler className="size-3.5" />
              </button>
              <button onClick={() => ui.openSettings()} className="grid size-8 place-items-center rounded-[6px] border stage-line text-muted hover:text-fg" aria-label={L("Einstellungen", "Settings")}>
                <Settings className="size-3.5" />
              </button>
              <a href="/admin" className="grid size-8 place-items-center rounded-[6px] border stage-line text-muted hover:text-fg" aria-label="Admin">
                <LayoutDashboard className="size-3.5" />
              </a>
            </>
          )}
        </div>
      </header>

      <main id="main" className="relative flex flex-1 items-center justify-center px-[var(--page-pad)] py-10">
        {editMode ? (
          <div className="w-full max-w-3xl pb-24">
            <WidgetGrid widgets={widgets} config={config} isOwner={isOwner} editMode single />
          </div>
        ) : !cur ? (
          <p className="text-muted">{L("Noch keine Bereiche.", "No sections yet.")}</p>
        ) : (
          <>
            {st.halo && <div className="stage-halo" aria-hidden />}
            <AnimatePresence mode="wait">
              <motion.section
                key={cur.id}
                id={`w-${cur.id}`}
                aria-label={title}
                initial={st.transition === "none" ? false : { opacity: 0, y: 30, scale: 0.97, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={st.transition === "none" ? undefined : { opacity: 0, y: -24, scale: 0.98, filter: "blur(6px)" }}
                transition={{ type: "spring", stiffness: 180, damping: 24 }}
                className="relative z-10 flex w-full justify-center"
              >
                <StageObject widget={cur} config={config} locale={locale} index={idx} title={title} objects={st.objects} isOwner={isOwner} />
              </motion.section>
            </AnimatePresence>
          </>
        )}
      </main>

      {!editMode && sections.length > 1 && (
        <div className="no-print pointer-events-none fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 font-mono text-[0.65rem] text-muted">
          <button onClick={() => go(idx - 1)} className="pointer-events-auto grid size-7 place-items-center rounded-[6px] border stage-line hover:text-fg" aria-label={L("Zurück", "Previous")}>
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="tabular">
            {String(idx + 1).padStart(2, "0")} / {String(sections.length).padStart(2, "0")}
          </span>
          <button onClick={() => go(idx + 1)} className="pointer-events-auto grid size-7 place-items-center rounded-[6px] border stage-line hover:text-fg" aria-label={L("Weiter", "Next")}>
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {tear > 0 && (
          <motion.div
            key={tear}
            className="pointer-events-none fixed inset-x-0 top-0 z-[60] text-[#d6d4ce]"
            initial={{ y: "100vh" }}
            animate={{ y: "-170vh" }}
            transition={{ duration: 0.95, ease: [0.65, 0, 0.35, 1] }}
            aria-hidden
          >
            <TornEdge />
            <div className="h-[130vh] bg-current" />
            <TornEdge flip />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Bookmark, CornerDownLeft, Expand, Eye, Globe, Keyboard, Languages, LayoutDashboard, LayoutGrid, LogOut, Monitor, Moon,
  Palette, PencilRuler, Plus, Search, Settings, Smartphone, SunMedium, Database, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useLocaleOverride, useT } from "@/hooks/use-i18n";
import { collectBookmarks } from "@/lib/bookmarks";
import { safeUrl } from "@/lib/utils";
import { useConfigStore } from "@/store/config-store";
import { useUIStore, type SettingsTab } from "@/store/ui-store";
import { Icon } from "@/components/icon";
import { Kbd } from "@/components/ui/misc";
import { widgetTitle } from "@/components/grid/widget-frame";
import { useFullscreen } from "@/components/shell/use-fullscreen";
import { logout } from "@/components/shell/session";
import { SEARCH_ENGINES } from "@/widgets/definitions";

interface Item {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
  icon: LucideIcon | string;
  run: () => void;
}

export function CommandPalette() {
  const t = useT();
  const locale = useLocale();
  const { setOverride } = useLocaleOverride();
  const open = useUIStore((s) => s.paletteOpen);
  const ui = useUIStore();
  const config = useConfigStore((s) => s.config);
  const isOwner = useConfigStore((s) => s.isOwner);
  const { toggle: toggleFullscreen } = useFullscreen();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const close = () => ui.setPaletteOpen(false);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const go = (fn: () => void) => () => {
      close();
      fn();
    };
    const tab = (id: SettingsTab, label: string, icon: LucideIcon): Item => ({ id: `s-${id}`, group: t.palette.actions, label: `${t.settings.title}: ${label}`, icon, run: go(() => ui.openSettings(id)) });
    const actions: Item[] = [
      { id: "theme-light", group: t.palette.actions, label: `${t.header.theme}: ${t.theme.light}`, icon: SunMedium, keywords: "hell light mode", run: go(() => ui.setThemeOverride("light")) },
      { id: "theme-dark", group: t.palette.actions, label: `${t.header.theme}: ${t.theme.dark}`, icon: Moon, keywords: "dunkel dark mode", run: go(() => ui.setThemeOverride("dark")) },
      { id: "theme-amoled", group: t.palette.actions, label: `${t.header.theme}: ${t.theme.amoled}`, icon: Smartphone, keywords: "black schwarz", run: go(() => ui.setThemeOverride("amoled")) },
      { id: "theme-system", group: t.palette.actions, label: `${t.header.theme}: ${t.theme.system}`, icon: Monitor, run: go(() => ui.setThemeOverride("system")) },
      { id: "lang", group: t.palette.actions, label: `${t.header.language}: ${locale === "de" ? "English" : "Deutsch"}`, icon: Languages, keywords: "sprache language", run: go(() => setOverride(locale === "de" ? "en" : "de")) },
      { id: "fs", group: t.palette.actions, label: t.header.fullscreen, icon: Expand, hint: "F", run: go(toggleFullscreen) },
      { id: "keys", group: t.palette.actions, label: t.palette.shortcuts, icon: Keyboard, hint: "?", run: go(() => ui.setShortcutsOpen(true)) },
    ];
    if (isOwner)
      actions.unshift(
        { id: "edit", group: t.palette.actions, label: ui.editMode ? t.header.exitEdit : t.header.editMode, icon: PencilRuler, hint: "E", run: go(() => ui.setEditMode(!ui.editMode)) },
        { id: "add", group: t.palette.actions, label: t.widgets.add, icon: Plus, run: go(() => (ui.setEditMode(true), ui.setAddWidgetOpen(true))) },
        tab("general", t.settings.general, Settings),
        tab("appearance", t.settings.appearance, Palette),
        tab("layout", t.settings.layout, LayoutGrid),
        tab("widgets", t.settings.widgets, LayoutDashboard),
        tab("data", t.settings.data, Database),
        { id: "preview", group: t.palette.actions, label: ui.previewVisitor ? t.header.exitPreview : t.header.previewVisitor, icon: Eye, run: go(() => ui.setPreviewVisitor(!ui.previewVisitor)) },
        { id: "admin", group: t.palette.actions, label: t.header.admin, icon: LayoutDashboard, run: go(() => (window.location.href = "/admin")) },
        { id: "logout", group: t.palette.actions, label: t.header.logout, icon: LogOut, run: go(() => void logout()) },
      );
    const sections: Item[] = config.widgets
      .filter((w) => w.enabled && (isOwner || w.visibility === "public"))
      .map((w) => ({
        id: `w-${w.id}`,
        group: t.palette.navigation,
        label: widgetTitle(w, locale),
        icon: ArrowRight,
        run: go(() => document.getElementById(`w-${w.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })),
      }));
    const links: Item[] = collectBookmarks(config).map((b, i) => ({
      id: `b-${i}`,
      group: t.palette.links,
      label: b.label,
      hint: b.category,
      keywords: b.url,
      icon: b.icon || Bookmark,
      run: go(() => window.open(safeUrl(b.url), /^https?:/.test(b.url) ? "_blank" : "_self", "noopener,noreferrer")),
    }));
    return [...actions, ...sections, ...links];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, isOwner, locale, t, ui.editMode, ui.previewVisitor]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = !s
      ? items.filter((i) => i.group !== t.palette.links).concat(items.filter((i) => i.group === t.palette.links).slice(0, 8))
      : items
          .map((i) => {
            const hay = `${i.label} ${i.keywords ?? ""} ${i.hint ?? ""}`.toLowerCase();
            const score = i.label.toLowerCase().startsWith(s) ? 3 : hay.includes(s) ? 2 : s.split(/\s+/).every((p) => hay.includes(p)) ? 1 : 0;
            return { i, score };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((x) => x.i);
    if (s) {
      const engineId = (config.widgets.find((w) => w.type === "search")?.settings.engine as string) || "duckduckgo";
      const tpl = SEARCH_ENGINES[engineId]?.url ?? SEARCH_ENGINES.duckduckgo.url;
      list.push({
        id: "web",
        group: t.palette.web,
        label: `„${q.trim()}“`,
        hint: SEARCH_ENGINES[engineId]?.name ?? "DuckDuckGo",
        icon: Globe,
        run: () => {
          close();
          window.open(tpl.replace("%s", encodeURIComponent(q.trim())), "_blank", "noopener,noreferrer");
        },
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q, config.widgets, t]);

  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${sel}"]`)?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  if (typeof document === "undefined") return null;
  let lastGroup = "";
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[85] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.header.commandPalette}
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.16 }}
            className="glass-panel relative w-full max-w-xl overflow-hidden rounded-lg-card text-fg shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 text-muted" aria-hidden />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSel((s) => Math.min(filtered.length - 1, s + 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSel((s) => Math.max(0, s - 1));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    filtered[sel]?.run();
                  } else if (e.key === "Escape") close();
                }}
                placeholder={t.palette.placeholder}
                className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-subtle"
                role="combobox"
                aria-expanded="true"
                aria-controls="palette-list"
                aria-activedescendant={filtered[sel] ? `pi-${filtered[sel].id}` : undefined}
              />
              <Kbd>Esc</Kbd>
            </div>
            <ul ref={listRef} id="palette-list" role="listbox" className="max-h-[55vh] overflow-y-auto p-2">
              {filtered.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">{t.palette.noResults}</li>}
              {filtered.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                const IconC = typeof it.icon === "string" ? null : it.icon;
                return (
                  <li key={it.id} role="presentation">
                    {header && <div className="px-3 pb-1 pt-3 text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-subtle">{header}</div>}
                    <button
                      id={`pi-${it.id}`}
                      data-index={i}
                      role="option"
                      aria-selected={i === sel}
                      onMouseMove={() => setSel(i)}
                      onClick={it.run}
                      className={`flex w-full items-center gap-3 rounded-ui px-3 py-2.5 text-left text-sm ${i === sel ? "bg-surface-3" : ""}`}
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-surface-2 text-muted">
                        {IconC ? <IconC className="size-4" /> : <Icon name={it.icon as string} className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{it.label}</span>
                      {it.hint && <span className="truncate text-xs text-muted">{it.hint}</span>}
                      {i === sel && <CornerDownLeft className="size-3.5 text-subtle" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Command, Expand, Eye, Languages, LayoutDashboard, LogOut, Menu, Monitor, Moon, PencilRuler, Settings, Shrink, SunMedium, X, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale, useLocaleOverride, useT } from "@/hooks/use-i18n";
import { Icon } from "@/components/icon";
import { Kbd } from "@/components/ui/misc";
import type { ThemeMode, WidgetInstance } from "@/lib/config/schema";
import { cn, safeUrl } from "@/lib/utils";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { widgetTitle } from "@/components/grid/widget-frame";
import { useFullscreen } from "./use-fullscreen";
import { logout } from "./session";

const THEMES: { mode: ThemeMode; icon: typeof Moon }[] = [
  { mode: "system", icon: Monitor },
  { mode: "light", icon: SunMedium },
  { mode: "dark", icon: Moon },
  { mode: "amoled", icon: Smartphone },
];

function IconBtn({ label, onClick, children, active, className }: { label: string; onClick?: () => void; children: React.ReactNode; active?: boolean; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn("grid size-9 shrink-0 place-items-center rounded-ui text-muted transition hover:bg-surface-3 hover:text-fg [&_svg]:size-[18px]", active && "bg-primary-soft text-primary hover:bg-primary-soft hover:text-primary", className)}
    >
      {children}
    </button>
  );
}

function Popover({ trigger, children, label }: { trigger: (open: boolean, toggle: () => void) => React.ReactNode; children: (close: () => void) => React.ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      {trigger(open, () => setOpen((o) => !o))}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="glass-panel absolute right-0 top-full z-50 mt-2 min-w-52 rounded-ui p-1 text-sm shadow-xl"
          >
            {children(() => setOpen(false))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MenuItem = ({ onClick, children, href }: { onClick?: () => void; children: React.ReactNode; href?: string }) => {
  const cls = "flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-fg hover:bg-surface-3 [&_svg]:size-4 [&_svg]:text-muted";
  return href ? (
    <a role="menuitem" href={href} className={cls}>
      {children}
    </a>
  ) : (
    <button role="menuitem" type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
};

export function useNavItems(widgets: WidgetInstance[]) {
  const locale = useLocale();
  return widgets.filter((w) => w.showInNav && w.enabled).map((w) => ({ id: w.id, label: widgetTitle(w, locale) }));
}

export function Header({ widgets, user }: { widgets: WidgetInstance[]; user: { displayName: string; role: string } | null }) {
  const t = useT();
  const locale = useLocale();
  const { setOverride } = useLocaleOverride();
  const config = useConfigStore((s) => s.config);
  const isOwner = useConfigStore((s) => s.isOwner);
  const ui = useUIStore();
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { header, navigation } = config.layout;
  const nav = useNavItems(widgets);
  const g = config.general;
  const canTheme = config.features.visitorThemeToggle || isOwner;
  const curTheme = ui.themeOverride ?? config.appearance.mode;
  const ThemeIcon = THEMES.find((x) => x.mode === curTheme)?.icon ?? Monitor;
  const logo = safeUrl(g.logo);

  if (!header.show && !isOwner) return null;

  const cycleTheme = () => {
    const i = THEMES.findIndex((x) => x.mode === curTheme);
    ui.setThemeOverride(THEMES[(i + 1) % THEMES.length].mode);
  };

  return (
    <header
      className={cn(
        "no-print z-40 w-full",
        header.sticky && "sticky top-0",
        header.show && header.sticky && "border-b border-border backdrop-blur-xl [background:color-mix(in_srgb,var(--bg)_55%,transparent)]",
        !header.show && "pointer-events-none fixed right-0 top-0",
      )}
    >
      <div
        className="mx-auto flex h-16 items-center gap-2 px-[var(--page-pad)]"
        style={{ maxWidth: "calc(var(--max-w) + var(--page-pad) * 2)" }}
      >
        {header.show && (
          <>
            <a href="#top" className="flex min-w-0 items-center gap-2.5 rounded-ui pr-2 font-heading font-semibold">
              {header.showLogo && (logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="size-8 rounded-[9px] object-cover" />
              ) : (
                <span className="grid size-8 place-items-center rounded-[9px] bg-gradient-to-br from-primary to-accent text-sm text-primary-fg">{(g.name || g.siteTitle || "·").charAt(0).toUpperCase()}</span>
              ))}
              <span className={cn("truncate", config.layout.mobile.compactHeader && "hidden sm:inline")}>{g.siteTitle || g.name}</span>
            </a>
            {navigation === "top" && nav.length > 0 && (
              <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 lg:flex">
                {nav.map((n) => (
                  <a key={n.id} href={`#w-${n.id}`} className="rounded-ui px-3 py-1.5 text-sm text-muted transition hover:bg-surface-3 hover:text-fg">
                    {n.label}
                  </a>
                ))}
              </nav>
            )}
          </>
        )}
        <div className="pointer-events-auto ml-auto flex items-center gap-1">
          {header.show && header.showSearch && config.features.commandPalette && (
            <button
              onClick={() => ui.setPaletteOpen(true)}
              className="mr-1 hidden h-9 items-center gap-2 rounded-ui border border-border-strong bg-surface-2 pl-3 pr-1.5 text-sm text-muted transition hover:text-fg md:flex"
              aria-label={t.header.commandPalette}
            >
              <Command className="size-3.5" />
              <span className="pr-6">{t.common.search} …</span>
              <Kbd>Ctrl K</Kbd>
            </button>
          )}
          {header.show && header.showQuickLinks && (
            <div className="hidden items-center gap-0.5 sm:flex">
              {config.quickLinks.slice(0, 6).map((q) =>
                safeUrl(q.url) ? (
                  <a key={q.id} href={safeUrl(q.url)} target={/^https?:/.test(q.url) ? "_blank" : undefined} rel="noopener noreferrer" title={q.label} aria-label={q.label} className="grid size-9 place-items-center rounded-ui text-muted hover:bg-surface-3 hover:text-fg">
                    <Icon name={q.icon} className="size-[18px]" />
                  </a>
                ) : null,
              )}
            </div>
          )}
          <div className={cn("flex items-center gap-0.5", !header.show && "glass-panel m-3 rounded-ui p-1 shadow-lg")}>
            {canTheme && (
              <IconBtn label={`${t.header.theme}: ${t.theme[curTheme]}`} onClick={cycleTheme} className="hidden sm:grid">
                <ThemeIcon />
              </IconBtn>
            )}
            <IconBtn label={`${t.header.language}: ${locale === "de" ? "English" : "Deutsch"}`} onClick={() => setOverride(locale === "de" ? "en" : "de")} className="hidden sm:grid">
              <span className="text-[0.7rem] font-bold uppercase">{locale === "de" ? "EN" : "DE"}</span>
            </IconBtn>
            <IconBtn label={t.header.fullscreen} onClick={toggleFullscreen} className="hidden md:grid">
              {isFullscreen ? <Shrink /> : <Expand />}
            </IconBtn>
            {isOwner && (
              <>
                <IconBtn label={ui.editMode ? t.header.exitEdit : t.header.editMode} onClick={() => ui.setEditMode(!ui.editMode)} active={ui.editMode}>
                  <PencilRuler />
                </IconBtn>
                <IconBtn label={t.header.openSettings} onClick={() => ui.openSettings()} active={ui.settingsOpen}>
                  <Settings />
                </IconBtn>
                <Popover
                  label={t.header.menu}
                  trigger={(open, toggle) => (
                    <button onClick={toggle} aria-expanded={open} aria-haspopup="menu" className="ml-1 grid size-8 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-semibold text-primary-fg" title={user?.displayName}>
                      {(user?.displayName || "?").charAt(0).toUpperCase()}
                    </button>
                  )}
                >
                  {(close) => (
                    <>
                      <div className="px-2.5 py-2 text-xs text-muted">
                        {user?.displayName} · {user?.role}
                      </div>
                      <MenuItem href="/admin">
                        <LayoutDashboard /> {t.header.admin}
                      </MenuItem>
                      <MenuItem onClick={() => (ui.setPreviewVisitor(!ui.previewVisitor), close())}>
                        <Eye /> {ui.previewVisitor ? t.header.exitPreview : t.header.previewVisitor}
                        {ui.previewVisitor && <Check className="ml-auto" />}
                      </MenuItem>
                      <MenuItem onClick={() => (ui.setPaletteOpen(true), close())}>
                        <Command /> {t.header.commandPalette}
                      </MenuItem>
                      <div className="my-1 h-px bg-border" />
                      <MenuItem onClick={() => void logout()}>
                        <LogOut /> {t.header.logout}
                      </MenuItem>
                    </>
                  )}
                </Popover>
              </>
            )}
            <IconBtn label={t.header.menu} onClick={() => setMobileOpen(true)} className="sm:hidden">
              <Menu />
            </IconBtn>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-[60] sm:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <motion.div
              role="dialog"
              aria-label={t.header.menu}
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="glass-panel absolute inset-x-0 top-0 rounded-b-[var(--radius-lg)] p-4 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-heading font-semibold">{g.siteTitle || g.name}</span>
                <IconBtn label={t.common.close} onClick={() => setMobileOpen(false)}>
                  <X />
                </IconBtn>
              </div>
              {nav.length > 0 && (
                <nav aria-label="Mobile" className="grid gap-0.5 border-b border-border pb-3">
                  {nav.map((n) => (
                    <a key={n.id} href={`#w-${n.id}`} onClick={() => setMobileOpen(false)} className="rounded-ui px-3 py-2.5 text-[0.95rem] hover:bg-surface-3">
                      {n.label}
                    </a>
                  ))}
                </nav>
              )}
              {config.quickLinks.length > 0 && (
                <div className="flex flex-wrap gap-1 border-b border-border py-3">
                  {config.quickLinks.map((q) => (
                    <a key={q.id} href={safeUrl(q.url) || undefined} className="flex items-center gap-2 rounded-ui bg-surface-2 px-3 py-2 text-sm">
                      <Icon name={q.icon} className="size-4" /> {q.label}
                    </a>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-3">
                {canTheme &&
                  THEMES.map(({ mode, icon: I }) => (
                    <button key={mode} onClick={() => ui.setThemeOverride(mode)} className={cn("flex items-center gap-1.5 rounded-ui px-3 py-2 text-sm", curTheme === mode ? "bg-primary text-primary-fg" : "bg-surface-2")}>
                      <I className="size-4" /> {t.theme[mode]}
                    </button>
                  ))}
                <button onClick={() => setOverride(locale === "de" ? "en" : "de")} className="flex items-center gap-1.5 rounded-ui bg-surface-2 px-3 py-2 text-sm">
                  <Languages className="size-4" /> {locale === "de" ? "English" : "Deutsch"}
                </button>
                {config.features.commandPalette && (
                  <button onClick={() => (setMobileOpen(false), ui.setPaletteOpen(true))} className="flex items-center gap-1.5 rounded-ui bg-surface-2 px-3 py-2 text-sm">
                    <Command className="size-4" /> {t.common.search}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

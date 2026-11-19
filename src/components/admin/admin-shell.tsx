"use client";

import { BarChart3, ExternalLink, FolderOpen, Home, Inbox, LayoutDashboard, LogOut, Palette, Settings2, Shapes, ShieldCheck, UserCog, Users } from "lucide-react";
import type { ReactNode } from "react";
import { setCsrfToken } from "@/lib/api";
import type { SiteConfig } from "@/lib/config/schema";
import { bi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ConfigStoreProvider } from "@/store/config-store";
import { LocaleProvider } from "@/hooks/use-i18n";
import { AutoSaver } from "@/components/shell/auto-saver";
import { ThemeController } from "@/components/shell/theme-controller";
import { SaveIndicator } from "@/components/shell/save-indicator";
import { logout } from "@/components/shell/session";
import { WidgetSettingsDialog } from "@/components/settings/widget-settings-dialog";
import { AddWidgetDialog } from "@/components/settings/add-widget-dialog";
import { Toaster } from "@/components/ui/toast";
import { ADMIN_NAV } from "./admin-nav";
import { ConfirmHost } from "@/components/ui/confirm";

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: "owner" | "admin" | "editor";
}

const ICONS = { "": LayoutDashboard, content: Shapes, design: Palette, media: FolderOpen, messages: Inbox, stats: BarChart3, users: Users, system: Settings2, account: UserCog } as const;

export function AdminShell({
  config,
  csrf,
  user,
  section,
  perms,
  children,
  locale,
}: {
  config: SiteConfig;
  csrf: string;
  user: AdminUser;
  section: string;
  perms: string[];
  children: ReactNode;
  locale: "de" | "en";
}) {
  if (typeof window !== "undefined") setCsrfToken(csrf);
  const nav = ADMIN_NAV.filter((n) => perms.includes(n.perm));
  return (
    <ConfigStoreProvider config={config} isOwner>
      <LocaleProvider initial={locale}>
        <ThemeController />
        <AutoSaver />
        <div className="flex min-h-dvh flex-col lg:flex-row">
          <aside className="glass-panel z-30 flex shrink-0 flex-col border-y-0 border-l-0 lg:sticky lg:top-0 lg:h-dvh lg:w-64">
            <div className="flex items-center gap-2.5 px-5 py-5">
              <span className="grid size-8 place-items-center rounded-[9px] bg-gradient-to-br from-primary to-accent text-primary-fg">
                <ShieldCheck className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold">{config.general.siteTitle}</p>
                <p className="text-xs text-muted">{bi(locale, "Administration", "Administration")}</p>
              </div>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible" aria-label="Admin">
              {nav.map((n) => (
                <a
                  key={n.id}
                  href={`/admin${n.id ? `/${n.id}` : ""}`}
                  aria-current={section === n.id ? "page" : undefined}
                  className={cn("flex shrink-0 items-center gap-2.5 rounded-ui px-3 py-2 text-sm transition", section === n.id ? "bg-primary-soft font-medium text-primary" : "text-muted hover:bg-surface-3 hover:text-fg")}
                >
                  {(() => { const I = ICONS[n.id]; return <I className="size-4" />; })()} {n[locale]}
                </a>
              ))}
            </nav>
            <div className="hidden space-y-1 border-t border-border p-3 lg:block">
              <a href="/" className="flex items-center gap-2.5 rounded-ui px-3 py-2 text-sm text-muted hover:bg-surface-3 hover:text-fg">
                <Home className="size-4" /> {bi(locale, "Zur Homepage", "To homepage")}
              </a>
              <button onClick={() => void logout()} className="flex w-full items-center gap-2.5 rounded-ui px-3 py-2 text-sm text-muted hover:bg-surface-3 hover:text-fg">
                <LogOut className="size-4" /> {bi(locale, "Abmelden", "Sign out")}
              </button>
              <p className="px-3 pt-2 text-xs text-subtle">
                {user.displayName || user.username} · {user.role}
              </p>
            </div>
          </aside>
          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border px-6 backdrop-blur-xl [background:color-mix(in_srgb,var(--bg)_70%,transparent)]">
              <h1 className="font-heading text-base font-semibold">{ADMIN_NAV.find((n) => n.id === section)?.[locale]}</h1>
              <div className="flex items-center gap-3">
                <SaveIndicator />
                <a href="/" target="_blank" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
                  {bi(locale, "Seite ansehen", "View site")} <ExternalLink className="size-3.5" />
                </a>
              </div>
            </header>
            <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
          </div>
        </div>
        <WidgetSettingsDialog />
        <AddWidgetDialog />
        <ConfirmHost />
        <Toaster />
      </LocaleProvider>
    </ConfigStoreProvider>
  );
}

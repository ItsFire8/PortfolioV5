"use client";

import { ArrowRight, BarChart3, Eye, FolderOpen, Inbox, Lock, PencilRuler, Shapes } from "lucide-react";
import { useLocale } from "@/hooks/use-i18n";
import { bi } from "@/lib/i18n";
import { useConfigStore } from "@/store/config-store";

export function Overview({ stats }: { stats: { unread: number; media: number; views30: number | null; visitors30: number | null; maintenance: boolean } }) {
  const locale = useLocale();
  const widgets = useConfigStore((s) => s.config.widgets);
  const L = (de: string, en: string) => bi(locale, de, en);
  const cards = [
    { icon: Shapes, label: L("Aktive Widgets", "Active widgets"), value: widgets.filter((w) => w.enabled).length, hint: `${widgets.filter((w) => w.visibility === "private").length} ${L("privat", "private")}`, href: "/admin/content" },
    { icon: Inbox, label: L("Ungelesene Nachrichten", "Unread messages"), value: stats.unread, href: "/admin/messages" },
    { icon: FolderOpen, label: L("Mediendateien", "Media files"), value: stats.media, href: "/admin/media" },
    { icon: BarChart3, label: L("Besucher (30 Tage)", "Visitors (30 days)"), value: stats.visitors30 ?? "—", hint: stats.views30 === null ? L("Statistik deaktiviert", "Statistics disabled") : `${stats.views30} ${L("Aufrufe", "views")}`, href: "/admin/stats" },
  ];
  return (
    <div className="space-y-6">
      {stats.maintenance && (
        <a href="/admin/system" className="block rounded-ui bg-amber-500/15 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {L("Wartungsmodus ist aktiv. Besucher sehen eine Wartungsseite.", "Maintenance mode is active. Visitors see a maintenance page.")} →
        </a>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <a key={c.label} href={c.href} className="card group p-5" data-style="glass">
            <c.icon className="size-5 text-primary" />
            <p className="tabular mt-4 font-heading text-3xl font-semibold">{c.value}</p>
            <p className="mt-1 text-sm">{c.label}</p>
            {c.hint && <p className="text-xs text-muted">{c.hint}</p>}
          </a>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { icon: PencilRuler, title: L("Live-Editor öffnen", "Open live editor"), text: L("Widgets direkt auf der Seite verschieben, skalieren und bearbeiten.", "Move, resize and edit widgets right on the page."), href: "/?edit=1" },
          { icon: Eye, title: L("Besuchervorschau", "Visitor preview"), text: L("Prüfen, was öffentlich sichtbar ist.", "Check what is publicly visible."), href: "/admin/design" },
          { icon: Lock, title: L("Private Module", "Private modules"), text: L("Sichtbarkeit jedes Widgets festlegen.", "Set the visibility of every widget."), href: "/admin/content" },
        ].map((x) => (
          <a key={x.title} href={x.href} className="card group flex flex-col p-5" data-style="glass">
            <x.icon className="size-5 text-accent" />
            <p className="mt-3 font-semibold">{x.title}</p>
            <p className="mt-1 flex-1 text-sm text-muted">{x.text}</p>
            <ArrowRight className="mt-4 size-4 text-muted transition group-hover:translate-x-1 group-hover:text-fg" />
          </a>
        ))}
      </div>
    </div>
  );
}

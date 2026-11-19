"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/hooks/use-i18n";
import { api } from "@/lib/api";
import { bi } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Segmented, Spinner } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";

interface Stats {
  series: { day: string; views: number; visitors: number }[];
  referrers: { host: string; count: number }[];
  pages: { path: string; views: number }[];
  totals: { views: number; visitors: number };
}

function Chart({ series, locale }: { series: Stats["series"]; locale: "de" | "en" }) {
  const max = Math.max(1, ...series.map((s) => s.views));
  const [hover, setHover] = useState<number | null>(null);
  const h = hover !== null ? series[hover] : null;
  return (
    <div>
      <div className="mb-2 h-5 text-xs text-muted">
        {h ? `${new Date(h.day + "T12:00:00").toLocaleDateString(locale === "de" ? "de-DE" : "en-US", { dateStyle: "medium" })}: ${h.views} ${bi(locale, "Aufrufe", "views")} · ${h.visitors} ${bi(locale, "Besucher", "visitors")}` : " "}
      </div>
      <div className="flex h-44 items-end gap-[2px]" role="img" aria-label={bi(locale, "Aufrufe pro Tag", "Views per day")} onMouseLeave={() => setHover(null)}>
        {series.map((s, i) => (
          <div key={s.day} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)}>
            <div className="w-full rounded-t-[3px] bg-primary/25 transition-colors" style={{ height: `${(s.views / max) * 100}%`, minHeight: s.views ? 2 : 0, background: hover === i ? "var(--primary)" : undefined }} />
            <div className="absolute bottom-0 w-full rounded-t-[3px] bg-primary" style={{ height: `${(s.visitors / max) * 100}%`, minHeight: s.visitors ? 2 : 0, opacity: hover === i ? 0 : 1 }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[0.65rem] text-subtle">
        <span>{series[0]?.day}</span>
        <span>{series[series.length - 1]?.day}</span>
      </div>
    </div>
  );
}

export function StatsAdmin({ enabled: initialEnabled }: { enabled: boolean }) {
  const locale = useLocale();
  const L = (de: string, en: string) => bi(locale, de, en);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [days, setDays] = useState<"7" | "30" | "90">("30");
  const [stats, setStats] = useState<Stats | null>(null);
  const load = useCallback(() => api<Stats>(`/api/stats?days=${days}`).then(setStats), [days]);
  useEffect(() => void load(), [load]);

  const toggle = async (v: boolean) => {
    setEnabled(v);
    await api("/api/system", { method: "PUT", json: { statsEnabled: v } }).catch((e) => (toast.error(e.message), setEnabled(!v)));
  };

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5" data-style="glass">
        <div className="max-w-xl">
          <p className="font-semibold">{L("Besucherstatistik", "Visitor statistics")}</p>
          <p className="text-sm text-muted">
            {L(
              "Datenschutzfreundlich: keine Cookies, keine IP-Speicherung, kein Tracking über Tage hinweg. „Do Not Track“ und GPC werden respektiert. Deine eigenen Besuche zählen nicht.",
              "Privacy-friendly: no cookies, no stored IPs, no cross-day tracking. Do-Not-Track and GPC are respected. Your own visits are not counted.",
            )}
          </p>
        </div>
        <Switch checked={enabled} onChange={toggle} label={L("Statistik aktivieren", "Enable statistics")} />
      </div>
      {!stats ? (
        <Spinner />
      ) : (
        <>
          <div className="card p-5" data-style="glass">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-8">
                <div>
                  <p className="tabular font-heading text-3xl font-semibold">{stats.totals.visitors}</p>
                  <p className="text-xs text-muted">{L("Besucher", "Visitors")}</p>
                </div>
                <div>
                  <p className="tabular font-heading text-3xl font-semibold">{stats.totals.views}</p>
                  <p className="text-xs text-muted">{L("Aufrufe", "Views")}</p>
                </div>
              </div>
              <Segmented label="Range" value={days} onChange={setDays} className="w-fit" options={[{ value: "7", label: "7d" }, { value: "30", label: "30d" }, { value: "90", label: "90d" }]} />
            </div>
            <Chart series={stats.series} locale={locale} />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              { title: L("Herkunft", "Referrers"), rows: stats.referrers.map((r) => [r.host, r.count] as const) },
              { title: L("Seiten", "Pages"), rows: stats.pages.map((p) => [p.path, p.views] as const) },
            ].map((b) => (
              <div key={b.title} className="card p-5" data-style="glass">
                <p className="mb-3 font-semibold">{b.title}</p>
                {b.rows.length ? (
                  <ul className="space-y-1.5 text-sm">
                    {b.rows.map(([k, v]) => (
                      <li key={k} className="flex justify-between gap-3">
                        <span className="truncate">{k}</span>
                        <span className="tabular text-muted">{v}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">—</p>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="danger-ghost"
            size="sm"
            onClick={async () => (await confirmDialog({ title: L("Alle Statistiken löschen?", "Delete all statistics?"), danger: true, confirmLabel: L("Löschen", "Delete"), cancelLabel: L("Abbrechen", "Cancel") })) && api("/api/stats", { method: "DELETE" }).then(load)}
          >
            {L("Statistiken zurücksetzen", "Reset statistics")}
          </Button>
        </>
      )}
    </div>
  );
}

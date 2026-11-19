"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useNow } from "@/hooks/use-now";
import { intlLocale } from "@/lib/format";
import { bi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "./types";

type Ev = { title?: string; date?: string; time?: string; color?: string; yearly?: boolean };
type S = { weekStart: "monday" | "sunday"; showUpcoming: boolean; events: Ev[] };

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function Calendar({ widget, locale }: WidgetProps<S>) {
  const s = widget.settings;
  const now = useNow(60_000);
  const [offset, setOffset] = useState(0);
  const today = now ?? new Date(2000, 0, 1);
  const view = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const mondayFirst = s.weekStart !== "sunday";

  const eventsOn = useMemo(() => {
    const m = new Map<string, Ev[]>();
    for (const e of s.events) {
      if (!e.date || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) continue;
      const key = e.yearly ? `${view.getFullYear()}${e.date.slice(4)}` : e.date;
      m.set(key, [...(m.get(key) ?? []), e]);
    }
    return m;
  }, [s.events, view]);

  const first = (view.getDay() + (mondayFirst ? 6 : 0)) % 7;
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];
  const loc = intlLocale(locale);
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(loc, { weekday: "narrow" }).format(new Date(2024, 0, (mondayFirst ? 1 : 7) + i)));
  const todayKey = now ? ymd(now) : "";

  const upcoming = useMemo(() => {
    if (!now) return [];
    const base = ymd(now);
    return s.events
      .filter((e) => e.date && e.title)
      .map((e) => {
        let d = e.date!;
        if (e.yearly) {
          d = `${now.getFullYear()}${d.slice(4)}`;
          if (d < base) d = `${now.getFullYear() + 1}${e.date!.slice(4)}`;
        }
        return { ...e, next: d };
      })
      .filter((e) => e.next >= base)
      .sort((a, b) => (a.next + (a.time ?? "")).localeCompare(b.next + (b.time ?? "")))
      .slice(0, 4);
  }, [now, s.events]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading font-semibold capitalize">{new Intl.DateTimeFormat(loc, { month: "long", year: "numeric" }).format(view)}</p>
        <div className="flex gap-0.5">
          <button className="grid size-7 place-items-center rounded-ui text-muted hover:bg-surface-3 hover:text-fg" onClick={() => setOffset((o) => o - 1)} aria-label={bi(locale, "Vorheriger Monat", "Previous month")}>
            <ChevronLeft className="size-4" />
          </button>
          {offset !== 0 && (
            <button className="rounded-ui px-2 text-xs text-muted hover:bg-surface-3 hover:text-fg" onClick={() => setOffset(0)}>
              {bi(locale, "Heute", "Today")}
            </button>
          )}
          <button className="grid size-7 place-items-center rounded-ui text-muted hover:bg-surface-3 hover:text-fg" onClick={() => setOffset((o) => o + 1)} aria-label={bi(locale, "Nächster Monat", "Next month")}>
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs" role="grid">
        {weekdays.map((w, i) => (
          <span key={i} className="pb-1 font-medium text-subtle">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const key = ymd(d);
          const evs = eventsOn.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <span
              key={i}
              title={evs.map((e) => `${e.time ? e.time + " " : ""}${e.title}`).join("\n") || undefined}
              className={cn("relative mx-auto grid size-8 place-items-center rounded-full tabular", isToday ? "bg-primary font-semibold text-primary-fg" : evs.length ? "font-semibold" : "text-fg/80")}
            >
              {d.getDate()}
              {evs.length > 0 && (
                <span className="absolute bottom-0.5 flex gap-0.5">
                  {evs.slice(0, 3).map((e, j) => (
                    <span key={j} className="size-1 rounded-full" style={{ background: isToday ? "currentColor" : e.color || "var(--accent)" }} />
                  ))}
                </span>
              )}
            </span>
          );
        })}
      </div>
      {s.showUpcoming && upcoming.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-border pt-3">
          {upcoming.map((e, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm">
              <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: e.color || "var(--accent)" }} />
              <div className="min-w-0">
                <p className="truncate font-medium">{e.title}</p>
                <p className="text-xs text-muted">
                  {new Intl.DateTimeFormat(loc, { weekday: "short", day: "numeric", month: "short" }).format(new Date(e.next + "T12:00:00"))}
                  {e.time ? ` · ${e.time}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

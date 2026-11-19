"use client";

import { useNow } from "@/hooks/use-now";
import { bi } from "@/lib/i18n";
import { EmptyState } from "./shared";
import type { WidgetProps } from "./types";

type S = { label: string; target: string; doneText: string; showSeconds: boolean; yearly: boolean };

function nextTarget(target: string, yearly: boolean, now: Date): Date | null {
  const t = new Date(target);
  if (Number.isNaN(t.getTime())) return null;
  if (!yearly) return t;
  const n = new Date(t);
  n.setFullYear(now.getFullYear());
  if (n.getTime() < now.getTime()) n.setFullYear(now.getFullYear() + 1);
  return n;
}

export default function Countdown({ widget, locale }: WidgetProps<S>) {
  const s = widget.settings;
  const now = useNow(1000);
  if (!s.target) return <EmptyState widgetId={widget.id} />;
  const target = now ? nextTarget(s.target, s.yearly, now) : null;
  const diff = target && now ? Math.max(0, target.getTime() - now.getTime()) : 0;
  const units = [
    { v: Math.floor(diff / 86400000), l: bi(locale, "Tage", "Days") },
    { v: Math.floor(diff / 3600000) % 24, l: bi(locale, "Std", "Hrs") },
    { v: Math.floor(diff / 60000) % 60, l: bi(locale, "Min", "Min") },
    ...(s.showSeconds ? [{ v: Math.floor(diff / 1000) % 60, l: bi(locale, "Sek", "Sec") }] : []),
  ];
  const finished = now && target && diff === 0;
  return (
    <div className="flex h-full flex-col justify-center">
      {s.label && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{s.label}</p>}
      {finished ? (
        <p className="font-heading text-2xl font-semibold text-primary">{s.doneText || "🎉"}</p>
      ) : (
        <div className="flex gap-2" aria-live="off">
          {units.map((u) => (
            <div key={u.l} className="min-w-14 flex-1 rounded-ui bg-surface-2 px-2 py-2 text-center">
              <p className="tabular font-heading text-2xl font-semibold leading-none sm:text-3xl">{now ? String(u.v).padStart(2, "0") : "--"}</p>
              <p className="mt-1 text-[0.65rem] uppercase tracking-wider text-muted">{u.l}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

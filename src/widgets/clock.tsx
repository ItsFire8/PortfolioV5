"use client";

import { useNow } from "@/hooks/use-now";
import { formatDate, formatTime, validTimeZone } from "@/lib/format";
import type { WidgetProps } from "./types";

type S = { variant: "digital" | "analog" | "minimal"; timezone: string; showDate: boolean; zones: { label?: string; timezone?: string }[] };

function parts(d: Date, tz?: string) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: validTimeZone(tz), hour: "numeric", minute: "numeric", second: "numeric", hour12: false });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { h: Number(p.hour) % 24, m: Number(p.minute), s: Number(p.second) };
}

function Analog({ now, tz }: { now: Date | null; tz?: string }) {
  const { h, m, s } = now ? parts(now, tz) : { h: 10, m: 10, s: 0 };
  const hand = (deg: number, len: number, w: number, cls: string) => (
    <line x1="50" y1="50" x2={50 + len * Math.sin((deg * Math.PI) / 180)} y2={50 - len * Math.cos((deg * Math.PI) / 180)} strokeWidth={w} strokeLinecap="round" className={cls} />
  );
  return (
    <svg viewBox="0 0 100 100" className="size-28" role="img" aria-label="Clock">
      <circle cx="50" cy="50" r="47" className="fill-[var(--surface-2)] stroke-[var(--border-strong)]" strokeWidth="1" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return <line key={i} x1={50 + 40 * Math.sin(a)} y1={50 - 40 * Math.cos(a)} x2={50 + 44 * Math.sin(a)} y2={50 - 44 * Math.cos(a)} strokeWidth={i % 3 === 0 ? 2 : 1} className="stroke-[var(--fg-muted)]" strokeLinecap="round" />;
      })}
      {hand((h % 12) * 30 + m * 0.5, 24, 3.2, "stroke-[var(--fg)]")}
      {hand(m * 6 + s * 0.1, 34, 2.2, "stroke-[var(--fg)]")}
      {hand(s * 6, 38, 1, "stroke-[var(--primary)]")}
      <circle cx="50" cy="50" r="2.5" className="fill-[var(--primary)]" />
    </svg>
  );
}

export default function Clock({ widget, config }: WidgetProps<S>) {
  const s = widget.settings;
  const g = config.general;
  const tz = s.timezone || g.timezone;
  const now = useNow(1000);
  const zones = s.zones.filter((z) => validTimeZone(z.timezone));
  return (
    <div className="flex h-full flex-col justify-center" suppressHydrationWarning>
      {s.variant === "analog" ? (
        <div className="flex items-center gap-4">
          <Analog now={now} tz={tz} />
          {s.showDate && now && <p className="text-sm text-muted">{formatDate(now, g, tz)}</p>}
        </div>
      ) : (
        <>
          <p className={s.variant === "minimal" ? "tabular font-heading text-3xl font-light tracking-tight" : "tabular font-heading text-[2.6rem] font-semibold leading-none tracking-tight"}>
            {now ? formatTime(now, g, tz) : "--:--"}
          </p>
          {s.showDate && <p className="mt-2 text-sm text-muted">{now ? formatDate(now, g, tz) : " "}</p>}
        </>
      )}
      {zones.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          {zones.map((z, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="truncate text-muted">{z.label || z.timezone}</span>
              <span className="tabular font-medium">{now ? formatTime(now, g, z.timezone, false) : "--:--"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

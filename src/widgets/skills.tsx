"use client";

import { motion } from "framer-motion";
import { EmptyState } from "./shared";
import type { WidgetProps } from "./types";

type Item = { name?: string; level?: number; category?: string };
type S = { display: "bars" | "tags" | "dots"; groupByCategory: boolean; items: Item[] };

function group(items: Item[], on: boolean): [string, Item[]][] {
  if (!on) return [["", items]];
  const m = new Map<string, Item[]>();
  for (const it of items) {
    const k = it.category?.trim() || "";
    m.set(k, [...(m.get(k) ?? []), it]);
  }
  return [...m.entries()];
}

export default function Skills({ widget }: WidgetProps<S>) {
  const { display, groupByCategory, items } = widget.settings;
  const valid = items.filter((i) => i.name);
  if (!valid.length) return <EmptyState widgetId={widget.id} />;
  return (
    <div className="space-y-5">
      {group(valid, groupByCategory).map(([cat, list]) => (
        <div key={cat || "_"}>
          {cat && <h3 className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted">{cat}</h3>}
          {display === "tags" ? (
            <ul className="flex flex-wrap gap-1.5">
              {list.map((it, i) => (
                <li key={i} className="rounded-full border border-border-strong bg-surface-2 px-3 py-1 text-sm">
                  {it.name}
                </li>
              ))}
            </ul>
          ) : display === "dots" ? (
            <ul className="space-y-2">
              {list.map((it, i) => {
                const filled = Math.round((it.level ?? 0) / 20);
                return (
                  <li key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{it.name}</span>
                    <span className="flex gap-1" aria-label={`${it.level ?? 0}%`}>
                      {Array.from({ length: 5 }, (_, d) => (
                        <span key={d} className={d < filled ? "size-2 rounded-full bg-primary" : "size-2 rounded-full bg-surface-3"} />
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="space-y-3">
              {list.map((it, i) => (
                <li key={i}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{it.name}</span>
                    <span className="tabular text-xs text-muted">{it.level ?? 0}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={it.level ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label={it.name}>
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${it.level ?? 0}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

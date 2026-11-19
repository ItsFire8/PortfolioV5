"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { relativeTime } from "@/lib/format";
import { bi } from "@/lib/i18n";
import { EmptyState } from "./shared";
import type { WidgetProps } from "./types";

type Item = { title: string; link: string; date: string | null; source: string };
type S = { feeds: { url?: string; label?: string }[]; maxItems: number; showSource: boolean; showDate: boolean };

export default function Rss({ widget, locale }: WidgetProps<S>) {
  const s = widget.settings;
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const feedsKey = JSON.stringify(s.feeds) + s.maxItems;

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/rss?widget=${encodeURIComponent(widget.id)}`, { credentials: "same-origin" })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json().catch(() => ({}))).error ?? r.statusText))))
      .then((d: { items: Item[]; errors: string[] }) => {
        setItems(d.items);
        setError(d.errors.length && !d.items.length ? d.errors.join("; ") : null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [widget.id]);

  useEffect(() => {
    if (!s.feeds.some((f) => f.url)) return;
    const t = setTimeout(load, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedsKey, load]);

  if (!s.feeds.some((f) => f.url)) return <EmptyState widgetId={widget.id} />;
  return (
    <div className="flex h-full flex-col">
      <div className="-mt-1 mb-2 flex justify-end">
        <button onClick={load} disabled={loading} className="grid size-7 place-items-center rounded-ui text-muted hover:bg-surface-3 hover:text-fg" aria-label={bi(locale, "Aktualisieren", "Refresh")}>
          <RefreshCw className={loading ? "size-3.5 animate-spin" : "size-3.5"} />
        </button>
      </div>
      {error && !items?.length && <p className="text-sm text-muted">{bi(locale, "Feeds konnten nicht geladen werden.", "Feeds could not be loaded.")}</p>}
      {!items && !error && (
        <ul className="animate-pulse space-y-3" aria-busy>
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="h-9 rounded bg-surface-3" />
          ))}
        </ul>
      )}
      <ul className="-mx-2 divide-y divide-[var(--border)]">
        {items?.map((it, i) => (
          <li key={i}>
            <a href={it.link || undefined} target="_blank" rel="noopener noreferrer" className="block rounded-ui px-2 py-2.5 hover:bg-surface-2">
              <p className="line-clamp-2 text-sm font-medium leading-snug">{it.title}</p>
              {(s.showSource || s.showDate) && (
                <p className="mt-1 text-xs text-muted">
                  {s.showSource && it.source}
                  {s.showSource && s.showDate && it.date ? " · " : ""}
                  {s.showDate && it.date && !Number.isNaN(Date.parse(it.date)) ? relativeTime(new Date(it.date), locale) : ""}
                </p>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

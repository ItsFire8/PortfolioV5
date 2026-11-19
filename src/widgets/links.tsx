"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { cn, hostname, safeUrl } from "@/lib/utils";
import { EmptyState, ExtLink } from "./shared";
import type { WidgetProps } from "./types";

type Link = { label?: string; url?: string; icon?: string };
type Cat = { name?: string; links?: Link[] };
type S = { layout: "grid" | "list"; newTab: boolean; showFavicons: boolean; categories: Cat[] };

function Favicon({ url, icon, enabled }: { url: string; icon?: string; enabled: boolean }) {
  const [failed, setFailed] = useState(false);
  let origin = "";
  try {
    origin = new URL(url).origin;
  } catch {
    /* relative link */
  }
  if (enabled && origin && !failed && !icon)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`${origin}/favicon.ico`} alt="" className="size-4" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
  return <Icon name={icon} className="size-4" />;
}

export default function Links({ widget }: WidgetProps<S>) {
  const { layout, newTab, showFavicons, categories } = widget.settings;
  const cats = categories.map((c) => ({ ...c, links: (c.links ?? []).filter((l) => safeUrl(l.url)) })).filter((c) => c.links.length);
  const [active, setActive] = useState(0);
  if (!cats.length) return <EmptyState widgetId={widget.id} />;
  const tabs = cats.length > 1 && cats.length <= 6;
  const shown = tabs ? [cats[Math.min(active, cats.length - 1)]] : cats;
  return (
    <div className="space-y-4">
      {tabs && (
        <div role="tablist" className="flex gap-1 overflow-x-auto">
          {cats.map((c, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-medium transition", i === active ? "bg-fg text-bg" : "text-muted hover:bg-surface-2 hover:text-fg")}
            >
              {c.name || "—"}
            </button>
          ))}
        </div>
      )}
      {shown.map((c, ci) => (
        <div key={ci}>
          {!tabs && c.name && <h3 className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-muted">{c.name}</h3>}
          <ul className={layout === "grid" ? "grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]" : "-mx-2 space-y-0.5"}>
            {c.links.map((l, i) => (
              <li key={i}>
                <ExtLink
                  href={l.url!}
                  newTab={newTab}
                  className={cn(
                    "group flex items-center gap-2.5 text-sm transition",
                    layout === "grid" ? "rounded-ui border border-border bg-surface-2 p-2.5 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-3" : "rounded-ui px-2 py-1.5 hover:bg-surface-2",
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-surface-3 text-muted group-hover:text-primary">
                    <Favicon url={l.url!} icon={l.icon} enabled={showFavicons} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{l.label || hostname(l.url!)}</span>
                    {layout === "list" && <span className="block truncate text-xs text-muted">{hostname(l.url!)}</span>}
                  </span>
                </ExtLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

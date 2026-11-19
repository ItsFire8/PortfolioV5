"use client";

import { ArrowUpRight } from "lucide-react";
import { BrandIcon, platformLabel } from "@/components/brand-icon";
import { EmptyState, ExtLink } from "./shared";
import type { WidgetProps } from "./types";

type Item = { platform: string; url: string; label?: string };

export default function Social({ widget }: WidgetProps<{ style: "icons" | "list"; items: Item[] }>) {
  const { style, items } = widget.settings;
  const valid = items.filter((i) => i.url);
  if (!valid.length) return <EmptyState widgetId={widget.id} />;
  const href = (i: Item) => (i.platform === "email" && !i.url.startsWith("mailto:") ? `mailto:${i.url}` : i.url);
  if (style === "list")
    return (
      <ul className="-mx-2 space-y-0.5">
        {valid.map((it, i) => (
          <li key={i}>
            <ExtLink href={href(it)} className="group flex items-center gap-3 rounded-ui px-2 py-2 text-sm hover:bg-surface-2">
              <BrandIcon platform={it.platform} className="size-[18px] text-muted group-hover:text-fg" />
              <span className="flex-1 truncate">{it.label || platformLabel(it.platform)}</span>
              <ArrowUpRight className="size-3.5 text-subtle transition group-hover:text-fg" aria-hidden />
            </ExtLink>
          </li>
        ))}
      </ul>
    );
  return (
    <ul className="flex h-full flex-wrap content-center items-center gap-2">
      {valid.map((it, i) => (
        <li key={i}>
          <ExtLink
            href={href(it)}
            aria-label={it.label || platformLabel(it.platform)}
            title={it.label || platformLabel(it.platform)}
            className="grid size-11 place-items-center rounded-ui border border-border bg-surface-2 text-muted transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
          >
            <BrandIcon platform={it.platform} className="size-5" />
          </ExtLink>
        </li>
      ))}
    </ul>
  );
}

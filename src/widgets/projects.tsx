"use client";

import { ArrowUpRight, Code2, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { cn, safeUrl } from "@/lib/utils";
import { EmptyState, ExtLink } from "./shared";
import type { WidgetProps } from "./types";

type Item = { title?: string; description?: string; image?: string; url?: string; repo?: string; tags?: string[] | string; year?: string; featured?: boolean };
type S = { layout: "grid" | "list"; filterByTag: boolean; items: Item[] };

const tagsOf = (t: Item["tags"]) => (Array.isArray(t) ? t : typeof t === "string" ? t.split(",") : []).map((x) => x.trim()).filter(Boolean);

export default function Projects({ widget, config }: WidgetProps<S>) {
  const { layout, filterByTag, items } = widget.settings;
  const [tag, setTag] = useState<string | null>(null);
  const valid = items.filter((p) => p.title);
  const allTags = useMemo(() => [...new Set(valid.flatMap((p) => tagsOf(p.tags)))].slice(0, 16), [valid]);
  const list = valid
    .filter((p) => !tag || tagsOf(p.tags).includes(tag))
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  if (!valid.length) return <EmptyState widgetId={widget.id} />;
  const all = config.general.locale === "en" ? "All" : "Alle";
  return (
    <div className="space-y-4">
      {filterByTag && allTags.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Filter">
          {[null, ...allTags].map((t) => (
            <button
              key={t ?? "_all"}
              onClick={() => setTag(t)}
              aria-pressed={tag === t}
              className={cn("rounded-full px-3 py-1 text-xs font-medium transition", tag === t ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted hover:text-fg")}
            >
              {t ?? all}
            </button>
          ))}
        </div>
      )}
      <ul className={layout === "grid" ? "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(230px,1fr))]" : "space-y-2"}>
        {list.map((p, i) => {
          const img = safeUrl(p.image);
          const href = safeUrl(p.url) || safeUrl(p.repo);
          return (
            <li key={i} className={cn("group relative overflow-hidden rounded-ui border border-border bg-surface-2 transition hover:border-border-strong", layout === "list" && "flex gap-4 p-3")}>
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img}
                  alt=""
                  loading="lazy"
                  className={layout === "grid" ? "aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.03]" : "size-20 shrink-0 rounded-[calc(var(--radius-sm)-4px)] object-cover"}
                />
              )}
              <div className={layout === "grid" ? "p-4" : "min-w-0 flex-1"}>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug">
                    {href ? (
                      <ExtLink href={href} className="after:absolute after:inset-0 focus:outline-none">
                        {p.title}
                      </ExtLink>
                    ) : (
                      p.title
                    )}
                  </h3>
                  <div className="flex shrink-0 items-center gap-1.5 text-muted">
                    {p.featured && <Star className="size-3.5 fill-accent text-accent" aria-label="Featured" />}
                    {p.year && <span className="tabular text-xs">{p.year}</span>}
                    {href && <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />}
                  </div>
                </div>
                {p.description && <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">{p.description}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {tagsOf(p.tags).map((t) => (
                    <span key={t} className="rounded-full bg-primary-soft px-2 py-0.5 text-[0.7rem] font-medium text-primary">
                      {t}
                    </span>
                  ))}
                  {safeUrl(p.repo) && safeUrl(p.url) && (
                    <ExtLink href={p.repo!} className="relative z-10 ml-auto inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
                      <Code2 className="size-3.5" aria-hidden /> Code
                    </ExtLink>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

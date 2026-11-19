"use client";

import { ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import { Icon } from "@/components/icon";
import { renderMarkdown } from "@/lib/markdown";
import { safeUrl } from "@/lib/utils";
import { EmptyState, ExtLink } from "./shared";
import type { WidgetProps } from "./types";

type S = { kind: "markdown" | "embed" | "image" | "stat"; content: string; embedUrl: string; embedHeight: number; image: string; link: string; statValue: string; statLabel: string; statHint: string; icon: string };

export default function Custom({ widget }: WidgetProps<S>) {
  const s = widget.settings;
  const html = useMemo(() => (s.kind === "markdown" ? renderMarkdown(s.content) : ""), [s.kind, s.content]);
  switch (s.kind) {
    case "embed": {
      const url = safeUrl(s.embedUrl);
      if (!/^https:\/\//i.test(url)) return <EmptyState widgetId={widget.id} />;
      return (
        <iframe
          src={url}
          title={widget.title || "Embed"}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
          referrerPolicy="no-referrer"
          allow="fullscreen; picture-in-picture"
          className="w-full rounded-ui border-0 bg-surface-2"
          style={{ height: s.embedHeight }}
        />
      );
    }
    case "image": {
      const img = safeUrl(s.image);
      if (!img) return <EmptyState widgetId={widget.id} />;
      // eslint-disable-next-line @next/next/no-img-element
      const el = <img src={img} alt={widget.title || ""} loading="lazy" className="size-full rounded-ui object-cover" />;
      return s.link ? <ExtLink href={s.link} className="block size-full">{el}</ExtLink> : el;
    }
    case "stat": {
      if (!s.statValue) return <EmptyState widgetId={widget.id} />;
      const body = (
        <div className="group flex h-full flex-col justify-between gap-3">
          <div className="flex items-center justify-between text-muted">
            <span className="grid size-9 place-items-center rounded-ui bg-primary-soft text-primary">
              <Icon name={s.icon} fallback="ChartBar" className="size-4.5" />
            </span>
            {s.link && <ArrowUpRight className="size-4 transition group-hover:text-fg" aria-hidden />}
          </div>
          <div>
            <p className="tabular font-heading text-3xl font-semibold leading-none">{s.statValue}</p>
            {s.statLabel && <p className="mt-1.5 text-sm font-medium">{s.statLabel}</p>}
            {s.statHint && <p className="text-xs text-muted">{s.statHint}</p>}
          </div>
        </div>
      );
      return s.link ? <ExtLink href={s.link} className="block h-full">{body}</ExtLink> : body;
    }
    default:
      if (!s.content.trim()) return <EmptyState widgetId={widget.id} />;
      return <div className="md text-[0.95rem]" dangerouslySetInnerHTML={{ __html: html }} />;
  }
}

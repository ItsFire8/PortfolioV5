"use client";

import { BriefcaseBusiness, Download, GraduationCap, Sparkle } from "lucide-react";
import { useT } from "@/hooks/use-i18n";
import { EmptyState, ExtLink } from "./shared";
import type { WidgetProps } from "./types";

type Item = { kind?: string; title?: string; org?: string; location?: string; start?: string; end?: string; description?: string };
type S = { items: Item[]; cvFile: string; downloadLabel: string };

export default function Resume({ widget }: WidgetProps<S>) {
  const t = useT();
  const { items, cvFile, downloadLabel } = widget.settings;
  if (!items.length && !cvFile) return <EmptyState widgetId={widget.id} />;
  return (
    <div className="flex h-full flex-col">
      <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-border-strong">
        {items.map((it, i) => {
          const Icon = it.kind === "education" ? GraduationCap : it.kind === "other" ? Sparkle : BriefcaseBusiness;
          return (
            <li key={i} className="relative flex gap-4">
              <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-border-strong bg-surface-solid text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="font-semibold leading-snug">{it.title}</h3>
                  {(it.start || it.end) && (
                    <span className="tabular text-xs text-muted">
                      {it.start}
                      {it.end ? ` – ${it.end}` : ""}
                    </span>
                  )}
                </div>
                {(it.org || it.location) && (
                  <p className="text-sm text-muted">
                    {it.org}
                    {it.org && it.location ? " · " : ""}
                    {it.location}
                  </p>
                )}
                {it.description && <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-fg/85">{it.description}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {cvFile && (
        <ExtLink href={cvFile} className="mt-6 inline-flex h-9 w-fit items-center gap-2 rounded-ui bg-primary px-4 text-sm font-medium text-primary-fg hover:brightness-110">
          <Download className="size-4" aria-hidden /> {downloadLabel || t.common.download}
        </ExtLink>
      )}
    </div>
  );
}

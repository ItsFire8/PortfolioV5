"use client";

import { useMemo } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { safeUrl } from "@/lib/utils";
import { EmptyState } from "./shared";
import type { WidgetProps } from "./types";

export default function About({ widget }: WidgetProps<{ content: string; image: string }>) {
  const { content, image } = widget.settings;
  const html = useMemo(() => renderMarkdown(content), [content]);
  if (!content.trim()) return <EmptyState widgetId={widget.id} />;
  const img = safeUrl(image);
  return (
    <div className="flex h-full flex-col gap-5 sm:flex-row">
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" loading="lazy" className="aspect-[4/5] w-full shrink-0 rounded-ui object-cover sm:w-40" />
      )}
      <div className="md min-w-0 text-[0.95rem]" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { useT } from "@/hooks/use-i18n";
import { cn, safeUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Avatar({ src, name, className }: { src: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  const url = safeUrl(src);
  if (!url || failed)
    return (
      <div className={cn("grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent font-heading font-semibold text-primary-fg", className)} aria-hidden>
        {initials || "·"}
      </div>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} onError={() => setFailed(true)} className={cn("shrink-0 rounded-full object-cover ring-2 ring-[var(--surface-solid)]", className)} loading="lazy" decoding="async" />
  );
}

/** Empty state: helpful for the owner, never shown to visitors (empty widgets are filtered server-side). */
export function EmptyState({ widgetId, children }: { widgetId: string; children?: ReactNode }) {
  const t = useT();
  const isOwner = useConfigStore((s) => s.isOwner);
  const edit = useUIStore((s) => s.setEditingWidget);
  return (
    <div className="flex h-full min-h-24 flex-col items-center justify-center gap-3 rounded-ui border border-dashed border-border-strong p-4 text-center">
      <p className="max-w-xs text-xs text-muted">{children ?? (isOwner ? t.common.emptyOwner : t.common.empty)}</p>
      {isOwner && (
        <Button size="sm" variant="subtle" onClick={() => edit(widgetId)}>
          {t.widgets.configure}
        </Button>
      )}
    </div>
  );
}

export function ExtLink({ href, children, className, newTab = true, ...rest }: { href: string; children: ReactNode; className?: string; newTab?: boolean; "aria-label"?: string; title?: string }) {
  const url = safeUrl(href);
  if (!url) return <span className={className}>{children}</span>;
  const external = /^https?:/i.test(url);
  return (
    <a href={url} className={className} {...(external && newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
      {children}
    </a>
  );
}

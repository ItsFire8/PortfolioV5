"use client";

import { MapPin } from "lucide-react";
import { BrandIcon, platformLabel } from "@/components/brand-icon";
import { cn } from "@/lib/utils";
import { Avatar, EmptyState, ExtLink } from "./shared";
import type { WidgetProps } from "./types";

type Btn = { label?: string; url?: string; primary?: boolean };
type S = { role: string; location: string; bio: string; status: string; statusColor: string; showSocial: boolean; buttons: Btn[] };

export default function Profile({ widget, config }: WidgetProps<S>) {
  const s = widget.settings;
  const g = config.general;
  if (!g.name && !s.role && !s.bio) return <EmptyState widgetId={widget.id} />;
  const social = s.showSocial
    ? ((config.widgets.find((w) => w.type === "social" && w.enabled)?.settings.items as { platform: string; url: string }[] | undefined) ?? [])
    : [];
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar src={g.avatar} name={g.name} className="size-20" />
          {s.status && <span className="absolute bottom-1 right-1 size-3.5 rounded-full ring-[3px] ring-[var(--surface-solid)]" style={{ background: s.statusColor }} aria-hidden />}
        </div>
        <div className="min-w-0 pt-1">
          <h2 className="font-heading text-xl font-semibold leading-tight">{g.name}</h2>
          {g.username && <p className="text-sm text-muted">@{g.username}</p>}
          {s.role && <p className="mt-1 text-sm font-medium text-primary">{s.role}</p>}
        </div>
      </div>
      {(s.location || s.status) && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {s.location && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-muted">
              <MapPin className="size-3.5" aria-hidden /> {s.location}
            </span>
          )}
          {s.status && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium" style={{ background: `${s.statusColor}1f`, color: s.statusColor }}>
              <span className="size-1.5 animate-pulse rounded-full" style={{ background: s.statusColor }} /> {s.status}
            </span>
          )}
        </div>
      )}
      {s.bio && <p className="mt-4 text-[0.92rem] leading-relaxed text-muted">{s.bio}</p>}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
        {s.buttons.filter((b) => b.label && b.url).map((b, i) => (
          <ExtLink
            key={i}
            href={b.url!}
            className={cn(
              "inline-flex h-9 items-center rounded-ui px-4 text-sm font-medium transition hover:brightness-110",
              b.primary ? "bg-primary text-primary-fg" : "border border-border-strong text-fg hover:bg-surface-2",
            )}
          >
            {b.label}
          </ExtLink>
        ))}
        {social.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {social.slice(0, 6).map((it, i) => (
              <ExtLink key={i} href={it.url} aria-label={platformLabel(it.platform)} title={platformLabel(it.platform)} className="grid size-9 place-items-center rounded-ui text-muted transition hover:bg-surface-3 hover:text-fg">
                <BrandIcon platform={it.platform} className="size-[18px]" />
              </ExtLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

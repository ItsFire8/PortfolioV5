"use client";

import { AlertTriangle, Check, CloudOff, Loader2 } from "lucide-react";
import { useT } from "@/hooks/use-i18n";
import { useConfigStore } from "@/store/config-store";

export function SaveIndicator() {
  const t = useT();
  const status = useConfigStore((s) => s.saveStatus);
  const error = useConfigStore((s) => s.saveError);
  const map = {
    idle: null,
    pending: { icon: <Loader2 className="size-3.5 animate-spin" />, text: t.common.unsaved, cls: "text-muted" },
    saving: { icon: <Loader2 className="size-3.5 animate-spin" />, text: t.common.saving, cls: "text-muted" },
    saved: { icon: <Check className="size-3.5" />, text: t.common.saved, cls: "text-emerald-500" },
    error: { icon: <AlertTriangle className="size-3.5" />, text: t.common.saveError, cls: "text-red-500" },
    offline: { icon: <CloudOff className="size-3.5" />, text: t.common.offline, cls: "text-amber-500" },
  }[status];
  if (!map) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${map.cls}`} role="status" title={error ?? undefined}>
      {map.icon}
      <span className="hidden sm:inline">{map.text}</span>
    </span>
  );
}

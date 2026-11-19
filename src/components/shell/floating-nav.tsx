"use client";

import { Command } from "lucide-react";
import type { WidgetInstance } from "@/lib/config/schema";
import { useT } from "@/hooks/use-i18n";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { useNavItems } from "./header";

export function FloatingNav({ widgets }: { widgets: WidgetInstance[] }) {
  const t = useT();
  const nav = useNavItems(widgets);
  const palette = useConfigStore((s) => s.config.features.commandPalette);
  const open = useUIStore((s) => s.setPaletteOpen);
  if (!nav.length && !palette) return null;
  return (
    <nav aria-label="Sections" className="no-print glass-panel fixed bottom-5 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-0.5 overflow-x-auto rounded-full p-1 shadow-xl">
      {nav.map((n) => (
        <a key={n.id} href={`#w-${n.id}`} className="shrink-0 rounded-full px-3.5 py-2 text-sm text-muted transition hover:bg-surface-3 hover:text-fg">
          {n.label}
        </a>
      ))}
      {palette && (
        <button onClick={() => open(true)} className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-fg" aria-label={t.header.commandPalette}>
          <Command className="size-4" />
        </button>
      )}
    </nav>
  );
}

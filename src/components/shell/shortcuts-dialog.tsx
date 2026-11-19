"use client";

import { useT } from "@/hooks/use-i18n";
import { Dialog } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/misc";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";

export function ShortcutsDialog() {
  const t = useT();
  const open = useUIStore((s) => s.shortcutsOpen);
  const set = useUIStore((s) => s.setShortcutsOpen);
  const isOwner = useConfigStore((s) => s.isOwner);
  const quick = useConfigStore((s) => s.config.quickLinks).filter((q) => q.shortcut);
  const rows: [string[], string][] = [
    [["Ctrl", "K"], t.shortcuts.palette],
    [["/"], t.shortcuts.search],
    [["F"], t.shortcuts.fullscreen],
    [["T"], t.shortcuts.theme],
    [["?"], t.shortcuts.help],
    [["Esc"], t.shortcuts.escape],
    ...(isOwner
      ? ([
          [["E"], t.shortcuts.edit],
          [[","], t.shortcuts.settings],
          [["Ctrl", "Z"], "Undo"],
          [["Ctrl", "Shift", "Z"], "Redo"],
        ] as [string[], string][])
      : []),
    ...quick.map((q) => [[q.shortcut.toUpperCase()], q.label] as [string[], string]),
  ];
  return (
    <Dialog open={open} onClose={() => set(false)} title={t.palette.shortcuts} size="sm">
      <ul className="space-y-2">
        {rows.map(([keys, label], i) => (
          <li key={i} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-muted">{label}</span>
            <span className="flex gap-1">
              {keys.map((k) => (
                <Kbd key={k}>{k}</Kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

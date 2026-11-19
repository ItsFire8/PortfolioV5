"use client";

import { CloudOff, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useWidgetData } from "@/hooks/use-widget-data";
import { bi } from "@/lib/i18n";
import { newId } from "@/lib/config/defaults";
import { cn } from "@/lib/utils";
import { confirmDialog } from "@/components/ui/confirm";
import type { WidgetProps } from "./types";

type Note = { id: string; title: string; body: string; updatedAt: number };

export default function Notes({ widget, locale }: WidgetProps<{ storage: "server" | "local" }>) {
  const { data, update, canWrite, syncState, loaded } = useWidgetData<Note[]>(widget.id, widget.settings.storage, []);
  const notes = Array.isArray(data) ? data : [];
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = notes.find((n) => n.id === activeId) ?? notes[0];

  const add = () => {
    const n: Note = { id: newId("n"), title: "", body: "", updatedAt: Date.now() };
    update((p) => [n, ...(Array.isArray(p) ? p : [])]);
    setActiveId(n.id);
  };
  const edit = (patch: Partial<Note>) => active && update((p) => p.map((n) => (n.id === active.id ? { ...n, ...patch, updatedAt: Date.now() } : n)));
  const remove = async () => {
    if (!active) return;
    if (active.body.trim() && !(await confirmDialog({ title: bi(locale, "Notiz löschen?", "Delete note?"), danger: true, confirmLabel: bi(locale, "Löschen", "Delete"), cancelLabel: bi(locale, "Abbrechen", "Cancel") }))) return;
    update((p) => p.filter((n) => n.id !== active.id));
    setActiveId(null);
  };

  if (loaded && !notes.length)
    return (
      <div className="flex h-full min-h-32 flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted">{bi(locale, "Noch keine Notizen.", "No notes yet.")}</p>
        {canWrite && (
          <button onClick={add} className="inline-flex items-center gap-1.5 rounded-ui bg-primary-soft px-3 py-1.5 text-sm font-medium text-primary">
            <Plus className="size-4" /> {bi(locale, "Neue Notiz", "New note")}
          </button>
        )}
      </div>
    );

  return (
    <div className="flex h-full min-h-48 flex-col gap-3">
      <div className="flex items-center gap-1 overflow-x-auto">
        {notes.map((n) => (
          <button
            key={n.id}
            onClick={() => setActiveId(n.id)}
            className={cn("max-w-32 shrink-0 truncate rounded-full px-3 py-1 text-xs font-medium transition", n.id === active?.id ? "bg-fg text-bg" : "text-muted hover:bg-surface-2")}
          >
            {n.title || n.body.split("\n")[0]?.slice(0, 24) || bi(locale, "Unbenannt", "Untitled")}
          </button>
        ))}
        {canWrite && (
          <button onClick={add} className="grid size-6 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg" aria-label={bi(locale, "Neue Notiz", "New note")}>
            <Plus className="size-3.5" />
          </button>
        )}
        {syncState === "offline" || syncState === "error" ? <CloudOff className="ml-auto size-3.5 shrink-0 text-amber-500" aria-label="Offline" /> : null}
      </div>
      {active && (
        <div className="flex min-h-0 flex-1 flex-col rounded-ui bg-surface-2 p-3">
          <input
            value={active.title}
            onChange={(e) => edit({ title: e.target.value })}
            readOnly={!canWrite}
            placeholder={bi(locale, "Titel", "Title")}
            className="bg-transparent font-semibold outline-none placeholder:text-subtle"
            aria-label={bi(locale, "Titel", "Title")}
          />
          <textarea
            value={active.body}
            onChange={(e) => edit({ body: e.target.value })}
            readOnly={!canWrite}
            placeholder={bi(locale, "Schreib etwas …", "Write something …")}
            className="mt-2 min-h-28 flex-1 resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-subtle"
            aria-label={bi(locale, "Notiz", "Note")}
          />
          {canWrite && (
            <div className="flex items-center justify-between pt-2 text-[0.7rem] text-subtle">
              <span>{new Date(active.updatedAt).toLocaleString(locale === "de" ? "de-DE" : "en-US", { dateStyle: "short", timeStyle: "short" })}</span>
              <button onClick={remove} className="rounded p-1 hover:bg-red-500/10 hover:text-red-500" aria-label={bi(locale, "Notiz löschen", "Delete note")}>
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

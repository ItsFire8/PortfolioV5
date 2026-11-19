"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, CloudOff, Flag, Trash2 } from "lucide-react";
import { useState } from "react";
import { useWidgetData } from "@/hooks/use-widget-data";
import { newId } from "@/lib/config/defaults";
import { bi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { WidgetProps } from "./types";

type Todo = { id: string; text: string; done: boolean; important?: boolean; createdAt: number };

export default function TodoWidget({ widget, locale }: WidgetProps<{ storage: "server" | "local"; showCompleted: boolean }>) {
  const { data, update, canWrite, syncState } = useWidgetData<Todo[]>(widget.id, widget.settings.storage, []);
  const todos = Array.isArray(data) ? data : [];
  const [text, setText] = useState("");
  const open = todos.filter((t) => !t.done).sort((a, b) => Number(!!b.important) - Number(!!a.important));
  const done = todos.filter((t) => t.done);
  const list = widget.settings.showCompleted ? [...open, ...done] : open;
  const pct = todos.length ? Math.round((done.length / todos.length) * 100) : 0;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    update((p) => [{ id: newId("t"), text: v.slice(0, 300), done: false, createdAt: Date.now() }, ...p]);
    setText("");
  };
  const patch = (id: string, p: Partial<Todo>) => update((all) => all.map((t) => (t.id === id ? { ...t, ...p } : t)));

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={bi(locale, "Fortschritt", "Progress")}>
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="tabular text-xs text-muted">
          {done.length}/{todos.length}
        </span>
        {(syncState === "offline" || syncState === "error") && <CloudOff className="size-3.5 text-amber-500" aria-label="Offline" />}
      </div>
      {canWrite && (
        <form onSubmit={add}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={bi(locale, "Neue Aufgabe + Enter", "New task + Enter")}
            aria-label={bi(locale, "Neue Aufgabe", "New task")}
            className="input-base h-9"
          />
        </form>
      )}
      <ul className="-mx-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        <AnimatePresence initial={false}>
          {list.map((t) => (
            <motion.li key={t.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 12 }} className="group flex items-center gap-2.5 rounded-ui px-1 py-1.5 hover:bg-surface-2">
              <button
                onClick={() => patch(t.id, { done: !t.done })}
                disabled={!canWrite}
                aria-label={t.done ? bi(locale, "Als offen markieren", "Mark as open") : bi(locale, "Erledigt", "Done")}
                className={cn("grid size-[18px] shrink-0 place-items-center rounded-[6px] border transition", t.done ? "border-accent bg-accent text-white" : "border-border-strong hover:border-accent")}
              >
                {t.done && <Check className="size-3" strokeWidth={3} />}
              </button>
              <span className={cn("min-w-0 flex-1 break-words text-sm", t.done && "text-subtle line-through")}>{t.text}</span>
              {canWrite && (
                <span className="flex opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                  <button onClick={() => patch(t.id, { important: !t.important })} className={cn("rounded p-1 hover:bg-surface-3", t.important ? "text-amber-500 opacity-100" : "text-muted")} aria-label={bi(locale, "Wichtig", "Important")}>
                    <Flag className="size-3.5" />
                  </button>
                  <button onClick={() => update((all) => all.filter((x) => x.id !== t.id))} className="rounded p-1 text-muted hover:bg-red-500/10 hover:text-red-500" aria-label={bi(locale, "Löschen", "Delete")}>
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              )}
              {t.important && !canWrite && <Flag className="size-3.5 text-amber-500" aria-hidden />}
            </motion.li>
          ))}
        </AnimatePresence>
        {!list.length && <li className="py-6 text-center text-sm text-muted">{bi(locale, "Alles erledigt ✓", "All done ✓")}</li>}
      </ul>
      {canWrite && done.length > 0 && (
        <button onClick={() => update((all) => all.filter((t) => !t.done))} className="self-start text-xs text-muted hover:text-fg">
          {bi(locale, "Erledigte entfernen", "Clear completed")}
        </button>
      )}
    </div>
  );
}

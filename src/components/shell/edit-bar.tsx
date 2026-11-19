"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Redo2, Settings, Undo2 } from "lucide-react";
import { useT } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { SaveIndicator } from "./save-indicator";

export function EditBar() {
  const t = useT();
  const ui = useUIStore();
  const { undo, redo, past, future } = useConfigStore((s) => s);
  return (
    <AnimatePresence>
      {ui.editMode && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 34 }}
          className="no-print glass-panel fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full p-1.5 pl-4 shadow-2xl"
          role="toolbar"
          aria-label={t.header.editMode}
        >
          <span className="mr-2 hidden text-sm font-medium sm:inline">{t.header.editMode}</span>
          <SaveIndicator />
          <div className="mx-2 h-5 w-px bg-border-strong" />
          <Button size="icon-sm" variant="ghost" onClick={undo} disabled={!past.length} aria-label="Undo (Ctrl+Z)" title="Undo (Ctrl+Z)">
            <Undo2 />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={redo} disabled={!future.length} aria-label="Redo (Ctrl+Shift+Z)" title="Redo (Ctrl+Shift+Z)">
            <Redo2 />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => ui.setAddWidgetOpen(true)} className="rounded-full">
            <Plus /> <span className="hidden sm:inline">{t.widgets.add}</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => ui.openSettings()} className="rounded-full" aria-label={t.header.openSettings}>
            <Settings />
          </Button>
          <Button size="sm" variant="primary" onClick={() => ui.setEditMode(false)} className="rounded-full">
            <Check /> {t.header.exitEdit}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

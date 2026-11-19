"use client";

import { useEffect } from "react";
import type { ThemeMode } from "@/lib/config/schema";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { useFullscreen } from "./use-fullscreen";

const isTyping = (el: EventTarget | null) => {
  const e = el as HTMLElement | null;
  return !!e && (e.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(e.tagName));
};
const CYCLE: ThemeMode[] = ["system", "light", "dark", "amoled"];

/**
 * Global shortcuts:
 *  Ctrl/⌘+K palette · / focus search · E edit mode · , settings · F fullscreen
 *  T theme · ? help · Ctrl+Z / Ctrl+Shift+Z undo/redo (owner) · Esc close
 */
export function KeyboardShortcuts() {
  const features = useConfigStore((s) => s.config.features);
  const quickLinks = useConfigStore((s) => s.config.quickLinks);
  const mode = useConfigStore((s) => s.config.appearance.mode);
  const isOwner = useConfigStore((s) => s.isOwner);
  const undo = useConfigStore((s) => s.undo);
  const redo = useConfigStore((s) => s.redo);
  const { toggle: toggleFullscreen } = useFullscreen();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ui = useUIStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "k" && features.commandPalette) {
        e.preventDefault();
        ui.setPaletteOpen(!ui.paletteOpen);
        return;
      }
      if (isOwner && mod && e.key.toLowerCase() === "z" && !isTyping(e.target)) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (!features.shortcuts || mod || e.altKey || isTyping(e.target)) return;
      if (ui.paletteOpen || ui.settingsOpen || ui.editingWidget || ui.addWidgetOpen) return;
      const key = e.key;
      if (key === "/") {
        const input = document.querySelector<HTMLInputElement>("[data-global-search]");
        if (input) {
          e.preventDefault();
          input.focus();
        } else if (features.commandPalette) {
          e.preventDefault();
          ui.setPaletteOpen(true);
        }
      } else if (key === "?") ui.setShortcutsOpen(true);
      else if (key === "f") toggleFullscreen();
      else if (key === "t") {
        const cur = ui.themeOverride ?? mode;
        ui.setThemeOverride(CYCLE[(CYCLE.indexOf(cur) + 1) % CYCLE.length]);
      } else if (isOwner && key === "e") ui.setEditMode(!ui.editMode);
      else if (isOwner && key === ",") ui.openSettings();
      else {
        const q = quickLinks.find((x) => x.shortcut && x.shortcut.toLowerCase() === key.toLowerCase());
        if (q?.url) window.open(q.url, /^https?:/.test(q.url) ? "_blank" : "_self", "noopener,noreferrer");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [features, quickLinks, mode, isOwner, undo, redo, toggleFullscreen]);
  return null;
}

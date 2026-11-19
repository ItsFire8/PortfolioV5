"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ThemeMode } from "@/lib/config/schema";

export type SettingsTab = "general" | "appearance" | "layout" | "widgets" | "quicklinks" | "data";

interface UIState {
  // persisted, per device (LocalStorage)
  themeOverride: ThemeMode | null;
  searchEngine: Record<string, string>;
  // session only
  editMode: boolean;
  previewVisitor: boolean;
  settingsOpen: boolean;
  settingsTab: SettingsTab;
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  addWidgetOpen: boolean;
  editingWidget: string | null;
  resolvedTheme: "light" | "dark" | "amoled";
  online: boolean;

  setThemeOverride: (m: ThemeMode | null) => void;
  setSearchEngine: (widgetId: string, engine: string) => void;
  setEditMode: (v: boolean) => void;
  setPreviewVisitor: (v: boolean) => void;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  setSettingsTab: (t: SettingsTab) => void;
  setPaletteOpen: (v: boolean) => void;
  setShortcutsOpen: (v: boolean) => void;
  setAddWidgetOpen: (v: boolean) => void;
  setEditingWidget: (id: string | null) => void;
  setResolvedTheme: (t: "light" | "dark" | "amoled") => void;
  setOnline: (v: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      themeOverride: null,
      searchEngine: {},
      editMode: false,
      previewVisitor: false,
      settingsOpen: false,
      settingsTab: "general",
      paletteOpen: false,
      shortcutsOpen: false,
      addWidgetOpen: false,
      editingWidget: null,
      resolvedTheme: "dark",
      online: true,

      setThemeOverride: (themeOverride) => set({ themeOverride }),
      setSearchEngine: (id, engine) => set((s) => ({ searchEngine: { ...s.searchEngine, [id]: engine } })),
      setEditMode: (editMode) => set({ editMode, previewVisitor: false }),
      setPreviewVisitor: (previewVisitor) => set({ previewVisitor, editMode: false, settingsOpen: false }),
      openSettings: (tab) => set((s) => ({ settingsOpen: true, settingsTab: tab ?? s.settingsTab, paletteOpen: false })),
      closeSettings: () => set({ settingsOpen: false }),
      setSettingsTab: (settingsTab) => set({ settingsTab }),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
      setAddWidgetOpen: (addWidgetOpen) => set({ addWidgetOpen }),
      setEditingWidget: (editingWidget) => set({ editingWidget }),
      setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
      setOnline: (online) => set({ online }),
    }),
    {
      name: "hp-ui",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ themeOverride: s.themeOverride, searchEngine: s.searchEngine }),
    },
  ),
);

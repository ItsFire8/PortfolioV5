"use client";

import { createContext, createElement, useContext, useState, type ReactNode } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { arrayMove } from "@dnd-kit/sortable";
import { createWidget, newId } from "@/lib/config/defaults";
import { applyPreset } from "@/lib/config/presets";
import type { SiteConfig, WidgetInstance } from "@/lib/config/schema";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error" | "offline";

interface ConfigState {
  config: SiteConfig;
  /** Last config confirmed by the server – used for "discard" and conflict-free autosave. */
  savedConfig: SiteConfig;
  isOwner: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  past: SiteConfig[];
  future: SiteConfig[];

  init: (config: SiteConfig, isOwner: boolean) => void;
  set: (updater: (c: SiteConfig) => SiteConfig, opts?: { history?: boolean }) => void;
  patch: <K extends "general" | "appearance" | "layout" | "seo" | "features">(section: K, patch: Partial<SiteConfig[K]>) => void;
  replace: (config: SiteConfig) => void;
  markSaved: (config: SiteConfig) => void;
  setSaveStatus: (s: SaveStatus, error?: string | null) => void;
  undo: () => void;
  redo: () => void;

  applyPreset: (id: string) => void;
  updateWidget: (id: string, patch: Partial<WidgetInstance>) => void;
  updateWidgetSettings: (id: string, patch: Record<string, unknown>) => void;
  addWidget: (type: string, index?: number) => string;
  removeWidget: (id: string) => void;
  duplicateWidget: (id: string) => string | null;
  moveWidget: (activeId: string, overId: string) => void;
  moveWidgetBy: (id: string, delta: number) => void;
  setMobileOrder: (ids: string[]) => void;
}

const HISTORY_LIMIT = 60;
let lastHistoryPush = 0;

/**
 * One store per request/page – never a module-level singleton, otherwise the
 * owner's (private) configuration could leak between server renders.
 */
const createConfigStore = (initial: SiteConfig, owner: boolean) =>
  createStore<ConfigState>((setState, get) => ({
  config: initial,
  savedConfig: initial,
  isOwner: owner,
  saveStatus: "idle",
  saveError: null,
  past: [],
  future: [],

  init: (config, isOwner) => setState({ config, savedConfig: config, isOwner, past: [], future: [], saveStatus: "idle" }),

  set: (updater, opts = {}) => {
    const prev = get().config;
    const next = updater(prev);
    if (next === prev) return;
    const t = Date.now();
    // Coalesce rapid changes (slider drags, typing) into one undo step.
    const push = opts.history !== false && t - lastHistoryPush > 600;
    if (push) lastHistoryPush = t;
    setState((s) => ({
      config: next,
      past: push ? [...s.past.slice(-HISTORY_LIMIT), prev] : s.past,
      future: push ? [] : s.future,
      saveStatus: s.isOwner ? "pending" : s.saveStatus,
    }));
  },

  patch: (section, patch) => get().set((c) => ({ ...c, [section]: { ...c[section], ...patch } })),

  replace: (config) => setState((s) => ({ config, past: [...s.past.slice(-HISTORY_LIMIT), s.config], future: [], saveStatus: "pending" })),

  markSaved: (config) => setState({ savedConfig: config, saveStatus: "saved", saveError: null }),
  setSaveStatus: (saveStatus, saveError = null) => setState({ saveStatus, saveError }),

  undo: () => {
    const { past, config, future } = get();
    if (!past.length) return;
    setState({ config: past[past.length - 1], past: past.slice(0, -1), future: [config, ...future], saveStatus: "pending" });
  },
  redo: () => {
    const { past, config, future } = get();
    if (!future.length) return;
    setState({ config: future[0], future: future.slice(1), past: [...past, config], saveStatus: "pending" });
  },

  applyPreset: (id) => {
    lastHistoryPush = 0;
    get().set((c) => ({ ...c, ...applyPreset(c.appearance, c.layout, id) }));
  },

  updateWidget: (id, patch) =>
    get().set((c) => ({ ...c, widgets: c.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),

  updateWidgetSettings: (id, patch) =>
    get().set((c) => ({
      ...c,
      widgets: c.widgets.map((w) => (w.id === id ? { ...w, settings: { ...w.settings, ...patch } } : w)),
    })),

  addWidget: (type, index) => {
    const w = createWidget(type);
    lastHistoryPush = 0;
    get().set((c) => {
      const widgets = [...c.widgets];
      widgets.splice(index ?? widgets.length, 0, w);
      return { ...c, widgets };
    });
    return w.id;
  },

  removeWidget: (id) => {
    lastHistoryPush = 0;
    get().set((c) => ({
      ...c,
      widgets: c.widgets.filter((w) => w.id !== id),
      layout: { ...c.layout, mobile: { ...c.layout.mobile, order: c.layout.mobile.order.filter((x) => x !== id) } },
    }));
  },

  duplicateWidget: (id) => {
    const src = get().config.widgets.find((w) => w.id === id);
    if (!src) return null;
    const copy: WidgetInstance = { ...structuredClone(src), id: newId(src.type.slice(0, 3)) };
    lastHistoryPush = 0;
    get().set((c) => {
      const i = c.widgets.findIndex((w) => w.id === id);
      const widgets = [...c.widgets];
      widgets.splice(i + 1, 0, copy);
      return { ...c, widgets };
    });
    return copy.id;
  },

  moveWidget: (activeId, overId) => {
    if (activeId === overId) return;
    lastHistoryPush = 0;
    get().set((c) => {
      const from = c.widgets.findIndex((w) => w.id === activeId);
      const to = c.widgets.findIndex((w) => w.id === overId);
      if (from < 0 || to < 0) return c;
      return { ...c, widgets: arrayMove(c.widgets, from, to) };
    });
  },

  moveWidgetBy: (id, delta) => {
    lastHistoryPush = 0;
    get().set((c) => {
      const from = c.widgets.findIndex((w) => w.id === id);
      const to = Math.min(c.widgets.length - 1, Math.max(0, from + delta));
      if (from < 0 || from === to) return c;
      return { ...c, widgets: arrayMove(c.widgets, from, to) };
    });
  },

  setMobileOrder: (ids) =>
    get().set((c) => ({ ...c, layout: { ...c.layout, mobile: { ...c.layout.mobile, order: ids, customOrder: true } } })),
}));

const Ctx = createContext<StoreApi<ConfigState> | null>(null);

export function ConfigStoreProvider({ config, isOwner, children }: { config: SiteConfig; isOwner: boolean; children: ReactNode }) {
  const [store] = useState(() => createConfigStore(config, isOwner));
  return createElement(Ctx.Provider, { value: store }, children);
}

export function useConfigStoreApi(): StoreApi<ConfigState> {
  const store = useContext(Ctx);
  if (!store) throw new Error("ConfigStoreProvider missing");
  return store;
}

export function useConfigStore<T = ConfigState>(selector?: (s: ConfigState) => T): T {
  return useStore(useConfigStoreApi(), selector ?? ((s) => s as unknown as T));
}

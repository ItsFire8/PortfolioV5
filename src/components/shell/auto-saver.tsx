"use client";

import { useEffect, useRef } from "react";
import { api, ApiError } from "@/lib/api";
import type { SiteConfig } from "@/lib/config/schema";
import { useConfigStore, useConfigStoreApi } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";

const DRAFT_KEY = "hp-config-draft";

/**
 * Debounced autosave for the owner. If the server is unreachable the draft is
 * kept in LocalStorage and retried as soon as the browser is online again.
 */
export function AutoSaver() {
  const store = useConfigStoreApi();
  const config = useConfigStore((s) => s.config);
  const saved = useConfigStore((s) => s.savedConfig);
  const setOnline = useUIStore((s) => s.setOnline);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inflight = useRef(false);

  const save = useRef(async () => {
    if (inflight.current) {
      timer.current = setTimeout(() => void save.current(), 500);
      return;
    }
    const snapshot = store.getState().config;
    if (snapshot === store.getState().savedConfig) return;
    inflight.current = true;
    store.getState().setSaveStatus("saving");
    try {
      const res = await api<{ config: SiteConfig }>("/api/config", { method: "PUT", json: { config: snapshot } });
      // Only mark as saved if nothing changed meanwhile – otherwise keep pending.
      if (store.getState().config === snapshot) {
        store.setState({ savedConfig: snapshot, saveStatus: "saved", saveError: null });
        localStorage.removeItem(DRAFT_KEY);
      } else store.setState({ savedConfig: snapshot });
      void res;
    } catch (e) {
      const offline = !navigator.onLine || (e instanceof TypeError);
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot));
      } catch {
        /* ignore */
      }
      const msg = e instanceof ApiError && e.details && typeof e.details === "object" && "issues" in e.details ? `${e.message}: ${JSON.stringify((e.details as { issues: unknown[] }).issues[0])}` : (e as Error).message;
      store.getState().setSaveStatus(offline ? "offline" : "error", msg);
    } finally {
      inflight.current = false;
    }
  });

  useEffect(() => {
    if (config === saved) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void save.current(), 800);
    return () => clearTimeout(timer.current);
  }, [config, saved]);

  useEffect(() => {
    const on = () => {
      setOnline(true);
      void save.current();
    };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (store.getState().config !== store.getState().savedConfig) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [setOnline, store]);

  return null;
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useConfigStore } from "@/store/config-store";

const LS_PREFIX = "hp-wd:";
const PENDING_PREFIX = "hp-wd-pending:";

function readLocal<T>(key: string): T | undefined {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : undefined;
  } catch {
    return undefined;
  }
}
function writeLocal(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* quota or private mode */
  }
}

/**
 * Interactive widget state (notes, todos).
 * - storage "local": lives in this browser only, works fully offline.
 * - storage "server": synced via /api/widget-data; cached locally so it works
 *   offline, pending writes are flushed when the connection returns.
 *   Only the owner can write; visitors get a read-only view.
 */
export function useWidgetData<T>(widgetId: string, storage: "server" | "local", initial: T) {
  const isOwner = useConfigStore((s) => s.isOwner);
  const canWrite = storage === "local" || isOwner;
  const cacheKey = `${LS_PREFIX}${storage}:${widgetId}`;
  const [data, setData] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "saving" | "error" | "offline">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef<T>(initial);

  const flush = useCallback(async () => {
    if (storage !== "server") return;
    const pending = readLocal<T>(PENDING_PREFIX + widgetId);
    if (pending === undefined) return;
    setSyncState("saving");
    try {
      await api(`/api/widget-data/${widgetId}`, { method: "PUT", json: { data: pending } });
      localStorage.removeItem(PENDING_PREFIX + widgetId);
      setSyncState("idle");
    } catch {
      setSyncState(navigator.onLine ? "error" : "offline");
    }
  }, [storage, widgetId]);

  useEffect(() => {
    let cancelled = false;
    const cached = readLocal<T>(cacheKey);
    if (cached !== undefined) {
      setData(cached);
      latest.current = cached;
    }
    if (storage === "local") {
      setLoaded(true);
      return;
    }
    api<{ data: T | null }>(`/api/widget-data/${widgetId}`)
      .then((r) => {
        if (cancelled) return;
        // Unsynced local edits win over the server copy.
        const pending = readLocal<T>(PENDING_PREFIX + widgetId);
        const value = pending ?? r.data ?? initial;
        setData(value);
        latest.current = value;
        writeLocal(cacheKey, value);
        if (pending !== undefined) void flush();
      })
      .catch(() => setSyncState(navigator.onLine ? "error" : "offline"))
      .finally(() => !cancelled && setLoaded(true));
    const onOnline = () => void flush();
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetId, storage]);

  const update = useCallback(
    (updater: T | ((prev: T) => T)) => {
      if (!canWrite) return;
      const next = typeof updater === "function" ? (updater as (p: T) => T)(latest.current) : updater;
      latest.current = next;
      setData(next);
      writeLocal(cacheKey, next);
      if (storage === "server") {
        writeLocal(PENDING_PREFIX + widgetId, next);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => void flush(), 700);
      }
    },
    [canWrite, cacheKey, flush, storage, widgetId],
  );

  return { data, update, loaded, canWrite, syncState };
}

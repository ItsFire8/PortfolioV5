"use client";

import { useEffect } from "react";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";

/** PWA service worker registration, privacy-friendly page-view beacon, LocalStorage rehydration. */
export function BackgroundTasks({ statsEnabled }: { statsEnabled: boolean }) {
  const pwa = useConfigStore((s) => s.config.features.pwa);
  const isOwner = useConfigStore((s) => s.isOwner);

  useEffect(() => {
    void useUIStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (pwa && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
    else navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => void r.unregister())).catch(() => {});
  }, [pwa]);

  useEffect(() => {
    if (!statsEnabled || isOwner) return;
    const body = JSON.stringify({ path: location.pathname, referrer: document.referrer });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/stats", new Blob([body], { type: "application/json" }));
    else void fetch("/api/stats", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  }, [statsEnabled, isOwner]);

  return null;
}

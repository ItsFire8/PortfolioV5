"use client";

import { useEffect, useMemo } from "react";
import { buildThemeCss, sanitizeCss } from "@/lib/theme";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";

/** Applies theme variables live and resolves light/dark/AMOLED (+ system preference, + visitor override). */
export function ThemeController() {
  const appearance = useConfigStore((s) => s.config.appearance);
  const layout = useConfigStore((s) => s.config.layout);
  const allowOverride = useConfigStore((s) => s.config.features.visitorThemeToggle || s.isOwner);
  const override = useUIStore((s) => s.themeOverride);
  const setResolved = useUIStore((s) => s.setResolvedTheme);
  const css = useMemo(() => buildThemeCss(appearance, layout), [appearance, layout]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      let mode = (allowOverride && override) || appearance.mode;
      if (mode === "system") mode = mq.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", mode);
      setResolved(mode as "light" | "dark" | "amoled");
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [appearance.mode, override, allowOverride, setResolved]);

  useEffect(() => {
    document.documentElement.classList.toggle("no-motion", appearance.animationSpeed === 0);
  }, [appearance.animationSpeed]);

  return (
    <>
      <style id="theme-vars" dangerouslySetInnerHTML={{ __html: css }} />
      {appearance.customCss.trim() && <style id="custom-css" dangerouslySetInnerHTML={{ __html: sanitizeCss(appearance.customCss) }} />}
    </>
  );
}

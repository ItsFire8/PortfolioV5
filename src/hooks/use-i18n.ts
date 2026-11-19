"use client";

import { createContext, createElement, useCallback, useContext, useState, type ReactNode } from "react";
import { getDict } from "@/lib/i18n";
import type { Locale } from "@/lib/config/schema";
import { useConfigStore } from "@/store/config-store";

/**
 * Visitor language override. Stored in a cookie (not only LocalStorage) so the
 * server can render the right language immediately – no flash, no mismatch.
 */
const LocaleCtx = createContext<{ override: Locale | null; setOverride: (l: Locale | null) => void }>({ override: null, setOverride: () => {} });

export function LocaleProvider({ initial, children }: { initial: Locale | null; children: ReactNode }) {
  const [override, setState] = useState<Locale | null>(initial);
  const setOverride = useCallback((l: Locale | null) => {
    setState(l);
    document.cookie = l ? `hp-locale=${l}; path=/; max-age=31536000; samesite=lax` : "hp-locale=; path=/; max-age=0; samesite=lax";
  }, []);
  return createElement(LocaleCtx.Provider, { value: { override, setOverride } }, children);
}

export const useLocaleOverride = () => useContext(LocaleCtx);

export function useLocale(): Locale {
  const configLocale = useConfigStore((s) => s.config.general.locale);
  return useContext(LocaleCtx).override ?? configLocale;
}

export function useT() {
  return getDict(useLocale());
}

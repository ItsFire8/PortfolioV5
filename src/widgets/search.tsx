"use client";

import { ArrowRight, Bookmark, Search as SearchIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useT } from "@/hooks/use-i18n";
import { safeUrl } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { collectBookmarks } from "@/lib/bookmarks";
import { SEARCH_ENGINES } from "./definitions";
import type { WidgetProps } from "./types";

type S = { engine: string; customUrl: string; newTab: boolean; allowSwitch: boolean; suggestBookmarks: boolean };

export default function Search({ widget, config }: WidgetProps<S>) {
  const t = useT();
  const s = widget.settings;
  const chosen = useUIStore((st) => st.searchEngine[widget.id]);
  const setEngine = useUIStore((st) => st.setSearchEngine);
  const engine = s.allowSwitch && chosen && (SEARCH_ENGINES[chosen] || chosen === "custom") ? chosen : s.engine;
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bookmarks = useMemo(() => (s.suggestBookmarks ? collectBookmarks(config) : []), [config, s.suggestBookmarks]);
  const matches = q.trim().length > 0 ? bookmarks.filter((b) => b.label.toLowerCase().includes(q.toLowerCase()) || b.url.toLowerCase().includes(q.toLowerCase())).slice(0, 5) : [];

  const template = engine === "custom" ? s.customUrl : SEARCH_ENGINES[engine]?.url ?? SEARCH_ENGINES.duckduckgo.url;
  const go = (url: string) => (s.newTab ? window.open(url, "_blank", "noopener,noreferrer") : window.location.assign(url));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sel >= 0 && matches[sel]) return go(matches[sel].url);
    const query = q.trim();
    if (!query) return;
    if (/^https?:\/\/\S+$/i.test(query)) return go(query);
    const url = safeUrl(template.replace("%s", encodeURIComponent(query)));
    if (url) go(url);
  };

  return (
    <form onSubmit={submit} role="search" className="relative flex h-full items-center" data-search-widget>
      <div className="flex w-full items-center gap-2 rounded-[calc(var(--radius)*0.8)] border border-border-strong bg-surface-2 py-1.5 pl-4 pr-1.5 shadow-sm transition focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--primary-soft)]">
        <SearchIcon className="size-5 shrink-0 text-muted" aria-hidden />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((v) => Math.min(matches.length - 1, v + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((v) => Math.max(-1, v - 1));
            } else if (e.key === "Escape") setQ("");
          }}
          placeholder={`${t.common.search} – ${engine === "custom" ? "Web" : SEARCH_ENGINES[engine]?.name ?? ""}`}
          aria-label={t.common.search}
          className="h-10 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-subtle"
          autoComplete="off"
          data-global-search
        />
        {s.allowSwitch && (
          <select
            value={engine}
            onChange={(e) => setEngine(widget.id, e.target.value)}
            aria-label="Search engine"
            className="hidden h-9 max-w-36 cursor-pointer rounded-ui bg-transparent px-2 text-xs text-muted outline-none hover:bg-surface-3 sm:block"
          >
            {Object.entries(SEARCH_ENGINES).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
            {s.customUrl && <option value="custom">Custom</option>}
          </select>
        )}
        <button type="submit" className="grid size-9 shrink-0 place-items-center rounded-ui bg-primary text-primary-fg transition hover:brightness-110" aria-label={t.common.search}>
          <ArrowRight className="size-4" />
        </button>
      </div>
      {matches.length > 0 && (
        <ul className="glass-panel absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-ui p-1 shadow-xl" role="listbox">
          {matches.map((m, i) => (
            <li key={m.url + i} role="option" aria-selected={i === sel}>
              <a href={m.url} target={s.newTab ? "_blank" : undefined} rel="noopener noreferrer" className={`flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm ${i === sel ? "bg-surface-3" : "hover:bg-surface-2"}`}>
                <Bookmark className="size-3.5 text-primary" aria-hidden />
                <span className="truncate font-medium">{m.label}</span>
                <span className="ml-auto truncate text-xs text-muted">{m.category}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

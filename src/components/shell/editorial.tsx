"use client";

import { Plus } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { SiteConfig, WidgetInstance } from "@/lib/config/schema";
import { bi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/use-i18n";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { WidgetGrid } from "@/components/grid/widget-grid";
import { useNavItems } from "./header";
import { Footer } from "./footer";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Oversized display line: letters are spread across the full width and scaled to fit. */
function Hero({ text }: { text: string }) {
  const box = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<number | null>(null);
  useIsoLayoutEffect(() => {
    const el = box.current;
    const p = probe.current;
    if (!el || !p) return;
    const fit = () => {
      const natural = p.getBoundingClientRect().width; // width at 100px
      if (!natural) return;
      const avail = el.clientWidth;
      setSize(Math.max(32, Math.min((avail / natural) * 100 * 0.97, avail * 0.2, window.innerHeight * 0.42)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [text]);
  const chars = [...text.toUpperCase()];
  return (
    <div ref={box} className="relative w-full overflow-hidden">
      <span ref={probe} aria-hidden className="pointer-events-none invisible absolute whitespace-pre font-heading font-black uppercase" style={{ fontSize: 100, letterSpacing: "-0.02em" }}>
        {text}
      </span>
      <h1
        aria-label={text}
        className="flex justify-between font-heading font-black uppercase leading-[0.78] tracking-[-0.02em]"
        style={{ fontSize: size ?? "clamp(3rem, 14vw, 15rem)", opacity: size ? 1 : 0, transition: "opacity .4s" }}
      >
        {chars.map((c, i) => (
          <span key={i} aria-hidden>
            {c === " " ? " " : c}
          </span>
        ))}
      </h1>
    </div>
  );
}

function CursorDot() {
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = dot.current!;
    let x = -100, y = -100, cx = -100, cy = -100, big = false, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      big = !!(e.target as HTMLElement)?.closest?.("a,button,input,textarea,select,[role=button]");
    };
    const loop = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) scale(${big ? 3.2 : 1})`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={dot} className="ed-cursor" aria-hidden />;
}

export function EditorialShell({ widgets, config, isOwner, editMode, user }: { widgets: WidgetInstance[]; config: SiteConfig; isOwner: boolean; editMode: boolean; user: { displayName: string } | null }) {
  const locale = useLocale();
  const L = (de: string, en: string) => bi(locale, de, en);
  const ed = config.layout.editorial;
  const g = config.general;
  const ui = useUIStore();
  const canTheme = useConfigStore((s) => s.config.features.visitorThemeToggle || s.isOwner);
  const nav = useNavItems(widgets).slice(0, 5);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = nav.map((n) => document.getElementById(`w-${n.id}`)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id.slice(2));
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [nav.map((n) => n.id).join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const heroText = ed.heroText || g.name || g.siteTitle;
  const statement = g.description;
  const invert = () => ui.setThemeOverride(ui.resolvedTheme === "light" ? "dark" : "light");

  const actions = (
    <>
      {config.features.commandPalette && (
        <button onClick={() => ui.setPaletteOpen(true)} className="ed-link">
          {L("Suche", "Search")}
        </button>
      )}
      {isOwner && user && (
        <>
          <button onClick={() => ui.setEditMode(!ui.editMode)} className="ed-link">
            {ui.editMode ? L("Fertig", "Done") : L("Bearbeiten", "Edit")}
          </button>
          <button onClick={() => ui.openSettings()} className="ed-link" aria-label={L("Einstellungen", "Settings")}>
            {L("Einstellungen", "Settings")}
          </button>
        </>
      )}
    </>
  );

  return (
    <div className={cn("editorial relative flex min-h-dvh flex-col", ed.grayscaleImages && "ed-gray")}>
      {ed.showGridLines && <div className="ed-lines" aria-hidden />}
      {ed.showCursor && config.appearance.animationSpeed > 0 && <CursorDot />}

      <div className="px-[var(--page-pad)] pt-[calc(var(--page-pad)*0.5)]">{heroText && <Hero text={heroText} />}</div>

      <nav aria-label="Main" className="ed-nav sticky top-0 z-40 mt-6 px-[var(--page-pad)]">
        <div className="ed-grid items-start py-4">
          <a href="#top" className="col-span-1 -ml-0.5 inline-flex w-fit items-center" aria-label={L("Nach oben", "To top")}>
            <Plus className="size-6" strokeWidth={3.5} />
          </a>
          <div className="col-span-7 flex gap-6 overflow-x-auto lg:col-span-6 lg:grid lg:grid-cols-6 lg:gap-0 lg:overflow-visible">
            {nav.map((n, i) => (
              <a
                key={n.id}
                href={`#w-${n.id}`}
                className={cn("ed-tick relative shrink-0 pb-3 text-[0.95rem] leading-none transition-opacity hover:opacity-100", i === 0 && nav.length <= 4 && "lg:col-span-2", active && active !== n.id ? "opacity-70" : "opacity-100")}
                aria-current={active === n.id ? "location" : undefined}
              >
                {n.label}
                <span className={cn("absolute bottom-0 left-0 h-px bg-fg transition-[width] duration-500", active === n.id ? "w-full" : "w-0")} />
              </a>
            ))}
            <span className="flex shrink-0 gap-4 pl-4 text-[0.95rem] leading-none text-muted lg:hidden">
              {canTheme && (
                <button onClick={invert} className="ed-link">
                  {L("Invertieren", "Invert")}
                </button>
              )}
              {actions}
            </span>
          </div>
          <div className="hidden items-start justify-end gap-4 text-[0.8rem] leading-none lg:col-span-1 lg:flex">{actions}</div>
        </div>
      </nav>

      <section className="ed-grid relative min-h-[62vh] px-[var(--page-pad)] pb-10 pt-8" aria-label={L("Einleitung", "Introduction")}>
        <p className="col-span-8 max-w-56 text-sm leading-snug lg:col-span-2 lg:col-start-2">{ed.tagline}</p>
        {statement && <p className="col-span-8 mt-10 max-w-xl text-3xl leading-[1.12] tracking-[-0.01em] sm:text-4xl lg:col-span-3 lg:col-start-6 lg:mt-0">{statement}</p>}
        <a href="#main" className="absolute bottom-6 hidden items-end gap-3 text-sm lg:flex" style={{ left: "calc(var(--page-pad) + (100% - var(--page-pad) * 2) / 8 * 5)" }}>
          <span className="h-16 w-px bg-fg" aria-hidden /> {L("Scrollen zum Entdecken", "Scroll to discover")}
        </a>
      </section>

      <main id="main" className="w-full flex-1 px-[var(--page-pad)]">
        <WidgetGrid widgets={widgets} config={config} isOwner={isOwner} editMode={editMode} single />
      </main>

      <Footer />

      <div className="no-print fixed bottom-5 left-[var(--page-pad)] z-40 hidden flex-col items-start gap-1 text-[0.8rem] mix-blend-difference lg:flex [&>*]:text-white">
        {canTheme && (
          <button onClick={invert} className="ed-link">
            {L("Farben invertieren", "Invert color")}
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Locale, SiteConfig, WidgetInstance } from "@/lib/config/schema";
import { sendContactMessage } from "@/lib/contact";
import { formatDate, formatTime, hourIn, validTimeZone } from "@/lib/format";
import { bi } from "@/lib/i18n";
import { renderMarkdown } from "@/lib/markdown";
import { cn, safeUrl } from "@/lib/utils";
import { useNow } from "@/hooks/use-now";
import { BrandIcon, platformLabel } from "@/components/brand-icon";
import { WIDGET_COMPONENTS } from "@/widgets/components";
import { getDict } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

/** A light paper surface, independent of the page theme (re-uses the light palette variables). */
export function Paper({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div data-theme="light" className={cn("stage-paper text-fg", className)} style={style}>
      {children}
    </div>
  );
}

/** Deterministic decorative barcode derived from a string. */
export function Barcode({ value, className }: { value: string; className?: string }) {
  const bars = useMemo(() => {
    let h = 2166136261;
    const out: number[] = [];
    for (let i = 0; i < 46; i++) {
      h ^= value.charCodeAt(i % Math.max(1, value.length)) + i;
      h = Math.imul(h, 16777619) >>> 0;
      out.push(1 + (h % 3));
    }
    return out;
  }, [value]);
  let x = 0;
  return (
    <svg viewBox="0 0 140 24" preserveAspectRatio="none" className={cn("h-6 w-full", className)} aria-hidden>
      {bars.map((w, i) => {
        const r = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={24} fill="currentColor" /> : null;
        x += w + 0.6;
        return r;
      })}
    </svg>
  );
}

function Paperclip({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 64" className={cn("h-14 w-5 text-[#9a9a96]", className)} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <path d="M17 18v30a5 5 0 0 1-10 0V12a3.5 3.5 0 0 1 7 0v34a2 2 0 0 1-4 0V18" />
    </svg>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "·";

const profileOf = (c: SiteConfig) => (c.widgets.find((w) => w.type === "profile")?.settings ?? {}) as { role?: string; location?: string; status?: string; statusColor?: string };
const socialOf = (c: SiteConfig) => ((c.widgets.find((w) => w.type === "social" && w.enabled)?.settings.items as { platform: string; url: string }[] | undefined) ?? []).filter((i) => i.url);
const goTo = (c: SiteConfig, type: string) => {
  const w = c.widgets.find((x) => x.type === type && x.enabled);
  if (w) window.location.hash = `w-${w.id}`;
};

/* ------------------------------------------------------------------ */
/* Postcard – profile                                                  */
/* ------------------------------------------------------------------ */

function Postcard({ config, locale }: { config: SiteConfig; locale: Locale }) {
  const g = config.general;
  const p = profileOf(config);
  const social = socialOf(config);
  const avatar = safeUrl(g.avatar);
  const now = useNow(60_000);
  return (
    <div className="relative w-[min(600px,92vw)] -rotate-[1.2deg] rounded-[7px] bg-[#363635] p-5 text-[#ecebe6] shadow-[0_40px_80px_-30px_rgba(0,0,0,.8)] sm:p-6">
      <Paperclip className="absolute -top-7 left-10 rotate-6" />
      <div className="flex gap-5 sm:gap-7">
        <div className="stage-stamp shrink-0">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={g.name} className="h-40 w-32 object-cover grayscale sm:h-48 sm:w-40" />
          ) : (
            <div className="grid h-40 w-32 place-items-center bg-[#d9d8d3] font-heading text-4xl font-semibold text-[#2a2a2a] sm:h-48 sm:w-40">{initials(g.name)}</div>
          )}
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col">
          <svg viewBox="0 0 160 60" className="absolute -right-1 -top-1 h-14 w-40 text-white/25" fill="none" stroke="currentColor" aria-hidden>
            <circle cx="30" cy="30" r="22" />
            <circle cx="30" cy="30" r="15" />
            {[0, 8, 16, 24, 32].map((y) => (
              <path key={y} d={`M58 ${14 + y} q12 -6 24 0 t24 0 t24 0 t24 0`} />
            ))}
          </svg>
          <div className="mt-14 space-y-2">
            {p.status && <span className="inline-block rounded-[3px] bg-[var(--c-accent-raw)] px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-black">{p.status}</span>}
            {p.role && <p className="font-mono text-[0.72rem] uppercase tracking-wider text-white/60">{p.role}</p>}
            {social.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-1">
                {social.slice(0, 6).map((s, i) => (
                  <a key={i} href={safeUrl(s.platform === "email" && !s.url.startsWith("mailto:") ? `mailto:${s.url}` : s.url)} target="_blank" rel="noopener noreferrer" aria-label={platformLabel(s.platform)} className="text-white/70 hover:text-white">
                    <BrandIcon platform={s.platform} className="size-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="mt-auto pt-6">
            {config.widgets.some((w) => w.type === "about" && w.enabled) && (
              <button onClick={() => goTo(config, "about")} className="rounded-[4px] bg-[#ecebe6] px-3 py-1.5 text-xs font-medium text-[#1d1d1d] hover:bg-white">
                {bi(locale, "Über mich", "About me")}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/55">
        <span className="truncate">{g.name}</span>
        <span className="truncate" suppressHydrationWarning>
          {p.location || g.timezone.split("/").pop()?.replace(/_/g, " ")}
          {now ? ` · ${formatTime(now, g, undefined, false)}` : ""}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ID badge – greeting                                                 */
/* ------------------------------------------------------------------ */

function Badge({ widget, config, locale }: { widget: WidgetInstance; config: SiteConfig; locale: Locale }) {
  const g = config.general;
  const p = profileOf(config);
  const t = getDict(locale);
  const now = useNow(60_000);
  const h = now ? hourIn(now, g.timezone) : -1;
  const word = h < 0 ? t.greeting.welcome : h < 5 ? t.greeting.night : h < 11 ? t.greeting.morning : h < 18 ? t.greeting.day : h < 22 ? t.greeting.evening : t.greeting.night;
  const sub = String(widget.settings.message || "") || g.description;
  return (
    <div className="stage-swing relative -mt-24 flex flex-col items-center">
      <div className="stage-strap h-[34vh] w-7" aria-hidden />
      <div className="relative -mt-1 h-7 w-12 rounded-b-md bg-gradient-to-b from-[#8b8b88] to-[#5d5d5a]" aria-hidden />
      <Paper className="relative -mt-1 w-[min(300px,80vw)] rounded-[14px] p-5 shadow-[0_40px_70px_-25px_rgba(0,0,0,.85)]">
        <div className="mx-auto mb-4 h-2 w-14 rounded-full bg-black/15" aria-hidden />
        <div className="grid size-14 place-items-center rounded-[12px] bg-[#1d1d1d] font-heading text-xl font-semibold text-[var(--c-accent-raw)]">{initials(g.name)}</div>
        <h1 className="mt-6 font-heading text-[1.7rem] font-semibold leading-tight tracking-tight">{g.name || g.siteTitle}</h1>
        {p.role && <p className="mt-0.5 font-mono text-[0.68rem] uppercase tracking-wider text-muted">{p.role}</p>}
        <p className="mt-4 text-sm text-muted" suppressHydrationWarning>
          {word}
          {sub ? ` — ${sub}` : ""}
        </p>
        <div className="mt-6 flex items-end justify-between gap-4 font-mono text-[0.6rem] uppercase tracking-wider text-muted">
          <span>
            ID · {g.username || "guest"}
            <br />
            {now ? formatDate(now, { ...g, dateFormat: "medium" }) : " "}
          </span>
          <Barcode value={g.name + g.username} className="w-24 text-fg" />
        </div>
      </Paper>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Telemetry – clock                                                   */
/* ------------------------------------------------------------------ */

function Telemetry({ widget, config, locale }: { widget: WidgetInstance; config: SiteConfig; locale: Locale }) {
  const g = config.general;
  const tz = validTimeZone(String(widget.settings.timezone || "")) || g.timezone;
  const now = useNow(1000);
  const weather = config.widgets.find((w) => w.type === "weather")?.settings as { latitude?: number; longitude?: number; location?: string } | undefined;
  const lat = weather?.latitude;
  const lon = weather?.longitude;
  const pos = lat || lon ? `${Math.abs(lat!).toFixed(2)}°${lat! >= 0 ? "N" : "S"} / ${Math.abs(lon!).toFixed(2)}°${lon! >= 0 ? "E" : "W"}` : "—";
  const sec = now ? now.getSeconds() : 0;
  const offset = now ? new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(now).find((x) => x.type === "timeZoneName")?.value : "";
  const rows: [string, string][] = [
    [bi(locale, "Zeit", "Time"), now ? formatTime(now, { ...g, showSeconds: true }, tz, true) : "--:--:--"],
    [bi(locale, "Datum", "Date"), now ? formatDate(now, { ...g, dateFormat: "medium" }, tz) : "—"],
    ["TZ", `${tz.split("/").pop()?.replace(/_/g, " ")} ${offset ?? ""}`],
    ["POS", pos],
  ];
  return (
    <div className="w-[min(420px,92vw)] rounded-[8px] border border-white/10 bg-[#2b2b2b] p-4 font-mono text-[0.7rem] uppercase tracking-wider text-[#d7d6d1] shadow-[0_30px_60px_-25px_rgba(0,0,0,.8)]">
      <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
        <span>
          Telemetry : <span className="text-[#7ddc8a]">Live</span>
        </span>
        <span className="size-1.5 animate-pulse rounded-full bg-[#7ddc8a]" />
      </div>
      <dl className="grid grid-cols-[5.5rem_1fr] gap-y-1.5" suppressHydrationWarning>
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-white/40">{k}</dt>
            <dd className="tabular">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[3px]" aria-hidden>
        {Array.from({ length: 180 }, (_, i) => {
          const col = i % 30;
          const row = Math.floor(i / 30);
          const lit = col < sec / 2 && (row + col) % 3 !== 0;
          return <span key={i} className={cn("aspect-square rounded-full", lit ? "bg-[#d7d6d1]" : "bg-white/[0.07]")} />;
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Book + reader – about / markdown                                    */
/* ------------------------------------------------------------------ */

function Book({ widget, config, locale, number, title }: { widget: WidgetInstance; config: SiteConfig; locale: Locale; number: number; title: string }) {
  const [open, setOpen] = useState(false);
  const content = String(widget.settings.content ?? "");
  const html = useMemo(() => renderMarkdown(content), [content]);
  const headings = useMemo(() => content.split("\n").filter((l) => /^#{1,3}\s/.test(l)).map((l) => l.replace(/^#+\s*/, "")), [content]);
  const body = useRef<HTMLDivElement>(null);
  const firstLine = content.replace(/[#*_`>\[\]]/g, "").trim().split("\n")[0]?.slice(0, 90);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);
  return (
    <>
      <button onClick={() => setOpen(true)} className="stage-book group" aria-label={`${title} – ${bi(locale, "lesen", "read")}`}>
        <span className="stage-book-inner">
          <Paper className="stage-book-cover flex h-full flex-col p-5 text-left">
            <span className="flex justify-between font-mono text-[0.58rem] uppercase tracking-wider text-muted">
              <span>{config.general.name || config.general.siteTitle}</span>
              <span>{bi(locale, "Text", "Text")}</span>
            </span>
            <span className="mt-auto font-heading text-[5.5rem] font-semibold leading-none tracking-[-0.06em]">{String(number).padStart(2, "0")}</span>
            <span className="mt-2 text-sm font-medium">{title}</span>
            {firstLine && <span className="mt-1 line-clamp-2 text-[0.7rem] text-muted">{firstLine}</span>}
            <span className="mt-auto flex items-center justify-between pt-4 font-mono text-[0.58rem] uppercase tracking-wider text-muted">
              <span className="rounded-[3px] border border-black/20 px-1.5 py-0.5">{bi(locale, "Lesen", "Read")}</span>
              <span>{Math.max(1, Math.round(content.split(/\s+/).length / 200))} min</span>
            </span>
          </Paper>
          <span className="stage-book-pages" aria-hidden />
          <span className="stage-book-ribbon" aria-hidden />
        </span>
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div className="fixed inset-0 z-[85] flex justify-center overflow-y-auto bg-black/50 px-4 py-16 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
                {headings.length > 1 && (
                  <nav className="sticky top-16 mr-6 hidden h-fit w-56 rounded-[8px] border border-white/10 bg-[#2b2b2b] p-2 font-mono text-[0.62rem] uppercase tracking-wider text-white/70 xl:block" onClick={(e) => e.stopPropagation()}>
                    <p className="px-2 py-1.5 text-white/40">{bi(locale, "Inhalt", "Contents")}</p>
                    {headings.map((h, i) => (
                      <button key={i} className="block w-full truncate rounded-[5px] px-2 py-1.5 text-left hover:bg-white/10" onClick={() => body.current?.querySelectorAll("h2,h3,h4")[i]?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                        • {h}
                      </button>
                    ))}
                  </nav>
                )}
                <motion.article
                  role="dialog"
                  aria-modal="true"
                  aria-label={title}
                  initial={{ y: 40, opacity: 0, rotateX: 8 }}
                  animate={{ y: 0, opacity: 1, rotateX: 0 }}
                  exit={{ y: 30, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 30 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative h-fit w-full max-w-2xl rounded-[6px] bg-[#333332] px-6 py-10 text-[#e9e8e3] shadow-2xl sm:px-14"
                >
                  <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-[5px] p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label={bi(locale, "Schließen", "Close")}>
                    <X className="size-4" />
                  </button>
                  <p className="font-mono text-[0.62rem] uppercase tracking-wider text-white/40">
                    {config.general.name} / {String(number).padStart(2, "0")}
                  </p>
                  <h2 className="mt-4 font-heading text-4xl font-semibold tracking-tight">{title}</h2>
                  <div ref={body} className="md mt-8 text-[1.02rem] [--fg:#e9e8e3] [--fg-muted:#b5b4ae] [--surface-2:rgba(255,255,255,.05)] [--surface-3:rgba(255,255,255,.09)]" dangerouslySetInnerHTML={{ __html: html }} />
                </motion.article>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Wheel – projects                                                    */
/* ------------------------------------------------------------------ */

type Project = { title?: string; description?: string; image?: string; url?: string; repo?: string; tags?: string[] | string; year?: string };
const tagsOf = (t: Project["tags"]) => (Array.isArray(t) ? t : typeof t === "string" ? t.split(",") : []).map((x) => x.trim()).filter(Boolean);

function Wheel({ widget, config, locale }: { widget: WidgetInstance; config: SiteConfig; locale: Locale }) {
  const items = ((widget.settings.items as Project[]) ?? []).filter((p) => p.title);
  const [sel, setSel] = useState(0);
  const [mode, setMode] = useState<"wheel" | "list" | "grid">("wheel");
  const lock = useRef(0);
  const cur = items[Math.min(sel, items.length - 1)];
  const Grid = WIDGET_COMPONENTS.projects;
  if (!items.length) return <Sheet widget={widget} config={config} locale={locale} number={0} title="" />;
  const step = (d: number) => setSel((s) => Math.min(items.length - 1, Math.max(0, s + d)));
  const img = cur ? safeUrl(cur.image) : "";
  const href = cur ? safeUrl(cur.url) || safeUrl(cur.repo) : "";
  return (
    <div className="flex w-full max-w-6xl flex-col items-center gap-6">
      {mode === "grid" ? (
        <Paper className="max-h-[70vh] w-full overflow-y-auto rounded-[6px] p-6">
          <Grid widget={widget} config={config} locale={locale} isOwner={false} editMode={false} />
        </Paper>
      ) : mode === "list" ? (
        <ul className="stage-line w-full max-w-3xl divide-y divide-[color-mix(in_srgb,var(--fg)_12%,transparent)] border-y">
          {items.map((p, i) => (
            <li key={i}>
              <a href={safeUrl(p.url) || safeUrl(p.repo) || undefined} target="_blank" rel="noopener noreferrer" className="group flex items-baseline gap-4 py-4 text-fg">
                <span className="w-8 font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 text-2xl tracking-tight group-hover:translate-x-1 transition">{p.title}</span>
                <span className="font-mono text-xs text-muted">{p.year}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid w-full items-center gap-8 md:grid-cols-[1.2fr_1fr]">
          <div
            className="relative h-[62vh] overflow-hidden outline-none"
            tabIndex={0}
            role="listbox"
            aria-label={bi(locale, "Projekte", "Projects")}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") (e.preventDefault(), step(1));
              if (e.key === "ArrowUp") (e.preventDefault(), step(-1));
            }}
            onWheel={(e) => {
              const t = Date.now();
              if (t - lock.current < 140) return;
              lock.current = t;
              step(e.deltaY > 0 ? 1 : -1);
            }}
          >
            {items.map((p, i) => {
              const d = i - sel;
              const a = (d * 7 * Math.PI) / 180;
              const R = 620;
              const x = R * Math.cos(a) - R;
              const y = R * Math.sin(a);
              const active = d === 0;
              return (
                <button
                  key={i}
                  role="option"
                  aria-selected={active}
                  onClick={() => setSel(i)}
                  className="absolute left-6 top-1/2 flex origin-left items-center gap-3 whitespace-nowrap text-left transition-[transform,opacity,color] duration-500 ease-[cubic-bezier(.2,.8,.2,1)]"
                  style={{ transform: `translate(${x}px, calc(${y}px - 50%)) rotate(${(a * 180) / Math.PI}deg)`, opacity: Math.abs(d) > 6 ? 0 : 1 - Math.abs(d) * 0.13 }}
                >
                  <span className={cn("text-[2.1rem] leading-none tracking-tight sm:text-[2.5rem]", active ? "text-fg" : "text-muted")}>{p.title}</span>
                  {active && tagsOf(p.tags).length > 0 && (
                    <span className="flex gap-1">
                      {tagsOf(p.tags).slice(0, 2).map((t) => (
                        <span key={t} className="rounded-[3px] bg-[color-mix(in_srgb,var(--fg)_10%,transparent)] px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-muted">
                          {t}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={sel} initial={{ opacity: 0, y: 12, rotate: 1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-[8px] border-[6px] border-[#1c1c1c] bg-[#1c1c1c] shadow-2xl">
              <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[3px] bg-[#2f2f2e]">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="size-full object-cover" />
                ) : (
                  <span className="font-heading text-6xl font-semibold text-white/15">{cur?.title?.charAt(0)}</span>
                )}
              </div>
              <div className="space-y-2 p-4 text-[#e9e8e3]">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">{cur?.title}</p>
                  <span className="font-mono text-[0.65rem] text-white/40">{cur?.year}</span>
                </div>
                {cur?.description && <p className="text-sm text-white/60">{cur.description}</p>}
                {href && (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-wider text-[var(--c-accent-raw)] hover:underline">
                    {bi(locale, "Öffnen", "Open")} <ArrowUpRight className="size-3" />
                  </a>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
      <div className="flex stage-line rounded-[6px] border bg-[color-mix(in_srgb,var(--fg)_6%,transparent)] p-0.5 font-mono text-[0.6rem] uppercase tracking-wider" role="radiogroup" aria-label="View">
        {(["list", "wheel", "grid"] as const).map((m) => (
          <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={cn("rounded-[4px] px-3 py-1.5", mode === m ? "bg-[color-mix(in_srgb,var(--fg)_14%,transparent)] text-fg" : "text-muted hover:text-fg")}>
            {m === "list" ? bi(locale, "Liste", "List") : m === "wheel" ? bi(locale, "Rad", "Wheel") : bi(locale, "Raster", "Grid")}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Letter – contact                                                    */
/* ------------------------------------------------------------------ */

function Letter({ widget, config, locale }: { widget: WidgetInstance; config: SiteConfig; locale: Locale }) {
  const g = config.general;
  const p = profileOf(config);
  const email = String(widget.settings.email ?? "");
  const topics = locale === "de" ? ["Neues Projekt", "Zusammenarbeit", "Einfach Hallo"] : ["New business", "A collaboration", "Just a hello"];
  const [topic, setTopic] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");
  const renderedAt = useRef(Date.now());
  const now = useNow(60_000);
  const first = g.name.split(" ")[0] || g.siteTitle;
  const line = "w-full border-0 border-b border-dashed border-black/25 bg-transparent px-0 py-1 outline-none placeholder:text-black/35 focus:border-black";
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    try {
      await sendContactMessage({
        name: String(f.get("name") ?? ""),
        email: String(f.get("email") ?? ""),
        subject: `${topics[topic]}${f.get("via") ? ` · ${f.get("via")}` : ""}`,
        message: String(f.get("message") ?? ""),
        website: String(f.get("website") ?? ""),
        renderedAt: renderedAt.current,
      });
      setState("sent");
    } catch (x) {
      setErr((x as Error).message);
      setState("error");
    }
  };
  const status = state === "sent" ? bi(locale, "Gesendet", "Sent") : bi(locale, "Entwurf", "Draft");
  return (
    <div className="relative w-[min(640px,94vw)] pt-6">
      <Paper className="relative max-h-[74vh] overflow-y-auto rounded-[2px] px-6 py-9 font-mono text-[0.78rem] leading-relaxed shadow-[0_40px_80px_-30px_rgba(0,0,0,.85)] sm:px-12">
        <div className="flex items-center gap-4 border-b border-black/15 pb-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-black/70 text-[0.7rem] font-bold">{initials(g.name)}</span>
          <div className="min-w-0 uppercase tracking-wider">
            <p className="font-sans text-sm font-semibold normal-case tracking-normal">{g.name || g.siteTitle}</p>
            {p.role && <p className="text-[0.62rem] text-black/55">{p.role}</p>}
            {email && <p className="text-[0.62rem] text-black/55">{email}</p>}
          </div>
        </div>
        {state === "sent" ? (
          <div className="py-16 text-center">
            <p className="inline-block -rotate-6 rounded-[4px] border-4 border-[var(--c-accent-raw)] px-4 py-2 text-2xl font-bold uppercase tracking-widest text-[var(--c-accent-raw)]">{status}</p>
            <p className="mt-6 text-black/60">{String(widget.settings.successMessage || "") || getDict(locale).contact.success}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 pt-5">
            <p className="text-black/55" suppressHydrationWarning>{now ? formatDate(now, { ...g, dateFormat: "medium" }) : " "}</p>
            <p className="text-base">{locale === "de" ? `Hallo ${first},` : `Dear ${first},`}</p>
            <fieldset className="flex flex-wrap gap-x-5 gap-y-1">
              <legend className="sr-only">{bi(locale, "Anliegen", "Topic")}</legend>
              <span className="text-black/45">{bi(locale, "re", "re")} :</span>
              {topics.map((t, i) => (
                <button type="button" key={t} role="radio" aria-checked={topic === i} onClick={() => setTopic(i)} className="hover:underline">
                  [{topic === i ? "X" : " "}] {t}
                </button>
              ))}
            </fieldset>
            <label className="flex items-baseline gap-3">
              <span className="w-14 shrink-0 text-black/45">{bi(locale, "von", "from")} :</span>
              <input name="email" type="email" required maxLength={200} placeholder={bi(locale, "deine@adresse.de", "you@studio.com")} className={line} autoComplete="email" />
            </label>
            <label className="flex items-baseline gap-3">
              <span className="w-14 shrink-0 text-black/45">{bi(locale, "über", "via")} :</span>
              <input name="via" maxLength={120} placeholder={bi(locale, "Empfehlung, Suche … (optional)", "A friend, a search … (optional)")} className={line} />
            </label>
            <label className="block">
              <span className="text-black/45">{bi(locale, "Worum geht es?", "What are we making?")}</span>
              <textarea name="message" required minLength={5} maxLength={5000} rows={6} className="stage-ruled mt-1 w-full resize-none bg-transparent outline-none" />
            </label>
            <p>{bi(locale, "Viele Grüße,", "Sincerely,")}</p>
            <label className="block">
              <span className="sr-only">{bi(locale, "Name", "Name")}</span>
              <input name="name" required maxLength={120} placeholder={bi(locale, "Dein Name (Unterschrift)", "Your name (signature)")} className={cn(line, "font-[cursive] text-base")} autoComplete="name" />
            </label>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] size-px opacity-0" aria-hidden />
            {state === "error" && (
              <p className="text-red-700" role="alert">
                {getDict(locale).contact.error} {err && `(${err})`}
              </p>
            )}
            <div className="flex items-center justify-between gap-3 pt-4 text-[0.6rem] uppercase tracking-wider text-black/45">
              <span>{bi(locale, "Eine Antwort. Kein Newsletter.", "One reply. No newsletter.")}</span>
              <button type="submit" disabled={state === "sending"} className="rounded-[3px] bg-[#1b1b1b] px-3 py-1.5 font-mono text-[0.68rem] normal-case tracking-normal text-white hover:bg-black disabled:opacity-50">
                {state === "sending" ? "…" : bi(locale, "Absenden ↗", "Send it ↗")}
              </button>
            </div>
          </form>
        )}
      </Paper>
      <div className="absolute -right-2 top-0 hidden w-52 rotate-[4deg] sm:block md:-right-16">
        <Paperclip className="absolute -top-6 left-4 z-10 -rotate-12" />
        <Paper className="stage-ticket p-4 pt-5 font-mono text-[0.58rem] uppercase tracking-wider shadow-xl">
          <p className="text-[0.7rem] font-bold">
            {(g.name || g.siteTitle).split(" ")[0]} · {bi(locale, "Post", "Mail")}
          </p>
          <dl className="mt-3 grid grid-cols-[4.5rem_1fr] gap-y-1 text-black/60">
            <dt>{bi(locale, "An", "To")}</dt>
            <dd className="truncate text-black">{g.name}</dd>
            <dt>{bi(locale, "Betreff", "Re")}</dt>
            <dd className="truncate text-black">{topics[topic]}</dd>
            <dt>Status</dt>
            <dd className={state === "sent" ? "text-[var(--c-accent-raw)]" : "text-black"}>{status}</dd>
          </dl>
          <Barcode value={g.name + topics[topic]} className="mt-3 text-black" />
          <p className="mt-1 text-black/45">{bi(locale, "Bitte aufbewahren", "Keep this half")}</p>
        </Paper>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sheet – every other widget                                          */
/* ------------------------------------------------------------------ */

function Sheet({ widget, config, locale, number, title }: { widget: WidgetInstance; config: SiteConfig; locale: Locale; number: number; title: string }) {
  const Comp = WIDGET_COMPONENTS[widget.type];
  return (
    <Paper className="relative max-h-[72vh] w-[min(760px,94vw)] rotate-[-0.4deg] overflow-y-auto rounded-[3px] p-6 shadow-[0_40px_80px_-30px_rgba(0,0,0,.85)] sm:p-9">
      <div className="mb-6 flex items-center justify-between border-b border-black/15 pb-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-black/55">
        <span>
          {bi(locale, "Akte", "File")} {String(number).padStart(2, "0")}
        </span>
        <span className="truncate pl-4">{title}</span>
      </div>
      {Comp && <Comp widget={widget} config={config} locale={locale} isOwner={false} editMode={false} />}
    </Paper>
  );
}

/* ------------------------------------------------------------------ */

export function StageObject({ widget, config, locale, index, title, objects, isOwner }: { widget: WidgetInstance; config: SiteConfig; locale: Locale; index: number; title: string; objects: boolean; isOwner: boolean }) {
  const n = index + 1;
  if (objects) {
    if (widget.type === "profile") return <Postcard config={config} locale={locale} />;
    if (widget.type === "greeting") return <Badge widget={widget} config={config} locale={locale} />;
    if (widget.type === "clock") return <Telemetry widget={widget} config={config} locale={locale} />;
    if (widget.type === "about" || (widget.type === "custom" && widget.settings.kind === "markdown")) return <Book widget={widget} config={config} locale={locale} number={n} title={title} />;
    if (widget.type === "projects") return <Wheel widget={widget} config={config} locale={locale} />;
    if (widget.type === "contact") return <Letter widget={widget} config={config} locale={locale} />;
  }
  // Interactive owner widgets (notes, todos) keep their owner capabilities.
  if (isOwner && (widget.type === "notes" || widget.type === "todo")) {
    const Comp = WIDGET_COMPONENTS[widget.type];
    return (
      <Paper className="w-[min(560px,94vw)] rounded-[3px] p-7 shadow-2xl">
        <p className="mb-5 border-b border-black/15 pb-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-black/55">{title}</p>
        <Comp widget={widget} config={config} locale={locale} isOwner editMode={false} />
      </Paper>
    );
  }
  return <Sheet widget={widget} config={config} locale={locale} number={n} title={title} />;
}

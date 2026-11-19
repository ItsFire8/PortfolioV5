"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { safeUrl } from "@/lib/utils";
import { EmptyState } from "./shared";
import type { WidgetProps } from "./types";

type Img = { src?: string; caption?: string; alt?: string };
type S = { columns: number; aspect: "square" | "landscape" | "portrait"; images: Img[] };

export default function Gallery({ widget }: WidgetProps<S>) {
  const s = widget.settings;
  const images = s.images.filter((i) => safeUrl(i.src));
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + images.length) % images.length)), [images.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  if (!images.length) return <EmptyState widgetId={widget.id} />;
  const aspect = { square: "aspect-square", landscape: "aspect-[4/3]", portrait: "aspect-[3/4]" }[s.aspect] ?? "aspect-square";
  const cur = open !== null ? images[open] : null;
  return (
    <>
      <ul className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(6, s.columns))}, minmax(0,1fr))` }}>
        {images.map((img, i) => (
          <li key={i}>
            <button onClick={() => setOpen(i)} className={`group relative block w-full overflow-hidden rounded-ui ${aspect}`} aria-label={img.alt || img.caption || `Image ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={safeUrl(img.src)} alt={img.alt || img.caption || ""} loading="lazy" decoding="async" className="size-full object-cover transition duration-500 group-hover:scale-105" />
            </button>
          </li>
        ))}
      </ul>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {cur && (
              <motion.div role="dialog" aria-modal="true" className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
                <motion.figure key={open} initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={safeUrl(cur.src)} alt={cur.alt || cur.caption || ""} className="max-h-[82dvh] w-auto rounded-lg object-contain" />
                  {cur.caption && <figcaption className="mt-3 text-center text-sm text-white/80">{cur.caption}</figcaption>}
                </motion.figure>
                <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setOpen(null)} aria-label="Close">
                  <X className="size-5" />
                </button>
                {images.length > 1 && (
                  <>
                    <button className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={(e) => (e.stopPropagation(), step(-1))} aria-label="Previous">
                      <ChevronLeft className="size-6" />
                    </button>
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={(e) => (e.stopPropagation(), step(1))} aria-label="Next">
                      <ChevronRight className="size-6" />
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

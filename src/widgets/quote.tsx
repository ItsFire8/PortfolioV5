"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Quote as QuoteIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "./shared";
import type { WidgetProps } from "./types";

type S = { mode: "daily" | "random" | "rotate"; interval: number; items: { text?: string; author?: string }[] };

export default function Quote({ widget }: WidgetProps<S>) {
  const s = widget.settings;
  const items = s.items.filter((q) => q.text);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!items.length) return;
    if (s.mode === "daily") {
      const d = new Date();
      const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
      setIndex(day % items.length);
    } else setIndex(Math.floor(Math.random() * items.length));
    if (s.mode !== "rotate") return;
    const t = setInterval(() => setIndex((i) => ((i ?? 0) + 1) % items.length), Math.max(5, s.interval) * 1000);
    return () => clearInterval(t);
  }, [items.length, s.mode, s.interval]);

  if (!items.length) return <EmptyState widgetId={widget.id} />;
  const q = items[(index ?? 0) % items.length];
  return (
    <figure className="relative flex h-full flex-col justify-center">
      <QuoteIcon className="pointer-events-none absolute -right-1 -top-2 size-14 text-primary opacity-10" aria-hidden />
      <AnimatePresence mode="wait">
        <motion.div key={index ?? -1} initial={{ opacity: 0, y: 6 }} animate={{ opacity: index === null ? 0 : 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
          <blockquote className="pr-8 font-heading text-lg font-medium leading-snug sm:text-xl">„{q.text}“</blockquote>
          {q.author && <figcaption className="mt-3 text-sm text-muted">— {q.author}</figcaption>}
        </motion.div>
      </AnimatePresence>
    </figure>
  );
}

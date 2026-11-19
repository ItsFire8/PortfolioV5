"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, useState, type ReactNode } from "react";
import { cn, safeUrl } from "@/lib/utils";
import { useConfigStore } from "@/store/config-store";

/** Scroll effects are skipped for "reduce motion" users and when animation speed is 0. */
export function useMotionOK() {
  const reduced = useReducedMotion();
  const speed = useConfigStore((s) => s.config.appearance.animationSpeed);
  return !reduced && speed > 0;
}

/* ------------------------------------------------------------------ */
/* Text that "inks in" word by word while it scrolls through the view */
/* ------------------------------------------------------------------ */

function ScrubWord({ progress, range, children }: { progress: MotionValue<number>; range: [number, number]; children: ReactNode }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return <motion.span style={{ opacity }}>{children}</motion.span>;
}

export function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const ok = useMotionOK();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.92", "end 0.5"] });
  if (!ok) return <p className={className}>{text}</p>;
  const parts = text.split(/(\s+)/);
  const words = parts.filter((p) => p.trim()).length;
  let n = 0;
  return (
    <p ref={ref} className={className} aria-label={text}>
      {parts.map((p, i) => {
        if (!p.trim()) return p;
        const k = n++;
        return (
          <ScrubWord key={i} progress={scrollYProgress} range={[k / words, (k + 1) / words]}>
            {p}
          </ScrubWord>
        );
      })}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Section title sliding in horizontally while the section enters      */
/* ------------------------------------------------------------------ */

export function SlideTitle({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const ok = useMotionOK();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 0.45"] });
  const x = useTransform(scrollYProgress, [0, 1], ["14vw", "0vw"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [0, 0.6, 1]);
  return (
    <motion.h2 ref={ref} id={id} className={className} style={ok ? { x, opacity } : undefined}>
      {children}
    </motion.h2>
  );
}

/** Fade-up once when entering the viewport. */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ok = useMotionOK();
  if (!ok) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 48 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -12% 0px" }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Dark word field: a big word ticker, then a tilting field of words   */
/* ------------------------------------------------------------------ */

function FieldRow({ progress, words, i }: { progress: MotionValue<number>; words: string[]; i: number }) {
  const x = useTransform(progress, [0, 1], i % 2 ? ["4%", "-32%"] : ["-32%", "4%"]);
  const row = Array.from({ length: 14 }, (_, j) => words[(i * 3 + j) % words.length]);
  return (
    <motion.div style={{ x }} className="flex shrink-0 gap-12 whitespace-nowrap">
      {row.map((w, j) => (
        <span key={j} className="text-[clamp(1.4rem,2.6vw,2.4rem)] tracking-tight" style={{ opacity: [1, 0.35, 0.6, 0.18, 0.8][(i + j) % 5] }}>
          {w}
        </span>
      ))}
    </motion.div>
  );
}

export function WordField({ words }: { words: string[] }) {
  const ref = useRef<HTMLElement>(null);
  const ok = useMotionOK();
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(p, "change", (v) => setActive(Math.min(words.length - 1, Math.max(0, Math.floor((v / 0.3) * words.length)))));
  const rotate = useTransform(p, [0.18, 1], [0, -26]);
  const rotateX = useTransform(p, [0.18, 1], [0, 34]);
  const scale = useTransform(p, [0.18, 1], [0.95, 1.55]);
  const fieldOpacity = useTransform(p, [0.12, 0.32], [0, 1]);
  const centerOpacity = useTransform(p, [0.22, 0.34], [1, 0]);
  if (!words.length) return null;
  if (!ok)
    return (
      <section className="bg-[#151515] px-[var(--page-pad)] py-32 text-center text-[#ededea]" aria-label={words.join(", ")}>
        <p className="mx-auto max-w-4xl text-4xl leading-tight tracking-tight">{words.join(" · ")}</p>
      </section>
    );
  return (
    <section ref={ref} className="relative bg-[#151515] text-[#ededea]" style={{ height: "300vh" }} aria-label={words.join(", ")}>
      <div className="sticky top-0 flex h-dvh items-center justify-center overflow-hidden [perspective:900px]">
        <motion.div aria-hidden style={{ rotate, rotateX, scale, opacity: fieldOpacity }} className="absolute inset-[-35%] flex flex-col justify-center gap-7">
          {Array.from({ length: 11 }, (_, i) => (
            <FieldRow key={i} progress={p} words={words} i={i} />
          ))}
        </motion.div>
        <motion.div style={{ opacity: centerOpacity }} className="relative z-10 text-center" aria-hidden>
          {[-1, 0, 1].map((o) => {
            const w = words[active + o];
            return (
              <p key={o} className={cn("text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] tracking-tight transition-all duration-500", o === 0 ? "text-[#ededea]" : "text-[#ededea]/25", o === -1 && "-translate-y-1 scale-95")}>
                {w ?? " "}
              </p>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Kinetic manifesto: giant words, line by line, rising out of masks   */
/* ------------------------------------------------------------------ */

export function Manifesto({ lines }: { lines: string[][] }) {
  const ref = useRef<HTMLElement>(null);
  const ok = useMotionOK();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(lines.length - 1, Math.floor(v * lines.length * 0.999))));
  if (!lines.length) return null;
  const big = "font-heading text-[clamp(3.5rem,14vw,15rem)] font-semibold uppercase leading-[0.84] tracking-[-0.045em]";
  if (!ok)
    return (
      <section className="space-y-4 px-[var(--page-pad)] py-24">
        {lines.map((l, i) => (
          <p key={i} className={big}>
            {l.join(" ")}
          </p>
        ))}
      </section>
    );
  return (
    <section ref={ref} className="relative" style={{ height: `${lines.length * 90 + 60}vh` }} aria-label={lines.map((l) => l.join(" ")).join(" / ")}>
      <div className="sticky top-0 h-dvh overflow-hidden px-[var(--page-pad)]" aria-hidden>
        {lines.map((line, li) => (
          <div key={li} className="absolute inset-x-[var(--page-pad)] top-1/2 flex -translate-y-1/2 flex-wrap items-end justify-between gap-x-[4vw]">
            {line.map((w, wi) => (
              <span key={wi} className="-mt-[0.34em] block overflow-hidden pb-[0.06em] pt-[0.34em] text-[clamp(3.5rem,14vw,15rem)] leading-none" style={{ marginTop: wi % 2 ? "calc(12vh - 0.34em)" : undefined }}>
                <motion.span
                  className={cn(big, "block")}
                  initial={false}
                  animate={{ y: li === active ? "0%" : li < active ? "-140%" : "140%", opacity: li === active ? 1 : 0 }}
                  transition={{ duration: 0.8, ease: [0.7, 0, 0.2, 1], delay: li === active ? wi * 0.09 : 0 }}
                >
                  {w}
                </motion.span>
              </span>
            ))}
          </div>
        ))}
        <span className="absolute bottom-6 right-[var(--page-pad)] font-mono text-xs tabular">
          {String(active + 1).padStart(2, "0")} | {String(lines.length).padStart(2, "0")}
        </span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pinned full-bleed image story (gallery in the editorial template)   */
/* ------------------------------------------------------------------ */

type StoryImage = { src?: string; caption?: string; alt?: string };

/** Scroll offsets must stay inside 0…1 and strictly increase (the browser animation API rejects anything else). */
const span = (a: number, b: number): [number, number] => {
  const lo = Math.min(0.999, Math.max(0, a));
  return [lo, Math.max(lo + 0.001, Math.min(1, b))];
};

function StorySlide({ p, n, i, img }: { p: MotionValue<number>; n: number; i: number; img: StoryImage }) {
  const fade = useTransform(p, span((i - 0.35) / n, i / n), [0, 1]);
  const scale = useTransform(p, span((i - 0.35) / n, (i + 1) / n), [1.18, 1]);
  const captionY = useTransform(p, span((i - 0.2) / n, (i + 0.15) / n), [60, 0]);
  const opacity = i === 0 ? 1 : fade;
  return (
    <motion.figure style={{ opacity }} className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <motion.img src={safeUrl(img.src)} alt={img.alt || img.caption || ""} style={{ scale }} className="no-reveal size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/20" />
      <figcaption className="absolute inset-x-[var(--page-pad)] bottom-[14vh] grid items-end gap-6 text-white md:grid-cols-8">
        {img.caption && (
          <motion.span style={{ y: captionY }} className="font-heading text-[clamp(3rem,8vw,8rem)] leading-none tracking-[-0.04em] md:col-span-4 md:col-start-2">
            {img.caption}
          </motion.span>
        )}
        {img.alt && img.alt !== img.caption && <span className="max-w-xs text-sm leading-snug text-white/75 md:col-span-2 md:col-start-6">{img.alt}</span>}
      </figcaption>
    </motion.figure>
  );
}

export function PinnedStory({ images, label }: { images: StoryImage[]; label: string }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(p, "change", (v) => setActive(Math.min(images.length - 1, Math.floor(v * images.length * 0.999))));
  const n = images.length;
  return (
    <section ref={ref} className="relative -mx-[var(--page-pad)]" style={{ height: `${n * 110 + 40}vh` }} aria-label={label}>
      <div className="sticky top-0 h-dvh overflow-hidden bg-black">
        {images.map((img, i) => (
          <StorySlide key={i} p={p} n={n} i={i} img={img} />
        ))}
        <div className="absolute bottom-6 left-[var(--page-pad)] right-[var(--page-pad)] flex justify-between font-mono text-xs text-white/80">
          <span>{label}</span>
          <span className="tabular">
            {String(active + 1).padStart(2, "0")} | {String(n).padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  );
}

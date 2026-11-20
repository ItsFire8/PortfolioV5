"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";

const GLYPHS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワ0123456789<>/{}=+*#";

/**
 * Interactive background matrix: a grid of dots (or glyphs) that light up around the
 * pointer and fade out with a short trail. Drawn on a single fixed canvas; the render
 * loop only runs while something is still glowing.
 */
export function MouseMatrix() {
  const m = useConfigStore((s) => s.config.appearance.matrix);
  const speed = useConfigStore((s) => s.config.appearance.animationSpeed);
  const theme = useUIStore((s) => s.resolvedTheme);
  const colors = useConfigStore((s) => `${s.config.appearance.primary}${s.config.appearance.accent}${s.config.appearance.mode}`);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !m.enabled) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    const hot = css.getPropertyValue(m.color === "fg" ? "--fg" : m.color === "primary" ? "--primary" : "--accent").trim() || "#888";
    const base = css.getPropertyValue("--fg").trim() || "#888";
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const gap = m.spacing;
    const glyphs = m.style === "glyphs";
    const animate = !reduced && speed > 0;
    const decay = animate ? Math.pow(0.9, speed) : 0;
    let cols = 0, rows = 0, energy = new Float32Array(0), chars: string[] = [];
    let px = -9999, py = -9999, raf = 0, running = false;

    const resize = () => {
      canvas.width = Math.ceil(window.innerWidth * dpr);
      canvas.height = Math.ceil(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      cols = Math.ceil(window.innerWidth / gap) + 1;
      rows = Math.ceil(window.innerHeight / gap) + 1;
      energy = new Float32Array(cols * rows);
      chars = Array.from({ length: cols * rows }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]);
      draw();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (glyphs) {
        ctx.font = `${Math.round(gap * 0.62)}px "JetBrains Mono Variable", ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
      }
      let active = false;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = c * gap + gap / 2;
          const y = r * gap + gap / 2;
          const d = Math.hypot(x - px, y - py);
          const target = d < m.radius ? Math.pow(1 - d / m.radius, 1.6) : 0;
          const e = Math.max(target, energy[i] * decay);
          energy[i] = e < 0.01 ? 0 : e;
          if (e > 0.01) active = true;
          if (glyphs) {
            if (e <= 0.01) continue;
            if (Math.random() < 0.05 * e) chars[i] = GLYPHS[(Math.random() * GLYPHS.length) | 0];
            ctx.globalAlpha = Math.min(1, e * 1.1);
            ctx.fillStyle = e > 0.55 ? hot : base;
            ctx.fillText(chars[i], x, y);
          } else {
            // In the foreground only the area around the pointer is drawn – never over text at rest.
            const idle = m.showIdle && m.layer !== "foreground" ? 0.13 : 0;
            if (e <= 0.01 && !idle) continue;
            ctx.globalAlpha = idle + e * (0.95 - idle);
            ctx.fillStyle = e > 0.08 ? hot : base;
            ctx.beginPath();
            ctx.arc(x, y, 0.9 + e * gap * 0.22, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;
      return active;
    };

    const loop = () => {
      const active = draw();
      if (active) raf = requestAnimationFrame(loop);
      else running = false;
    };
    const kick = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    const move = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      kick();
    };
    const leave = () => {
      px = py = -9999;
      kick();
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [m, speed, theme, reduced, colors]);

  if (!m.enabled) return null;
  return <canvas ref={ref} className={m.layer === "foreground" ? "no-print pointer-events-none fixed inset-0 z-[45]" : "pointer-events-none fixed inset-0 z-[-1]"} aria-hidden />;
}

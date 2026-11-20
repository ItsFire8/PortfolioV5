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
    const network = m.style === "network";
    let posX = new Float32Array(0), posY = new Float32Array(0);
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
      posX = new Float32Array(cols * rows);
      posY = new Float32Array(cols * rows);
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
          if (network) {
            // Parallax: active points are pushed slightly away from the pointer.
            const push = e * gap * 0.45;
            const k = d > 0.001 ? push / d : 0;
            posX[i] = x + (x - px) * k;
            posY[i] = y + (y - py) * k;
            continue;
          }
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
      if (network) drawNetwork();
      ctx.globalAlpha = 1;
      return active;
    };

    /** Lines between every pair of neighbouring active points, then the points on top. */
    const drawNetwork = () => {
      const T = 0.06;
      const idle = m.showIdle && m.layer !== "foreground";
      ctx.lineWidth = 1;
      ctx.strokeStyle = hot;
      // right, down, down-right, down-left neighbours → a triangulated mesh
      const links: [number, number][] = [
        [1, 0],
        [0, 1],
        [1, 1],
        [-1, 1],
      ];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const e = energy[i];
          if (e < T) continue;
          for (const [dc, dr] of links) {
            const cc = c + dc;
            const rr = r + dr;
            if (cc < 0 || cc >= cols || rr >= rows) continue;
            const j = rr * cols + cc;
            const f = energy[j];
            if (f < T) continue;
            ctx.globalAlpha = Math.min(e, f) * (dc && dr ? 0.45 : 0.75);
            ctx.beginPath();
            ctx.moveTo(posX[i], posY[i]);
            ctx.lineTo(posX[j], posY[j]);
            ctx.stroke();
          }
        }
      }
      for (let i = 0; i < energy.length; i++) {
        const e = energy[i];
        if (e < T) {
          if (!idle) continue;
          ctx.globalAlpha = 0.1;
          ctx.fillStyle = base;
          ctx.beginPath();
          ctx.arc((i % cols) * gap + gap / 2, Math.floor(i / cols) * gap + gap / 2, 0.9, 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        ctx.globalAlpha = Math.min(1, 0.35 + e);
        ctx.fillStyle = hot;
        ctx.beginPath();
        ctx.arc(posX[i], posY[i], 1.2 + e * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
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

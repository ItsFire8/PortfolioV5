"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { create } from "zustand";

type Tone = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

const useToasts = create<{ toasts: Toast[]; push: (m: string, t: Tone) => void; drop: (id: number) => void }>((set) => ({
  toasts: [],
  push: (message, tone) => {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, message, tone }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), tone === "error" ? 6000 : 3200);
  },
  drop: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (m: string) => useToasts.getState().push(m, "success"),
  error: (m: string) => useToasts.getState().push(m, "error"),
  info: (m: string) => useToasts.getState().push(m, "info"),
};

export function Toaster() {
  const { toasts, drop } = useToasts();
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[min(92vw,380px)] -translate-x-1/2 flex-col gap-2" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? AlertCircle : Info;
          return (
            <motion.button
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              onClick={() => drop(t.id)}
              className="glass-panel pointer-events-auto flex items-start gap-2.5 rounded-ui px-3.5 py-2.5 text-left text-sm text-fg shadow-xl"
            >
              <Icon className={t.tone === "error" ? "mt-0.5 size-4 shrink-0 text-red-500" : t.tone === "success" ? "mt-0.5 size-4 shrink-0 text-emerald-500" : "mt-0.5 size-4 shrink-0 text-primary"} />
              <span>{t.message}</span>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

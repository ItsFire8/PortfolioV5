import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden p-4">
      <div className="bg-layer anim-aurora" aria-hidden>
        <div className="blob" />
        <div className="blob" />
        <div className="blob" />
      </div>
      <div className="card w-full max-w-sm p-8" data-style="glass" style={{ ["--blur" as string]: "24px" }}>
        <div className="mb-6">
          <div className="mb-5 grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-fg shadow-lg">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
            </svg>
          </div>
          <h1 className="font-heading text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}

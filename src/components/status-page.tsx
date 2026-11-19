import type { ReactNode } from "react";

/** Minimal full-screen status page (maintenance, errors) – server component, no client JS. */
export function StatusPage({ title, text, footer, icon }: { title: string; text: string; footer?: ReactNode; icon?: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--primary-soft),transparent_60%)]" />
      <div className="card max-w-md p-10 text-center" data-style="glass">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary-soft text-2xl text-primary">{icon ?? "⚙"}</div>
        <h1 className="font-heading text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-muted">{text}</p>
        {footer && <div className="mt-8">{footer}</div>}
      </div>
    </main>
  );
}

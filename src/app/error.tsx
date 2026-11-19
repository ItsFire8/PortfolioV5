"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="card max-w-md p-10 text-center" data-style="glass">
        <h1 className="font-heading text-2xl font-semibold">Etwas ist schiefgelaufen · Something went wrong</h1>
        <p className="mt-3 text-muted">Bitte versuche es erneut. · Please try again.</p>
        <button onClick={reset} className="mt-6 rounded-ui bg-primary px-4 py-2 text-sm font-medium text-primary-fg">
          Retry
        </button>
      </div>
    </main>
  );
}

"use client";

import { useT } from "@/hooks/use-i18n";
import { useConfigStore } from "@/store/config-store";

export function Footer() {
  const t = useT();
  const config = useConfigStore((s) => s.config);
  const isOwner = useConfigStore((s) => s.isOwner);
  const f = config.layout.footer;
  if (!f.show) return null;
  const year = new Date().getFullYear();
  return (
    <footer className="no-print mx-auto mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-border px-[var(--page-pad)] py-8 text-sm text-muted" style={{ maxWidth: "calc(var(--max-w) + var(--page-pad) * 2)" }}>
      <p>{f.text || `© ${year} ${config.general.name || config.general.siteTitle}`}</p>
      <nav className="flex items-center gap-4" aria-label="Footer">
        {isOwner ? (
          <a href="/admin" className="hover:text-fg">
            {t.header.admin}
          </a>
        ) : (
          f.showLogin && (
            <a href="/login" className="hover:text-fg" rel="nofollow">
              {t.footer.login}
            </a>
          )
        )}
      </nav>
    </footer>
  );
}

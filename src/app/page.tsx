import type { Metadata } from "next";
import { headers } from "next/headers";
import { AppShell } from "@/components/shell/app-shell";
import { StatusPage } from "@/components/status-page";
import { loadPageData } from "@/lib/server/page-data";
import { getDict } from "@/lib/i18n";
import { safeUrl } from "@/lib/utils";
import { toPublicConfig } from "@/lib/config/normalize";

export async function generateMetadata(): Promise<Metadata> {
  const { fullConfig: c, system } = await loadPageData();
  const g = c.general;
  const title = g.siteTitle || g.name || "Homepage";
  const index = c.seo.indexable && system.allowSearchIndexing && !system.maintenance;
  const og = safeUrl(c.seo.ogImage) || safeUrl(g.avatar);
  return {
    title,
    description: g.description,
    keywords: c.seo.keywords || undefined,
    applicationName: title,
    authors: g.name ? [{ name: g.name }] : undefined,
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    icons: { icon: safeUrl(g.favicon) || "/api/icon", apple: safeUrl(g.favicon) || "/api/icon?size=180" },
    manifest: c.features.pwa ? "/manifest.webmanifest" : undefined,
    openGraph: { title, description: g.description, type: "website", images: og ? [og] : undefined, locale: g.locale === "de" ? "de_DE" : "en_US" },
    twitter: { card: og ? "summary_large_image" : "summary", title, description: g.description },
  };
}

export default async function Home({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const data = await loadPageData();
  const { system, setupNeeded, initialLocale } = data;
  // "?preview=visitor" renders exactly what anonymous visitors get (used by the admin preview).
  const asVisitor = (await searchParams).preview === "visitor";
  const isOwner = data.isOwner && !asVisitor;
  const session = asVisitor ? null : data.session;
  const config = asVisitor ? toPublicConfig(data.fullConfig) : data.config;
  const locale = initialLocale ?? config.general.locale;
  const t = getDict(locale);

  if (system.maintenance && !isOwner)
    return <StatusPage title={t.maintenance.title} text={system.maintenanceMessage || t.maintenance.text} footer={<a href="/login" className="text-xs text-muted hover:text-fg">{t.footer.login}</a>} />;

  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const g = config.general;
  const sameAs = (config.widgets.find((w) => w.type === "social")?.settings.items as { url?: string }[] | undefined)?.map((i) => i.url).filter((u): u is string => !!u && /^https?:/.test(u));
  const jsonLd = g.name
    ? { "@context": "https://schema.org", "@type": "Person", name: g.name, alternateName: g.username || undefined, description: g.description || undefined, image: safeUrl(g.avatar) || undefined, sameAs: sameAs?.length ? sameAs : undefined }
    : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      {setupNeeded && !asVisitor && (
        <div className="relative z-50 flex flex-wrap items-center justify-center gap-3 bg-primary px-4 py-2 text-center text-sm font-medium text-primary-fg">
          {locale === "de" ? "Willkommen! Diese Homepage ist noch nicht eingerichtet." : "Welcome! This homepage has not been set up yet."}
          <a href="/setup" className="rounded-full bg-black/20 px-3 py-0.5 hover:bg-black/30">
            {locale === "de" ? "Jetzt einrichten →" : "Set up now →"}
          </a>
        </div>
      )}
      <AppShell
        config={config}
        isOwner={isOwner}
        csrf={session?.csrf ?? null}
        user={session ? { displayName: session.user.displayName || session.user.username, role: session.user.role } : null}
        statsEnabled={system.statsEnabled && !asVisitor}
        maintenance={system.maintenance}
        initialLocale={initialLocale}
      />
    </>
  );
}

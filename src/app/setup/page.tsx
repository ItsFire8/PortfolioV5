import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SetupForm } from "@/components/auth/setup-form";
import { getDict } from "@/lib/i18n";
import { loadPageData } from "@/lib/server/page-data";

export const metadata: Metadata = { title: "Setup", robots: { index: false, follow: false } };

export default async function SetupPage() {
  const { setupNeeded, fullConfig, initialLocale } = await loadPageData();
  if (!setupNeeded) redirect("/login");
  const locale = initialLocale ?? fullConfig.general.locale;
  const t = getDict(locale).auth;
  return (
    <AuthCard title={t.setupTitle} subtitle={t.setupIntro}>
      <SetupForm t={t} locale={locale} needsToken={!!process.env.SETUP_TOKEN} />
    </AuthCard>
  );
}

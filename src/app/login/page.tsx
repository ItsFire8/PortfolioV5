import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { getDict } from "@/lib/i18n";
import { loadPageData } from "@/lib/server/page-data";

export const metadata: Metadata = { title: "Login", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { session, setupNeeded, fullConfig, initialLocale } = await loadPageData();
  if (setupNeeded) redirect("/setup");
  const sp = await searchParams;
  const next = sp.next && /^\/(?!\/)/.test(sp.next) ? sp.next : "/";
  if (session) redirect(next);
  const t = getDict(initialLocale ?? fullConfig.general.locale).auth;
  return (
    <AuthCard title={t.login} subtitle={fullConfig.general.siteTitle}>
      <LoginForm t={t} next={next} />
    </AuthCard>
  );
}

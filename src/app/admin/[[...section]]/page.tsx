import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import pkg from "../../../../package.json";
import { AdminShell } from "@/components/admin/admin-shell";
import { ADMIN_NAV } from "@/components/admin/admin-nav";
import { Overview } from "@/components/admin/overview";
import { ContentAdmin } from "@/components/admin/content";
import { DesignAdmin } from "@/components/admin/design";
import { MediaAdmin } from "@/components/admin/media";
import { MessagesAdmin } from "@/components/admin/messages";
import { StatsAdmin } from "@/components/admin/stats";
import { UsersAdmin } from "@/components/admin/users";
import { SystemAdmin } from "@/components/admin/system";
import { AccountAdmin } from "@/components/admin/account";
import { can } from "@/lib/server/auth";
import { IS_LOCAL_DB, one } from "@/lib/server/db";
import { getStats } from "@/lib/server/stats";
import { loadPageData } from "@/lib/server/page-data";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { session, fullConfig, system, initialLocale } = await loadPageData();
  const section = (await params).section?.[0] ?? "";
  if (!session) redirect(`/login?next=${encodeURIComponent(`/admin${section ? `/${section}` : ""}`)}`);
  const nav = ADMIN_NAV.find((n) => n.id === section);
  if (!nav || (await params).section?.length && (await params).section!.length > 1) notFound();
  const role = session.user.role;
  const perms = ["content", "media", "users", "system", "messages", "stats"].filter((p) => can(role, p as Parameters<typeof can>[1]));
  if (!perms.includes(nav.perm)) redirect("/admin");
  const locale = initialLocale ?? fullConfig.general.locale;

  let content: React.ReactNode;
  switch (section) {
    case "": {
      const unread = can(role, "messages") ? Number((await one<{ n: number }>("SELECT COUNT(*) AS n FROM messages WHERE is_read = 0"))?.n ?? 0) : 0;
      const media = Number((await one<{ n: number }>("SELECT COUNT(*) AS n FROM media"))?.n ?? 0);
      const st = system.statsEnabled && can(role, "stats") ? await getStats(30) : null;
      content = <Overview stats={{ unread, media, views30: st?.totals.views ?? null, visitors30: st?.totals.visitors ?? null, maintenance: system.maintenance }} />;
      break;
    }
    case "content":
      content = <ContentAdmin />;
      break;
    case "design":
      content = <DesignAdmin />;
      break;
    case "media":
      content = <MediaAdmin />;
      break;
    case "messages":
      content = <MessagesAdmin />;
      break;
    case "stats":
      content = <StatsAdmin enabled={system.statsEnabled} />;
      break;
    case "users":
      content = <UsersAdmin currentUserId={session.user.id} />;
      break;
    case "system":
      content = <SystemAdmin initial={system} info={{ version: pkg.version, storage: IS_LOCAL_DB ? "SQLite (lokal / local)" : "libSQL (remote)" }} />;
      break;
    case "account":
      content = <AccountAdmin user={{ username: session.user.username, displayName: session.user.displayName, email: session.user.email }} />;
      break;
  }

  return (
    <AdminShell config={fullConfig} csrf={session.csrf} user={session.user} section={section} perms={perms} locale={locale}>
      {content}
    </AdminShell>
  );
}

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { toPublicConfig } from "@/lib/config/normalize";
import type { Locale } from "@/lib/config/schema";
import { bootstrapAdminFromEnv, can, getSession, userCount } from "./auth";
import { getActiveConfig } from "./config-repo";
import { getSystemSettings } from "./system";

/** Everything a page render needs – deduplicated per request via React cache(). */
export const loadPageData = cache(async () => {
  await bootstrapAdminFromEnv();
  const [session, active, system, users] = await Promise.all([getSession(), getActiveConfig(), getSystemSettings(), userCount()]);
  const isOwner = !!session && can(session.user.role, "content");
  const cookieLocale = (await cookies()).get("hp-locale")?.value;
  const initialLocale: Locale | null = cookieLocale === "de" || cookieLocale === "en" ? cookieLocale : null;
  return {
    session,
    isOwner,
    // Visitors never receive private/disabled widgets.
    config: isOwner ? active.config : toPublicConfig(active.config),
    fullConfig: active.config,
    system,
    setupNeeded: users === 0,
    initialLocale,
  };
});

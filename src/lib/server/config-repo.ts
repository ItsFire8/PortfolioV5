import "server-only";
import { createDefaultConfig } from "@/lib/config/defaults";
import { normalizeConfig } from "@/lib/config/normalize";
import type { SiteConfig } from "@/lib/config/schema";
import { id } from "./crypto";
import { all, now, one, run } from "./db";

export interface ProfileMeta {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

const toMeta = (r: { id: string; name: string; is_active: number; created_at: number; updated_at: number }): ProfileMeta => ({
  id: r.id,
  name: r.name,
  isActive: Number(r.is_active) === 1,
  createdAt: Number(r.created_at),
  updatedAt: Number(r.updated_at),
});

/** Returns the active configuration profile, creating factory defaults on first run. */
export async function getActiveConfig(): Promise<{ id: string; config: SiteConfig; updatedAt: number }> {
  let row = await one<{ id: string; data: string; updated_at: number }>(
    "SELECT id, data, updated_at FROM config_profiles WHERE is_active = 1 LIMIT 1",
  );
  if (!row) {
    const first = await one<{ id: string }>("SELECT id FROM config_profiles ORDER BY created_at LIMIT 1");
    if (first) {
      await run("UPDATE config_profiles SET is_active = 1 WHERE id = ?", [first.id]);
      return getActiveConfig();
    }
    const locale = (process.env.DEFAULT_LOCALE === "en" ? "en" : "de") as "de" | "en";
    const config = createDefaultConfig(locale);
    if (process.env.DEFAULT_TIMEZONE) config.general.timezone = process.env.DEFAULT_TIMEZONE;
    const pid = id("p");
    await run(
      "INSERT INTO config_profiles (id, name, data, is_active, created_at, updated_at) VALUES (?,?,?,1,?,?)",
      [pid, locale === "de" ? "Standard" : "Default", JSON.stringify(config), now(), now()],
    );
    row = { id: pid, data: JSON.stringify(config), updated_at: now() };
  }
  let config: SiteConfig;
  try {
    config = normalizeConfig(JSON.parse(row.data));
  } catch (e) {
    console.error("[config] stored config invalid, falling back to defaults", e);
    config = createDefaultConfig();
  }
  return { id: row.id, config, updatedAt: Number(row.updated_at) };
}

export async function saveConfig(profileId: string, input: unknown): Promise<{ config: SiteConfig; updatedAt: number }> {
  const config = normalizeConfig(input);
  const t = now();
  const r = await run("UPDATE config_profiles SET data = ?, updated_at = ? WHERE id = ?", [JSON.stringify(config), t, profileId]);
  if (r.rowsAffected === 0) throw new Error("Profile not found");
  return { config, updatedAt: t };
}

export async function listProfiles(): Promise<ProfileMeta[]> {
  return (await all<Parameters<typeof toMeta>[0]>(
    "SELECT id, name, is_active, created_at, updated_at FROM config_profiles ORDER BY created_at",
  )).map(toMeta);
}

export async function createProfile(name: string, data?: unknown): Promise<ProfileMeta> {
  const config = data ? normalizeConfig(data) : (await getActiveConfig()).config;
  const pid = id("p");
  const t = now();
  await run("INSERT INTO config_profiles (id, name, data, is_active, created_at, updated_at) VALUES (?,?,?,0,?,?)", [
    pid,
    name.slice(0, 80),
    JSON.stringify(config),
    t,
    t,
  ]);
  return { id: pid, name, isActive: false, createdAt: t, updatedAt: t };
}

export async function activateProfile(pid: string) {
  const exists = await one("SELECT id FROM config_profiles WHERE id = ?", [pid]);
  if (!exists) return false;
  await run("UPDATE config_profiles SET is_active = CASE WHEN id = ? THEN 1 ELSE 0 END", [pid]);
  return true;
}

export async function renameProfile(pid: string, name: string) {
  await run("UPDATE config_profiles SET name = ? WHERE id = ?", [name.slice(0, 80), pid]);
}

export async function deleteProfile(pid: string) {
  const row = await one<{ is_active: number }>("SELECT is_active FROM config_profiles WHERE id = ?", [pid]);
  if (!row) return false;
  if (Number(row.is_active) === 1) throw new Error("Cannot delete the active profile");
  await run("DELETE FROM config_profiles WHERE id = ?", [pid]);
  return true;
}

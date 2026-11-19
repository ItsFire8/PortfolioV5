import "server-only";
import { normalizeConfig } from "@/lib/config/normalize";
import { id } from "./crypto";
import { all, db, now, one, run } from "./db";
import { getSystemSettings, updateSystemSettings, type SystemSettings } from "./system";

export interface BackupPayload {
  format: "homepage-backup";
  version: 1;
  createdAt: string;
  profiles: { id: string; name: string; data: unknown; isActive: boolean }[];
  widgetData: { widgetId: string; data: unknown }[];
  system: SystemSettings;
}

/** Snapshot of all content (profiles, widget data, system settings). Users and media are not included – see README for full-volume backups. */
export async function buildBackup(): Promise<BackupPayload> {
  const profiles = await all<{ id: string; name: string; data: string; is_active: number }>(
    "SELECT id, name, data, is_active FROM config_profiles ORDER BY created_at",
  );
  const wd = await all<{ widget_id: string; data: string }>("SELECT widget_id, data FROM widget_data");
  return {
    format: "homepage-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    profiles: profiles.map((p) => ({ id: p.id, name: p.name, data: JSON.parse(p.data), isActive: Number(p.is_active) === 1 })),
    widgetData: wd.map((w) => ({ widgetId: w.widget_id, data: JSON.parse(w.data) })),
    system: await getSystemSettings(),
  };
}

export async function storeBackup(name: string) {
  const payload = JSON.stringify(await buildBackup());
  const bid = id("b");
  await run("INSERT INTO backups (id, name, data, size, created_at) VALUES (?,?,?,?,?)", [bid, name.slice(0, 100), payload, payload.length, now()]);
  // keep the latest 30 server-side backups
  await run("DELETE FROM backups WHERE id NOT IN (SELECT id FROM backups ORDER BY created_at DESC LIMIT 30)");
  return bid;
}

export async function listBackups() {
  return (await all<{ id: string; name: string; size: number; created_at: number }>(
    "SELECT id, name, size, created_at FROM backups ORDER BY created_at DESC",
  )).map((b) => ({ id: b.id, name: b.name, size: Number(b.size), createdAt: Number(b.created_at) }));
}

export async function getBackup(bid: string): Promise<BackupPayload | null> {
  const row = await one<{ data: string }>("SELECT data FROM backups WHERE id = ?", [bid]);
  return row ? (JSON.parse(row.data) as BackupPayload) : null;
}

export async function deleteBackup(bid: string) {
  await run("DELETE FROM backups WHERE id = ?", [bid]);
}

/** Validates everything first, then replaces content in a single transaction. */
export async function restoreBackup(input: unknown) {
  const p = input as Partial<BackupPayload>;
  if (!p || p.format !== "homepage-backup" || !Array.isArray(p.profiles) || p.profiles.length === 0)
    throw new Error("Not a valid backup file");
  const profiles = p.profiles.slice(0, 50).map((x, i) => ({
    id: typeof x.id === "string" && /^[\w-]{1,64}$/.test(x.id) ? x.id : id("p"),
    name: String(x.name ?? `Profile ${i + 1}`).slice(0, 80),
    data: JSON.stringify(normalizeConfig(x.data)),
    isActive: !!x.isActive,
  }));
  if (!profiles.some((x) => x.isActive)) profiles[0].isActive = true;
  const widgetData = (Array.isArray(p.widgetData) ? p.widgetData : [])
    .filter((w) => typeof w?.widgetId === "string" && /^[\w-]{1,64}$/.test(w.widgetId))
    .slice(0, 1000)
    .map((w) => ({ widgetId: w.widgetId, data: JSON.stringify(w.data ?? null).slice(0, 1_000_000) }));
  const t = now();
  const tx = await (await db()).transaction("write");
  try {
    await tx.execute("DELETE FROM config_profiles");
    for (const pr of profiles)
      await tx.execute({
        sql: "INSERT INTO config_profiles (id, name, data, is_active, created_at, updated_at) VALUES (?,?,?,?,?,?)",
        args: [pr.id, pr.name, pr.data, pr.isActive ? 1 : 0, t, t],
      });
    await tx.execute("DELETE FROM widget_data");
    for (const w of widgetData)
      await tx.execute({ sql: "INSERT INTO widget_data (widget_id, data, updated_at) VALUES (?,?,?)", args: [w.widgetId, w.data, t] });
    await tx.commit();
  } catch (e) {
    await tx.rollback();
    throw e;
  } finally {
    tx.close();
  }
  if (p.system && typeof p.system === "object") await updateSystemSettings(p.system);
}

import "server-only";
import { all, run } from "./db";

/** Server-only settings. Never part of the public site config. */
export interface SystemSettings {
  maintenance: boolean;
  maintenanceMessage: string;
  statsEnabled: boolean;
  contactEnabled: boolean;
  allowSearchIndexing: boolean;
}

const DEFAULTS: SystemSettings = {
  maintenance: false,
  maintenanceMessage: "",
  statsEnabled: false,
  contactEnabled: true,
  allowSearchIndexing: true,
};

export async function getSystemSettings(): Promise<SystemSettings> {
  const rows = await all<{ key: string; value: string }>("SELECT key, value FROM system");
  const out = { ...DEFAULTS } as Record<string, unknown>;
  for (const r of rows) {
    if (r.key in DEFAULTS) {
      try {
        out[r.key] = JSON.parse(r.value);
      } catch {
        /* ignore corrupted value */
      }
    }
  }
  return out as unknown as SystemSettings;
}

export async function updateSystemSettings(patch: Partial<SystemSettings>): Promise<SystemSettings> {
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in DEFAULTS) || typeof v !== typeof DEFAULTS[k as keyof SystemSettings]) continue;
    await run("INSERT OR REPLACE INTO system (key, value) VALUES (?, ?)", [k, JSON.stringify(typeof v === "string" ? v.slice(0, 1000) : v)]);
  }
  return getSystemSettings();
}

"use client";

import { ArchiveRestore, Check, Download, FileUp, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/hooks/use-i18n";
import { api } from "@/lib/api";
import { normalizeConfig } from "@/lib/config/normalize";
import type { SiteConfig } from "@/lib/config/schema";
import { bi } from "@/lib/i18n";
import { downloadFile, formatBytes } from "@/lib/utils";
import { useConfigStore, useConfigStoreApi } from "@/store/config-store";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/ui/confirm";
import { Input } from "@/components/ui/input";
import { Badge, Section, Spinner } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import { SaveIndicator } from "@/components/shell/save-indicator";

interface Profile {
  id: string;
  name: string;
  isActive: boolean;
  updatedAt: number;
}
interface Backup {
  id: string;
  name: string;
  size: number;
  createdAt: number;
}

const readFile = (f: File) => f.text().then((s) => JSON.parse(s) as unknown);

export function DataPanel() {
  const t = useT();
  const locale = useLocale();
  const store = useConfigStoreApi();
  const config = useConfigStore((s) => s.config);
  const [profiles, setProfiles] = useState<Profile[] | null>(null);
  const [backups, setBackups] = useState<Backup[] | null>(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLInputElement>(null);
  const L = (de: string, en: string) => bi(locale, de, en);

  const load = useCallback(() => {
    api<{ profiles: Profile[] }>("/api/profiles").then((r) => setProfiles(r.profiles)).catch(() => setProfiles([]));
    api<{ backups: Backup[] }>("/api/backups").then((r) => setBackups(r.backups)).catch(() => setBackups(null));
  }, []);
  useEffect(() => load(), [load]);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true);
    try {
      await fn();
      if (ok) toast.success(ok);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  /** Make sure pending edits are on the server before switching/duplicating profiles. */
  const flush = async () => {
    const s = store.getState();
    if (s.config !== s.savedConfig) {
      await api("/api/config", { method: "PUT", json: { config: s.config } });
      store.setState({ savedConfig: s.config, saveStatus: "saved" });
    }
  };

  const exportJson = () => downloadFile(`homepage-config-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ format: "homepage-config", version: 1, config }, null, 2));

  const importJson = async (file: File) => {
    try {
      const raw = (await readFile(file)) as { config?: unknown };
      const next: SiteConfig = normalizeConfig(raw && typeof raw === "object" && "config" in raw ? raw.config : raw);
      if (!(await confirmDialog({ title: L("Konfiguration importieren?", "Import configuration?"), message: L("Die aktuelle Konfiguration wird ersetzt (Rückgängig mit Strg+Z).", "The current configuration will be replaced (undo with Ctrl+Z)."), confirmLabel: L("Importieren", "Import"), cancelLabel: t.common.cancel })))
        return;
      store.getState().replace(next);
      toast.success(L("Konfiguration importiert.", "Configuration imported."));
    } catch (e) {
      toast.error(`${L("Ungültige Datei", "Invalid file")}: ${(e as Error).message.slice(0, 200)}`);
    }
  };

  return (
    <div className="space-y-8">
      <Section title={L("Speichern", "Saving")}>
        <div className="flex items-center justify-between rounded-ui bg-surface-2 px-3 py-2.5 text-sm">
          <span>{t.settings.autosave}</span>
          <SaveIndicator />
        </div>
      </Section>

      <Section title={L("Export & Import", "Export & import")} description={L("Die Konfiguration als JSON-Datei – ideal für Versionierung oder Umzug.", "The configuration as JSON file – great for versioning or migration.")}>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportJson}>
            <Download /> {L("Als JSON exportieren", "Export as JSON")}
          </Button>
          <Button onClick={() => importRef.current?.click()}>
            <FileUp /> {L("JSON importieren", "Import JSON")}
          </Button>
          <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e) => (e.target.files?.[0] && void importJson(e.target.files[0]), (e.target.value = ""))} />
        </div>
      </Section>

      <Section title={L("Konfigurationsprofile", "Configuration profiles")} description={L("Mehrere komplette Konfigurationen, z. B. „Bewerbung“ und „Privat“. Das aktive Profil sehen Besucher.", "Several complete configurations, e.g. “Job hunt” and “Personal”. Visitors see the active one.")}>
        {profiles === null ? (
          <Spinner />
        ) : (
          <ul className="space-y-1.5">
            {profiles.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-ui border border-border bg-surface-2 py-1.5 pl-3 pr-1.5">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                {p.isActive ? (
                  <Badge tone="success">
                    <Check className="size-3" /> {t.common.active}
                  </Badge>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          await flush();
                          await api(`/api/profiles/${p.id}`, { method: "PATCH", json: { activate: true } });
                          window.location.reload();
                        })
                      }
                    >
                      {L("Aktivieren", "Activate")}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="danger-ghost"
                      aria-label={t.common.delete}
                      onClick={async () =>
                        (await confirmDialog({ title: L("Profil löschen?", "Delete profile?"), message: p.name, danger: true, confirmLabel: t.common.delete, cancelLabel: t.common.cancel })) &&
                        run(() => api(`/api/profiles/${p.id}`, { method: "DELETE" }))
                      }
                    >
                      <Trash2 />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={L("Name des neuen Profils", "New profile name")} />
          <Button
            disabled={!newName.trim() || busy}
            onClick={() =>
              run(async () => {
                await flush();
                await api("/api/profiles", { method: "POST", json: { name: newName.trim(), from: "current" } });
                setNewName("");
              }, L("Profil als Kopie erstellt.", "Profile created as copy."))
            }
          >
            <Plus /> {L("Kopie", "Copy")}
          </Button>
          <Button
            variant="ghost"
            disabled={!newName.trim() || busy}
            onClick={() =>
              run(async () => {
                await api("/api/profiles", { method: "POST", json: { name: newName.trim(), from: "defaults" } });
                setNewName("");
              }, L("Leeres Profil erstellt.", "Blank profile created."))
            }
          >
            {L("Leer", "Blank")}
          </Button>
        </div>
      </Section>

      {backups !== null && (
        <Section title={L("Backups", "Backups")} description={L("Sichert alle Profile, Notizen/To-dos und Systemeinstellungen auf dem Server.", "Stores all profiles, notes/to-dos and system settings on the server.")}>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled={busy} onClick={() => run(async () => (await flush(), api("/api/backups", { method: "POST", json: { name: "" } })), L("Backup erstellt.", "Backup created."))}>
              <Save /> {L("Backup erstellen", "Create backup")}
            </Button>
            <Button disabled={busy} onClick={() => restoreRef.current?.click()}>
              <Upload /> {L("Aus Datei wiederherstellen", "Restore from file")}
            </Button>
            <input
              ref={restoreRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                if (!(await confirmDialog({ title: L("Backup wiederherstellen?", "Restore backup?"), message: L("Alle Profile und Widget-Daten werden ersetzt. Vorher wird automatisch ein Sicherungs-Backup angelegt.", "All profiles and widget data will be replaced. A safety backup is created first."), danger: true, confirmLabel: L("Wiederherstellen", "Restore"), cancelLabel: t.common.cancel })))
                  return;
                await run(async () => {
                  await api("/api/backups/restore", { method: "POST", json: { backup: await readFile(f) } });
                  window.location.reload();
                });
              }}
            />
          </div>
          <ul className="space-y-1.5">
            {backups.map((b) => (
              <li key={b.id} className="flex items-center gap-2 rounded-ui border border-border bg-surface-2 py-1.5 pl-3 pr-1.5 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{b.name}</span>
                  <span className="text-xs text-muted">
                    {new Date(b.createdAt).toLocaleString(locale === "de" ? "de-DE" : "en-US")} · {formatBytes(b.size)}
                  </span>
                </span>
                <a href={`/api/backups/${b.id}`} className="grid size-7 place-items-center rounded-ui text-muted hover:bg-surface-3 hover:text-fg" aria-label={t.common.download} title={t.common.download}>
                  <Download className="size-3.5" />
                </a>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={L("Wiederherstellen", "Restore")}
                  title={L("Wiederherstellen", "Restore")}
                  onClick={async () =>
                    (await confirmDialog({ title: L("Backup wiederherstellen?", "Restore backup?"), message: b.name, danger: true, confirmLabel: L("Wiederherstellen", "Restore"), cancelLabel: t.common.cancel })) &&
                    run(async () => {
                      await api("/api/backups/restore", { method: "POST", json: { id: b.id } });
                      window.location.reload();
                    })
                  }
                >
                  <ArchiveRestore />
                </Button>
                <Button size="icon-sm" variant="danger-ghost" aria-label={t.common.delete} onClick={() => run(() => api(`/api/backups/${b.id}`, { method: "DELETE" }))}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={L("Werkseinstellungen", "Factory settings")}>
        <p className="text-xs text-muted">{L("Setzt Design, Layout und Widgets des aktiven Profils zurück. Name, Benutzername und Zeitzone bleiben erhalten.", "Resets design, layout and widgets of the active profile. Name, username and time zone are kept.")}</p>
        <Button
          variant="danger"
          disabled={busy}
          onClick={async () => {
            if (!(await confirmDialog({ title: L("Auf Werkseinstellungen zurücksetzen?", "Reset to factory settings?"), message: L("Tipp: Erstelle vorher ein Backup.", "Tip: create a backup first."), danger: true, confirmLabel: t.common.reset, cancelLabel: t.common.cancel }))) return;
            await run(async () => {
              const r = await api<{ config: SiteConfig }>("/api/config/reset", { method: "POST" });
              store.setState({ config: r.config, savedConfig: r.config, saveStatus: "saved", past: [], future: [] });
            }, L("Zurückgesetzt.", "Reset done."));
          }}
        >
          <RotateCcw /> {L("Zurücksetzen", "Reset")}
        </Button>
      </Section>
    </div>
  );
}

"use client";

import { KeyRound, Trash2, UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/hooks/use-i18n";
import { api } from "@/lib/api";
import { bi } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge, Spinner } from "@/components/ui/misc";
import { confirmDialog } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";

interface U {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: "owner" | "admin" | "editor";
  created_at: number;
  last_login_at: number | null;
}

export function UsersAdmin({ currentUserId }: { currentUserId: string }) {
  const locale = useLocale();
  const L = (de: string, en: string) => bi(locale, de, en);
  const [users, setUsers] = useState<U[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [pwFor, setPwFor] = useState<U | null>(null);
  const load = useCallback(() => api<{ users: U[] }>("/api/users").then((r) => setUsers(r.users)), []);
  useEffect(() => void load(), [load]);
  const err = (e: Error) => toast.error(e.message);
  const roleLabel = { owner: L("Eigentümer", "Owner"), admin: "Admin", editor: L("Redakteur", "Editor") };

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-5" data-style="glass">
        <p className="max-w-xl text-sm text-muted">
          {L(
            "Eigentümer & Admins haben vollen Zugriff. Redakteure dürfen Inhalte, Design und Medien bearbeiten, aber keine Benutzer, Backups oder Systemeinstellungen.",
            "Owner & admins have full access. Editors may edit content, design and media, but not users, backups or system settings.",
          )}
        </p>
        <Button variant="primary" onClick={() => setAdding(true)}>
          <UserPlus /> {L("Benutzer hinzufügen", "Add user")}
        </Button>
      </div>
      {!users ? (
        <Spinner />
      ) : (
        <div className="card overflow-x-auto p-0" data-style="glass">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">{L("Benutzer", "User")}</th>
                <th className="px-4 py-3 font-medium">{L("Rolle", "Role")}</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">{L("Letzte Anmeldung", "Last sign-in")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {u.display_name || u.username} {u.id === currentUserId && <Badge>{L("Du", "You")}</Badge>}
                    </p>
                    <p className="text-xs text-muted">
                      @{u.username}
                      {u.email && ` · ${u.email}`}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "owner" ? (
                      <Badge tone="primary">{roleLabel.owner}</Badge>
                    ) : (
                      <Select value={u.role} onChange={(e) => api(`/api/users/${u.id}`, { method: "PATCH", json: { role: e.target.value } }).then(load).catch(err)} className="h-8 w-32 text-xs" aria-label={L("Rolle", "Role")}>
                        <option value="admin">{roleLabel.admin}</option>
                        <option value="editor">{roleLabel.editor}</option>
                      </Select>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted md:table-cell">{u.last_login_at ? new Date(u.last_login_at).toLocaleString(locale === "de" ? "de-DE" : "en-US") : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {u.id !== currentUserId && (
                        <Button size="icon-sm" variant="ghost" onClick={() => setPwFor(u)} aria-label={L("Passwort setzen", "Set password")} title={L("Passwort setzen", "Set password")}>
                          <KeyRound />
                        </Button>
                      )}
                      {u.role !== "owner" && u.id !== currentUserId && (
                        <Button
                          size="icon-sm"
                          variant="danger-ghost"
                          aria-label={L("Löschen", "Delete")}
                          onClick={async () =>
                            (await confirmDialog({ title: L("Benutzer löschen?", "Delete user?"), message: u.username, danger: true, confirmLabel: L("Löschen", "Delete"), cancelLabel: L("Abbrechen", "Cancel") })) &&
                            api(`/api/users/${u.id}`, { method: "DELETE" }).then(load).catch(err)
                          }
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={adding} onClose={() => setAdding(false)} title={L("Benutzer hinzufügen", "Add user")} size="sm">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            try {
              await api("/api/users", { method: "POST", json: Object.fromEntries(f.entries()) });
              toast.success(L("Benutzer angelegt.", "User created."));
              setAdding(false);
              void load();
            } catch (x) {
              err(x as Error);
            }
          }}
        >
          <Field label={L("Benutzername", "Username")} htmlFor="nu">
            <Input id="nu" name="username" required minLength={2} pattern="[\w.\-@]+" />
          </Field>
          <Field label={L("Anzeigename", "Display name")} htmlFor="nd">
            <Input id="nd" name="displayName" />
          </Field>
          <Field label="E-Mail" htmlFor="ne">
            <Input id="ne" name="email" type="email" />
          </Field>
          <Field label={L("Passwort (min. 10 Zeichen)", "Password (min. 10 characters)")} htmlFor="np">
            <Input id="np" name="password" type="password" required minLength={10} autoComplete="new-password" />
          </Field>
          <Field label={L("Rolle", "Role")} htmlFor="nr">
            <Select id="nr" name="role" defaultValue="editor">
              <option value="editor">{roleLabel.editor}</option>
              <option value="admin">{roleLabel.admin}</option>
            </Select>
          </Field>
          <Button type="submit" variant="primary" className="w-full">
            {L("Anlegen", "Create")}
          </Button>
        </form>
      </Dialog>
      <Dialog open={!!pwFor} onClose={() => setPwFor(null)} title={`${L("Passwort setzen", "Set password")}: ${pwFor?.username ?? ""}`} size="sm">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const pw = String(new FormData(e.currentTarget).get("password"));
            try {
              await api(`/api/users/${pwFor!.id}`, { method: "PATCH", json: { password: pw } });
              toast.success(L("Passwort geändert. Der Benutzer wurde abgemeldet.", "Password changed. The user was signed out."));
              setPwFor(null);
            } catch (x) {
              err(x as Error);
            }
          }}
        >
          <Input name="password" type="password" required minLength={10} autoComplete="new-password" aria-label="Password" data-autofocus />
          <Button type="submit" variant="primary" className="w-full">
            {L("Speichern", "Save")}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}

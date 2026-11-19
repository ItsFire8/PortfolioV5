"use client";

import { useState } from "react";
import { useLocale } from "@/hooks/use-i18n";
import { api } from "@/lib/api";
import { bi } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Section } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";

export function AccountAdmin({ user }: { user: { username: string; displayName: string; email: string } }) {
  const locale = useLocale();
  const L = (de: string, en: string) => bi(locale, de, en);
  const [busy, setBusy] = useState(false);
  const submit = (fn: (f: FormData) => Record<string, unknown>, msg: string) => async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    try {
      await api("/api/account", { method: "PATCH", json: fn(new FormData(form)) });
      toast.success(msg);
      form.querySelectorAll<HTMLInputElement>("input[type=password]").forEach((i) => (i.value = ""));
    } catch (x) {
      toast.error((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form className="card space-y-4 p-5" data-style="glass" onSubmit={submit((f) => ({ displayName: f.get("displayName"), email: f.get("email") }), L("Profil gespeichert.", "Profile saved."))}>
        <Section title={L("Profil", "Profile")}>
          <Field label={L("Benutzername", "Username")}>
            <Input value={user.username} disabled />
          </Field>
          <Field label={L("Anzeigename", "Display name")} htmlFor="adn">
            <Input id="adn" name="displayName" defaultValue={user.displayName} />
          </Field>
          <Field label="E-Mail" help={L("Kann alternativ zum Benutzernamen für die Anmeldung genutzt werden.", "Can be used instead of the username to sign in.")} htmlFor="aem">
            <Input id="aem" name="email" type="email" defaultValue={user.email} />
          </Field>
          <Button type="submit" variant="primary" disabled={busy}>
            {L("Speichern", "Save")}
          </Button>
        </Section>
      </form>
      <form
        className="card space-y-4 p-5"
        data-style="glass"
        onSubmit={(e) => {
          const f = new FormData(e.currentTarget);
          if (f.get("newPassword") !== f.get("repeat")) {
            e.preventDefault();
            toast.error(L("Passwörter stimmen nicht überein.", "Passwords do not match."));
            return;
          }
          return submit((fd) => ({ currentPassword: fd.get("currentPassword"), newPassword: fd.get("newPassword") }), L("Passwort geändert. Andere Sitzungen wurden abgemeldet.", "Password changed. Other sessions were signed out."))(e);
        }}
      >
        <Section title={L("Passwort ändern", "Change password")}>
          <Field label={L("Aktuelles Passwort", "Current password")} htmlFor="acp">
            <Input id="acp" name="currentPassword" type="password" required autoComplete="current-password" />
          </Field>
          <Field label={L("Neues Passwort (min. 10 Zeichen)", "New password (min. 10 characters)")} htmlFor="anp">
            <Input id="anp" name="newPassword" type="password" required minLength={10} autoComplete="new-password" />
          </Field>
          <Field label={L("Wiederholen", "Repeat")} htmlFor="arp">
            <Input id="arp" name="repeat" type="password" required minLength={10} autoComplete="new-password" />
          </Field>
          <Button type="submit" variant="primary" disabled={busy}>
            {L("Passwort ändern", "Change password")}
          </Button>
        </Section>
      </form>
    </div>
  );
}

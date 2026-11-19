"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Segmented, Spinner } from "@/components/ui/misc";

export function SetupForm({ t, locale: initial, needsToken }: { t: Dict["auth"]; locale: "de" | "en"; needsToken: boolean }) {
  const [locale, setLocale] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("password2")) return setError(t.mismatch);
    if (String(f.get("password")).length < 10) return setError(t.passwordRules);
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "content-type": "application/json", ...(needsToken ? { "x-setup-token": String(f.get("token") ?? "") } : {}) },
      body: JSON.stringify({ username: f.get("username"), displayName: f.get("displayName"), password: f.get("password"), locale }),
    }).catch(() => null);
    if (res?.ok) {
      window.location.href = "/";
      return;
    }
    const body = await res?.json().catch(() => ({}));
    setBusy(false);
    setError(body?.issues?.[0] ? `${body.issues[0].path}: ${body.issues[0].message}` : body?.error ?? "Error");
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Segmented label="Language" value={locale} onChange={setLocale} options={[{ value: "de", label: "Deutsch" }, { value: "en", label: "English" }]} />
      <Field label={t.displayName} htmlFor="dn">
        <Input id="dn" name="displayName" autoComplete="name" required maxLength={120} autoFocus />
      </Field>
      <Field label={t.username} htmlFor="un">
        <Input id="un" name="username" autoComplete="username" required minLength={2} maxLength={60} pattern="[\w.\-@]+" />
      </Field>
      <Field label={t.password} help={t.passwordRules} htmlFor="pw">
        <Input id="pw" name="password" type="password" autoComplete="new-password" required minLength={10} />
      </Field>
      <Field label={t.passwordRepeat} htmlFor="pw2">
        <Input id="pw2" name="password2" type="password" autoComplete="new-password" required minLength={10} />
      </Field>
      {needsToken && (
        <Field label="Setup-Token" help="SETUP_TOKEN (.env)" htmlFor="tk">
          <Input id="tk" name="token" required />
        </Field>
      )}
      {error && (
        <p className="rounded-ui bg-red-500/10 px-3 py-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
        {busy ? <Spinner /> : <Sparkles />} {t.create}
      </Button>
    </form>
  );
}

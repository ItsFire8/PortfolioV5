"use client";

import { LogIn } from "lucide-react";
import { useState } from "react";
import type { Dict } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";

export function LoginForm({ t, next }: { t: Dict["auth"]; next: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: f.get("username"), password: f.get("password") }),
    }).catch(() => null);
    if (res?.ok) {
      window.location.href = next;
      return;
    }
    setBusy(false);
    setError(res?.status === 429 ? t.tooMany : t.invalid);
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t.email} htmlFor="u">
        <Input id="u" name="username" autoComplete="username" required autoFocus />
      </Field>
      <Field label={t.password} htmlFor="p">
        <Input id="p" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {error && (
        <p className="rounded-ui bg-red-500/10 px-3 py-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
        {busy ? <Spinner /> : <LogIn />} {t.login}
      </Button>
      <a href="/" className="block text-center text-xs text-muted hover:text-fg">
        ← {t.backHome}
      </a>
    </form>
  );
}

"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useRef, useState } from "react";
import { useT } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { WidgetProps } from "./types";

type S = { intro: string; successMessage: string; showSubject: boolean; email: string };

export default function Contact({ widget }: WidgetProps<S>) {
  const t = useT();
  const s = widget.settings;
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const renderedAt = useRef(Date.now());

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          email: f.get("email"),
          subject: f.get("subject") ?? "",
          message: f.get("message"),
          website: f.get("website"),
          t: renderedAt.current,
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? res.statusText);
      setState("done");
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  };

  if (state === "done")
    return (
      <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 text-center">
        <CheckCircle2 className="size-10 text-emerald-500" aria-hidden />
        <p className="font-medium">{s.successMessage || t.contact.success}</p>
      </div>
    );
  const id = (k: string) => `${widget.id}-${k}`;
  return (
    <form onSubmit={submit} className="space-y-3">
      {s.intro && <p className="text-sm text-muted">{s.intro}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={id("name")} className="text-xs font-medium">{t.contact.name}</label>
          <Input id={id("name")} name="name" required maxLength={120} autoComplete="name" />
        </div>
        <div className="space-y-1">
          <label htmlFor={id("email")} className="text-xs font-medium">{t.contact.email}</label>
          <Input id={id("email")} name="email" type="email" required maxLength={200} autoComplete="email" />
        </div>
      </div>
      {s.showSubject && (
        <div className="space-y-1">
          <label htmlFor={id("subject")} className="text-xs font-medium">{t.contact.subject}</label>
          <Input id={id("subject")} name="subject" maxLength={200} />
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor={id("message")} className="text-xs font-medium">{t.contact.message}</label>
        <Textarea id={id("message")} name="message" required minLength={5} maxLength={5000} rows={5} />
      </div>
      {/* Honeypot: invisible for humans, tempting for bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px] size-px opacity-0" aria-hidden />
      {state === "error" && <p className="text-sm text-red-500" role="alert">{t.contact.error} {error && `(${error})`}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={state === "sending"}>
          <Send /> {state === "sending" ? t.contact.sending : t.contact.send}
        </Button>
        {s.email && (
          <p className="text-xs text-muted">
            {t.contact.or}{" "}
            <a className="text-primary underline-offset-2 hover:underline" href={`mailto:${s.email}`}>
              {s.email}
            </a>
          </p>
        )}
      </div>
    </form>
  );
}

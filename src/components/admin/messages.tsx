"use client";

import { Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/hooks/use-i18n";
import { api } from "@/lib/api";
import { bi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, Spinner } from "@/components/ui/misc";
import { confirmDialog } from "@/components/ui/confirm";

interface Msg {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: number;
}

export function MessagesAdmin() {
  const locale = useLocale();
  const L = (de: string, en: string) => bi(locale, de, en);
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(() => api<{ messages: Msg[] }>("/api/messages").then((r) => setMsgs(r.messages)), []);
  useEffect(() => void load(), [load]);
  const mark = (id: string, read: boolean) => api(`/api/messages/${id}`, { method: "PATCH", json: { read } }).then(load);

  if (!msgs) return <Spinner />;
  if (!msgs.length)
    return (
      <div className="card p-10 text-center" data-style="glass">
        <Mail className="mx-auto size-8 text-muted" />
        <p className="mt-3 text-sm text-muted">{L("Noch keine Nachrichten über das Kontaktformular.", "No messages from the contact form yet.")}</p>
      </div>
    );
  return (
    <ul className="space-y-2">
      {msgs.map((m) => (
        <li key={m.id} className="card p-0" data-style="glass">
          <button
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
            onClick={() => {
              setOpen(open === m.id ? null : m.id);
              if (!m.is_read) void mark(m.id, true);
            }}
            aria-expanded={open === m.id}
          >
            {m.is_read ? <MailOpen className="size-4 shrink-0 text-muted" /> : <Mail className="size-4 shrink-0 text-primary" />}
            <span className="min-w-0 flex-1">
              <span className={cn("block truncate text-sm", !m.is_read && "font-semibold")}>
                {m.name} <span className="font-normal text-muted">· {m.email}</span>
              </span>
              <span className="block truncate text-xs text-muted">{m.subject || m.body.slice(0, 90)}</span>
            </span>
            {!m.is_read && <Badge tone="primary">{L("Neu", "New")}</Badge>}
            <span className="shrink-0 text-xs text-muted">{new Date(m.created_at).toLocaleString(locale === "de" ? "de-DE" : "en-US", { dateStyle: "short", timeStyle: "short" })}</span>
          </button>
          {open === m.id && (
            <div className="border-t border-border px-4 py-4">
              {m.subject && <p className="mb-2 font-semibold">{m.subject}</p>}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
              <div className="mt-4 flex gap-2">
                <a href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: " + (m.subject || ""))}`} className="inline-flex h-8 items-center gap-1.5 rounded-ui bg-primary px-3 text-xs font-medium text-primary-fg">
                  <Reply className="size-3.5" /> {L("Antworten", "Reply")}
                </a>
                <Button size="sm" variant="ghost" onClick={() => mark(m.id, !m.is_read)}>
                  {m.is_read ? L("Als ungelesen markieren", "Mark unread") : L("Als gelesen markieren", "Mark read")}
                </Button>
                <Button
                  size="sm"
                  variant="danger-ghost"
                  onClick={async () => (await confirmDialog({ title: L("Nachricht löschen?", "Delete message?"), danger: true, confirmLabel: L("Löschen", "Delete"), cancelLabel: L("Abbrechen", "Cancel") })) && api(`/api/messages/${m.id}`, { method: "DELETE" }).then(load)}
                >
                  <Trash2 /> {L("Löschen", "Delete")}
                </Button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

"use client";

import { Download, Mail } from "lucide-react";
import { BrandIcon, platformLabel } from "@/components/brand-icon";
import type { Locale, SiteConfig, WidgetInstance } from "@/lib/config/schema";
import { bi } from "@/lib/i18n";
import { cn, hostname, safeUrl } from "@/lib/utils";
import { EmptyState } from "./shared";
import type { WidgetProps } from "./types";

type S = { role: string; email: string; phone: string; website: string; location: string; note: string; showSocial: boolean; vcard: boolean };

export interface ContactData {
  name: string;
  initials: string;
  role: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  note: string;
  username: string;
  social: { platform: string; url: string }[];
  vcard: boolean;
}

/** Merges the tag's own fields with profile, contact and social widgets as fallbacks. */
export function contactData(widget: WidgetInstance, config: SiteConfig): ContactData {
  const s = widget.settings as Partial<S>;
  const profile = (config.widgets.find((w) => w.type === "profile")?.settings ?? {}) as { role?: string; location?: string };
  const contact = (config.widgets.find((w) => w.type === "contact")?.settings ?? {}) as { email?: string };
  const social = s.showSocial
    ? (((config.widgets.find((w) => w.type === "social" && w.enabled)?.settings.items as { platform: string; url: string }[] | undefined) ?? []).filter((i) => i.url))
    : [];
  const name = config.general.name || config.general.siteTitle;
  return {
    name,
    initials:
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("") || "·",
    role: s.role || profile.role || "",
    email: s.email || contact.email || "",
    phone: s.phone || "",
    website: s.website || "",
    location: s.location || profile.location || "",
    note: s.note || "",
    username: config.general.username,
    social,
    vcard: s.vcard !== false,
  };
}

const esc = (v: string) => v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

/** Builds and downloads a vCard 3.0 file – entirely in the browser, nothing is sent anywhere. */
export function downloadVCard(d: ContactData) {
  const parts = d.name.trim().split(/\s+/);
  const last = parts.length > 1 ? parts.pop()! : "";
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(d.name)}`,
    `N:${esc(last)};${esc(parts.join(" "))};;;`,
    d.role && `TITLE:${esc(d.role)}`,
    d.email && `EMAIL;TYPE=INTERNET:${esc(d.email)}`,
    d.phone && `TEL;TYPE=CELL:${esc(d.phone)}`,
    d.website && `URL:${esc(d.website)}`,
    d.location && `ADR;TYPE=WORK:;;;${esc(d.location)};;;`,
    d.note && `NOTE:${esc(d.note)}`,
    ...d.social.map((s) => `X-SOCIALPROFILE;TYPE=${s.platform}:${esc(s.url)}`),
    "END:VCARD",
  ].filter(Boolean);
  const blob = new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${d.name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-") || "kontakt"}.vcf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** The card face – used flat in normal layouts and on the lanyard in the stage layout. */
export function TagFace({ d, locale, className }: { d: ContactData; locale: Locale; className?: string }) {
  const rows: [string, string, string | undefined][] = [
    [bi(locale, "E-Mail", "E-mail"), d.email, d.email ? `mailto:${d.email}` : undefined],
    [bi(locale, "Telefon", "Phone"), d.phone, d.phone ? `tel:${d.phone.replace(/[^\d+]/g, "")}` : undefined],
    ["Web", d.website ? hostname(d.website) : "", safeUrl(d.website) || undefined],
    [bi(locale, "Ort", "Based"), d.location, undefined],
  ];
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-12 place-items-center rounded-[11px] bg-[#1d1d1d] font-heading text-lg font-semibold text-[var(--c-accent-raw)]">{d.initials}</span>
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted">{bi(locale, "Kontakt", "Contact")}</span>
      </div>
      <p className="mt-5 font-heading text-2xl font-semibold leading-tight tracking-tight">{d.name}</p>
      {d.role && <p className="mt-0.5 font-mono text-[0.66rem] uppercase tracking-wider text-muted">{d.role}</p>}
      <dl className="mt-5 space-y-1.5 border-t border-dashed border-black/20 pt-4 font-mono text-[0.7rem] dark:border-white/20">
        {rows
          .filter(([, v]) => v)
          .map(([k, v, href]) => (
            <div key={k} className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 uppercase tracking-wider text-muted">{k}</dt>
              <dd className="min-w-0 truncate text-right">
                {href ? (
                  <a href={href} className="underline decoration-transparent underline-offset-2 hover:decoration-current" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {v}
                  </a>
                ) : (
                  v
                )}
              </dd>
            </div>
          ))}
      </dl>
      {d.social.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {d.social.slice(0, 7).map((s, i) => (
            <a
              key={i}
              href={safeUrl(s.platform === "email" && !s.url.startsWith("mailto:") ? `mailto:${s.url}` : s.url)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={platformLabel(s.platform)}
              title={platformLabel(s.platform)}
              className="grid size-8 place-items-center rounded-[7px] border border-black/10 text-muted transition hover:text-fg dark:border-white/15"
            >
              <BrandIcon platform={s.platform} className="size-3.5" />
            </a>
          ))}
        </div>
      )}
      {d.note && <p className="mt-4 text-xs text-muted">{d.note}</p>}
      <div className="mt-5 flex gap-2">
        {d.email && (
          <a href={`mailto:${d.email}`} className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[7px] bg-[#1b1b1b] px-3 text-xs font-medium text-white hover:bg-black">
            <Mail className="size-3.5" /> {bi(locale, "Schreiben", "Write")}
          </a>
        )}
        {d.vcard && (
          <button type="button" onClick={() => downloadVCard(d)} className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[7px] border border-black/15 px-3 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5">
            <Download className="size-3.5" /> vCard
          </button>
        )}
      </div>
    </div>
  );
}

export default function Badge({ widget, config, locale }: WidgetProps<S>) {
  const d = contactData(widget, config);
  if (!d.email && !d.phone && !d.website && !d.social.length) return <EmptyState widgetId={widget.id} />;
  return <TagFace d={d} locale={locale} />;
}

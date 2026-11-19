import type { GeneralConfig, Locale } from "./config/schema";

export const intlLocale = (l: Locale) => (l === "de" ? "de-DE" : "en-US");

export function validTimeZone(tz: string | undefined): string | undefined {
  if (!tz) return undefined;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return undefined;
  }
}

export function formatDate(d: Date, g: Pick<GeneralConfig, "dateFormat" | "locale" | "timezone">, tz?: string): string {
  const timeZone = validTimeZone(tz || g.timezone);
  if (g.dateFormat === "iso") {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    return parts;
  }
  return new Intl.DateTimeFormat(intlLocale(g.locale), { timeZone, dateStyle: g.dateFormat }).format(d);
}

export function formatTime(
  d: Date,
  g: Pick<GeneralConfig, "timeFormat" | "locale" | "timezone" | "showSeconds">,
  tz?: string,
  seconds = g.showSeconds,
): string {
  return new Intl.DateTimeFormat(intlLocale(g.locale), {
    timeZone: validTimeZone(tz || g.timezone),
    hour: "2-digit",
    minute: "2-digit",
    second: seconds ? "2-digit" : undefined,
    hour12: g.timeFormat === "12h",
  }).format(d);
}

/** Hour (0–23) in the configured time zone. */
export function hourIn(d: Date, tz?: string): number {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone: validTimeZone(tz), hour: "2-digit", hour12: false }).format(d);
  return Number(h) % 24;
}

export function relativeTime(date: Date, locale: Locale): string {
  const diff = (date.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [u, s] of units) if (Math.abs(diff) >= s) return rtf.format(Math.round(diff / s), u);
  return rtf.format(Math.round(diff), "second");
}

export const TIMEZONES: string[] = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
  } catch {
    return [];
  }
})();

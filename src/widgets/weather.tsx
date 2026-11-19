"use client";

import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Droplets, Moon, Sun, Wind, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { intlLocale } from "@/lib/format";
import { bi } from "@/lib/i18n";
import { EmptyState } from "./shared";
import type { WidgetProps } from "./types";

interface Data {
  current: { temperature: number; apparent: number; humidity: number; wind: number; code: number; isDay: boolean };
  daily: { date: string; code: number; max: number; min: number; rain: number | null }[];
  units: { temp: string; wind: string };
}
type S = { location: string; latitude: number; longitude: number; units: string; showForecast: boolean; days: number };

/** WMO weather codes → icon + label. */
function describe(code: number, isDay = true): { icon: LucideIcon; de: string; en: string } {
  if (code === 0) return { icon: isDay ? Sun : Moon, de: "Klar", en: "Clear" };
  if (code <= 2) return { icon: CloudSun, de: "Leicht bewölkt", en: "Partly cloudy" };
  if (code === 3) return { icon: Cloud, de: "Bedeckt", en: "Overcast" };
  if (code <= 48) return { icon: CloudFog, de: "Nebel", en: "Fog" };
  if (code <= 57) return { icon: CloudDrizzle, de: "Nieselregen", en: "Drizzle" };
  if (code <= 67 || (code >= 80 && code <= 82)) return { icon: CloudRain, de: "Regen", en: "Rain" };
  if (code <= 77 || code === 85 || code === 86) return { icon: CloudSnow, de: "Schnee", en: "Snow" };
  return { icon: CloudLightning, de: "Gewitter", en: "Thunderstorm" };
}

export default function Weather({ widget, locale }: WidgetProps<S>) {
  const s = widget.settings;
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = !!(s.latitude || s.longitude);
  const key = `${s.latitude},${s.longitude},${s.units},${s.days}`;

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;
    const load = () =>
      fetch(`/api/weather?widget=${encodeURIComponent(widget.id)}`, { credentials: "same-origin" })
        .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json().catch(() => ({}))).error ?? r.statusText))))
        .then((d) => !cancelled && (setData(d), setError(null)))
        .catch((e: Error) => !cancelled && setError(e.message));
    const timer = setTimeout(load, 400); // debounce while editing coordinates
    const interval = setInterval(load, 15 * 60_000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [configured, key, widget.id]);

  if (!configured) return <EmptyState widgetId={widget.id} />;
  if (error && !data) return <p className="text-sm text-muted">{bi(locale, "Wetterdaten nicht verfügbar.", "Weather data unavailable.")}</p>;
  if (!data)
    return (
      <div className="animate-pulse space-y-3" aria-busy>
        <div className="h-10 w-24 rounded bg-surface-3" />
        <div className="h-4 w-32 rounded bg-surface-3" />
      </div>
    );
  const d = describe(data.current.code, data.current.isDay);
  const CurIcon = d.icon;
  const dayFmt = new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short" });
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="tabular font-heading text-4xl font-semibold leading-none">
            {Math.round(data.current.temperature)}
            <span className="text-2xl text-muted">{data.units.temp}</span>
          </p>
          <p className="mt-1.5 text-sm font-medium">{d[locale]}</p>
          <p className="text-xs text-muted">{s.location || `${s.latitude.toFixed(2)}, ${s.longitude.toFixed(2)}`}</p>
        </div>
        <CurIcon className="size-12 text-accent" strokeWidth={1.5} aria-hidden />
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <Wind className="size-3.5" aria-hidden /> {Math.round(data.current.wind)} {data.units.wind}
        </span>
        <span className="inline-flex items-center gap-1">
          <Droplets className="size-3.5" aria-hidden /> {data.current.humidity}%
        </span>
        <span>
          {bi(locale, "Gefühlt", "Feels")} {Math.round(data.current.apparent)}°
        </span>
      </div>
      {s.showForecast && data.daily.length > 1 && (
        <ul className="mt-auto grid gap-1 border-t border-border pt-3" style={{ gridTemplateColumns: `repeat(${Math.min(data.daily.length - 1, 6)}, minmax(0,1fr))` }}>
          {data.daily.slice(1, 7).map((day) => {
            const Ic = describe(day.code).icon;
            return (
              <li key={day.date} className="flex flex-col items-center gap-1 text-xs">
                <span className="text-muted">{dayFmt.format(new Date(day.date + "T12:00:00"))}</span>
                <Ic className="size-4" aria-label={describe(day.code)[locale]} />
                <span className="tabular font-medium">{Math.round(day.max)}°</span>
                <span className="tabular text-muted">{Math.round(day.min)}°</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useLocale, useT } from "@/hooks/use-i18n";
import { useNow } from "@/hooks/use-now";
import { formatDate, formatTime, TIMEZONES } from "@/lib/format";
import { bi } from "@/lib/i18n";
import type { GeneralConfig } from "@/lib/config/schema";
import { useConfigStore } from "@/store/config-store";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SEARCH_ENGINES } from "@/widgets/definitions";
import { Section, Segmented } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { MediaInput } from "./media-picker";

export function GeneralPanel() {
  const t = useT();
  const locale = useLocale();
  const c = useConfigStore((s) => s.config);
  const patch = useConfigStore((s) => s.patch);
  const g = c.general;
  const set = (p: Partial<GeneralConfig>) => patch("general", p);
  const now = useNow(1000);
  return (
    <div className="space-y-8">
      <Section title={t.settings.identity}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={bi(locale, "Name", "Name")} htmlFor="g-name">
            <Input id="g-name" value={g.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label={bi(locale, "Benutzername", "Username")} htmlFor="g-user">
            <Input id="g-user" value={g.username} onChange={(e) => set({ username: e.target.value })} />
          </Field>
        </div>
        <Field label={bi(locale, "Seitentitel", "Site title")} htmlFor="g-title">
          <Input id="g-title" value={g.siteTitle} onChange={(e) => set({ siteTitle: e.target.value })} />
        </Field>
        <Field label={bi(locale, "Beschreibung", "Description")} help={bi(locale, "Wird auch für Suchmaschinen und Vorschauen verwendet.", "Also used for search engines and link previews.")} htmlFor="g-desc">
          <Textarea id="g-desc" value={g.description} rows={2} onChange={(e) => set({ description: e.target.value })} />
        </Field>
      </Section>
      <Section title={t.settings.branding}>
        <Field label={bi(locale, "Profilbild", "Profile picture")}>
          <MediaInput value={g.avatar} onChange={(v) => set({ avatar: v })} />
        </Field>
        <Field label="Logo">
          <MediaInput value={g.logo} onChange={(v) => set({ logo: v })} />
        </Field>
        <Field label="Favicon" help={bi(locale, "PNG oder ICO, quadratisch. Leer = automatisch generiert.", "PNG or ICO, square. Empty = generated automatically.")}>
          <MediaInput value={g.favicon} onChange={(v) => set({ favicon: v })} />
        </Field>
      </Section>
      <Section title={t.settings.regional}>
        <Field label={bi(locale, "Sprache (Standard für Besucher)", "Language (default for visitors)")}>
          <Segmented label="Locale" value={g.locale} onChange={(v) => set({ locale: v })} options={[{ value: "de", label: "Deutsch" }, { value: "en", label: "English" }]} />
        </Field>
        <Field label={bi(locale, "Zeitzone", "Time zone")} htmlFor="g-tz">
          <Input id="g-tz" list="tz-list" value={g.timezone} onChange={(e) => set({ timezone: e.target.value })} />
          <datalist id="tz-list">
            {TIMEZONES.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={bi(locale, "Datumsformat", "Date format")} htmlFor="g-df">
            <Select id="g-df" value={g.dateFormat} onChange={(e) => set({ dateFormat: e.target.value as GeneralConfig["dateFormat"] })}>
              {(["short", "medium", "long", "full", "iso"] as const).map((f) => (
                <option key={f} value={f}>
                  {now ? formatDate(now, { ...g, dateFormat: f }) : f}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={bi(locale, "Uhrzeitformat", "Time format")}>
            <Segmented label="Time" value={g.timeFormat} onChange={(v) => set({ timeFormat: v })} options={[{ value: "24h", label: "24h" }, { value: "12h", label: "12h" }]} />
          </Field>
        </div>
        <Field label={bi(locale, "Sekunden anzeigen", "Show seconds")} inline>
          <Switch checked={g.showSeconds} onChange={(v) => set({ showSeconds: v })} />
        </Field>
        <p className="tabular rounded-ui bg-surface-2 px-3 py-2 text-xs text-muted" suppressHydrationWarning>
          {bi(locale, "Vorschau", "Preview")}: {now ? `${formatDate(now, g)} · ${formatTime(now, g)}` : "…"}
        </p>
      </Section>
      <Section title={t.settings.seo}>
        <Field label={bi(locale, "Schlüsselwörter", "Keywords")} htmlFor="s-kw">
          <Input id="s-kw" value={c.seo.keywords} onChange={(e) => patch("seo", { keywords: e.target.value })} />
        </Field>
        <Field label={bi(locale, "Vorschaubild (Open Graph)", "Preview image (Open Graph)")}>
          <MediaInput value={c.seo.ogImage} onChange={(v) => patch("seo", { ogImage: v })} />
        </Field>
        <Field label={bi(locale, "Von Suchmaschinen indexieren", "Allow search engine indexing")} inline>
          <Switch checked={c.seo.indexable} onChange={(v) => patch("seo", { indexable: v })} />
        </Field>
      </Section>
      <Section title={t.settings.features}>
        <Field label={bi(locale, "Befehlspalette (Strg + K)", "Command palette (Ctrl + K)")} inline>
          <Switch checked={c.features.commandPalette} onChange={(v) => patch("features", { commandPalette: v })} />
        </Field>
        {c.features.commandPalette && (
          <>
            <Field
              label={bi(locale, "Websuche in der Befehlspalette", "Web search in the command palette")}
              help={bi(locale, "„Wie Suchleiste“ nutzt die Suchmaschine des Suchleisten-Widgets – inklusive der Wahl, die Besucher dort treffen.", "“Like search bar” uses the search widget's engine – including the visitor's choice there.")}
              htmlFor="pal-engine"
            >
              <Select id="pal-engine" value={c.features.paletteEngine} onChange={(e) => patch("features", { paletteEngine: e.target.value })}>
                <option value="auto">{bi(locale, "Wie Suchleiste", "Like search bar")}</option>
                {Object.entries(SEARCH_ENGINES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name}
                  </option>
                ))}
                <option value="custom">{bi(locale, "Eigene URL", "Custom URL")}</option>
              </Select>
            </Field>
            {c.features.paletteEngine === "custom" && (
              <Field
                label={bi(locale, "Such-URL (%s = Suchbegriff)", "Search URL (%s = query)")}
                help={
                  c.features.paletteSearchUrl && !/^https?:\/\/.+%s/.test(c.features.paletteSearchUrl)
                    ? bi(locale, "Muss mit http(s):// beginnen und %s enthalten – sonst wird DuckDuckGo verwendet.", "Must start with http(s):// and contain %s – otherwise DuckDuckGo is used.")
                    : bi(locale, "z. B. https://search.example.org/search?q=%s (auch eigene SearXNG-Instanz)", "e.g. https://search.example.org/search?q=%s (also your own SearXNG instance)")
                }
                htmlFor="pal-url"
              >
                <Input id="pal-url" type="url" value={c.features.paletteSearchUrl} placeholder="https://…?q=%s" onChange={(e) => patch("features", { paletteSearchUrl: e.target.value })} />
              </Field>
            )}
          </>
        )}
        <Field label={bi(locale, "Tastaturkürzel", "Keyboard shortcuts")} inline>
          <Switch checked={c.features.shortcuts} onChange={(v) => patch("features", { shortcuts: v })} />
        </Field>
        <Field label={bi(locale, "Besucher dürfen Farbschema wählen", "Visitors may choose color scheme")} inline>
          <Switch checked={c.features.visitorThemeToggle} onChange={(v) => patch("features", { visitorThemeToggle: v })} />
        </Field>
        <Field label={bi(locale, "Als App installierbar (PWA) & Offline-Cache", "Installable app (PWA) & offline cache")} inline>
          <Switch checked={c.features.pwa} onChange={(v) => patch("features", { pwa: v })} />
        </Field>
      </Section>
    </div>
  );
}

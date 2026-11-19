"use client";

import { Globe, Lock, MapPin } from "lucide-react";
import { useState } from "react";
import { useLocale, useT } from "@/hooks/use-i18n";
import { api } from "@/lib/api";
import { bi, tl } from "@/lib/i18n";
import { CARD_STYLES, type WidgetInstance } from "@/lib/config/schema";
import { useConfigStore } from "@/store/config-store";
import { useUIStore } from "@/store/ui-store";
import { getWidgetDefinition } from "@/widgets/definitions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Section, Segmented, Spinner } from "@/components/ui/misc";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { Icon } from "@/components/icon";
import { FieldList } from "./field-renderer";

function GeocodeHelper({ widget }: { widget: WidgetInstance }) {
  const locale = useLocale();
  const update = useConfigStore((s) => s.updateWidgetSettings);
  const [q, setQ] = useState(String(widget.settings.location ?? ""));
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ name: string; region: string; latitude: number; longitude: number }[]>([]);
  const search = async () => {
    setBusy(true);
    try {
      const r = await api<{ results: typeof results }>(`/api/geocode?lang=${locale}&q=${encodeURIComponent(q)}`);
      setResults(r.results);
      if (!r.results.length) toast.info(bi(locale, "Kein Ort gefunden.", "No place found."));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2 rounded-ui border border-border bg-surface-2 p-3">
      <p className="text-xs font-medium">{bi(locale, "Koordinaten suchen", "Find coordinates")}</p>
      <div className="flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), void search())} placeholder="Berlin" />
        <Button onClick={search} disabled={busy || q.trim().length < 2}>
          {busy ? <Spinner /> : <MapPin />} {bi(locale, "Suchen", "Search")}
        </Button>
      </div>
      {results.length > 0 && (
        <ul className="space-y-0.5">
          {results.map((r, i) => (
            <li key={i}>
              <button
                className="w-full rounded-[8px] px-2 py-1.5 text-left text-sm hover:bg-surface-3"
                onClick={() => {
                  update(widget.id, { location: r.name, latitude: r.latitude, longitude: r.longitude });
                  setResults([]);
                }}
              >
                <span className="font-medium">{r.name}</span> <span className="text-xs text-muted">{r.region}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WidgetSettingsDialog() {
  const t = useT();
  const locale = useLocale();
  const id = useUIStore((s) => s.editingWidget);
  const close = () => useUIStore.getState().setEditingWidget(null);
  const widget = useConfigStore((s) => s.config.widgets.find((w) => w.id === id));
  const template = useConfigStore((s) => s.config.layout.template);
  const { updateWidget, updateWidgetSettings } = useConfigStore((s) => s);
  const [tab, setTab] = useState<"content" | "display">("content");
  const def = widget ? getWidgetDefinition(widget.type) : undefined;

  return (
    <Dialog
      open={!!widget && !!def}
      onClose={close}
      size="lg"
      title={
        widget && def ? (
          <span className="flex items-center gap-2">
            <Icon name={def.icon} className="size-4 text-primary" /> {widget.title || tl(def.name, locale)}
          </span>
        ) : (
          ""
        )
      }
      description={def ? tl(def.description, locale) : undefined}
      footer={
        <Button variant="primary" onClick={close}>
          {t.common.close}
        </Button>
      }
    >
      {widget && def && (
        <div className="space-y-5">
          <Segmented
            label="Tabs"
            value={tab}
            onChange={setTab}
            options={[
              { value: "content", label: t.widgets.content },
              { value: "display", label: t.widgets.display },
            ]}
          />
          {def.external && (
            <p className="flex gap-2 rounded-ui bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
              <Globe className="mt-0.5 size-3.5 shrink-0" /> {tl(def.external, locale)}
            </p>
          )}
          {tab === "content" ? (
            <div className="space-y-4">
              {widget.type === "weather" && <GeocodeHelper widget={widget} />}
              {def.fields.length ? (
                <FieldList fields={def.fields} values={widget.settings} onChange={(patch) => updateWidgetSettings(widget.id, patch)} />
              ) : (
                <p className="text-sm text-muted">{bi(locale, "Dieses Widget hat keine Inhaltseinstellungen.", "This widget has no content settings.")}</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <Section title={t.widgets.display}>
                <Field label={t.widgets.customTitle} htmlFor="wt">
                  <Input id="wt" value={widget.title} placeholder={tl(def.name, locale)} onChange={(e) => updateWidget(widget.id, { title: e.target.value })} />
                </Field>
                <Field label={t.widgets.showTitle} inline>
                  <Switch checked={widget.showTitle} onChange={(v) => updateWidget(widget.id, { showTitle: v })} label={t.widgets.showTitle} />
                </Field>
                <Field label={t.widgets.showInNav} inline>
                  <Switch checked={widget.showInNav} onChange={(v) => updateWidget(widget.id, { showInNav: v })} label={t.widgets.showInNav} />
                </Field>
                <Field label={t.widgets.cardStyle}>
                  <Select value={widget.style} onChange={(e) => updateWidget(widget.id, { style: e.target.value as WidgetInstance["style"] })}>
                    <option value="inherit">{t.widgets.inherit}</option>
                    {CARD_STYLES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </Field>
              </Section>
              <Section title={t.widgets.visibility}>
                <Segmented
                  label={t.widgets.visibility}
                  value={widget.visibility}
                  onChange={(v) => updateWidget(widget.id, { visibility: v })}
                  options={[
                    { value: "public", label: (<><Globe /> {t.common.public}</>) },
                    { value: "private", label: (<><Lock /> {t.common.private}</>) },
                  ]}
                />
                <p className="text-xs text-muted">
                  {widget.visibility === "private"
                    ? bi(locale, "Nur für angemeldete Eigentümer sichtbar – wird an Besucher gar nicht ausgeliefert.", "Only visible when signed in – never delivered to visitors.")
                    : bi(locale, "Für alle Besucher sichtbar.", "Visible to all visitors.")}
                </p>
                <Field label={t.widgets.show} inline>
                  <Switch checked={widget.enabled} onChange={(v) => updateWidget(widget.id, { enabled: v })} label={t.widgets.show} />
                </Field>
                {template === "sidebar" && (
                  <Field label={t.widgets.region}>
                    <Segmented
                      label={t.widgets.region}
                      value={widget.region}
                      onChange={(v) => updateWidget(widget.id, { region: v })}
                      options={[
                        { value: "main", label: t.widgets.regionMain },
                        { value: "sidebar", label: t.widgets.regionSidebar },
                      ]}
                    />
                  </Field>
                )}
              </Section>
              <Section title={t.widgets.resize}>
                <Slider label={t.widgets.width} value={widget.size.w} min={1} max={6} onChange={(w) => updateWidget(widget.id, { size: { ...widget.size, w } })} unit={bi(locale, " Sp.", " col")} />
                <Slider label={t.widgets.height} value={widget.size.h} min={1} max={6} onChange={(h) => updateWidget(widget.id, { size: { ...widget.size, h } })} unit={bi(locale, " Z.", " row")} />
              </Section>
              <Section title={t.settings.mobile}>
                <Field label={t.widgets.hideMobile} inline>
                  <Switch checked={widget.mobile.hidden} onChange={(v) => updateWidget(widget.id, { mobile: { ...widget.mobile, hidden: v } })} label={t.widgets.hideMobile} />
                </Field>
                <Field label={t.widgets.mobileWidth} help={bi(locale, "Gilt bei 2 mobilen Spalten.", "Applies with 2 mobile columns.")}>
                  <Segmented
                    label={t.widgets.mobileWidth}
                    value={String(widget.mobile.w) as "1" | "2"}
                    onChange={(v) => updateWidget(widget.id, { mobile: { ...widget.mobile, w: Number(v) } })}
                    options={[
                      { value: "1", label: "½" },
                      { value: "2", label: "1/1" },
                    ]}
                  />
                </Field>
              </Section>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

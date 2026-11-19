"use client";

import { Columns3, LayoutDashboard, LayoutGrid, Newspaper, PanelLeft } from "lucide-react";
import { arrayMove } from "@dnd-kit/sortable";
import { useLocale, useT } from "@/hooks/use-i18n";
import { bi } from "@/lib/i18n";
import type { LayoutConfig } from "@/lib/config/schema";
import { cn } from "@/lib/utils";
import { useConfigStore } from "@/store/config-store";
import { Field, Input } from "@/components/ui/input";
import { Section, Segmented } from "@/components/ui/misc";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { widgetTitle } from "@/components/grid/widget-frame";
import { SortableList } from "./sortable-list";

export function LayoutPanel() {
  const t = useT();
  const locale = useLocale();
  const c = useConfigStore((s) => s.config);
  const patch = useConfigStore((s) => s.patch);
  const setMobileOrder = useConfigStore((s) => s.setMobileOrder);
  const L = c.layout;
  const set = (p: Partial<LayoutConfig>) => patch("layout", p);
  const templates = [
    { id: "dashboard", icon: LayoutDashboard, name: "Dashboard", desc: bi(locale, "Freies Raster", "Free grid") },
    { id: "sidebar", icon: PanelLeft, name: bi(locale, "Seitenleiste", "Sidebar"), desc: bi(locale, "Profil links/rechts fixiert", "Sticky profile column") },
    { id: "portfolio", icon: Newspaper, name: "Portfolio", desc: bi(locale, "Abschnitte, editorial", "Sections, editorial") },
    { id: "bento", icon: LayoutGrid, name: "Bento", desc: bi(locale, "Feste Kachelhöhen", "Fixed tile heights") },
    { id: "editorial", icon: Columns3, name: "Editorial", desc: bi(locale, "Schweizer Raster, großer Schriftzug", "Swiss grid, oversized type") },
  ] as const;

  const enabled = c.widgets.filter((w) => w.enabled);
  const orderIds = L.mobile.order.filter((id) => enabled.some((w) => w.id === id));
  const ordered = [...orderIds.map((id) => enabled.find((w) => w.id === id)!), ...enabled.filter((w) => !orderIds.includes(w.id))];

  return (
    <div className="space-y-8">
      <Section title={bi(locale, "Vorlage", "Template")}>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((tp) => (
            <button
              key={tp.id}
              onClick={() => set({ template: tp.id })}
              aria-pressed={L.template === tp.id}
              className={cn("flex items-start gap-2.5 rounded-ui border p-3 text-left transition", L.template === tp.id ? "border-primary bg-primary-soft" : "border-border hover:border-border-strong")}
            >
              <tp.icon className={cn("mt-0.5 size-4 shrink-0", L.template === tp.id ? "text-primary" : "text-muted")} />
              <span>
                <span className="block text-sm font-semibold">{tp.name}</span>
                <span className="block text-xs text-muted">{tp.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </Section>
      {L.template === "editorial" && (
        <Section title="Editorial" description={bi(locale, "Abschnitte erscheinen nummeriert untereinander. Widgets mit Breite ≥ 3 zeigen den Inhalt unter dem Titel, schmalere daneben.", "Sections are stacked and numbered. Widgets with width ≥ 3 show content below the title, narrower ones beside it.")}>
          <Field label={bi(locale, "Großer Schriftzug", "Display text")} help={bi(locale, "Leer = dein Name. Kurze Wörter wirken am stärksten.", "Empty = your name. Short words work best.")} htmlFor="ed-hero">
            <Input id="ed-hero" value={L.editorial.heroText} placeholder={c.general.name} maxLength={40} onChange={(e) => set({ editorial: { ...L.editorial, heroText: e.target.value } })} />
          </Field>
          <Field label={bi(locale, "Kurzer Leitsatz (links)", "Short tagline (left)")} help={bi(locale, "Rechts steht die Seitenbeschreibung aus „Allgemein“.", "The site description from “General” appears on the right.")} htmlFor="ed-tag">
            <Input id="ed-tag" value={L.editorial.tagline} maxLength={200} onChange={(e) => set({ editorial: { ...L.editorial, tagline: e.target.value } })} />
          </Field>
          {(
            [
              ["showGridLines", bi(locale, "Rasterlinien anzeigen", "Show grid lines")],
              ["sectionNumbers", bi(locale, "Abschnitte nummerieren", "Number sections")],
              ["grayscaleImages", bi(locale, "Bilder in Graustufen (Farbe beim Überfahren)", "Grayscale images (color on hover)")],
              ["showCursor", bi(locale, "Cursor-Punkt", "Cursor dot")],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label} inline>
              <Switch checked={L.editorial[k]} onChange={(v) => set({ editorial: { ...L.editorial, [k]: v } })} />
            </Field>
          ))}
        </Section>
      )}
      <Section title={t.settings.structure}>
        <Slider label={bi(locale, "Spalten", "Columns")} value={L.columns} min={1} max={6} onChange={(columns) => set({ columns })} />
        <Field label={bi(locale, "Volle Breite", "Full width")} inline>
          <Switch checked={L.fullWidth} onChange={(fullWidth) => set({ fullWidth })} />
        </Field>
        {!L.fullWidth && <Slider label={bi(locale, "Seitenbreite", "Page width")} value={L.maxWidth} min={640} max={2400} step={20} unit="px" onChange={(maxWidth) => set({ maxWidth })} />}
        <Field label={bi(locale, "Navigation", "Navigation")} help={bi(locale, "Zeigt Widgets mit „In Navigation anzeigen“.", "Shows widgets marked “show in navigation”.")}>
          <Segmented
            label="Navigation"
            value={L.navigation}
            onChange={(navigation) => set({ navigation })}
            options={[
              { value: "none", label: bi(locale, "Keine", "None") },
              { value: "top", label: bi(locale, "Oben", "Top") },
              { value: "floating", label: bi(locale, "Schwebend", "Floating") },
            ]}
          />
        </Field>
        {L.template === "sidebar" && (
          <>
            <Field label={bi(locale, "Position der Seitenleiste", "Sidebar position")}>
              <Segmented label="Sidebar" value={L.sidebarPosition} onChange={(sidebarPosition) => set({ sidebarPosition })} options={[{ value: "left", label: bi(locale, "Links", "Left") }, { value: "right", label: bi(locale, "Rechts", "Right") }]} />
            </Field>
            <Slider label={bi(locale, "Breite der Seitenleiste", "Sidebar width")} value={L.sidebarWidth} min={240} max={480} step={10} unit="px" onChange={(sidebarWidth) => set({ sidebarWidth })} />
            <p className="text-xs text-muted">{bi(locale, "Widgets werden über ihre Anzeige-Einstellungen der Seitenleiste zugeordnet.", "Assign widgets to the sidebar in their display settings.")}</p>
          </>
        )}
      </Section>
      <Section title={t.settings.spacing}>
        <Slider label={bi(locale, "Abstand zwischen Widgets", "Gap between widgets")} value={L.gap} min={0} max={48} unit="px" onChange={(gap) => set({ gap })} />
        <Slider label={bi(locale, "Seitenrand", "Page padding")} value={L.padding} min={0} max={96} unit="px" onChange={(padding) => set({ padding })} />
        <Slider label={bi(locale, "Zeilenhöhe (Widget-Höheneinheit)", "Row height (widget height unit)")} value={L.rowHeight} min={60} max={400} step={10} unit="px" onChange={(rowHeight) => set({ rowHeight })} />
      </Section>
      <Section title={t.settings.headerFooter}>
        {(
          [
            ["show", bi(locale, "Header anzeigen", "Show header")],
            ["sticky", bi(locale, "Header fixieren", "Sticky header")],
            ["showLogo", bi(locale, "Logo anzeigen", "Show logo")],
            ["showSearch", bi(locale, "Suchfeld im Header", "Search in header")],
            ["showQuickLinks", bi(locale, "Schnellzugriffe im Header", "Quick links in header")],
          ] as const
        ).map(([k, label]) => (
          <Field key={k} label={label} inline>
            <Switch checked={L.header[k]} onChange={(v) => set({ header: { ...L.header, [k]: v } })} />
          </Field>
        ))}
        <Field label={bi(locale, "Footer anzeigen", "Show footer")} inline>
          <Switch checked={L.footer.show} onChange={(v) => set({ footer: { ...L.footer, show: v } })} />
        </Field>
        <Field label={bi(locale, "Anmelde-Link im Footer", "Sign-in link in footer")} help={bi(locale, "Auch ohne Link erreichbar unter /login.", "Always reachable at /login.")} inline>
          <Switch checked={L.footer.showLogin} onChange={(v) => set({ footer: { ...L.footer, showLogin: v } })} />
        </Field>
        <Field label={bi(locale, "Footer-Text", "Footer text")} htmlFor="ft">
          <Input id="ft" value={L.footer.text} placeholder={`© ${new Date().getFullYear()} ${c.general.name}`} onChange={(e) => set({ footer: { ...L.footer, text: e.target.value } })} />
        </Field>
      </Section>
      <Section title={t.settings.mobile}>
        <Field label={bi(locale, "Spalten auf Smartphones", "Columns on phones")}>
          <Segmented label="Mobile columns" value={String(L.mobile.columns) as "1" | "2"} onChange={(v) => set({ mobile: { ...L.mobile, columns: Number(v) } })} options={[{ value: "1", label: "1" }, { value: "2", label: "2" }]} />
        </Field>
        <Field label={bi(locale, "Kompakter Header (nur Logo)", "Compact header (logo only)")} inline>
          <Switch checked={L.mobile.compactHeader} onChange={(v) => set({ mobile: { ...L.mobile, compactHeader: v } })} />
        </Field>
        <Field label={bi(locale, "Eigene Reihenfolge auf Smartphones", "Custom order on phones")} inline>
          <Switch checked={L.mobile.customOrder} onChange={(v) => set({ mobile: { ...L.mobile, customOrder: v, order: L.mobile.order.length ? L.mobile.order : enabled.map((w) => w.id) } })} />
        </Field>
        {L.mobile.customOrder && (
          <SortableList
            items={ordered}
            onReorder={(from, to) => {
              const ids = ordered.map((w) => w.id);
              setMobileOrder(arrayMove(ids, ids.indexOf(from), ids.indexOf(to)));
            }}
            render={(w) => <span className="truncate py-2 pr-3 text-sm">{widgetTitle(w, locale)}</span>}
          />
        )}
      </Section>
    </div>
  );
}

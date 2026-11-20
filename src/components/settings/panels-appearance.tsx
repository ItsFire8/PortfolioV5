"use client";

import { Check, Monitor, Moon, Smartphone, SunMedium } from "lucide-react";
import { useLocale, useT } from "@/hooks/use-i18n";
import { DESIGN_PRESETS } from "@/lib/config/presets";
import { ANIMATED_BACKGROUNDS, CARD_STYLES, FONTS, type AppearanceConfig, type FontId } from "@/lib/config/schema";
import { bi, tl } from "@/lib/i18n";
import { FONT_LABELS, FONT_STACKS } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useConfigStore } from "@/store/config-store";
import { ColorInput } from "@/components/ui/color-input";
import { Field, Select, Textarea } from "@/components/ui/input";
import { Section, Segmented } from "@/components/ui/misc";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MediaInput } from "./media-picker";

export function PresetGrid() {
  const locale = useLocale();
  const current = useConfigStore((s) => s.config.appearance.preset);
  const apply = useConfigStore((s) => s.applyPreset);
  return (
    <ul className="grid grid-cols-2 gap-2">
      {DESIGN_PRESETS.map((p) => (
        <li key={p.id}>
          <button
            onClick={() => apply(p.id)}
            aria-pressed={current === p.id}
            className={cn("group relative w-full overflow-hidden rounded-ui border p-2 text-left transition", current === p.id ? "border-primary ring-2 ring-primary-soft" : "border-border hover:border-border-strong")}
          >
            <div className="relative mb-2 h-14 overflow-hidden rounded-[8px]" style={{ background: p.swatch[0] }}>
              <div className="absolute left-2 top-2 h-4 w-12 rounded-[4px]" style={{ background: p.swatch[1], opacity: 0.95 }} />
              <div className="absolute bottom-2 left-2 h-3 w-8 rounded-full" style={{ background: p.swatch[2] }} />
              <div className="absolute bottom-2 right-2 size-6 rounded-[6px] border" style={{ borderColor: p.swatch[1] + "55", background: p.swatch[1] + "18" }} />
            </div>
            <p className="text-xs font-semibold">{tl(p.name, locale)}</p>
            <p className="truncate text-[0.68rem] text-muted">{tl(p.description, locale)}</p>
            {current === p.id && <Check className="absolute right-2 top-2 size-4 rounded-full bg-primary p-0.5 text-primary-fg" />}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AppearancePanel() {
  const t = useT();
  const locale = useLocale();
  const a = useConfigStore((s) => s.config.appearance);
  const patch = useConfigStore((s) => s.patch);
  const set = (p: Partial<AppearanceConfig>) => patch("appearance", { ...p, preset: p.preset ?? a.preset });
  const setBg = (p: Partial<AppearanceConfig["background"]>) => set({ background: { ...a.background, ...p } });
  const bg = a.background;
  const fontSelect = (key: "font" | "headingFont", label: string) => (
    <Field label={label} htmlFor={`f-${key}`}>
      <Select id={`f-${key}`} value={a[key]} onChange={(e) => set({ [key]: e.target.value as FontId })} style={{ fontFamily: FONT_STACKS[a[key]] }}>
        {FONTS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: FONT_STACKS[f] }}>
            {FONT_LABELS[f]}
          </option>
        ))}
      </Select>
    </Field>
  );
  return (
    <div className="space-y-8">
      <Section title={t.settings.presets} description={bi(locale, "Vorlagen setzen Farben, Schrift & Flächen – alles bleibt danach anpassbar.", "Presets set colors, fonts & surfaces – everything stays customizable.")}>
        <PresetGrid />
      </Section>
      <Section title={bi(locale, "Farbschema", "Color scheme")}>
        <Segmented
          label="Mode"
          value={a.mode}
          onChange={(mode) => set({ mode })}
          options={[
            { value: "system", label: (<><Monitor /> {t.theme.system}</>) },
            { value: "light", label: (<><SunMedium /> {t.theme.light}</>) },
            { value: "dark", label: (<><Moon /> {t.theme.dark}</>) },
            { value: "amoled", label: (<><Smartphone /> AMOLED</>) },
          ]}
        />
      </Section>
      <Section title={t.settings.colors} description={bi(locale, "Kontraste werden automatisch abgesichert.", "Contrast is safeguarded automatically.")}>
        <div className="grid grid-cols-3 gap-3">
          <ColorInput label={bi(locale, "Primär", "Primary")} value={a.primary} onChange={(primary) => set({ primary })} />
          <ColorInput label={bi(locale, "Sekundär", "Secondary")} value={a.secondary} onChange={(secondary) => set({ secondary })} />
          <ColorInput label={bi(locale, "Akzent", "Accent")} value={a.accent} onChange={(accent) => set({ accent })} />
        </div>
      </Section>
      <Section title={t.settings.typography}>
        <div className="grid gap-4 sm:grid-cols-2">
          {fontSelect("font", bi(locale, "Fließtext", "Body"))}
          {fontSelect("headingFont", bi(locale, "Überschriften", "Headings"))}
        </div>
        <Slider label={bi(locale, "Schriftgröße", "Font size")} value={a.fontSize} min={12} max={22} unit="px" onChange={(fontSize) => set({ fontSize })} />
      </Section>
      <Section title={t.settings.background}>
        <Segmented
          label="Background"
          value={bg.type}
          onChange={(type) => setBg({ type })}
          options={[
            { value: "solid", label: bi(locale, "Farbe", "Color") },
            { value: "gradient", label: bi(locale, "Verlauf", "Gradient") },
            { value: "image", label: bi(locale, "Bild", "Image") },
            { value: "video", label: "Video" },
            { value: "animated", label: bi(locale, "Animiert", "Animated") },
          ]}
        />
        {bg.type === "solid" && (
          <>
            <Field label={bi(locale, "Themenfarbe verwenden (passt sich Hell/Dunkel an)", "Use theme color (adapts to light/dark)")} inline>
              <Switch checked={bg.themed} onChange={(themed) => setBg({ themed })} />
            </Field>
            {!bg.themed && (
              <div className="grid grid-cols-2 gap-3">
                <ColorInput label={bi(locale, "Hintergrund hell", "Background light")} value={bg.color} onChange={(color) => setBg({ color })} />
                <ColorInput label={bi(locale, "Hintergrund dunkel", "Background dark")} value={bg.colorDark} onChange={(colorDark) => setBg({ colorDark })} />
              </div>
            )}
          </>
        )}
        {bg.type === "gradient" && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <ColorInput label={bi(locale, "Start", "From")} value={bg.gradientFrom} onChange={(gradientFrom) => setBg({ gradientFrom })} />
              <ColorInput label={bi(locale, "Mitte", "Via")} value={bg.gradientVia} onChange={(gradientVia) => setBg({ gradientVia })} />
              <ColorInput label={bi(locale, "Ende", "To")} value={bg.gradientTo} onChange={(gradientTo) => setBg({ gradientTo })} />
            </div>
            <Slider label={bi(locale, "Winkel", "Angle")} value={bg.gradientAngle} min={0} max={360} unit="°" onChange={(gradientAngle) => setBg({ gradientAngle })} />
          </>
        )}
        {bg.type === "image" && (
          <Field label={bi(locale, "Hintergrundbild", "Background image")}>
            <MediaInput value={bg.image} onChange={(image) => setBg({ image })} />
          </Field>
        )}
        {bg.type === "video" && (
          <Field label={bi(locale, "Hintergrundvideo (MP4/WebM, stumm)", "Background video (MP4/WebM, muted)")}>
            <MediaInput value={bg.video} onChange={(video) => setBg({ video })} kind="video" />
          </Field>
        )}
        {bg.type === "animated" && (
          <Field label={bi(locale, "Animation", "Animation")}>
            <Select value={bg.animated} onChange={(e) => setBg({ animated: e.target.value as AppearanceConfig["background"]["animated"] })}>
              {ANIMATED_BACKGROUNDS.map((x) => (
                <option key={x} value={x}>
                  {{ aurora: "Aurora", mesh: "Mesh Gradient", grid: "Neon Grid", orbs: "Orbs", noise: "Film Grain" }[x]}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {bg.type !== "solid" && (
          <>
            <Slider label={bi(locale, "Abdunkeln / Aufhellen (Overlay)", "Overlay")} value={Math.round(bg.overlay * 100)} min={0} max={100} unit="%" onChange={(v) => setBg({ overlay: v / 100 })} />
            {(bg.type === "image" || bg.type === "video") && <Slider label={bi(locale, "Hintergrundunschärfe", "Background blur")} value={bg.blur} min={0} max={40} unit="px" onChange={(blur) => setBg({ blur })} />}
          </>
        )}
      </Section>
      <Section title={bi(locale, "Maus-Matrix", "Mouse matrix")} description={bi(locale, "Ein Raster im Hintergrund, das auf den Mauszeiger reagiert.", "A background grid that reacts to the mouse pointer.")}>
        <Field label={bi(locale, "Maus-Matrix aktivieren", "Enable mouse matrix")} inline>
          <Switch checked={a.matrix.enabled} onChange={(enabled) => set({ matrix: { ...a.matrix, enabled } })} />
        </Field>
        {a.matrix.enabled && (
          <>
            <Field label={bi(locale, "Stil", "Style")}>
              <Segmented
                label="Matrix style"
                value={a.matrix.style}
                onChange={(style) => set({ matrix: { ...a.matrix, style } })}
                options={[
                  { value: "dots", label: bi(locale, "Punkte", "Dots") },
                  { value: "glyphs", label: bi(locale, "Zeichen", "Glyphs") },
                  { value: "network", label: bi(locale, "Netz", "Network") },
                ]}
              />
            </Field>
            <Field label={bi(locale, "Ebene", "Layer")} help={bi(locale, "Vordergrund: über den Karten, nur rund um den Mauszeiger – Klicks gehen weiterhin durch.", "Foreground: above the cards, only around the pointer – clicks still go through.")}>
              <Segmented
                label="Matrix layer"
                value={a.matrix.layer}
                onChange={(layer) => set({ matrix: { ...a.matrix, layer } })}
                options={[
                  { value: "background", label: bi(locale, "Hintergrund", "Background") },
                  { value: "foreground", label: bi(locale, "Vordergrund", "Foreground") },
                ]}
              />
            </Field>
            <Field label={bi(locale, "Farbe", "Color")}>
              <Segmented
                label="Matrix color"
                value={a.matrix.color}
                onChange={(color) => set({ matrix: { ...a.matrix, color } })}
                options={[
                  { value: "accent", label: bi(locale, "Akzent", "Accent") },
                  { value: "primary", label: bi(locale, "Primär", "Primary") },
                  { value: "fg", label: bi(locale, "Text", "Text") },
                ]}
              />
            </Field>
            <Slider label={bi(locale, "Rasterabstand", "Grid spacing")} value={a.matrix.spacing} min={10} max={60} unit="px" onChange={(spacing) => set({ matrix: { ...a.matrix, spacing } })} />
            <Slider label={bi(locale, "Wirkungsradius", "Radius")} value={a.matrix.radius} min={40} max={500} step={10} unit="px" onChange={(radius) => set({ matrix: { ...a.matrix, radius } })} />
            {a.matrix.style !== "glyphs" && a.matrix.layer === "background" && (
              <Field label={bi(locale, "Raster auch in Ruhe zeigen", "Show grid at rest")} inline>
                <Switch checked={a.matrix.showIdle} onChange={(showIdle) => set({ matrix: { ...a.matrix, showIdle } })} />
              </Field>
            )}
          </>
        )}
      </Section>
      <Section title={t.settings.surfaces}>
        <Field label={bi(locale, "Kartenstil", "Card style")}>
          <Segmented label="Card" value={a.cardStyle} onChange={(cardStyle) => set({ cardStyle })} options={CARD_STYLES.map((s) => ({ value: s, label: { glass: "Glass", solid: "Solid", outline: "Outline", flat: "Flat", line: "Line" }[s] }))} />
        </Field>
        {a.cardStyle === "glass" && <Slider label={bi(locale, "Glas-Unschärfe", "Glass blur")} value={a.glassBlur} min={0} max={48} unit="px" onChange={(glassBlur) => set({ glassBlur })} />}
        <Slider label={bi(locale, "Deckkraft der Flächen", "Surface opacity")} value={Math.round(a.transparency * 100)} min={0} max={100} unit="%" onChange={(v) => set({ transparency: v / 100 })} />
        <Slider label={bi(locale, "Eckenradius", "Corner radius")} value={a.radius} min={0} max={40} unit="px" onChange={(radius) => set({ radius })} />
        <Slider label={bi(locale, "Schattenintensität", "Shadow intensity")} value={Math.round(a.shadow * 100)} min={0} max={100} unit="%" onChange={(v) => set({ shadow: v / 100 })} />
      </Section>
      <Section title={t.settings.motion}>
        <Slider
          label={bi(locale, "Animationsgeschwindigkeit", "Animation speed")}
          value={a.animationSpeed}
          min={0}
          max={3}
          step={0.25}
          format={(v) => (v === 0 ? bi(locale, "Aus", "Off") : `${v}×`)}
          onChange={(animationSpeed) => set({ animationSpeed })}
        />
        <p className="text-xs text-muted">{bi(locale, "Die Systemeinstellung „Bewegung reduzieren“ wird immer respektiert.", "The system setting “reduce motion” is always respected.")}</p>
      </Section>
      <Section title={t.settings.customCss} description={bi(locale, "Wird nach allen anderen Stilen geladen. Variablen: --primary, --accent, --radius, --surface …", "Loaded after all other styles. Variables: --primary, --accent, --radius, --surface …")}>
        <Textarea value={a.customCss} onChange={(e) => set({ customCss: e.target.value })} rows={8} spellCheck={false} className="font-mono text-[0.78rem]" placeholder=".card { border-width: 2px; }" aria-label={t.settings.customCss} />
      </Section>
    </div>
  );
}

"use client";

import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2, Copy } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useLocale } from "@/hooks/use-i18n";
import { tl, bi } from "@/lib/i18n";
import { TIMEZONES } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FieldDef } from "@/widgets/types";
import { Button } from "@/components/ui/button";
import { ColorInput } from "@/components/ui/color-input";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ICON_NAMES, Icon } from "@/components/icon";
import { MediaInput } from "./media-picker";

type Obj = Record<string, unknown>;

function visible(f: FieldDef, values: Obj) {
  if (!f.when) return true;
  const v = values[f.when.key];
  return Array.isArray(f.when.equals) ? f.when.equals.includes(v) : v === f.when.equals;
}

function defaultFor(fields: FieldDef[]): Obj {
  const o: Obj = {};
  for (const f of fields) {
    if (f.type === "toggle") o[f.key] = false;
    else if (f.type === "number" || f.type === "range") o[f.key] = f.min;
    else if (f.type === "select") o[f.key] = f.options[0]?.value ?? "";
    else if (f.type === "list" || f.type === "tags") o[f.key] = [];
    else if (f.type === "color") o[f.key] = "#6366f1";
    else o[f.key] = "";
  }
  return o;
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="input-base flex h-9 items-center gap-2 text-left">
        <Icon name={value} className="size-4" /> <span className="flex-1 truncate">{value || "—"}</span>
        <ChevronDown className="size-4 text-muted" />
      </button>
      {open && (
        <div className="mt-1.5 grid max-h-44 grid-cols-8 gap-1 overflow-y-auto rounded-ui border border-border bg-surface-2 p-1.5">
          <button type="button" onClick={() => (onChange(""), setOpen(false))} className="grid aspect-square place-items-center rounded-[6px] text-xs text-muted hover:bg-surface-3">
            ∅
          </button>
          {ICON_NAMES.map((n) => (
            <button
              key={n}
              type="button"
              title={n}
              onClick={() => (onChange(n), setOpen(false))}
              className={cn("grid aspect-square place-items-center rounded-[6px] hover:bg-surface-3", value === n && "bg-primary-soft text-primary")}
            >
              <Icon name={n} className="size-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ListField({ field, value, onChange }: { field: Extract<FieldDef, { type: "list" }>; value: Obj[]; onChange: (v: Obj[]) => void }) {
  const locale = useLocale();
  const [openIdx, setOpenIdx] = useState<number | null>(value.length === 0 ? null : null);
  const items = Array.isArray(value) ? value : [];
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpenIdx(openIdx === i ? j : openIdx);
  };
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[0.8rem] font-medium">{tl(field.label, locale)}</span>
        <span className="text-xs text-muted">{items.length}{field.max ? ` / ${field.max}` : ""}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => {
          const title = String(item[field.titleKey] ?? "").trim() || `${tl(field.itemLabel, locale)} ${i + 1}`;
          const open = openIdx === i;
          return (
            <li
              key={i}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIdx === null || dragIdx === i) return;
                const next = [...items];
                const [m] = next.splice(dragIdx, 1);
                next.splice(i, 0, m);
                onChange(next);
                setDragIdx(null);
              }}
              className={cn("rounded-ui border border-border bg-surface-2", dragIdx === i && "opacity-50")}
            >
              <div className="flex items-center gap-1 px-1.5 py-1">
                <GripVertical className="size-3.5 shrink-0 cursor-grab text-subtle" aria-hidden />
                <button type="button" onClick={() => setOpenIdx(open ? null : i)} className="flex min-w-0 flex-1 items-center gap-2 px-1 py-1 text-left text-sm" aria-expanded={open}>
                  <span className="truncate">{title}</span>
                </button>
                <Button size="icon-sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label={bi(locale, "Nach oben", "Move up")}>
                  <ChevronUp />
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={bi(locale, "Nach unten", "Move down")}>
                  <ChevronDown />
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => onChange([...items.slice(0, i + 1), structuredClone(item), ...items.slice(i + 1)])} aria-label={bi(locale, "Duplizieren", "Duplicate")} disabled={!!field.max && items.length >= field.max}>
                  <Copy />
                </Button>
                <Button size="icon-sm" variant="danger-ghost" onClick={() => (onChange(items.filter((_, j) => j !== i)), setOpenIdx(null))} aria-label={bi(locale, "Entfernen", "Remove")}>
                  <Trash2 />
                </Button>
              </div>
              {open && (
                <div className="space-y-3 border-t border-border p-3">
                  <FieldList fields={field.fields} values={item} onChange={(patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)))} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <Button
        size="sm"
        variant="outline"
        className="w-full border-dashed"
        disabled={!!field.max && items.length >= field.max}
        onClick={() => {
          onChange([...items, defaultFor(field.fields)]);
          setOpenIdx(items.length);
        }}
      >
        <Plus /> {tl(field.itemLabel, locale)}
      </Button>
    </div>
  );
}

function TagsField({ value, onChange, id }: { value: unknown; onChange: (v: string[]) => void; id: string }) {
  const arr = Array.isArray(value) ? (value as string[]) : typeof value === "string" ? value.split(",").map((x) => x.trim()).filter(Boolean) : [];
  const [text, setText] = useState(arr.join(", "));
  return <Input id={id} value={text} onChange={(e) => setText(e.target.value)} onBlur={() => onChange(text.split(",").map((x) => x.trim()).filter(Boolean))} placeholder="React, TypeScript, …" />;
}

export function FieldControl({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const locale = useLocale();
  const id = useId();
  const label = tl(field.label, locale);
  const help = field.help ? tl(field.help, locale) : undefined;
  const tzList = useMemo(() => (field.type === "timezone" ? TIMEZONES : []), [field.type]);
  switch (field.type) {
    case "toggle":
      return (
        <Field label={label} help={help} htmlFor={id} inline>
          <Switch id={id} checked={!!value} onChange={onChange} label={label} />
        </Field>
      );
    case "range":
      return <Slider label={label} value={Number(value ?? field.min)} min={field.min} max={field.max} step={field.step} unit={field.unit} onChange={onChange} />;
    case "number":
      return (
        <Field label={label} help={help} htmlFor={id}>
          <Input id={id} type="number" value={Number(value ?? 0)} min={field.min} max={field.max} step={field.step ?? 1} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} />
        </Field>
      );
    case "select":
      return (
        <Field label={label} help={help} htmlFor={id}>
          <Select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {tl(o.label, locale)}
              </option>
            ))}
          </Select>
        </Field>
      );
    case "textarea":
    case "markdown":
      return (
        <Field label={label} help={help ?? (field.type === "markdown" ? bi(locale, "Markdown: **fett**, *kursiv*, [Link](https://…), - Liste, ## Überschrift", "Markdown: **bold**, *italic*, [link](https://…), - list, ## heading") : undefined)} htmlFor={id}>
          <Textarea id={id} value={String(value ?? "")} rows={field.type === "markdown" ? 8 : 3} onChange={(e) => onChange(e.target.value)} className={field.type === "markdown" ? "font-mono text-[0.8rem]" : ""} />
        </Field>
      );
    case "color":
      return <ColorInput label={label} value={String(value || "#6366f1")} onChange={onChange} />;
    case "image":
    case "video":
    case "file":
      return (
        <Field label={label} help={help} htmlFor={id}>
          <MediaInput id={id} value={String(value ?? "")} onChange={onChange} kind={field.type} />
        </Field>
      );
    case "date":
      return (
        <Field label={label} help={help} htmlFor={id}>
          <Input id={id} type="date" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case "datetime":
      return (
        <Field label={label} help={help} htmlFor={id}>
          <Input id={id} type="datetime-local" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
    case "timezone":
      return (
        <Field label={label} help={help} htmlFor={id}>
          <Input id={id} list={`${id}-tz`} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder="Europe/Berlin" />
          <datalist id={`${id}-tz`}>
            {tzList.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </Field>
      );
    case "icon":
      return (
        <Field label={label} help={help}>
          <IconPicker value={String(value ?? "")} onChange={onChange} />
        </Field>
      );
    case "tags":
      return (
        <Field label={label} help={help ?? bi(locale, "Kommagetrennt", "Comma separated")} htmlFor={id}>
          <TagsField id={id} value={value} onChange={onChange} />
        </Field>
      );
    case "list":
      return <ListField field={field} value={(value as Obj[]) ?? []} onChange={onChange} />;
    default:
      return (
        <Field label={label} help={help} htmlFor={id}>
          <Input id={id} type={field.type === "url" ? "url" : "text"} value={String(value ?? "")} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
        </Field>
      );
  }
}

export function FieldList({ fields, values, onChange }: { fields: FieldDef[]; values: Obj; onChange: (patch: Obj) => void }) {
  return (
    <>
      {fields.filter((f) => visible(f, values)).map((f) => (
        <FieldControl key={f.key} field={f} value={values[f.key]} onChange={(v) => onChange({ [f.key]: v })} />
      ))}
    </>
  );
}

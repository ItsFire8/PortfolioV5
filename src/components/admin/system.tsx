"use client";

import { useState } from "react";
import { useLocale } from "@/hooks/use-i18n";
import { api } from "@/lib/api";
import { bi } from "@/lib/i18n";
import { Field, Textarea } from "@/components/ui/input";
import { Section } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { DataPanel } from "@/components/settings/panels-data";

interface Sys {
  maintenance: boolean;
  maintenanceMessage: string;
  statsEnabled: boolean;
  contactEnabled: boolean;
  allowSearchIndexing: boolean;
}

export function SystemAdmin({ initial, info }: { initial: Sys; info: { storage: string; version: string } }) {
  const locale = useLocale();
  const L = (de: string, en: string) => bi(locale, de, en);
  const [s, setS] = useState(initial);
  const save = async (patch: Partial<Sys>) => {
    const prev = s;
    setS({ ...s, ...patch });
    try {
      const r = await api<{ settings: Sys }>("/api/system", { method: "PUT", json: patch });
      setS(r.settings);
      toast.success(L("Gespeichert", "Saved"));
    } catch (e) {
      setS(prev);
      toast.error((e as Error).message);
    }
  };
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="card space-y-8 p-5" data-style="glass">
        <Section title={L("Wartungsmodus", "Maintenance mode")}>
          <Field label={L("Wartungsmodus aktiv", "Maintenance mode active")} help={L("Besucher sehen eine Wartungsseite, du siehst weiterhin alles.", "Visitors see a maintenance page, you still see everything.")} inline>
            <Switch checked={s.maintenance} onChange={(v) => save({ maintenance: v })} />
          </Field>
          <Field label={L("Nachricht", "Message")} htmlFor="mm">
            <Textarea id="mm" value={s.maintenanceMessage} onChange={(e) => setS({ ...s, maintenanceMessage: e.target.value })} onBlur={() => save({ maintenanceMessage: s.maintenanceMessage })} rows={2} />
          </Field>
        </Section>
        <Section title={L("Funktionen", "Features")}>
          <Field label={L("Kontaktformular annehmen", "Accept contact form")} inline>
            <Switch checked={s.contactEnabled} onChange={(v) => save({ contactEnabled: v })} />
          </Field>
          <Field label={L("Besucherstatistik", "Visitor statistics")} inline>
            <Switch checked={s.statsEnabled} onChange={(v) => save({ statsEnabled: v })} />
          </Field>
          <Field label={L("Suchmaschinen erlauben (global)", "Allow search engines (global)")} inline>
            <Switch checked={s.allowSearchIndexing} onChange={(v) => save({ allowSearchIndexing: v })} />
          </Field>
        </Section>
        <Section title={L("Installation", "Installation")}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted">Version</dt>
            <dd>{info.version}</dd>
            <dt className="text-muted">{L("Datenbank", "Database")}</dt>
            <dd>{info.storage}</dd>
          </dl>
        </Section>
      </div>
      <div className="card p-5" data-style="glass">
        <DataPanel />
      </div>
    </div>
  );
}

import { getWidgetDefinition } from "@/widgets/definitions";
import { now, one, run } from "@/lib/server/db";
import { handler, HttpError, json, readJson, requireAuth } from "@/lib/server/http";
import { resolveWidget } from "@/lib/server/widget-access";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const { widget } = await resolveWidget((await params).id);
  if (!getWidgetDefinition(widget.type)?.dataBacked) throw new HttpError(400, "Widget has no data");
  const row = await one<{ data: string; updated_at: number }>("SELECT data, updated_at FROM widget_data WHERE widget_id = ?", [widget.id]);
  return json({ data: row ? JSON.parse(row.data) : null, updatedAt: row ? Number(row.updated_at) : 0 }, { headers: { "cache-control": "no-store" } });
});

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  await requireAuth(req, "content");
  const { widget } = await resolveWidget((await params).id);
  if (!getWidgetDefinition(widget.type)?.dataBacked) throw new HttpError(400, "Widget has no data");
  const body = await readJson<{ data: unknown }>(req, 1_000_000);
  const t = now();
  await run("INSERT OR REPLACE INTO widget_data (widget_id, data, updated_at) VALUES (?,?,?)", [widget.id, JSON.stringify(body.data ?? null), t]);
  return json({ ok: true, updatedAt: t });
});

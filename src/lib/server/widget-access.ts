import "server-only";
import type { WidgetInstance } from "@/lib/config/schema";
import { getSession, type Session } from "./auth";
import { getActiveConfig } from "./config-repo";
import { HttpError } from "./http";

/**
 * Resolves a widget from the *stored* configuration. Server endpoints never
 * accept URLs/coordinates from the client – they read them from the owner's
 * config, which prevents abuse as an open proxy (SSRF).
 */
export async function resolveWidget(widgetId: string, type?: string): Promise<{ widget: WidgetInstance; session: Session | null }> {
  if (!/^[\w-]{1,64}$/.test(widgetId)) throw new HttpError(400, "Invalid widget id");
  const { config } = await getActiveConfig();
  const widget = config.widgets.find((w) => w.id === widgetId);
  if (!widget || (type && widget.type !== type)) throw new HttpError(404, "Widget not found");
  const session = await getSession();
  if (!session && (!widget.enabled || widget.visibility !== "public")) throw new HttpError(404, "Widget not found");
  return { widget, session };
}

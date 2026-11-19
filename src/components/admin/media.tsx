"use client";

import { Copy, FileText, Trash2, Video } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/hooks/use-i18n";
import { api } from "@/lib/api";
import { bi } from "@/lib/i18n";
import { formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { confirmDialog } from "@/components/ui/confirm";
import { Spinner } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import { uploadFile, type MediaItem } from "@/components/settings/media-picker";

export function MediaAdmin() {
  const locale = useLocale();
  const L = (de: string, en: string) => bi(locale, de, en);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [max, setMax] = useState(0);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api<{ media: MediaItem[]; maxBytes: number }>("/api/media").then((r) => (setItems(r.media), setMax(r.maxBytes))), []);
  useEffect(() => void load(), [load]);

  const upload = async (files: FileList) => {
    setBusy(true);
    try {
      for (const f of Array.from(files)) await uploadFile(f);
      toast.success(L("Hochgeladen.", "Uploaded."));
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <label
        className="card flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed p-8 text-center"
        data-style="outline"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => (e.preventDefault(), e.dataTransfer.files.length && void upload(e.dataTransfer.files))}
      >
        {busy ? <Spinner /> : <span className="font-medium">{L("Dateien hierher ziehen oder klicken", "Drop files here or click")}</span>}
        <span className="text-xs text-muted">PNG, JPG, GIF, WebP, AVIF, ICO, MP4, WebM, PDF · max. {formatBytes(max)} · {L("SVG ist aus Sicherheitsgründen deaktiviert.", "SVG is disabled for security reasons.")}</span>
        <input type="file" multiple hidden onChange={(e) => e.target.files && void upload(e.target.files)} />
      </label>
      {items === null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted">{L("Noch keine Medien.", "No media yet.")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((m) => (
            <li key={m.id} className="card overflow-hidden p-0" data-style="solid">
              <a href={m.url} target="_blank" rel="noreferrer" className="grid aspect-square place-items-center bg-surface-2">
                {m.mime.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.filename} loading="lazy" className="size-full object-cover" />
                ) : m.mime.startsWith("video/") ? (
                  <Video className="size-8 text-muted" />
                ) : (
                  <FileText className="size-8 text-muted" />
                )}
              </a>
              <div className="flex items-center gap-1 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium" title={m.filename}>
                    {m.filename}
                  </p>
                  <p className="text-[0.68rem] text-muted">{formatBytes(m.size)}</p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={L("URL kopieren", "Copy URL")}
                  onClick={() => navigator.clipboard.writeText(location.origin + m.url).then(() => toast.success(L("Kopiert", "Copied")))}
                >
                  <Copy />
                </Button>
                <Button
                  size="icon-sm"
                  variant="danger-ghost"
                  aria-label={L("Löschen", "Delete")}
                  onClick={async () => {
                    if (!(await confirmDialog({ title: L("Datei löschen?", "Delete file?"), message: L("Widgets, die diese Datei verwenden, zeigen sie danach nicht mehr an.", "Widgets using this file will no longer show it."), danger: true, confirmLabel: L("Löschen", "Delete"), cancelLabel: L("Abbrechen", "Cancel") })))
                      return;
                    await api(`/api/media/${m.id}`, { method: "DELETE" }).catch((e) => toast.error(e.message));
                    void load();
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

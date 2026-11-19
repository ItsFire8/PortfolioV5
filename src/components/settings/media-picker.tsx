"use client";

import { FileText, FolderOpen, ImageIcon, Upload, Video, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { bi } from "@/lib/i18n";
import { cn, formatBytes } from "@/lib/utils";
import { useLocale } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";

export interface MediaItem {
  id: string;
  filename: string;
  mime: string;
  size: number;
  createdAt: number;
  url: string;
}
export type MediaKind = "image" | "video" | "file";

const accepts: Record<MediaKind, string> = {
  image: "image/png,image/jpeg,image/gif,image/webp,image/avif,image/x-icon",
  video: "video/mp4,video/webm",
  file: "application/pdf,image/*,video/mp4,video/webm",
};
const matches = (m: MediaItem, kind: MediaKind) => (kind === "image" ? m.mime.startsWith("image/") : kind === "video" ? m.mime.startsWith("video/") : true);

export async function uploadFile(file: File): Promise<MediaItem> {
  const fd = new FormData();
  fd.append("file", file);
  const r = await api<{ media: MediaItem }>("/api/media", { method: "POST", body: fd });
  return r.media;
}

export function MediaLibrary({ kind, onPick, selectable = true }: { kind: MediaKind; onPick?: (m: MediaItem) => void; selectable?: boolean }) {
  const locale = useLocale();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => api<{ media: MediaItem[] }>("/api/media").then((r) => setItems(r.media)).catch((e) => toast.error(e.message)), []);
  useEffect(() => void load(), [load]);

  const upload = async (files: FileList | File[]) => {
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        const m = await uploadFile(f);
        toast.success(`${m.filename} ✓`);
      }
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const list = (items ?? []).filter((m) => matches(m, kind));
  return (
    <div
      onDragOver={(e) => (e.preventDefault(), setDrag(true))}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
      }}
      className={cn("space-y-3 rounded-ui", drag && "ring-2 ring-primary")}
    >
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? <Spinner /> : <Upload />} {bi(locale, "Datei hochladen", "Upload file")}
        </Button>
        <span className="text-xs text-muted">{bi(locale, "oder Dateien hierher ziehen", "or drop files here")}</span>
        <input ref={fileRef} type="file" accept={accepts[kind]} multiple hidden onChange={(e) => e.target.files && void upload(e.target.files)} />
      </div>
      {items === null ? (
        <div className="grid h-32 place-items-center"><Spinner /></div>
      ) : list.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{bi(locale, "Noch keine Dateien.", "No files yet.")}</p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {list.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                disabled={!selectable}
                onClick={() => onPick?.(m)}
                className="group block w-full overflow-hidden rounded-ui border border-border bg-surface-2 text-left transition enabled:hover:border-primary"
                title={m.filename}
              >
                <div className="grid aspect-square place-items-center overflow-hidden bg-surface-3">
                  {m.mime.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt="" loading="lazy" className="size-full object-cover" />
                  ) : m.mime.startsWith("video/") ? (
                    <Video className="size-8 text-muted" />
                  ) : (
                    <FileText className="size-8 text-muted" />
                  )}
                </div>
                <div className="px-2 py-1.5">
                  <p className="truncate text-[0.7rem] font-medium">{m.filename}</p>
                  <p className="text-[0.65rem] text-muted">{formatBytes(m.size)}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** URL input + upload + library picker. Works with any http(s) URL or local uploads. */
export function MediaInput({ value, onChange, kind = "image", id }: { value: string; onChange: (v: string) => void; kind?: MediaKind; id?: string }) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const IconC = kind === "video" ? Video : kind === "file" ? FileText : ImageIcon;
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {kind === "image" && value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-9 shrink-0 rounded-ui border border-border object-cover" />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-ui border border-border bg-surface-2 text-muted">
            <IconC className="size-4" />
          </span>
        )}
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… / Upload" className="min-w-0 flex-1" />
        {value && (
          <Button size="icon" variant="ghost" onClick={() => onChange("")} aria-label={bi(locale, "Leeren", "Clear")}>
            <X />
          </Button>
        )}
        <Button size="icon" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()} aria-label={bi(locale, "Hochladen", "Upload")} title={bi(locale, "Hochladen", "Upload")}>
          {busy ? <Spinner /> : <Upload />}
        </Button>
        <Button size="icon" variant="outline" onClick={() => setOpen(true)} aria-label={bi(locale, "Mediathek", "Media library")} title={bi(locale, "Mediathek", "Media library")}>
          <FolderOpen />
        </Button>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept={accepts[kind]}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            try {
              onChange((await uploadFile(f)).url);
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setBusy(false);
              e.target.value = "";
            }
          }}
        />
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title={bi(locale, "Mediathek", "Media library")} size="lg">
        <MediaLibrary
          kind={kind}
          onPick={(m) => {
            onChange(m.url);
            setOpen(false);
          }}
        />
      </Dialog>
    </div>
  );
}

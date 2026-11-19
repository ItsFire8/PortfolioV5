import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { id } from "./crypto";
import { all, DATA_DIR, IS_LOCAL_DB, now, one, run } from "./db";

export const MEDIA_DIR = path.join(DATA_DIR, "uploads");
export const MAX_UPLOAD_BYTES = Math.max(1, Number(process.env.MEDIA_MAX_MB || 25)) * 1024 * 1024;
const useFs = IS_LOCAL_DB && !process.env.VERCEL;

export interface MediaItem {
  id: string;
  filename: string;
  mime: string;
  size: number;
  createdAt: number;
  url: string;
}

/** Detects the real file type from magic bytes – the client-provided type is never trusted. SVG is rejected on purpose (script risk). */
export function sniffMime(b: Uint8Array): { mime: string; ext: string } | null {
  const hex = (n: number) => Array.from(b.slice(0, n), (x) => x.toString(16).padStart(2, "0")).join("");
  const ascii = (s: number, e: number) => String.fromCharCode(...b.slice(s, e));
  if (hex(8) === "89504e470d0a1a0a") return { mime: "image/png", ext: "png" };
  if (hex(3) === "ffd8ff") return { mime: "image/jpeg", ext: "jpg" };
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return { mime: "image/gif", ext: "gif" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { mime: "image/webp", ext: "webp" };
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (brand === "avif" || brand === "avis") return { mime: "image/avif", ext: "avif" };
    return { mime: "video/mp4", ext: "mp4" };
  }
  if (hex(4) === "1a45dfa3") return { mime: "video/webm", ext: "webm" };
  if (hex(4) === "00000100") return { mime: "image/x-icon", ext: "ico" };
  if (ascii(0, 5) === "%PDF-") return { mime: "application/pdf", ext: "pdf" };
  return null;
}

const urlFor = (mid: string, ext: string) => `/media/${mid}.${ext}`;
const extOf = (mime: string) =>
  ({ "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp", "image/avif": "avif", "video/mp4": "mp4", "video/webm": "webm", "image/x-icon": "ico", "application/pdf": "pdf" })[mime] ?? "bin";

export async function saveMedia(filename: string, bytes: Uint8Array): Promise<MediaItem> {
  const type = sniffMime(bytes);
  if (!type) throw new Error("Unsupported file type");
  const mid = id("m");
  const safeName = filename.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || `upload.${type.ext}`;
  if (useFs) {
    await fs.mkdir(MEDIA_DIR, { recursive: true });
    await fs.writeFile(path.join(MEDIA_DIR, `${mid}.${type.ext}`), bytes);
  }
  await run("INSERT INTO media (id, filename, mime, size, storage, data, created_at) VALUES (?,?,?,?,?,?,?)", [
    mid,
    safeName,
    type.mime,
    bytes.byteLength,
    useFs ? "fs" : "db",
    useFs ? null : bytes,
    now(),
  ]);
  return { id: mid, filename: safeName, mime: type.mime, size: bytes.byteLength, createdAt: now(), url: urlFor(mid, type.ext) };
}

export async function listMedia(): Promise<MediaItem[]> {
  const rows = await all<{ id: string; filename: string; mime: string; size: number; created_at: number }>(
    "SELECT id, filename, mime, size, created_at FROM media ORDER BY created_at DESC",
  );
  return rows.map((r) => ({
    id: r.id,
    filename: r.filename,
    mime: r.mime,
    size: Number(r.size),
    createdAt: Number(r.created_at),
    url: urlFor(r.id, extOf(r.mime)),
  }));
}

export async function readMedia(mid: string): Promise<{ mime: string; bytes: Uint8Array; filename: string } | null> {
  const row = await one<{ mime: string; storage: string; data: ArrayBuffer | null; filename: string }>(
    "SELECT mime, storage, data, filename FROM media WHERE id = ?",
    [mid],
  );
  if (!row) return null;
  if (row.storage === "fs") {
    try {
      const bytes = await fs.readFile(path.join(MEDIA_DIR, `${mid}.${extOf(row.mime)}`));
      return { mime: row.mime, bytes: new Uint8Array(bytes), filename: row.filename };
    } catch {
      return null;
    }
  }
  return row.data ? { mime: row.mime, bytes: new Uint8Array(row.data), filename: row.filename } : null;
}

export async function deleteMedia(mid: string): Promise<boolean> {
  const row = await one<{ mime: string; storage: string }>("SELECT mime, storage FROM media WHERE id = ?", [mid]);
  if (!row) return false;
  if (row.storage === "fs") await fs.rm(path.join(MEDIA_DIR, `${mid}.${extOf(row.mime)}`), { force: true });
  await run("DELETE FROM media WHERE id = ?", [mid]);
  return true;
}

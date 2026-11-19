import { readMedia } from "@/lib/server/media";

type Ctx = { params: Promise<{ file: string }> };

/** Serves uploaded media with strict headers (no sniffing, sandboxed). Supports HTTP range requests for video. */
export async function GET(req: Request, { params }: Ctx) {
  const { file } = await params;
  const m = /^(m_[\w-]{6,40})\.[a-z0-9]{2,5}$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  const item = await readMedia(m[1]);
  if (!item) return new Response("Not found", { status: 404 });
  const headers: Record<string, string> = {
    "content-type": item.mime,
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    "cache-control": "public, max-age=31536000, immutable",
    "accept-ranges": "bytes",
    "content-disposition": `inline; filename="${item.filename.replace(/"/g, "")}"`,
  };
  const total = item.bytes.byteLength;
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range) {
    let start = range[1] ? Number(range[1]) : total - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : total - 1;
    if (!range[1]) end = total - 1;
    start = Math.max(0, start);
    end = Math.min(end, total - 1);
    if (start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${total}` } });
    return new Response(new Uint8Array(item.bytes.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "content-range": `bytes ${start}-${end}/${total}`, "content-length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(item.bytes), { headers: { ...headers, "content-length": String(total) } });
}

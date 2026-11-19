import { listMedia, MAX_UPLOAD_BYTES, saveMedia } from "@/lib/server/media";
import { handler, HttpError, json, requireAuth } from "@/lib/server/http";

export const GET = handler(async (req: Request) => {
  await requireAuth(req, "media");
  return json({ media: await listMedia(), maxBytes: MAX_UPLOAD_BYTES });
});

export const POST = handler(async (req: Request) => {
  await requireAuth(req, "media");
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 100_000) throw new HttpError(413, "File too large");
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "No file");
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, "File too large");
  try {
    const item = await saveMedia(file.name, new Uint8Array(await file.arrayBuffer()));
    return json({ media: item }, 201);
  } catch (e) {
    throw new HttpError(415, (e as Error).message);
  }
});

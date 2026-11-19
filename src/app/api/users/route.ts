import { z } from "zod";
import { createUser, listUsers } from "@/lib/server/auth";
import { handler, HttpError, json, readJson, requireAuth } from "@/lib/server/http";

const body = z.object({
  username: z.string().trim().min(2).max(60).regex(/^[\w.\-@]+$/),
  displayName: z.string().trim().max(120).default(""),
  email: z.union([z.literal(""), z.email().max(200)]).default(""),
  password: z.string().min(10).max(500),
  role: z.enum(["admin", "editor"]),
});

export const GET = handler(async (req: Request) => {
  await requireAuth(req, "users");
  return json({ users: await listUsers() });
});

export const POST = handler(async (req: Request) => {
  await requireAuth(req, "users");
  const input = body.parse(await readJson(req, 10_000));
  try {
    const id = await createUser(input);
    return json({ id }, 201);
  } catch (e) {
    if (String(e).includes("UNIQUE")) throw new HttpError(409, "Username already exists");
    throw e;
  }
});

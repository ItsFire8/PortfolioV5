import { one } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await one("SELECT 1");
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}

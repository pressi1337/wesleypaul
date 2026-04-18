import { getAdminFromRequest } from "@/lib/auth";
import pool from "@/lib/db";
import { ensureTables } from "@/lib/init-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!getAdminFromRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await ensureTables();
    const url = new URL(request.url);
    const page   = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit  = Math.min(100, Math.max(10, Number(url.searchParams.get("limit") ?? 50)));
    const offset = (page - 1) * limit;
    const action = url.searchParams.get("action") ?? "";
    const user   = url.searchParams.get("user") ?? "";

    const conditions: string[] = [];
    const params: string[] = [];
    if (action) { conditions.push("action = ?"); params.push(action); }
    if (user)   { conditions.push("admin_username = ?"); params.push(user); }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.execute(
      `SELECT id, admin_id, admin_username, action, resource_type, resource_id,
              details, ip_address, created_at
       FROM audit_logs ${where}
       ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params.length ? params : undefined
    );

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM audit_logs ${where}`,
      params.length ? params : undefined
    );
    const total = ((countRows as { total: number }[])[0]?.total) ?? 0;

    return Response.json({ logs: rows, total, page, limit });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

import pool from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "contact";

  try {
    if (type === "booking") {
      const [rows] = await pool.execute(
        "SELECT * FROM booking_submissions ORDER BY created_at DESC"
      );
      return Response.json({ submissions: rows });
    } else {
      const [rows] = await pool.execute(
        "SELECT * FROM contact_submissions ORDER BY created_at DESC"
      );
      return Response.json({ submissions: rows });
    }
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, status, type } = await request.json() as { id: number; status: string; type: string };
    const table = type === "booking" ? "booking_submissions" : "contact_submissions";
    await pool.execute(`UPDATE ${table} SET status = ? WHERE id = ?`, [status, id]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const type = url.searchParams.get("type") || "contact";

  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
  const table = type === "booking" ? "booking_submissions" : "contact_submissions";
  await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);
  return Response.json({ success: true });
}

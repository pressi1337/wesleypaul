import pool from "./db";
import { getAdminFromRequest } from "./auth";

export async function logAudit(
  request: Request,
  action: string,
  resourceType: string,
  resourceId?: string | number,
  details?: string
) {
  try {
    const admin = getAdminFromRequest(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim()
      || request.headers.get("x-real-ip")
      || "";
    await pool.execute(
      `INSERT INTO audit_logs (admin_id, admin_username, action, resource_type, resource_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        admin?.id ?? null,
        admin?.username ?? "unknown",
        action,
        resourceType,
        resourceId != null ? String(resourceId) : "",
        details ?? "",
        ip,
      ]
    );
  } catch {
    // Non-fatal — never let audit failure break the request
  }
}

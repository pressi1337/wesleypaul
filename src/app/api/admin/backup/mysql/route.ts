import { getAdminFromRequest } from "@/lib/auth";
import { execSync } from "child_process";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!getAdminFromRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const host     = process.env.DB_HOST || "localhost";
  const user     = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "wesleypaul_cms";
  const port     = process.env.DB_PORT || "3306";

  try {
    const cmd = `mysqldump -h${host} -P${port} -u${user} --single-transaction --routines --triggers ${database}`;
    const sql = execSync(cmd, {
      env: { ...process.env, MYSQL_PWD: password },
      maxBuffer: 100 * 1024 * 1024,
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename  = `wesleypaul_cms_backup_${timestamp}.sql`;

    await logAudit(request, "backup_mysql", "database", database);

    return new Response(sql, {
      headers: {
        "Content-Type": "application/sql",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(sql.length),
      },
    });
  } catch (e) {
    return Response.json({ error: `Backup failed: ${String(e)}` }, { status: 500 });
  }
}

import pool from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const password = formData.get("password") as string | null;
  const file     = formData.get("file") as File | null;

  if (!password || !file) {
    return Response.json({ error: "Password and SQL file are required" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".sql")) {
    return Response.json({ error: "Only .sql files are accepted" }, { status: 400 });
  }

  const [rows] = await pool.execute(
    "SELECT password_hash FROM admin_users WHERE id = ?",
    [admin.id]
  );
  const users = rows as { password_hash: string }[];
  if (!users.length || !(await bcrypt.compare(password, users[0].password_hash))) {
    return Response.json({ error: "Incorrect password" }, { status: 403 });
  }

  try {
    const bytes   = await file.arrayBuffer();
    const sqlBuf  = Buffer.from(bytes);

    const host     = process.env.DB_HOST     || "localhost";
    const user     = process.env.DB_USER     || "root";
    const dbPass   = process.env.DB_PASSWORD || "";
    const database = process.env.DB_NAME     || "wesleypaul_cms";
    const port     = process.env.DB_PORT     || "3306";

    // Fix mysqldump compatibility: wrap bare function-call DEFAULTs in parens
    // e.g.  DEFAULT json_array()  →  DEFAULT (json_array())
    // MySQL 8.0 requires parens around expression defaults; older dumps omit them.
    let sql = sqlBuf.toString("utf8");
    sql = sql.replace(/\bDEFAULT\s+([a-zA-Z_][a-zA-Z0-9_]*\([^)]*\))/g, "DEFAULT ($1)");
    const fixedBuf = Buffer.from(sql, "utf8");

    const tmpFile = join(tmpdir(), `restore_${Date.now()}.sql`);
    try {
      writeFileSync(tmpFile, fixedBuf);
      execSync(`mysql -h${host} -P${port} -u${user} ${database} < ${tmpFile}`, {
        env: { ...process.env, MYSQL_PWD: dbPass },
        maxBuffer: 200 * 1024 * 1024,
        shell: "/bin/sh",
      });
    } finally {
      try { unlinkSync(tmpFile); } catch { /* ignore cleanup failure */ }
    }

    await logAudit(request, "restore_mysql", "database", database, `Restored DB from ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: `Restore failed: ${String(e)}` }, { status: 500 });
  }
}

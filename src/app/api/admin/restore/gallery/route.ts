import pool from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

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
    return Response.json({ error: "Password and ZIP file are required" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".zip")) {
    return Response.json({ error: "Only .zip files are accepted" }, { status: 400 });
  }

  const [rows] = await pool.execute(
    "SELECT password_hash FROM admin_users WHERE id = ?",
    [admin.id]
  );
  const users = rows as { password_hash: string }[];
  if (!users.length || !(await bcrypt.compare(password, users[0].password_hash))) {
    return Response.json({ error: "Incorrect password" }, { status: 403 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const tmpFile    = path.join(os.tmpdir(), `gallery_restore_${Date.now()}.zip`);

  try {
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(tmpFile, Buffer.from(bytes));
    fs.mkdirSync(uploadsDir, { recursive: true });

    execSync(`unzip -o "${tmpFile}" -d "${uploadsDir}"`, { maxBuffer: 200 * 1024 * 1024 });

    await logAudit(request, "restore_gallery", "media", "uploads", `Restored gallery from ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: `Restore failed: ${String(e)}` }, { status: 500 });
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

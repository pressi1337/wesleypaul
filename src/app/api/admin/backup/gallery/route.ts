import { getAdminFromRequest } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import archiver from "archiver";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!getAdminFromRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");

  if (!fs.existsSync(uploadsDir)) {
    return Response.json({ error: "No uploads directory found" }, { status: 404 });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename  = `gallery_backup_${timestamp}.zip`;

  try {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("data", (chunk: Buffer) => writer.write(chunk));
    archive.on("end",  ()             => writer.close());
    archive.on("error", (err: Error)  => writer.abort(err));

    archive.directory(uploadsDir, false);
    archive.finalize();

    await logAudit(request, "backup_gallery", "media", "uploads");

    return new Response(readable, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return Response.json({ error: `Gallery backup failed: ${String(e)}` }, { status: 500 });
  }
}

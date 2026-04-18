import fs from "fs";
import path from "path";
import pool from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

// Directories under /public to scan (relative to public root)
const SCAN_DIRS = ["images", "uploads"];

// File extensions we treat as media
const MIME_MAP: Record<string, string> = {
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  gif:  "image/gif",
  webp: "image/webp",
  svg:  "image/svg+xml",
  mp4:  "video/mp4",
  webm: "video/webm",
  mov:  "video/quicktime",
  ogv:  "video/ogg",
};

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const publicDir = path.join(process.cwd(), "public");
  const conn = await pool.getConnection();
  let imported = 0;
  let skipped = 0;

  try {
    // Ensure unique index exists so INSERT IGNORE works safely
    await conn.query(
      `ALTER TABLE media ADD UNIQUE INDEX IF NOT EXISTS uq_file_path (file_path(255))`
    ).catch(() => {/* ignore if syntax not supported */});

    // Collect all existing file_paths in one query for fast lookup
    const [existingRows] = await conn.query("SELECT file_path FROM media");
    const existing = new Set(
      (existingRows as { file_path: string }[]).map(r => r.file_path)
    );

    for (const dir of SCAN_DIRS) {
      const absDir = path.join(publicDir, dir);
      if (!fs.existsSync(absDir)) continue;

      const entries = fs.readdirSync(absDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile()) continue;

        const ext = path.extname(entry.name).replace(".", "").toLowerCase();
        const mimeType = MIME_MAP[ext];
        if (!mimeType) continue; // skip non-media files

        const filePath = `/${dir}/${entry.name}`;
        if (existing.has(filePath)) { skipped++; continue; }

        const absPath = path.join(absDir, entry.name);
        let fileSize = 0;
        try { fileSize = fs.statSync(absPath).size; } catch { /* skip */ }

        await conn.query(
          `INSERT IGNORE INTO media (filename, original_name, file_path, file_size, mime_type)
           VALUES (?, ?, ?, ?, ?)`,
          [entry.name, entry.name, filePath, fileSize, mimeType]
        );
        existing.add(filePath);
        imported++;
      }
    }

    return Response.json({ success: true, imported, skipped });
  } finally {
    conn.release();
  }
}

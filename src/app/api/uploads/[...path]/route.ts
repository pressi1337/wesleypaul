import fs from "fs";
import path from "path";

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
  pdf:  "application/pdf",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filename = segments.join("/");

  // Prevent directory traversal
  const normalized = path.normalize(filename);
  if (normalized.includes("..")) {
    return new Response("Forbidden", { status: 403 });
  }

  const filePath = path.join(process.cwd(), "public", "uploads", normalized);

  if (!fs.existsSync(filePath)) {
    return new Response("Not Found", { status: 404 });
  }

  const ext = path.extname(filename).replace(".", "").toLowerCase();
  const contentType = MIME_MAP[ext] ?? "application/octet-stream";

  const buffer = fs.readFileSync(filePath);
  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

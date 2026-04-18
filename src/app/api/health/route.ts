import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await pool.execute("SELECT 1");
    return Response.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
    });
  } catch {
    return Response.json({
      status: "error",
      db: "disconnected",
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}

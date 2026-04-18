import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { geolocateIP, isBot } from "@/lib/ip-geo";
import { ensureTables } from "@/lib/init-db";

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

// POST — record a new page visit
export async function POST(req: NextRequest) {
  try {
    await ensureTables();
    const body = (await req.json()) as {
      sessionId?: string;
      page?: string;
      referrer?: string;
      userAgent?: string;
    };

    const sessionId  = (body.sessionId  ?? "").slice(0, 64);
    const pagePath   = (body.page       ?? "/").slice(0, 500);
    const referrer   = (body.referrer   ?? "").slice(0, 500);
    const userAgent  = (body.userAgent  ?? req.headers.get("user-agent") ?? "").slice(0, 500);
    const ip         = getClientIP(req);
    const bot        = isBot(userAgent) ? 1 : 0;

    const geo = bot ? { country: "", region: "", city: "", lat: null, lng: null }
                    : await geolocateIP(ip);

    await pool.execute(
      `INSERT INTO analytics_visits
         (session_id, page_path, ip_address, user_agent, referrer,
          country, region, city, lat, lng, is_bot)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [sessionId, pagePath, ip, userAgent, referrer,
       geo.country, geo.region, geo.city, geo.lat, geo.lng, bot]
    );

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}

// PUT — update time spent for a session/page pair
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as { sessionId?: string; page?: string; timeSpentS?: number };
    const sessionId = (body.sessionId ?? "").slice(0, 64);
    const pagePath  = (body.page      ?? "/").slice(0, 500);
    const seconds   = Math.min(Math.max(Math.round(Number(body.timeSpentS ?? 0)), 0), 86400);

    if (sessionId) {
      await pool.execute(
        `UPDATE analytics_visits SET time_spent_s = ?
         WHERE session_id = ? AND page_path = ?
         ORDER BY created_at DESC LIMIT 1`,
        [seconds, sessionId, pagePath]
      );
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}

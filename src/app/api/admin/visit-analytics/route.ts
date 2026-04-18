import { getAdminFromRequest } from "@/lib/auth";
import pool from "@/lib/db";
import { ensureTables } from "@/lib/init-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!getAdminFromRequest(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTables();

    const url = new URL(request.url);
    const days = Math.min(Math.max(Number(url.searchParams.get("days") ?? 30), 1), 365);

    const [summary] = await pool.execute(
      `SELECT
         COUNT(*) AS total_visits,
         COUNT(DISTINCT ip_address) AS unique_ips,
         COUNT(DISTINCT session_id) AS unique_sessions,
         ROUND(AVG(NULLIF(time_spent_s,0))) AS avg_time_s,
         SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_visits
       FROM analytics_visits
       WHERE is_bot = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    const [topPages] = await pool.execute(
      `SELECT page_path, COUNT(*) AS visits,
              ROUND(AVG(NULLIF(time_spent_s,0))) AS avg_time_s
       FROM analytics_visits
       WHERE is_bot = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY page_path ORDER BY visits DESC LIMIT 20`,
      [days]
    );

    const [topCountries] = await pool.execute(
      `SELECT COALESCE(NULLIF(country,''),'Unknown') AS country,
              COUNT(*) AS visits, COUNT(DISTINCT ip_address) AS unique_ips
       FROM analytics_visits
       WHERE is_bot = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY country ORDER BY visits DESC LIMIT 20`,
      [days]
    );

    const [ipList] = await pool.execute(
      `SELECT ip_address, country, region, city, lat, lng,
              COUNT(*) AS visits,
              SUM(time_spent_s) AS total_time_s,
              MAX(created_at) AS last_seen
       FROM analytics_visits
       WHERE is_bot = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY ip_address, country, region, city, lat, lng
       ORDER BY visits DESC LIMIT 100`,
      [days]
    );

    const [mapPoints] = await pool.execute(
      `SELECT lat, lng, country, city,
              COUNT(*) AS visits
       FROM analytics_visits
       WHERE is_bot = 0 AND lat IS NOT NULL AND lng IS NOT NULL
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY lat, lng, country, city
       ORDER BY visits DESC LIMIT 500`,
      [days]
    );

    const [dailyTrend] = await pool.execute(
      `SELECT DATE(created_at) AS date, COUNT(*) AS visits
       FROM analytics_visits
       WHERE is_bot = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at) ORDER BY date ASC`,
      [days]
    );

    return Response.json({
      summary: (summary as unknown[])[0],
      topPages,
      topCountries,
      ipList,
      mapPoints,
      dailyTrend,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

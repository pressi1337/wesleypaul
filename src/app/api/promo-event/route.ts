import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export interface PromoEvent {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  event_date: string | null;
}

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT id, title, slug, excerpt, featured_image, event_date
      FROM posts
      WHERE post_type = 'event'
        AND status = 'published'
        AND event_date >= NOW() - INTERVAL 1 DAY
      ORDER BY event_date ASC
      LIMIT 1
    `);
    const arr = rows as PromoEvent[];
    if (arr.length > 0) {
      return Response.json({ event: arr[0] });
    }
  } catch { /* fall through */ }
  return Response.json({ event: null });
}

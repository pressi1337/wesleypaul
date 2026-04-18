import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [rows] = await pool.execute('SELECT * FROM analytics_config LIMIT 1');
    const configs = rows as Record<string, unknown>[];
    return Response.json({ config: configs[0] || null });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { ga_tracking_id, fb_pixel_id, gtm_id } = body;

    const [rows] = await pool.execute('SELECT id FROM analytics_config LIMIT 1');
    const existing = rows as { id: number }[];

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE analytics_config SET ga_tracking_id=?, fb_pixel_id=?, gtm_id=? WHERE id=?',
        [ga_tracking_id, fb_pixel_id, gtm_id, existing[0].id]
      );
    } else {
      await pool.execute(
        'INSERT INTO analytics_config (ga_tracking_id, fb_pixel_id, gtm_id) VALUES (?, ?, ?)',
        [ga_tracking_id, fb_pixel_id, gtm_id]
      );
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

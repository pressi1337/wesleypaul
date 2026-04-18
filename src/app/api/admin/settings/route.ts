import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [rows] = await pool.execute('SELECT setting_key, setting_value FROM site_settings');
    const settings: Record<string, string> = {};
    for (const row of rows as { setting_key: string; setting_value: string }[]) {
      settings[row.setting_key] = row.setting_value;
    }
    return Response.json({ settings });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as { settings: Record<string, string> };
    const { settings } = body;

    for (const [key, value] of Object.entries(settings)) {
      await pool.execute(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [rows] = await pool.execute('SELECT * FROM email_config LIMIT 1');
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
    const { smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name } = body;

    // Get existing record
    const [rows] = await pool.execute('SELECT id FROM email_config LIMIT 1');
    const existing = rows as { id: number }[];

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE email_config SET smtp_host=?, smtp_port=?, smtp_user=?, smtp_password=?, from_email=?, from_name=? WHERE id=?',
        [smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name, existing[0].id]
      );
    } else {
      await pool.execute(
        'INSERT INTO email_config (smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name) VALUES (?, ?, ?, ?, ?, ?)',
        [smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name]
      );
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { current_password, new_password } = await request.json() as {
      current_password: string;
      new_password: string;
    };

    if (!current_password || !new_password) {
      return Response.json({ error: 'Both fields are required' }, { status: 400 });
    }
    if (new_password.length < 8) {
      return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    const [rows] = await pool.execute(
      'SELECT id, password_hash FROM admin_users WHERE id = ?',
      [admin.id]
    );
    const users = rows as { id: number; password_hash: string }[];
    if (users.length === 0) return Response.json({ error: 'User not found' }, { status: 404 });

    const valid = await bcrypt.compare(current_password, users[0].password_hash);
    if (!valid) return Response.json({ error: 'Current password is incorrect' }, { status: 400 });

    const hash = await bcrypt.hash(new_password, 12);
    await pool.execute('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, admin.id]);
    await logAudit(request, "password_change", "auth", admin.id, `Password changed by ${admin.username}`);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

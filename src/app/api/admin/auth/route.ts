import pool from '@/lib/db';
import { signToken, getAdminFromRequest } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) {
    return Response.json({ authenticated: false }, { status: 401 });
  }
  return Response.json({ authenticated: true, user: admin });
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const [rows] = await pool.execute(
      'SELECT id, username, password_hash FROM admin_users WHERE username = ?',
      [username]
    );
    const users = rows as { id: number; username: string; password_hash: string }[];

    if (users.length === 0) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({ id: user.id, username: user.username });

    const response = Response.json({ success: true });
    const headers = new Headers(response.headers);
    headers.set(
      'Set-Cookie',
      `admin_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 3600}; SameSite=Lax`
    );

    return new Response(response.body, { status: 200, headers });
  } catch (error) {
    console.error('Auth error:', error);
    return Response.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = Response.json({ success: true });
  const headers = new Headers(response.headers);
  headers.set(
    'Set-Cookie',
    'admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
  );
  return new Response(response.body, { status: 200, headers });
}

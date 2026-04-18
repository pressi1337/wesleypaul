import { getAdminFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const formId = url.searchParams.get('form_id');

  try {
    let query = 'SELECT * FROM form_submissions';
    const params: string[] = [];
    if (formId) {
      query += ' WHERE form_id = ?';
      params.push(formId);
    }
    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    return Response.json({ submissions: rows });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as { id: number; status: string };
    await pool.execute('UPDATE form_submissions SET status = ? WHERE id = ?', [body.status, body.id]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as { id: number };
    await pool.execute('DELETE FROM form_submissions WHERE id = ?', [body.id]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { page_id, section_type, sort_order = 0, content_json = '{}' } = body;

    const [result] = await pool.execute(
      'INSERT INTO page_sections (page_id, section_type, sort_order, content_json) VALUES (?, ?, ?, ?)',
      [page_id, section_type, sort_order, content_json]
    );
    const insertResult = result as { insertId: number };
    return Response.json({ success: true, id: insertResult.insertId }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

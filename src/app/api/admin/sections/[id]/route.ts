import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { section_type, sort_order, content_json } = body;

    await pool.execute(
      'UPDATE page_sections SET section_type=?, sort_order=?, content_json=? WHERE id=?',
      [section_type, sort_order, content_json, id]
    );
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    await pool.execute('DELETE FROM page_sections WHERE id = ?', [id]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

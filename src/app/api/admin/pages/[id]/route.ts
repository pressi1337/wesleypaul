import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const [pageRows] = await pool.execute('SELECT * FROM pages WHERE id = ?', [id]);
    const pages = pageRows as Record<string, unknown>[];
    if (pages.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });

    const [sectionRows] = await pool.execute(
      'SELECT * FROM page_sections WHERE page_id = ? ORDER BY sort_order ASC',
      [id]
    );

    return Response.json({ page: pages[0], sections: sectionRows });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, layout, status, meta_title, meta_description, meta_keywords } = body;

    await pool.execute(
      'UPDATE pages SET title=?, slug=?, layout=?, status=?, meta_title=?, meta_description=?, meta_keywords=? WHERE id=?',
      [title, slug, layout, status, meta_title || '', meta_description || '', meta_keywords || '', id]
    );
    await logAudit(request, "update", "page", id, `Updated page: ${title}`);
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
    await pool.execute('DELETE FROM pages WHERE id = ?', [id]);
    await logAudit(request, "delete", "page", id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

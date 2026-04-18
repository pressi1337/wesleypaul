import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';
import { ensureHomePage } from '@/lib/init-db';

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureHomePage();

  try {
    const [rows] = await pool.execute(
      'SELECT id, title, slug, layout, status, meta_title, meta_description, meta_keywords, created_at, updated_at FROM pages ORDER BY updated_at DESC'
    );
    return Response.json({ pages: rows });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { title, slug, layout = 'standard', status = 'draft', meta_title = '', meta_description = '', meta_keywords = '' } = body;

    const [result] = await pool.execute(
      'INSERT INTO pages (title, slug, layout, status, meta_title, meta_description, meta_keywords) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, slug, layout, status, meta_title, meta_description, meta_keywords]
    );
    const insertResult = result as { insertId: number };
    return Response.json({ success: true, id: insertResult.insertId }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

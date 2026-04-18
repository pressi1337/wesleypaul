import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

/** GET site content by key or all keys */
export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  try {
    if (key) {
      const [rows] = await pool.execute(
        'SELECT content_key, content_json, updated_at FROM site_content WHERE content_key = ? LIMIT 1',
        [key]
      );
      const arr = rows as { content_key: string; content_json: string; updated_at: string }[];
      if (arr.length === 0) return Response.json({ data: null });
      return Response.json({ data: arr[0] });
    }
    const [rows] = await pool.execute('SELECT content_key, updated_at FROM site_content ORDER BY content_key');
    return Response.json({ items: rows });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

/** PUT upsert site content by key */
export async function PUT(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { content_key, content_json } = await request.json() as { content_key: string; content_json: string };
    if (!content_key || !content_json) {
      return Response.json({ error: 'content_key and content_json are required' }, { status: 400 });
    }
    await pool.execute(
      `INSERT INTO site_content (content_key, content_json)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE content_json = VALUES(content_json), updated_at = CURRENT_TIMESTAMP`,
      [content_key, content_json]
    );
    revalidatePath('/');
    revalidatePath('/admin/site-editor');
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

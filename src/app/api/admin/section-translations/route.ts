import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

/** GET /api/admin/section-translations?page_id=X
 *  Returns all section translations for every section on a page. */
export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const page_id = url.searchParams.get('page_id');
  if (!page_id) return Response.json({ error: 'page_id is required' }, { status: 400 });

  try {
    const [rows] = await pool.execute(
      `SELECT st.id, st.section_id, st.language_code, st.content_json, st.status, st.updated_at
       FROM section_translations st
       JOIN page_sections ps ON ps.id = st.section_id
       WHERE ps.page_id = ?
       ORDER BY ps.sort_order ASC, st.language_code ASC`,
      [page_id]
    );
    return Response.json({ section_translations: rows });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

/** POST /api/admin/section-translations
 *  Upsert a translated content_json for one section + language. */
export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { section_id, language_code, content_json, status = 'pending' } = await request.json() as {
      section_id: number;
      language_code: string;
      content_json: string;
      status?: string;
    };

    if (!section_id || !language_code || !content_json) {
      return Response.json({ error: 'section_id, language_code, content_json are required' }, { status: 400 });
    }

    await pool.execute(
      `INSERT INTO section_translations (section_id, language_code, content_json, status)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE content_json = VALUES(content_json), status = VALUES(status), updated_at = CURRENT_TIMESTAMP`,
      [section_id, language_code, content_json, status]
    );
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

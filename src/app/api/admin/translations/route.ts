import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const page_id = url.searchParams.get('page_id');

    // ── Per-page detail: return all translations for a page ───────────────
    if (page_id) {
      const [rows] = await pool.execute(
        'SELECT * FROM translations WHERE page_id = ? ORDER BY language_code, field_key',
        [page_id]
      );
      return Response.json({ translations: rows });
    }

    // ── Summary list: one row per page with language coverage ─────────────
    // We consider a language "present" if there is at least one translation row for it.
    // GROUP_CONCAT gives us a CSV of distinct language codes per page.
    const [rows] = await pool.execute(`
      SELECT
        p.id,
        p.title,
        p.slug,
        COUNT(DISTINCT t.id)                                           AS translation_count,
        COALESCE(
          GROUP_CONCAT(DISTINCT t.language_code ORDER BY t.language_code SEPARATOR ','),
          ''
        )                                                               AS languages_csv
      FROM pages p
      LEFT JOIN translations t ON t.page_id = p.id
      GROUP BY p.id, p.title, p.slug
      ORDER BY p.updated_at DESC
    `);

    // Parse languages_csv into an array on each row
    const pages = (rows as Array<{
      id: number;
      title: string;
      slug: string;
      translation_count: number;
      languages_csv: string;
    }>).map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      translation_count: Number(row.translation_count),
      languages: row.languages_csv ? row.languages_csv.split(',').filter(Boolean) : [],
    }));

    return Response.json({ pages });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as {
      page_id: number;
      language_code: string;
      field_key: string;
      content: string;
      status?: string;
    };
    const { page_id, language_code, field_key, content, status = 'pending' } = body;

    await pool.execute(
      `INSERT INTO translations (page_id, language_code, field_key, content, status)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE content = VALUES(content), status = VALUES(status)`,
      [page_id, language_code, field_key, content, status]
    );
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

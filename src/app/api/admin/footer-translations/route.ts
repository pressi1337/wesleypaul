import { getAdminFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

interface FooterRow { language_code: string; content_json: string; }

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang');

    if (lang) {
      const [rows] = await pool.execute('SELECT * FROM footer_translations WHERE language_code = ? LIMIT 1', [lang]);
      const items = rows as FooterRow[];
      if (items.length === 0) return Response.json({ translation: null });
      try {
        const parsed = JSON.parse(items[0].content_json) as Record<string, string>;
        return Response.json({ translation: parsed });
      } catch {
        return Response.json({ translation: null });
      }
    }

    const [rows] = await pool.execute('SELECT * FROM footer_translations');
    return Response.json({ translations: rows });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as {
      language_code: string;
      tagline?: string;
      cta_strip_text?: string;
      cta_strip_label?: string;
      content_json?: string;
    };
    const { language_code } = body;

    if (!language_code) return Response.json({ error: 'language_code required' }, { status: 400 });

    // Accept either flat fields or content_json blob
    const content = body.content_json
      ? body.content_json
      : JSON.stringify({ tagline: body.tagline ?? '', cta_strip_text: body.cta_strip_text ?? '', cta_strip_label: body.cta_strip_label ?? '' });

    await pool.execute(
      `INSERT INTO footer_translations (language_code, content_json)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE content_json = VALUES(content_json)`,
      [language_code, content]
    );

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

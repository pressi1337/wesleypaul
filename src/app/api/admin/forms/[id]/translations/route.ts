import { getAdminFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

async function ensureTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS form_translations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      form_id INT NOT NULL,
      language_code VARCHAR(10) NOT NULL,
      fields_json JSON,
      success_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_form_lang (form_id, language_code)
    )
  `);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    await ensureTable();
    const [rows] = await pool.execute(
      'SELECT language_code, fields_json, success_message FROM form_translations WHERE form_id = ?',
      [id]
    );
    const result: Record<string, { fields: unknown[]; success_message: string }> = {};
    for (const row of rows as { language_code: string; fields_json: unknown; success_message: string }[]) {
      const fields = Array.isArray(row.fields_json)
        ? row.fields_json as unknown[]
        : (() => { try { return JSON.parse(row.fields_json as string) as unknown[]; } catch { return []; } })();
      result[row.language_code] = { fields, success_message: row.success_message };
    }
    return Response.json({ translations: result });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    await ensureTable();
    const body = await request.json() as {
      language_code: string;
      fields: unknown[];
      success_message: string;
    };
    if (!body.language_code) return Response.json({ error: 'language_code required' }, { status: 400 });

    await pool.execute(
      `INSERT INTO form_translations (form_id, language_code, fields_json, success_message)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         fields_json = VALUES(fields_json),
         success_message = VALUES(success_message),
         updated_at = CURRENT_TIMESTAMP`,
      [id, body.language_code, JSON.stringify(body.fields), body.success_message ?? '']
    );
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang');
  if (!lang) return Response.json({ error: 'lang param required' }, { status: 400 });
  try {
    await pool.execute('DELETE FROM form_translations WHERE form_id = ? AND language_code = ?', [id, lang]);
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

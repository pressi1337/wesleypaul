import { getAdminFromRequest } from '@/lib/auth';
import pool from '@/lib/db';
import { ensureTables } from '@/lib/init-db';

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTables();

  try {
    const [rows] = await pool.execute(
      `SELECT id, name, description, created_at, updated_at,
        JSON_LENGTH(fields_json) as field_count
       FROM forms ORDER BY updated_at DESC`
    );
    return Response.json({ forms: rows });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as {
      name: string;
      description?: string;
      fields_json?: string;
      success_message?: string;
    };

    if (!body.name) return Response.json({ error: 'name is required' }, { status: 400 });

    const [result] = await pool.execute(
      `INSERT INTO forms (name, description, fields_json, success_message) VALUES (?, ?, ?, ?)`,
      [body.name, body.description || '', body.fields_json || '[]', body.success_message || 'Thank you! Your submission has been received.']
    );
    const insertResult = result as { insertId: number };
    const [rows] = await pool.execute('SELECT * FROM forms WHERE id = ?', [insertResult.insertId]);
    const forms = rows as unknown[];
    return Response.json({ form: forms[0] }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

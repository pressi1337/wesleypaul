import { getAdminFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const [rows] = await pool.execute('SELECT * FROM forms WHERE id = ?', [id]);
    const forms = rows as unknown[];
    if (forms.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ form: forms[0] });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await request.json() as {
      name?: string;
      description?: string;
      fields_json?: string;
      success_message?: string;
    };

    await pool.execute(
      `UPDATE forms SET name=?, description=?, fields_json=?, success_message=? WHERE id=?`,
      [body.name ?? '', body.description ?? '', body.fields_json ?? '[]', body.success_message ?? '', id]
    );

    const [rows] = await pool.execute('SELECT * FROM forms WHERE id = ?', [id]);
    const forms = rows as unknown[];
    return Response.json({ form: forms[0] });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    await pool.execute('DELETE FROM forms WHERE id = ?', [id]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

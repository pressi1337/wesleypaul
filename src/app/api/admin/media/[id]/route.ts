import fs from 'fs';
import path from 'path';
import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const [rows] = await pool.execute(
      'SELECT file_path FROM media WHERE id = ?',
      [id]
    );
    const media = rows as { file_path: string }[];
    if (media.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const filepath = path.join(process.cwd(), 'public', media[0].file_path);
    try {
      fs.unlinkSync(filepath);
    } catch {
      // file may not exist on disk, continue with DB deletion
    }

    await pool.execute('DELETE FROM media WHERE id = ?', [id]);
    return Response.json({ success: true });
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
    const body = await request.json() as { alt_text?: string };
    const { alt_text = '' } = body;

    await pool.execute(
      'UPDATE media SET alt_text = ? WHERE id = ?',
      [alt_text, id]
    );
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

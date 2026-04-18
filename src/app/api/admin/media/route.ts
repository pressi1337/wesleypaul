import fs from 'fs';
import path from 'path';
import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM media ORDER BY created_at DESC'
    );
    return Response.json({ media: rows });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = path.extname(file.name) || '';
    const filename = `${Date.now()}${ext}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const filepath = path.join(uploadsDir, filename);
    const filePath = `/uploads/${filename}`;

    fs.mkdirSync(uploadsDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    const [result] = await pool.execute(
      'INSERT INTO media (filename, original_name, file_path, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
      [filename, file.name, filePath, file.size, file.type]
    );
    const insertResult = result as { insertId: number };

    return Response.json({
      success: true,
      media: {
        id: insertResult.insertId,
        filename,
        file_path: filePath,
        original_name: file.name,
      },
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

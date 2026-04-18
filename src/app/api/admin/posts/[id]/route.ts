import { getAdminFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const [rows] = await pool.execute('SELECT * FROM posts WHERE id = ?', [id]);
    const posts = rows as unknown[];
    if (posts.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ post: posts[0] });
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
      title?: string;
      slug?: string;
      post_type?: string;
      excerpt?: string;
      content?: string;
      featured_image?: string;
      status?: string;
      event_date?: string | null;
      tags?: string;
      author?: string;
      translations_json?: string | null;
    };

    await pool.execute(
      `UPDATE posts SET title=?, slug=?, post_type=?, excerpt=?, content=?, featured_image=?, status=?, event_date=?, tags=?, author=?, translations_json=?
       WHERE id=?`,
      [body.title ?? '', body.slug ?? '', body.post_type ?? 'blog', body.excerpt ?? '', body.content ?? '', body.featured_image ?? '', body.status ?? 'draft', body.event_date ?? null, body.tags ?? '', body.author ?? '', body.translations_json ?? null, id]
    );

    const [rows] = await pool.execute('SELECT * FROM posts WHERE id = ?', [id]);
    const posts = rows as unknown[];
    return Response.json({ post: posts[0] });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    await pool.execute('DELETE FROM posts WHERE id = ?', [id]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

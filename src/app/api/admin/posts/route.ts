import { getAdminFromRequest } from '@/lib/auth';
import pool from '@/lib/db';
import { ensureTables } from '@/lib/init-db';

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTables();

  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  try {
    let query = 'SELECT * FROM posts';
    const params: string[] = [];
    if (type && ['blog', 'news', 'event'].includes(type)) {
      query += ' WHERE post_type = ?';
      params.push(type);
    }
    query += ' ORDER BY updated_at DESC';

    const [rows] = await pool.execute(query, params);
    return Response.json({ posts: rows });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as {
      title: string;
      slug: string;
      post_type?: string;
      excerpt?: string;
      content?: string;
      featured_image?: string;
      status?: string;
      event_date?: string | null;
      tags?: string;
      author?: string;
      translations_json?: string;
    };

    const { title, slug, post_type = 'blog', excerpt = '', content = '', featured_image = '', status = 'draft', event_date = null, tags = '', author = 'Wesley Paul Ministries', translations_json = null } = body;

    if (!title || !slug) return Response.json({ error: 'title and slug are required' }, { status: 400 });

    const [result] = await pool.execute(
      `INSERT INTO posts (title, slug, post_type, excerpt, content, featured_image, status, event_date, tags, author, translations_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, slug, post_type, excerpt, content, featured_image, status, event_date || null, tags, author, translations_json]
    );

    const insertResult = result as { insertId: number };
    const [rows] = await pool.execute('SELECT * FROM posts WHERE id = ?', [insertResult.insertId]);
    const posts = rows as unknown[];
    return Response.json({ post: posts[0] }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

import pool from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const limit = parseInt(url.searchParams.get('limit') || '6', 10);

  try {
    let query = "SELECT * FROM posts WHERE status = 'published'";
    const params: Array<string | number> = [];

    if (type && ['blog', 'news', 'event'].includes(type)) {
      query += ' AND post_type = ?';
      params.push(type);
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.execute(query, params);
    return Response.json({ posts: rows });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

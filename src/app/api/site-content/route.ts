import pool from '@/lib/db';

/** Public route — no auth needed. Returns site content by key. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  try {
    if (key) {
      const [rows] = await pool.execute(
        'SELECT content_json FROM site_content WHERE content_key = ? LIMIT 1',
        [key]
      );
      const arr = rows as { content_json: string }[];
      if (arr.length === 0) return Response.json({ data: null });
      try {
        return Response.json({ data: JSON.parse(arr[0].content_json) });
      } catch {
        return Response.json({ data: arr[0].content_json });
      }
    }

    // Return all keys (just keys, not full JSON)
    const [rows] = await pool.execute('SELECT content_key, updated_at FROM site_content ORDER BY content_key');
    return Response.json({ keys: rows });
  } catch {
    return Response.json({ data: null });
  }
}

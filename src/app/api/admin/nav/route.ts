import pool from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

/** GET all nav items (flat list, admin only) */
export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM nav_items ORDER BY COALESCE(parent_id, id), sort_order ASC'
    );
    return Response.json({ nav_items: rows });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

/** POST create new nav item */
export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { label, href, parent_id = null, sort_order = 0, open_new_tab = 0 } = await request.json() as {
      label: string; href: string; parent_id?: number | null;
      sort_order?: number; open_new_tab?: number;
    };
    const [result] = await pool.execute(
      'INSERT INTO nav_items (label, href, parent_id, sort_order, open_new_tab) VALUES (?, ?, ?, ?, ?)',
      [label, href, parent_id, sort_order, open_new_tab]
    );
    return Response.json({ success: true, id: (result as { insertId: number }).insertId }, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

/** PUT bulk-update sort orders */
export async function PUT(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { items } = await request.json() as {
      items: { id: number; label: string; href: string; parent_id: number | null; sort_order: number; is_active: number; open_new_tab: number }[];
    };
    for (const item of items) {
      await pool.execute(
        'UPDATE nav_items SET label=?, href=?, parent_id=?, sort_order=?, is_active=?, open_new_tab=? WHERE id=?',
        [item.label, item.href, item.parent_id, item.sort_order, item.is_active, item.open_new_tab, item.id]
      );
    }
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

/** DELETE nav item by id (pass ?id=X) */
export async function DELETE(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    await pool.execute('DELETE FROM nav_items WHERE id = ?', [id]);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

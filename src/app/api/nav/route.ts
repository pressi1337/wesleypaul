import pool from '@/lib/db';

export interface NavItem {
  id: number;
  label: string;
  href: string;
  parent_id: number | null;
  sort_order: number;
  is_active: number;
  open_new_tab: number;
  children?: NavItem[];
}

/** Public route — no auth needed. Returns full nav tree. */
export async function GET() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, label, href, parent_id, sort_order, is_active, open_new_tab FROM nav_items WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    const flat = rows as NavItem[];

    // Build tree: top-level items with children[]
    const topLevel = flat.filter(i => i.parent_id === null);
    const tree = topLevel.map(item => ({
      ...item,
      children: flat.filter(c => c.parent_id === item.id),
    }));

    return Response.json({ nav: tree });
  } catch {
    // Return static fallback if DB not ready yet
    return Response.json({ nav: [] });
  }
}

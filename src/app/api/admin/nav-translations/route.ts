import { getAdminFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

interface NavItem {
  id: number;
  label: string;
  href: string;
  parent_id: number | null;
  sort_order: number;
}

interface NavTranslationRow {
  nav_item_id: number;
  language_code: string;
  translated_label: string;
}

export async function GET(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [navRows] = await pool.execute('SELECT * FROM nav_items ORDER BY sort_order ASC');
    const navItems = navRows as NavItem[];

    const [trRows] = await pool.execute('SELECT * FROM nav_translations');
    const translations = trRows as NavTranslationRow[];

    const items = navItems.map(item => {
      const itemTranslations: Record<string, string> = {};
      translations
        .filter(t => t.nav_item_id === item.id)
        .forEach(t => { itemTranslations[t.language_code] = t.translated_label; });
      return { ...item, translations: itemTranslations };
    });

    return Response.json({ items });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as { nav_item_id: number; language_code: string; translated_label: string };
    const { nav_item_id, language_code, translated_label } = body;

    await pool.execute(
      `INSERT INTO nav_translations (nav_item_id, language_code, translated_label)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE translated_label = VALUES(translated_label)`,
      [nav_item_id, language_code, translated_label]
    );

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

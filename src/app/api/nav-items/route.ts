import pool from '@/lib/db';

interface NavItem {
  id: number;
  label: string;
  href: string;
  parent_id: number | null;
  sort_order: number;
  is_active: number;
  open_new_tab: number;
}

interface NavTranslationRow {
  nav_item_id: number;
  language_code: string;
  translated_label: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') || 'en';

  try {
    const [navRows] = await pool.execute(
      'SELECT * FROM nav_items WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    const navItems = navRows as NavItem[];

    if (lang !== 'en') {
      const [trRows] = await pool.execute(
        'SELECT * FROM nav_translations WHERE language_code = ?',
        [lang]
      );
      const translations = trRows as NavTranslationRow[];

      const translated = navItems.map(item => {
        const tr = translations.find(t => t.nav_item_id === item.id);
        return { ...item, label: tr ? tr.translated_label : item.label };
      });

      return Response.json({ items: translated });
    }

    return Response.json({ items: navItems });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

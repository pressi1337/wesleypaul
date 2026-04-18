import pool from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public endpoint — returns nav items with translated labels for the given ?lang= */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") ?? "en";

  try {
    const [navRows] = await pool.execute(
      "SELECT id, label, href, parent_id FROM nav_items WHERE is_active = 1 ORDER BY COALESCE(parent_id, id), sort_order ASC"
    );
    const navItems = navRows as Array<{ id: number; label: string; href: string; parent_id: number | null }>;

    if (lang === "en") {
      return Response.json({ items: navItems });
    }

    const [trRows] = await pool.execute(
      "SELECT nav_item_id, translated_label FROM nav_translations WHERE language_code = ?",
      [lang]
    );
    const translations = trRows as Array<{ nav_item_id: number; translated_label: string }>;
    const trMap: Record<number, string> = {};
    translations.forEach(t => { trMap[t.nav_item_id] = t.translated_label; });

    const items = navItems.map(item => ({
      id: item.id,
      label: trMap[item.id] || item.label,
      href: item.href,
      parent_id: item.parent_id,
    }));

    return Response.json({ items });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

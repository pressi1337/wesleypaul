import { Suspense } from "react";
import pool from "@/lib/db";
import Navbar, { NavItemData } from "./Navbar";

interface DbNavItem {
  id: number;
  label: string;
  href: string;
  parent_id: number | null;
  sort_order: number;
  is_active: number;
  open_new_tab: number;
}

async function getLogoUrl(): Promise<string> {
  try {
    const [rows] = await pool.execute(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'logo_url' LIMIT 1"
    );
    const val = (rows as { setting_value: string }[])[0]?.setting_value;
    return val || "/logo-nav.png";
  } catch {
    return "/logo-nav.png";
  }
}

export default async function NavbarServer() {
  const logo = await getLogoUrl();
  try {
    const [rows] = await pool.execute(
      "SELECT id, label, href, parent_id, sort_order, is_active, open_new_tab FROM nav_items WHERE is_active = 1 ORDER BY COALESCE(parent_id, id), sort_order ASC"
    );
    const flat = rows as DbNavItem[];
    const topLevel = flat.filter((i) => i.parent_id === null);
    const items: NavItemData[] = topLevel.map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      open_new_tab: item.open_new_tab,
      children: flat
        .filter((c) => c.parent_id === item.id)
        .map((c) => ({ id: c.id, label: c.label, href: c.href, open_new_tab: c.open_new_tab })),
    }));
    return <Suspense fallback={null}><Navbar items={items} logo={logo} /></Suspense>;
  } catch {
    return <Suspense fallback={null}><Navbar logo={logo} /></Suspense>;
  }
}

import { Suspense } from "react";
import pool from "@/lib/db";
import Navbar, { NavItemData, SocialUrls } from "./Navbar";

interface DbNavItem {
  id: number;
  label: string;
  href: string;
  parent_id: number | null;
  sort_order: number;
  is_active: number;
  open_new_tab: number;
}

async function getSiteSettings(): Promise<{ logo: string; social: SocialUrls }> {
  try {
    const [rows] = await pool.execute(
      "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('logo_url','facebook_url','youtube_url','instagram_url')"
    );
    const map: Record<string, string> = {};
    for (const r of rows as { setting_key: string; setting_value: string }[]) {
      map[r.setting_key] = r.setting_value;
    }
    return {
      logo:   map.logo_url    || "/logo-nav.png",
      social: {
        facebook:  map.facebook_url  || undefined,
        youtube:   map.youtube_url   || undefined,
        instagram: map.instagram_url || undefined,
      },
    };
  } catch {
    return { logo: "/logo-nav.png", social: {} };
  }
}

export default async function NavbarServer() {
  const { logo, social } = await getSiteSettings();
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
    return <Suspense fallback={null}><Navbar items={items} logo={logo} socialUrls={social} /></Suspense>;
  } catch {
    return <Suspense fallback={null}><Navbar logo={logo} socialUrls={social} /></Suspense>;
  }
}

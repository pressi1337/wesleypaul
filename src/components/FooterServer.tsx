import { Suspense } from "react";
import pool from "@/lib/db";
import Footer, { FooterSettings } from "./Footer";

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

export default async function FooterServer() {
  const logo = await getLogoUrl();
  try {
    const [rows] = await pool.execute(
      "SELECT content_json FROM site_content WHERE content_key = 'footer_settings' LIMIT 1"
    );
    const arr = rows as { content_json: string }[];
    if (arr.length > 0) {
      const settings = JSON.parse(arr[0].content_json) as FooterSettings;
      return <Suspense fallback={null}><Footer settings={settings} logo={logo} /></Suspense>;
    }
  } catch {
    // Fall back to default if DB not ready
  }
  return <Suspense fallback={null}><Footer logo={logo} /></Suspense>;
}

import pool from "@/lib/db";
import { LANG_OPTIONS } from "@/lib/languages";

export const dynamic = "force-dynamic";

/** Public endpoint — returns the currently active (enabled) languages. */
export async function GET() {
  try {
    const [rows] = await pool.execute(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'active_languages' LIMIT 1"
    );
    const arr = rows as { setting_value: string }[];
    if (arr.length > 0) {
      const langs = JSON.parse(arr[0].setting_value) as Array<{ code: string; label: string; nativeLabel: string; flag: string; enabled?: boolean }>;
      const active = langs.filter(l => l.enabled !== false);
      return Response.json({ languages: active });
    }
  } catch { /* fall through to default */ }

  // Default: return all non-English languages from languages.ts
  const defaults = LANG_OPTIONS
    .filter(l => !l.isDefault)
    .map(l => ({ code: l.code, label: l.label, nativeLabel: l.nativeLabel, flag: l.flag }));
  return Response.json({ languages: defaults });
}

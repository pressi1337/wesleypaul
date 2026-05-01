import pool from "@/lib/db";
import { LANG_OPTIONS } from "@/lib/languages";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type LangRow = { code: string; label: string; nativeLabel: string; flag: string; enabled?: boolean };

/** Public endpoint — returns the currently active (enabled) languages.
 *  ?modal=1  → filtered to only the languages selected for the first-visit modal. */
export async function GET(req: NextRequest) {
  const forModal = req.nextUrl.searchParams.get("modal") === "1";

  try {
    const [rows] = await pool.execute(
      "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('active_languages','lang_modal_languages')"
    );
    const arr = rows as { setting_key: string; setting_value: string }[];
    const byKey: Record<string, string> = {};
    for (const r of arr) byKey[r.setting_key] = r.setting_value;

    const allLangs: LangRow[] = byKey.active_languages
      ? (JSON.parse(byKey.active_languages) as LangRow[])
      : [];
    const active = allLangs.filter(l => l.enabled !== false);

    if (forModal && byKey.lang_modal_languages) {
      const modalCodes = JSON.parse(byKey.lang_modal_languages) as string[];
      const filtered = active.filter(l => modalCodes.includes(l.code));
      return Response.json({ languages: filtered });
    }

    if (active.length > 0) return Response.json({ languages: active });
  } catch { /* fall through to default */ }

  const defaults = LANG_OPTIONS
    .filter(l => !l.isDefault)
    .map(l => ({ code: l.code, label: l.label, nativeLabel: l.nativeLabel, flag: l.flag }));
  return Response.json({ languages: defaults });
}

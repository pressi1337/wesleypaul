import pool from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public endpoint — returns footer translation for the given ?lang= */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") ?? "en";

  if (lang === "en") return Response.json({ translation: null });

  try {
    const [rows] = await pool.execute(
      "SELECT content_json FROM footer_translations WHERE language_code = ? LIMIT 1",
      [lang]
    );
    const arr = rows as Array<{ content_json: string }>;
    if (arr.length === 0) return Response.json({ translation: null });
    try {
      return Response.json({ translation: JSON.parse(arr[0].content_json) });
    } catch {
      return Response.json({ translation: null });
    }
  } catch {
    return Response.json({ translation: null });
  }
}

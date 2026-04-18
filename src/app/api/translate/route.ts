export const dynamic = "force-dynamic";

/**
 * Public translation endpoint — uses MyMemory free API.
 * POST { texts: string[], lang: string } → { results: string[] }
 * All texts are translated in parallel for speed.
 */
export async function POST(request: Request) {
  try {
    const { texts, lang } = await request.json() as { texts: string[]; lang: string };

    if (!lang || lang === "en" || !Array.isArray(texts) || texts.length === 0) {
      return Response.json({ results: texts ?? [] });
    }

    const translateOne = async (text: string): Promise<string> => {
      if (!text || !text.trim()) return text;
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=en|${lang}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const d = await res.json() as { responseStatus: number; responseData: { translatedText: string } };
        return d.responseStatus === 200 ? d.responseData.translatedText : text;
      } catch {
        return text;
      }
    };

    // Translate all in parallel — significantly faster than sequential
    const results = await Promise.all(texts.map(translateOne));
    return Response.json({ results });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

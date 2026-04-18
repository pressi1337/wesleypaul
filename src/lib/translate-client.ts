/**
 * Client-side translation helpers.
 * Uses Google Translate (unofficial endpoint) — no API key, high rate limits.
 * Each visitor's browser makes the request from their own IP.
 */

async function translateOne(text: string, lang: string): Promise<string> {
  if (!text || !text.trim()) return text;
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=en&tl=${encodeURIComponent(lang)}&dt=t` +
    `&q=${encodeURIComponent(text.slice(0, 500))}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // Response shape: [ [[translated_chunk, original_chunk], ...], null, "en", ... ]
  const d = await res.json() as [Array<[string, string]>];
  const translated = d[0]?.map((chunk) => chunk[0]).join("") ?? "";
  if (!translated) throw new Error("Empty translation response");
  return translated;
}

/**
 * Translate all strings in parallel from the browser.
 * Uses allSettled — individual failures fall back to original text.
 * Throws if ALL translations failed so callers know not to cache.
 */
export async function translateBatch(texts: string[], lang: string): Promise<string[]> {
  if (!lang || lang === "en" || texts.length === 0) return texts;
  const settled = await Promise.allSettled(texts.map(t => translateOne(t, lang)));
  if (settled.every(r => r.status === "rejected")) {
    throw new Error("All translations failed");
  }
  return settled.map((r, i) => r.status === "fulfilled" ? r.value : texts[i]);
}

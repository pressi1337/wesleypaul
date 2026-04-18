import { getAdminFromRequest } from '@/lib/auth';
import pool from '@/lib/db';

// ── Provider helpers ─────────────────────────────────────────────────────────

async function getProviderSettings(): Promise<Record<string, string>> {
  try {
    const [rows] = await pool.execute(
      "SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('translate_provider','google_translate_key','deepl_api_key') LIMIT 3"
    );
    const map: Record<string, string> = {};
    (rows as { setting_key: string; setting_value: string }[]).forEach(r => {
      map[r.setting_key] = r.setting_value;
    });
    return map;
  } catch {
    return {};
  }
}

async function translateWithMyMemory(text: string, target: string): Promise<string> {
  const encoded = encodeURIComponent(text.trim());
  const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|${target}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  const data = await res.json() as { responseStatus: number; responseData: { translatedText: string } };
  if (data.responseStatus !== 200) throw new Error('MyMemory API error');
  return data.responseData.translatedText;
}

/**
 * Unofficial Google Translate endpoint — no API key required.
 * Same endpoint used by translate-client.ts on the client side.
 * Higher limits than MyMemory; used as the default server-side fallback.
 */
async function translateWithGoogleFree(text: string, target: string): Promise<string> {
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=en&tl=${encodeURIComponent(target)}&dt=t` +
    `&q=${encodeURIComponent(text.trim().slice(0, 500))}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Google free translate HTTP ${res.status}`);
  const d = await res.json() as [Array<[string, string]>];
  const translated = d[0]?.map((chunk: [string, string]) => chunk[0]).join('') ?? '';
  if (!translated) throw new Error('Empty response from Google free translate');
  return translated;
}

async function translateWithGoogle(text: string, target: string, apiKey: string): Promise<string> {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source: 'en', target, format: 'text' }),
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json() as { data?: { translations?: [{ translatedText: string }] }; error?: { message: string } };
  if (data.error) throw new Error(`Google Translate: ${data.error.message}`);
  return data.data?.translations?.[0]?.translatedText ?? text;
}

async function translateWithDeepL(text: string, target: string, apiKey: string): Promise<string> {
  // Keys ending in ":fx" use the free API host
  const host = apiKey.endsWith(':fx') ? 'api-free.deepl.com' : 'api.deepl.com';
  const res = await fetch(`https://${host}/v2/translate`, {
    method: 'POST',
    headers: { 'Authorization': `DeepL-Auth-Key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: [text], source_lang: 'EN', target_lang: target.toUpperCase() }),
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json() as { translations?: [{ text: string }]; message?: string };
  if (!data.translations) throw new Error(`DeepL: ${data.message ?? 'unknown error'}`);
  return data.translations[0].text;
}

/** Translate a single string using the configured provider. */
async function translateText(text: string, target: string, settings: Record<string, string>): Promise<string> {
  const provider = settings.translate_provider || 'google_free';
  if (provider === 'google' && settings.google_translate_key) {
    return translateWithGoogle(text, target, settings.google_translate_key);
  }
  if (provider === 'deepl' && settings.deepl_api_key) {
    return translateWithDeepL(text, target, settings.deepl_api_key);
  }
  if (provider === 'mymemory') {
    return translateWithMyMemory(text, target);
  }
  // Default: unofficial Google free endpoint (no key, high limits)
  return translateWithGoogleFree(text, target);
}

/** Small delay to be respectful of free-tier rate limits. */
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Field extraction ─────────────────────────────────────────────────────────

function extractTextFields(
  section_type: string,
  content: Record<string, unknown>
): Array<{ path: string; value: string }> {
  const out: Array<{ path: string; value: string }> = [];
  const addStr = (path: string, val: unknown) => {
    if (typeof val === 'string' && val.trim()) out.push({ path, value: val });
  };

  switch (section_type) {
    case 'hero':
      addStr('heading', content.heading);
      addStr('subheading', content.subheading);
      addStr('cta_text', content.cta_text);
      break;
    case 'text':
      addStr('heading', content.heading);
      addStr('body', content.body);
      break;
    case 'gallery':
      addStr('heading', content.heading);
      if (Array.isArray(content.items)) {
        (content.items as Record<string, unknown>[]).forEach((item, i) => {
          addStr(`items.${i}.caption`, item.caption);
        });
      }
      break;
    case 'cta':
      addStr('heading', content.heading);
      addStr('body', content.body);
      addStr('primary_cta_text', content.primary_cta_text);
      addStr('secondary_cta_text', content.secondary_cta_text);
      break;
    case 'faq':
      addStr('heading', content.heading);
      if (Array.isArray(content.items)) {
        (content.items as Record<string, unknown>[]).forEach((item, i) => {
          addStr(`items.${i}.question`, item.question);
          addStr(`items.${i}.answer`, item.answer);
        });
      }
      break;
    case 'team':
      addStr('heading', content.heading);
      if (Array.isArray(content.items)) {
        (content.items as Record<string, unknown>[]).forEach((item, i) => {
          addStr(`items.${i}.name`, item.name);
          addStr(`items.${i}.role`, item.role);
          addStr(`items.${i}.bio`, item.bio);
        });
      }
      break;
    case 'page_header':
      addStr('eyebrow', content.eyebrow);
      addStr('heading', content.heading);
      addStr('subheading', content.subheading);
      break;
    case 'two_col':
      addStr('label', content.label);
      addStr('heading', content.heading);
      addStr('body', content.body);
      addStr('cta_label', content.cta_label);
      addStr('cta_secondary_label', content.cta_secondary_label);
      break;
    case 'cards_grid':
      addStr('heading', content.heading);
      addStr('subtitle', content.subtitle);
      if (Array.isArray(content.items)) {
        (content.items as Record<string, unknown>[]).forEach((item, i) => {
          addStr(`items.${i}.title`, item.title);
          addStr(`items.${i}.description`, item.description);
        });
      }
      break;
    case 'sermons_grid':
      addStr('heading', content.heading);
      addStr('subtitle', content.subtitle);
      if (Array.isArray(content.items)) {
        (content.items as Record<string, unknown>[]).forEach((item, i) => {
          addStr(`items.${i}.title`, item.title);
        });
      }
      break;
    case 'contact_form':
      addStr('heading', content.heading);
      addStr('hours', content.hours);
      break;
    case 'custom_form':
      addStr('heading', content.heading);
      addStr('form_heading', content.form_heading);
      // description is rich HTML — translate as plain text so tags aren't corrupted
      if (typeof content.description === 'string' && content.description.trim()) {
        // Strip HTML tags, translate the text, then wrap in a <p>
        const plain = content.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (plain) out.push({ path: 'description_plain', value: plain });
      }
      break;
    case 'latest_posts':
      addStr('heading', content.heading);
      addStr('subtitle', content.subtitle);
      break;
    case 'donate_strip':
      addStr('text', content.text);
      addStr('button_label', content.button_label);
      break;
  }

  return out;
}

function setAtPath(
  obj: Record<string, unknown>,
  path: string,
  value: string
): Record<string, unknown> {
  const parts = path.split('.');
  if (parts.length === 1) return { ...obj, [path]: value };
  const [head, ...rest] = parts;
  if (head === 'items' && !isNaN(Number(rest[0]))) {
    const idx = Number(rest[0]);
    const restPath = rest.slice(1).join('.');
    const arr = Array.isArray(obj.items)
      ? [...(obj.items as Record<string, unknown>[])]
      : [];
    arr[idx] = setAtPath((arr[idx] as Record<string, unknown>) ?? {}, restPath, value);
    return { ...obj, items: arr };
  }
  return {
    ...obj,
    [head]: setAtPath((obj[head] as Record<string, unknown>) ?? {}, rest.join('.'), value),
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const admin = getAdminFromRequest(request);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json() as {
      text?: string;
      section_type?: string;
      content_json?: string;
      target: string;
    };

    const { target } = body;
    if (!target || typeof target !== 'string') {
      return Response.json({ error: 'target language is required' }, { status: 400 });
    }

    // Load provider config from DB (cached per request)
    const settings = await getProviderSettings();

    // ── Single text mode ─────────────────────────────────────────────────────
    if (body.text) {
      const translated = await translateText(body.text, target, settings);
      return Response.json({ success: true, translated });
    }

    // ── Section batch mode ───────────────────────────────────────────────────
    if (body.section_type && body.content_json) {
      let content: Record<string, unknown>;
      try {
        content = JSON.parse(body.content_json) as Record<string, unknown>;
      } catch {
        return Response.json({ error: 'Invalid content_json' }, { status: 400 });
      }

      const fields = extractTextFields(body.section_type, content);

      if (fields.length === 0) {
        return Response.json({ success: true, translated_content_json: body.content_json });
      }

      let translated = { ...content };

      for (const field of fields) {
        try {
          const result = await translateText(field.value, target, settings);
          if (field.path === 'description_plain') {
            // Wrap the translated plain text back into a simple paragraph
            translated = setAtPath(translated, 'description', `<p>${result}</p>`);
          } else {
            translated = setAtPath(translated, field.path, result);
          }
          // Small delay only when using MyMemory free tier
          const provider = settings.translate_provider || 'google_free';
          if (provider === 'mymemory') await delay(150);
        } catch {
          // On failure keep original value for this field
        }
      }

      return Response.json({
        success: true,
        translated_content_json: JSON.stringify(translated),
      });
    }

    return Response.json({ error: 'Provide either text or section_type + content_json' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

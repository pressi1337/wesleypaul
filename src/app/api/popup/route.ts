import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export interface PopupLangContent {
  media_url?: string;
  poster_url?: string;
  title?: string;
  description?: string;
  cta_label?: string;
  show_media?: boolean; // override per language
}

export interface PopupConfig {
  enabled: boolean;
  type: "video" | "image";
  // Default (English) content
  media_url: string;
  poster_url: string;
  title: string;
  description: string;
  cta_label: string;
  cta_href: string;
  cta_external: boolean;
  show_once: boolean;
  show_delay: number;
  home_only: boolean;
  show_media: boolean; // false = content-only, no image/video shown
  // Per-language overrides keyed by lang code
  translations?: Record<string, PopupLangContent>;
}

const DEFAULT_CONFIG: PopupConfig = {
  enabled: false,
  type: "image",
  media_url: "",
  poster_url: "",
  title: "",
  description: "",
  cta_label: "Learn More",
  cta_href: "/",
  cta_external: false,
  show_once: true,
  show_delay: 1,
  home_only: true,
  show_media: true,
  translations: {},
};

export async function GET() {
  try {
    const [rows] = await pool.execute(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'promo_popup' LIMIT 1"
    );
    const arr = rows as { setting_value: string }[];
    if (arr.length > 0) {
      const config = { ...DEFAULT_CONFIG, ...(JSON.parse(arr[0].setting_value) as Partial<PopupConfig>) };
      return Response.json({ config });
    }
  } catch { /* fall through */ }
  return Response.json({ config: DEFAULT_CONFIG });
}

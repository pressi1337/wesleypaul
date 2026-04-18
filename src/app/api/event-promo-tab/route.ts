import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export interface EventPromoTabLangContent {
  title?: string;
  subtitle?: string;
  cta_label?: string;
  tab_label?: string;
}

export interface EventPromoTabConfig {
  enabled: boolean;
  tab_label: string;
  title: string;
  subtitle: string;
  event_date: string;
  image_url: string;
  cta_label: string;
  cta_href: string;
  translations?: Record<string, EventPromoTabLangContent>;
}

const DEFAULT: EventPromoTabConfig = {
  enabled: false,
  tab_label: "Events",
  title: "",
  subtitle: "",
  event_date: "",
  image_url: "",
  cta_label: "View Details",
  cta_href: "",
  translations: {},
};

export async function GET() {
  try {
    const [rows] = await pool.execute(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'event_promo_tab' LIMIT 1"
    );
    const arr = rows as { setting_value: string }[];
    const cfg: EventPromoTabConfig = arr.length > 0
      ? { ...DEFAULT, ...(JSON.parse(arr[0].setting_value) as Partial<EventPromoTabConfig>) }
      : { ...DEFAULT };
    return Response.json({ config: cfg });
  } catch {
    return Response.json({ config: DEFAULT });
  }
}

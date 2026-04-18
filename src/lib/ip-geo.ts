import pool from "./db";

export interface GeoInfo {
  country: string;
  region: string;
  city: string;
  lat: number | null;
  lng: number | null;
}

const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^localhost$/i,
];

export function isPrivateIP(ip: string): boolean {
  return PRIVATE_RANGES.some(r => r.test(ip));
}

export async function geolocateIP(ip: string): Promise<GeoInfo> {
  const empty: GeoInfo = { country: "", region: "", city: "", lat: null, lng: null };
  if (!ip || isPrivateIP(ip)) return empty;

  // Check cache first
  try {
    const [rows] = await pool.execute(
      "SELECT country, region, city, lat, lng FROM ip_geocache WHERE ip_address = ? LIMIT 1",
      [ip]
    );
    const arr = rows as GeoInfo[];
    if (arr.length > 0) return arr[0];
  } catch { /* fall through to API */ }

  // Call ip-api.com (free, no key, 45 req/min, server-side only)
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return empty;
    const data = (await res.json()) as {
      status: string; country?: string; regionName?: string;
      city?: string; lat?: number; lon?: number;
    };
    if (data.status !== "success") return empty;

    const geo: GeoInfo = {
      country: data.country  ?? "",
      region:  data.regionName ?? "",
      city:    data.city     ?? "",
      lat:     data.lat      ?? null,
      lng:     data.lon      ?? null,
    };

    // Cache result
    await pool.execute(
      `INSERT INTO ip_geocache (ip_address, country, region, city, lat, lng)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE country=VALUES(country), region=VALUES(region),
         city=VALUES(city), lat=VALUES(lat), lng=VALUES(lng)`,
      [ip, geo.country, geo.region, geo.city, geo.lat, geo.lng]
    ).catch(() => {});

    return geo;
  } catch {
    return empty;
  }
}

const BOT_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /slurp/i, /facebookexternalhit/i,
  /Twitterbot/i, /LinkedInBot/i, /WhatsApp/i, /Googlebot/i, /bingbot/i,
  /Applebot/i, /DuckDuckBot/i, /YandexBot/i, /Sogou/i,
];

export function isBot(userAgent: string): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some(p => p.test(userAgent));
}

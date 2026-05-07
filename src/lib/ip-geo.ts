import pool from "./db";

export interface GeoInfo {
  country: string;
  region: string;
  city: string;
  lat: number | null;
  lng: number | null;
}

// ── Normalise IPv4-mapped IPv6 → plain IPv4 ─────────────────────────────────
// e.g. "::ffff:103.214.63.218" → "103.214.63.218"
// Fixes private-IP detection and geo-API compatibility.
export function normalizeIP(ip: string): string {
  const m = ip.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  return m ? m[1] : ip;
}

const PRIVATE_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^localhost$/i,
  /^0\.0\.0\.0$/,
  /^fc00:/i,   // IPv6 unique local
  /^fe80:/i,   // IPv6 link-local
];

export function isPrivateIP(ip: string): boolean {
  const normalized = normalizeIP(ip);
  return PRIVATE_RANGES.some(r => r.test(normalized));
}

// ── Primary: ipinfo.io — HTTPS, 50 k req/month free, very reliable ──────────
async function geoViaIpInfo(ip: string): Promise<GeoInfo | null> {
  try {
    const res = await fetch(`https://ipinfo.io/${ip}/json`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const d = (await res.json()) as {
      country?: string; region?: string; city?: string;
      loc?: string; // "lat,lng"
      bogon?: boolean;
    };
    if (d.bogon || !d.country) return null;

    let lat: number | null = null;
    let lng: number | null = null;
    if (d.loc) {
      const [la, lo] = d.loc.split(",").map(Number);
      if (!isNaN(la) && !isNaN(lo)) { lat = la; lng = lo; }
    }
    return {
      country: d.country  ?? "",
      region:  d.region   ?? "",
      city:    d.city     ?? "",
      lat, lng,
    };
  } catch { return null; }
}

// ── Fallback: ip-api.com — HTTP, 45 req/min free ────────────────────────────
async function geoViaIpApi(ip: string): Promise<GeoInfo | null> {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const d = (await res.json()) as {
      status: string; country?: string; regionName?: string;
      city?: string; lat?: number; lon?: number;
    };
    if (d.status !== "success") return null;
    return {
      country: d.country     ?? "",
      region:  d.regionName  ?? "",
      city:    d.city        ?? "",
      lat:     d.lat         ?? null,
      lng:     d.lon         ?? null,
    };
  } catch { return null; }
}

export async function geolocateIP(rawIp: string): Promise<GeoInfo> {
  const empty: GeoInfo = { country: "", region: "", city: "", lat: null, lng: null };
  if (!rawIp || rawIp === "unknown") return empty;

  const ip = normalizeIP(rawIp);
  if (isPrivateIP(ip)) return empty;

  // ── Check DB cache (keyed on the NORMALISED ip) ────────────────────────────
  try {
    const [rows] = await pool.execute(
      "SELECT country, region, city, lat, lng FROM ip_geocache WHERE ip_address = ? LIMIT 1",
      [ip]
    );
    const arr = rows as GeoInfo[];
    if (arr.length > 0 && arr[0].country) return arr[0];
  } catch { /* fall through */ }

  // ── Fetch geo — try ipinfo.io first, fall back to ip-api.com ──────────────
  const geo = (await geoViaIpInfo(ip)) ?? (await geoViaIpApi(ip)) ?? empty;

  // ── Cache result (normalised ip as key) ────────────────────────────────────
  if (geo.country) {
    await pool.execute(
      `INSERT INTO ip_geocache (ip_address, country, region, city, lat, lng)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE country=VALUES(country), region=VALUES(region),
         city=VALUES(city), lat=VALUES(lat), lng=VALUES(lng)`,
      [ip, geo.country, geo.region, geo.city, geo.lat, geo.lng]
    ).catch(() => {});
  }

  return geo;
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

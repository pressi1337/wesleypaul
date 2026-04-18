export const revalidate = 60;

import Link from "next/link";
import pool from "@/lib/db";
import { ensureTables } from "@/lib/init-db";

interface Post {
  id: number; title: string; slug: string; excerpt: string;
  featured_image: string; event_date: string | null; created_at: string;
  translations_json: string | null;
}

interface LangTranslation { title?: string; excerpt?: string; content?: string; }

async function getEvents() {
  await ensureTables();
  try {
    const [rows] = await pool.execute(
      "SELECT id,title,slug,excerpt,featured_image,event_date,created_at,translations_json FROM posts WHERE status='published' AND post_type='event' ORDER BY COALESCE(event_date, created_at) DESC"
    );
    return rows as Post[];
  } catch { return []; }
}

function applyTranslation(post: Post, lang: string): { title: string; excerpt: string } {
  if (!lang || lang === "en" || !post.translations_json) return { title: post.title, excerpt: post.excerpt };
  try {
    const tr = (JSON.parse(post.translations_json) as Record<string, LangTranslation>)[lang];
    return { title: tr?.title || post.title, excerpt: tr?.excerpt || post.excerpt };
  } catch { return { title: post.title, excerpt: post.excerpt }; }
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { lang } = await searchParams;
  const events = await getEvents();

  return (
    <div style={{ fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0a1523 60%,#1a2a4a)", padding: "72px 24px 56px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", color: "#C0185A", textTransform: "uppercase", marginBottom: 12 }}>Upcoming & Past</p>
        <h1 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>Events</h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", maxWidth: 560, margin: "0 auto" }}>
          Gospel festivals, revivals, camps, and ministry gatherings around the world.
        </p>
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px" }}>
        {events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 15 }}>No events published yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {events.map(event => {
              const { title, excerpt } = applyTranslation(event, lang ?? "en");
              const eventDate = event.event_date
                ? new Date(event.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
                : null;
              const href = `/blog/${event.slug}${lang && lang !== "en" ? `?lang=${lang}` : ""}`;
              return (
                <div key={event.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", boxShadow: "0 2px 10px rgba(0,0,0,0.06)", display: "flex", gap: 0, overflow: "hidden" }}>
                  {event.featured_image
                    ? <img src={event.featured_image} alt={event.title} style={{ width: 220, objectFit: "cover", flexShrink: 0, display: "block" }} />
                    : <div style={{ width: 140, background: "linear-gradient(135deg,#7c3aed,#4c1d95)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 40 }}>📅</span></div>
                  }
                  <div style={{ padding: "22px 26px", flex: 1 }}>
                    {eventDate && <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#ede9fe", borderRadius: 5, padding: "4px 10px", marginBottom: 10, fontSize: 12, fontWeight: 700, color: "#7c3aed" }}>📅 {eventDate}</div>}
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", lineHeight: 1.35, marginBottom: 10 }}>{title}</h2>
                    {excerpt && <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.65, marginBottom: 14 }}>{excerpt}</p>}
                    <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "#7c3aed", textDecoration: "none" }}>View Details →</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

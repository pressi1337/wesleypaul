export const revalidate = 60;

import Link from "next/link";
import pool from "@/lib/db";
import { ensureTables } from "@/lib/init-db";

interface Post {
  id: number; title: string; slug: string; post_type: string;
  excerpt: string; featured_image: string; author: string;
  created_at: string; translations_json: string | null;
}

interface LangTranslation { title?: string; excerpt?: string; content?: string; }

async function getPosts() {
  await ensureTables();
  try {
    const [rows] = await pool.execute(
      "SELECT id,title,slug,post_type,excerpt,featured_image,author,created_at,translations_json FROM posts WHERE status='published' AND post_type='news' ORDER BY created_at DESC"
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

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { lang } = await searchParams;
  const posts = await getPosts();

  return (
    <div style={{ fontFamily: "system-ui,sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg,#0a1523 60%,#1a2a4a)", padding: "72px 24px 56px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", color: "#C0185A", textTransform: "uppercase", marginBottom: 12 }}>Ministry Updates</p>
        <h1 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>News</h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", maxWidth: 560, margin: "0 auto" }}>
          Latest news and updates from Wesley Paul International Ministries around the globe.
        </p>
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px" }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 15 }}>No news published yet. Check back soon.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 28 }}>
            {posts.map(post => {
              const { title, excerpt } = applyTranslation(post, lang ?? "en");
              const date = new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
              const href = `/blog/${post.slug}${lang && lang !== "en" ? `?lang=${lang}` : ""}`;
              return (
                <div key={post.id} style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column" }}>
                  {post.featured_image
                    ? <img src={post.featured_image} alt={post.title} style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                    : <div style={{ height: 120, background: "linear-gradient(135deg,#0a1523,#0a5a2a)", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 32 }}>📰</span></div>
                  }
                  <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{date}</span>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: 10, flex: 1 }}>{title}</h2>
                    {excerpt && <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 14 }}>{excerpt.slice(0, 120)}{excerpt.length > 120 ? "…" : ""}</p>}
                    <Link href={href} style={{ fontSize: 13, fontWeight: 700, color: "#16a34a", textDecoration: "none" }}>Read More →</Link>
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

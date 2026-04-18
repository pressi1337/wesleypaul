export const revalidate = 60;

import Link from "next/link";
import pool from "@/lib/db";
import { ensureTables } from "@/lib/init-db";

interface Post {
  id: number; title: string; slug: string; post_type: string;
  excerpt: string; featured_image: string; author: string;
  created_at: string; tags: string; translations_json: string | null;
}

interface LangTranslation { title?: string; excerpt?: string; content?: string; }

async function getPosts(type: string) {
  await ensureTables();
  try {
    const [rows] = await pool.execute(
      "SELECT id,title,slug,post_type,excerpt,featured_image,author,tags,created_at,translations_json FROM posts WHERE status='published' AND post_type=? ORDER BY created_at DESC",
      [type]
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

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const { lang } = await searchParams;
  const posts = await getPosts("blog");

  return (
    <div style={{ fontFamily: "system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0a1523 60%,#1a2a4a)", padding: "72px 24px 56px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", color: "#C0185A", textTransform: "uppercase", marginBottom: 12 }}>Articles & Insights</p>
        <h1 style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>Blog</h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", maxWidth: 560, margin: "0 auto" }}>
          Reflections, ministry updates, and Biblical insights from the Wesley Paul Ministries team.
        </p>
      </div>

      {/* Posts grid */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 24px" }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8", fontSize: 15 }}>
            No blog posts published yet. Check back soon.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 28 }}>
            {posts.map(post => {
              const { title, excerpt } = applyTranslation(post, lang ?? "en");
              return <PostCard key={post.id} post={{ ...post, title, excerpt }} basePath="/blog" lang={lang} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, basePath, lang }: { post: Post; basePath: string; lang?: string }) {
  const date = new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const href = `${basePath}/${post.slug}${lang && lang !== "en" ? `?lang=${lang}` : ""}`;
  return (
    <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column" }}>
      {post.featured_image ? (
        <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.featured_image} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : (
        <div style={{ height: 140, background: "linear-gradient(135deg,#0a1523,#1a3a5c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 36 }}>✍️</span>
        </div>
      )}
      <div style={{ padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#2070B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8, display: "block" }}>{date}</span>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: 10, flex: 1 }}>{post.title}</h2>
        {post.excerpt && <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.65, marginBottom: 16 }}>{post.excerpt.slice(0, 140)}{post.excerpt.length > 140 ? "…" : ""}</p>}
        <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 700, color: "#2070B8", textDecoration: "none" }}>
          Read More →
        </Link>
      </div>
    </div>
  );
}

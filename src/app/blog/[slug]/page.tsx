export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";

interface Post {
  id: number; title: string; slug: string; post_type: string;
  excerpt: string; content: string; featured_image: string;
  author: string; tags: string; event_date: string | null; created_at: string;
  translations_json: string | null;
}

interface LangTranslation { title?: string; excerpt?: string; content?: string; }

async function getPost(slug: string) {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM posts WHERE slug=? AND status='published' LIMIT 1",
      [slug]
    );
    const posts = rows as Post[];
    return posts[0] ?? null;
  } catch { return null; }
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;

  const post = await getPost(slug);
  if (!post) notFound();

  // Apply saved translation if available for the requested language
  let title    = post.title;
  let excerpt  = post.excerpt;
  let content  = post.content;

  if (lang && lang !== "en" && post.translations_json) {
    try {
      const translations = JSON.parse(post.translations_json) as Record<string, LangTranslation>;
      const tr = translations[lang];
      if (tr?.title)   title   = tr.title;
      if (tr?.excerpt) excerpt = tr.excerpt;
      if (tr?.content) content = tr.content;
    } catch { /* keep English */ }
  }

  const date = new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const typeColors: Record<string, string> = { blog: "#2070B8", news: "#16a34a", event: "#7c3aed" };
  const typeColor = typeColors[post.post_type] ?? "#2070B8";
  const typeLabels: Record<string, string> = { blog: "Blog", news: "News", event: "Event" };
  const backHref = `/${post.post_type === "event" ? "events" : post.post_type}${lang && lang !== "en" ? `?lang=${lang}` : ""}`;

  return (
    <div style={{ fontFamily: "system-ui,sans-serif" }}>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#0a1523 60%,#1a2a4a)", padding: "64px 24px 48px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Link href={backHref} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: 20, fontWeight: 500 }}>
            ← Back to {typeLabels[post.post_type] ?? "Posts"}
          </Link>
          <div style={{ display: "inline-block", background: typeColor, color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", padding: "3px 12px", borderRadius: 4, marginBottom: 16 }}>
            {typeLabels[post.post_type] ?? post.post_type}
          </div>
          <h1 style={{ fontSize: "clamp(24px,4vw,42px)", fontWeight: 800, color: "#fff", lineHeight: 1.25, marginBottom: 16 }}>{title}</h1>
          {excerpt && <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", lineHeight: 1.65, marginBottom: 20 }}>{excerpt}</p>}
          <div style={{ display: "flex", gap: 16, fontSize: 13, color: "rgba(255,255,255,0.45)", flexWrap: "wrap" }}>
            <span>By {post.author}</span>
            <span>·</span>
            <span>{date}</span>
            {post.event_date && <><span>·</span><span>📅 {new Date(post.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span></>}
          </div>
        </div>
      </div>

      {/* Featured image */}
      {post.featured_image && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.featured_image} alt={title} style={{ width: "100%", maxHeight: 460, objectFit: "cover", borderRadius: "0 0 12px 12px", display: "block" }} />
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
        {content ? (
          <div style={{ fontSize: 17, lineHeight: 1.8, color: "#334155", whiteSpace: "pre-wrap" }}>{content}</div>
        ) : (
          <p style={{ color: "#94a3b8", fontStyle: "italic" }}>No content available.</p>
        )}
        {post.tags && (
          <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {post.tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
              <span key={tag} style={{ background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{tag}</span>
            ))}
          </div>
        )}
        <div style={{ marginTop: 48 }}>
          <Link href={backHref} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 22px", background: typeColor, color: "#fff", borderRadius: 7, fontSize: 13.5, fontWeight: 700, textDecoration: "none" }}>
            ← More {typeLabels[post.post_type] ?? "Posts"}
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, BookOpen, Newspaper, Tag } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { translateBatch } from "@/lib/translate-client";

export interface PostsSectionConfig {
  show?: boolean;
  heading?: string;
  eyebrow?: string;
  limit?: number;
  view_all_label?: string;
  view_all_href?: string;
  translations?: Record<string, Record<string, string>>;
}

export interface PostCard {
  id: number;
  title: string;
  slug: string;
  post_type: string;
  excerpt?: string;
  featured_image?: string;
  date: string;
  event_date?: string;
  tags?: string;
  translations_json?: string;
}

const TYPE_META: Record<string, { color: string; bg: string; icon: React.ReactNode; defaultHeading: string; defaultEyebrow: string; defaultViewAll: string }> = {
  news: {
    color: "#C0185A", bg: "#fef2f2",
    icon: <Newspaper size={14} />,
    defaultHeading: "Latest News", defaultEyebrow: "News", defaultViewAll: "All News",
  },
  blog: {
    color: "#2070B8", bg: "#eff6ff",
    icon: <BookOpen size={14} />,
    defaultHeading: "From the Blog", defaultEyebrow: "Blog", defaultViewAll: "All Posts",
  },
  event: {
    color: "#0891b2", bg: "#ecfeff",
    icon: <Calendar size={14} />,
    defaultHeading: "Upcoming Events", defaultEyebrow: "Events", defaultViewAll: "All Events",
  },
};

interface Props {
  contentKey: string;       // e.g. "home_news_section"
  postType: string;         // "news" | "blog" | "event"
  initialConfig: PostsSectionConfig;
  initialPosts: PostCard[];
}

// Placeholder posts shown in the site editor preview when no real posts exist
function makePlaceholders(postType: string, count: number): PostCard[] {
  const labels: Record<string, string> = { news: "News Article", blog: "Blog Post", event: "Event" };
  const label = labels[postType] ?? "Post";
  return Array.from({ length: count }, (_, i) => ({
    id: -(i + 1),
    title: `Example ${label} ${i + 1}`,
    slug: "#",
    post_type: postType,
    excerpt: "This is a preview placeholder. Real content will appear here once posts are published.",
    featured_image: "",
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    event_date: postType === "event" ? new Date().toISOString() : undefined,
    tags: "example,preview",
  }));
}

export default function HomePostsSection({ contentKey, postType, initialConfig, initialPosts }: Props) {
  const [config, setConfig] = useState<PostsSectionConfig>(initialConfig);
  const [isPreview, setIsPreview] = useState(false);

  // Detect preview (iframe) context — client only
  useEffect(() => {
    setIsPreview(window.self !== window.top);
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as { type?: string; key?: string; data?: unknown };
      if (msg?.type === "PREVIEW_DRAFT" && msg.key === contentKey && msg.data) {
        setConfig(msg.data as PostsSectionConfig);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [contentKey]);

  const meta         = TYPE_META[postType] ?? TYPE_META.news;
  const baseHeading  = config.heading        || meta.defaultHeading;
  const baseEyebrow  = config.eyebrow        || meta.defaultEyebrow;
  const baseViewAll  = config.view_all_label || meta.defaultViewAll;

  const searchParams = useSearchParams();
  const [lang, setLang] = useState("en");
  useEffect(() => { setLang(searchParams.get("lang") ?? "en"); }, [searchParams]);

  const [trHeading,  setTrHeading]  = useState(baseHeading);
  const [trEyebrow,  setTrEyebrow]  = useState(baseEyebrow);
  const [trViewAll,  setTrViewAll]  = useState(baseViewAll);

  useEffect(() => { setTrHeading(baseHeading); setTrEyebrow(baseEyebrow); setTrViewAll(baseViewAll); }, [baseHeading, baseEyebrow, baseViewAll]);

  useEffect(() => {
    if (lang === "en") { setTrHeading(baseHeading); setTrEyebrow(baseEyebrow); setTrViewAll(baseViewAll); return; }
    const saved = config.translations?.[lang];
    if (saved?.heading)        setTrHeading(saved.heading);
    if (saved?.eyebrow)        setTrEyebrow(saved.eyebrow);
    if (saved?.view_all_label) setTrViewAll(saved.view_all_label);
    if (saved?.heading && saved?.eyebrow && saved?.view_all_label) return;
    const cacheKey = `posts_tr_${contentKey}_v1_${lang}`;
    try {
      const c = JSON.parse(sessionStorage.getItem(cacheKey) ?? "null") as { heading: string; eyebrow: string; viewAll: string } | null;
      if (c) { setTrHeading(c.heading); setTrEyebrow(c.eyebrow); setTrViewAll(c.viewAll); return; }
    } catch { /* ignore */ }
    if (window.self !== window.top) return; // preview: only show saved translations
    translateBatch([baseHeading, baseEyebrow, baseViewAll], lang)
      .then(([h, e, v]) => {
        const h2 = h ?? baseHeading; const e2 = e ?? baseEyebrow; const v2 = v ?? baseViewAll;
        setTrHeading(h2); setTrEyebrow(e2); setTrViewAll(v2);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ heading: h2, eyebrow: e2, viewAll: v2 })); } catch { /* ignore */ }
      }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const limit = config.limit ?? 3;

  // In preview: show placeholder cards if no real posts; always apply live limit
  const displayPosts = useMemo(() => {
    const base = initialPosts.length > 0 ? initialPosts : (isPreview ? makePlaceholders(postType, limit) : []);
    return base.slice(0, limit);
  }, [initialPosts, isPreview, postType, limit]);

  const isPlaceholder = initialPosts.length === 0 && isPreview;

  if (config.show === false) return null;
  if (displayPosts.length === 0) return null;

  const heading      = trHeading;
  const eyebrow      = trEyebrow;
  const viewAllLabel = trViewAll;
  const viewAllHref  = config.view_all_href  || `/${postType === "event" ? "events" : postType}`;
  const isEvent       = postType === "event";

  return (
    <section
      data-site-section={contentKey}
      style={{ backgroundColor: isEvent ? "#f8f9fa" : "#fff", padding: "80px 24px" }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="section-label">{eyebrow}</span>
            <h2 className="section-title" style={{ fontSize: "2rem", marginBottom: 0 }}>{heading}</h2>
            <div className="section-divider-left" />
          </div>
          <Link href={viewAllHref} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: meta.color, textDecoration: "none" }}>
            {viewAllLabel} <ArrowRight size={14} />
          </Link>
        </div>

        {/* Cards grid */}
        {isPlaceholder && (
          <div style={{ marginBottom: 16, padding: "7px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 7, fontSize: 12, color: "#92400e", display: "inline-flex", alignItems: "center", gap: 6 }}>
            ⚠ Preview only — publish posts to show real content
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 28 }}>
          {displayPosts.map(post => {
            // Apply saved translation for current lang
            let cardTitle   = post.title;
            let cardExcerpt = post.excerpt;
            if (lang !== "en" && post.translations_json) {
              try {
                const tr = (JSON.parse(post.translations_json) as Record<string, { title?: string; excerpt?: string }>)[lang];
                if (tr?.title)   cardTitle   = tr.title;
                if (tr?.excerpt) cardExcerpt = tr.excerpt;
              } catch { /* keep English */ }
            }

            const displayDate = isEvent && post.event_date
              ? new Date(post.event_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              : post.date;
            const cardHref = `/${postType === "event" ? "events" : postType}/${post.slug}${lang !== "en" ? `?lang=${lang}` : ""}`;

            return (
              <Link
                key={post.id}
                href={cardHref}
                className="card-hover"
                style={{ display: "block", textDecoration: "none", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", background: "#fff" }}
              >
                {/* Featured image */}
                <div style={{ position: "relative", height: 200, backgroundColor: "#1a2a3a", overflow: "hidden" }}>
                  {post.featured_image ? (
                    <Image
                      src={post.featured_image}
                      alt={cardTitle}
                      fill
                      style={{ objectFit: "cover", transition: "transform 0.4s ease" }}
                      unoptimized
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,#0d1b2e,${meta.color}44)` }}>
                      <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 48 }}>
                        {meta.icon}
                      </span>
                    </div>
                  )}
                  {/* Type badge */}
                  <span style={{
                    position: "absolute", top: 12, left: 12,
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "3px 10px", borderRadius: 20, fontSize: 10.5, fontWeight: 700,
                    background: meta.color, color: "#fff", letterSpacing: "0.04em",
                  }}>
                    {meta.icon} {eyebrow}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: "18px 20px 20px" }}>
                  {/* Date / event date */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8, fontSize: 11.5, color: meta.color, fontWeight: 600 }}>
                    <Calendar size={11} />
                    {displayDate}
                  </div>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 8, lineHeight: 1.4,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {cardTitle}
                  </h3>

                  {cardExcerpt && (
                    <p style={{ fontSize: 13, color: "#6c757d", lineHeight: 1.65, marginBottom: 12,
                      display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {cardExcerpt}
                    </p>
                  )}

                  {/* Tags */}
                  {post.tags && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {post.tags.split(",").slice(0, 3).map(tag => (
                        <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: meta.bg, color: meta.color }}>
                          <Tag size={8} /> {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

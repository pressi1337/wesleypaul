"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon, BookOpen, Newspaper } from "lucide-react";

export interface MinistryActionConfig {
  show?: boolean;
  heading?: string;
  eyebrow?: string;
  limit?: number;
  sources?: string[]; // "gallery" | "blog" | "news"
  view_all_label?: string;
  view_all_href?: string;
}

export interface FeedItem {
  id: string;
  type: "gallery" | "blog" | "news";
  title?: string;
  excerpt?: string;
  image: string;
  href: string;
  date?: string;
}

interface Props {
  initialConfig: MinistryActionConfig;
  initialItems: FeedItem[];
}

const TYPE_COLORS: Record<string, string> = {
  gallery: "#16a34a",
  blog: "#2070B8",
  news: "#C0185A",
};
const TYPE_LABELS: Record<string, string> = {
  gallery: "Gallery",
  blog: "Blog",
  news: "News",
};
const TYPE_ICONS: Record<string, React.ReactNode> = {
  gallery: <ImageIcon size={10} />,
  blog: <BookOpen size={10} />,
  news: <Newspaper size={10} />,
};

export default function MinistryInActionSection({ initialConfig, initialItems }: Props) {
  const [config, setConfig] = useState<MinistryActionConfig>(initialConfig);
  const [items] = useState<FeedItem[]>(initialItems);

  // Live preview listener
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as { type?: string; key?: string; data?: unknown };
      if (msg?.type === "PREVIEW_DRAFT" && msg.key === "home_ministry_action" && msg.data) {
        setConfig(msg.data as MinistryActionConfig);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  if (config.show === false) return null;
  if (items.length === 0) return null;

  const heading      = config.heading || "Ministry in Action";
  const eyebrow      = config.eyebrow || "Latest Updates";
  const viewAllLabel = config.view_all_label || "View All";
  const viewAllHref  = config.view_all_href || "/gallery";

  return (
    <section data-site-section="home_ministry_action" style={{ backgroundColor: "#fff", padding: "80px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48, flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="section-label">{eyebrow}</span>
            <h2 className="section-title" style={{ fontSize: "2rem", marginBottom: 0 }}>{heading}</h2>
            <div className="section-divider-left" />
          </div>
          <Link href={viewAllHref} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "#2070B8", textDecoration: "none" }}>
            {viewAllLabel} <ArrowRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 28 }}>
          {items.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className="card-hover"
              style={{ display: "block", textDecoration: "none", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}
            >
              {/* Image */}
              <div style={{ position: "relative", height: 200, backgroundColor: "#1a2a3a", overflow: "hidden" }}>
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title || ""}
                    fill
                    style={{ objectFit: "cover", transition: "transform 0.4s ease" }}
                    unoptimized
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0d1b2e,#2070B8)" }}>
                    <ImageIcon size={40} style={{ color: "rgba(255,255,255,0.3)" }} />
                  </div>
                )}
                {/* Type badge */}
                <span style={{
                  position: "absolute", top: 12, left: 12,
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 9px", borderRadius: 20, fontSize: 10.5, fontWeight: 700,
                  background: TYPE_COLORS[item.type] || "#64748b", color: "#fff",
                  letterSpacing: "0.04em",
                }}>
                  {TYPE_ICONS[item.type]} {TYPE_LABELS[item.type] || item.type}
                </span>
              </div>

              {/* Text — only for posts */}
              {(item.title || item.excerpt) && (
                <div style={{ padding: "18px 20px", background: "#fff" }}>
                  {item.title && (
                    <h3 style={{ fontSize: 14.5, fontWeight: 700, color: "#0f172a", marginBottom: 6, lineHeight: 1.4 }}>
                      {item.title}
                    </h3>
                  )}
                  {item.excerpt && (
                    <p style={{ fontSize: 13, color: "#6c757d", lineHeight: 1.6, marginBottom: 8,
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {item.excerpt}
                    </p>
                  )}
                  {item.date && (
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{item.date}</span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

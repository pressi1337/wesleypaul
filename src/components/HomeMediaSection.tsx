"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Play, ExternalLink, X, PlayCircle, Image as ImageIcon, ArrowRight } from "lucide-react";
import { translateBatch } from "@/lib/translate-client";

export interface MediaItem {
  id?: string;
  url: string;
  title: string;
  thumbnail?: string;
  play_mode: "inline" | "external";
}

export interface MediaSectionData {
  show?: boolean;
  heading?: string;
  eyebrow?: string;
  items: MediaItem[];
  limit?: number;
  show_cta?: boolean;
  cta_label?: string;
  cta_href?: string;
  translations?: Record<string, { heading?: string; eyebrow?: string; cta_label?: string; items?: Record<string, string> }>;
}

interface Props {
  initialData: MediaSectionData;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function detectType(url: string): "youtube" | "instagram" | "other" {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/instagram\.com/.test(url)) return "instagram";
  return "other";
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function extractInstagramId(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

function getAutoThumb(url: string): string {
  const type = detectType(url);
  if (type === "youtube") {
    const id = extractYouTubeId(url);
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return "";
}

function getEmbedUrl(url: string): string | null {
  const type = detectType(url);
  if (type === "youtube") {
    const id = extractYouTubeId(url);
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
  }
  if (type === "instagram") {
    const id = extractInstagramId(url);
    if (id) return `https://www.instagram.com/reel/${id}/embed/`;
  }
  return null;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  youtube: <PlayCircle size={11} />,
  instagram: <ImageIcon size={11} />,
  other: <Play size={11} />,
};
const TYPE_COLOR: Record<string, string> = {
  youtube: "#dc2626",
  instagram: "#C0185A",
  other: "#64748b",
};
const TYPE_LABEL: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  other: "Media",
};

/* ── Media lightbox modal ────────────────────────────────────────────────── */
function MediaModal({ embedUrl, title, onClose }: { embedUrl: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 900 }}>
        <button
          onClick={onClose}
          style={{ position: "absolute", top: -40, right: 0, background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}
        >
          <X size={18} /> Close
        </button>
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 8, overflow: "hidden", background: "#000" }}>
          <iframe
            src={embedUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          />
        </div>
        {title && (
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 12, textAlign: "center" }}>{title}</p>
        )}
      </div>
    </div>
  );
}

/* ── Shared media card (used here and on /media page) ────────────────────── */
export function MediaCard({ item, onPlay }: { item: MediaItem; onPlay: (item: MediaItem) => void }) {
  const type = detectType(item.url);
  const thumb = item.thumbnail || getAutoThumb(item.url);
  const isExternal = item.play_mode === "external" || type === "instagram";

  return (
    <button
      onClick={() => onPlay(item)}
      style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
    >
      <div style={{ position: "relative", height: 196, backgroundColor: "#1a2a3a", overflow: "hidden" }}>
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.35s ease" }}
            onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.04)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = ""; }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0f2740,#2070B8)" }}>
            <Play size={40} style={{ color: "rgba(255,255,255,0.25)" }} />
          </div>
        )}

        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: TYPE_COLOR[type] || "#C0185A", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
            {isExternal ? <ExternalLink size={20} color="#fff" /> : <Play size={20} fill="#fff" color="#fff" style={{ marginLeft: 2 }} />}
          </div>
        </div>

        <span style={{ position: "absolute", top: 10, left: 10, display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: TYPE_COLOR[type] || "#64748b", color: "#fff", letterSpacing: "0.04em" }}>
          {TYPE_ICON[type]} {TYPE_LABEL[type]}
        </span>

        {isExternal && (
          <span style={{ position: "absolute", top: 10, right: 10, display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 7px", borderRadius: 20, fontSize: 9.5, fontWeight: 600, background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.8)" }}>
            <ExternalLink size={8} /> New tab
          </span>
        )}
      </div>

      {item.title && (
        <div style={{ padding: "14px 16px", background: "#111e35" }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {item.title}
          </p>
        </div>
      )}
    </button>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export default function HomeMediaSection({ initialData }: Props) {
  const [data, setData] = useState<MediaSectionData>(initialData);
  const [activeEmbed, setActiveEmbed] = useState<{ url: string; title: string } | null>(null);

  const searchParams = useSearchParams();
  const [lang, setLang] = useState("en");
  useEffect(() => { setLang(searchParams.get("lang") ?? "en"); }, [searchParams]);

  const rawHeading  = data.heading  || "Watch & Listen to Dr. Wesley";
  const rawEyebrow  = data.eyebrow  || "Media";
  const rawCtaLabel = data.cta_label || "View All Media";

  const [trHeading,  setTrHeading]  = useState(rawHeading);
  const [trEyebrow,  setTrEyebrow]  = useState(rawEyebrow);
  const [trCtaLabel, setTrCtaLabel] = useState(rawCtaLabel);

  useEffect(() => {
    setTrHeading(rawHeading); setTrEyebrow(rawEyebrow); setTrCtaLabel(rawCtaLabel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.heading, data.eyebrow, data.cta_label]);

  useEffect(() => {
    if (lang === "en") { setTrHeading(rawHeading); setTrEyebrow(rawEyebrow); setTrCtaLabel(rawCtaLabel); return; }
    const saved = data.translations?.[lang];
    if (saved?.heading || saved?.eyebrow || saved?.cta_label) {
      if (saved.heading)    setTrHeading(saved.heading);
      if (saved.eyebrow)    setTrEyebrow(saved.eyebrow);
      if (saved.cta_label)  setTrCtaLabel(saved.cta_label);
      return;
    }
    const cacheKey = `media_section_tr_v1_${lang}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const c = JSON.parse(cached) as { heading: string; eyebrow: string; cta_label: string };
        setTrHeading(c.heading); setTrEyebrow(c.eyebrow); setTrCtaLabel(c.cta_label);
        return;
      }
    } catch { /* ignore */ }
    if (window.self !== window.top) return; // preview: only show saved translations
    translateBatch([rawHeading, rawEyebrow, rawCtaLabel], lang)
      .then(([h, e, c]) => {
        const th = h ?? rawHeading; const te = e ?? rawEyebrow; const tc = c ?? rawCtaLabel;
        setTrHeading(th); setTrEyebrow(te); setTrCtaLabel(tc);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ heading: th, eyebrow: te, cta_label: tc })); } catch { /* ignore */ }
      }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, data.translations]);

  // Translate item titles — use admin-saved translations first, then auto-translate
  const [trTitles, setTrTitles] = useState<string[]>([]);
  useEffect(() => { setTrTitles(data.items.map(i => i.title)); }, [data.items]);
  useEffect(() => {
    if (lang === "en" || data.items.length === 0) { setTrTitles(data.items.map(i => i.title)); return; }
    const savedItems = data.translations?.[lang]?.items ?? {};
    const titles = data.items.map(i => i.title);
    const getId = (i: MediaItem) => i.id ?? "";
    const allSaved = data.items.every(i => savedItems[getId(i)]);
    if (allSaved) { setTrTitles(data.items.map(i => savedItems[getId(i)] ?? i.title)); return; }
    const cacheKey = `media_titles_tr_v1_${lang}_${titles.map(t => t.slice(0,8)).join("|")}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const c = JSON.parse(cached) as string[];
        setTrTitles(data.items.map((item, i) => savedItems[getId(item)] ?? c[i] ?? item.title));
        return;
      }
    } catch { /* ignore */ }
    const needTranslate = data.items.map(i => savedItems[getId(i)] ? "" : i.title);
    if (window.self !== window.top) return; // preview: only show saved translations
    translateBatch(needTranslate.filter(Boolean), lang)
      .then(results => {
        let ri = 0;
        const tr = data.items.map((item) => {
          if (savedItems[getId(item)]) return savedItems[getId(item)];
          return results[ri++] ?? item.title;
        });
        setTrTitles(tr);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(tr)); } catch { /* ignore */ }
      }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, data.items, data.translations]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as { type?: string; key?: string; data?: unknown };
      if (msg?.type === "PREVIEW_DRAFT" && msg.key === "home_media_section" && msg.data) {
        // Preserve existing items — the site editor only controls display settings,
        // items are managed via /admin/media-section and must not be wiped by a draft.
        setData(prev => ({
          ...prev,
          ...(msg.data as MediaSectionData),
          items: (msg.data as MediaSectionData).items?.length
            ? (msg.data as MediaSectionData).items
            : prev.items,
        }));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const handlePlay = useCallback((item: MediaItem) => {
    const type = detectType(item.url);
    if (item.play_mode === "external" || type === "instagram") {
      window.open(item.url, "_blank", "noopener,noreferrer");
      return;
    }
    const embedUrl = getEmbedUrl(item.url);
    if (embedUrl) setActiveEmbed({ url: embedUrl, title: item.title });
    else window.open(item.url, "_blank", "noopener,noreferrer");
  }, []);

  if (data.show === false) return null;
  if (!data.items || data.items.length === 0) return null;

  const limit   = typeof data.limit === "number" && data.limit > 0 ? data.limit : 3;
  const visible = data.items.slice(0, limit);
  const showCta = data.show_cta !== false && data.items.length > 0;
  const ctaHref = data.cta_href || "/media";

  return (
    <>
      <section data-site-section="home_media_section" style={{ backgroundColor: "#0d1b2e", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <span className="section-label" style={{ color: "#f5a623" }}>{trEyebrow}</span>
            <h2 className="section-title" style={{ fontSize: "2rem", color: "#fff" }}>{trHeading}</h2>
            <div className="section-divider" />
          </div>

          {/* Media grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {visible.map((item, i) => (
              <MediaCard key={item.id ?? i} item={{ ...item, title: trTitles[i] ?? item.title }} onPlay={handlePlay} />
            ))}
          </div>

          {/* View All CTA */}
          {showCta && (
            <div style={{ textAlign: "center", marginTop: 48 }}>
              <Link
                href={ctaHref}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 32px", background: "#C0185A", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 700, letterSpacing: "0.02em", boxShadow: "0 4px 16px rgba(192,24,90,0.4)", transition: "opacity 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
              >
                {trCtaLabel} <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {activeEmbed && (
        <MediaModal
          embedUrl={activeEmbed.url}
          title={activeEmbed.title}
          onClose={() => setActiveEmbed(null)}
        />
      )}
    </>
  );
}

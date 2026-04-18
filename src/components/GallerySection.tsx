"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { translateBatch } from "@/lib/translate-client";

interface GalleryData { images?: string[]; show?: boolean; heading?: string; eyebrow?: string; limit?: number; show_cta?: boolean; cta_label?: string; cta_href?: string; }

interface Props {
  images: string[];
  limit?: number;
  showViewAll?: boolean;
  heading?: string;
  eyebrow?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function GallerySection({ images, limit: limitProp, showViewAll = false, heading = "Ministry in Action", eyebrow = "Gallery", ctaLabel = "View All Photos", ctaHref = "/gallery" }: Props) {
  const [liveData, setLiveData] = useState<GalleryData>({ images, limit: limitProp, show_cta: showViewAll, cta_label: ctaLabel, cta_href: ctaHref, heading, eyebrow });

  const liveImages = liveData.images ?? images;
  const limit = liveData.limit ?? limitProp;
  const visible = limit ? liveImages.slice(0, limit) : liveImages;
  const [lightbox, setLightbox] = useState<number | null>(null);

  // Live preview listener for Site Editor — supports both legacy string[] and new GallerySettings object
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as { type?: string; key?: string; data?: unknown };
      if (msg?.type !== "PREVIEW_DRAFT" || msg.key !== "home_gallery") return;
      if (Array.isArray(msg.data)) {
        setLiveData(p => ({ ...p, images: msg.data as string[] }));
      } else if (msg.data && typeof msg.data === "object") {
        const d = msg.data as GalleryData;
        setLiveData(p => ({ ...p, ...d, images: d.images?.length ? d.images : p.images }));
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);
  const activeHeading  = liveData.heading  ?? heading;
  const activeEyebrow  = liveData.eyebrow  ?? eyebrow;
  const activeCtaLabel = liveData.cta_label ?? ctaLabel;
  const activeCtaHref  = liveData.cta_href  ?? ctaHref;
  const activeShowCta  = liveData.show_cta !== false && showViewAll;

  const [trEyebrow, setTrEyebrow] = useState(activeEyebrow);
  const [trHeading, setTrHeading] = useState(activeHeading);
  const [trViewAll, setTrViewAll] = useState(activeCtaLabel);

  useEffect(() => { setTrEyebrow(activeEyebrow); setTrHeading(activeHeading); setTrViewAll(activeCtaLabel); }, [activeEyebrow, activeHeading, activeCtaLabel]);

  const searchParams = useSearchParams();
  const [lang, setLang] = useState("en");
  useEffect(() => { setLang(searchParams.get("lang") ?? "en"); }, [searchParams]);

  useEffect(() => {
    if (lang === "en") { setTrEyebrow(activeEyebrow); setTrHeading(activeHeading); setTrViewAll(activeCtaLabel); return; }
    const cacheKey = `gallery_tr_v6_${lang}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) { const c = JSON.parse(cached) as { eyebrow: string; heading: string; viewAll: string }; setTrEyebrow(c.eyebrow); setTrHeading(c.heading); setTrViewAll(c.viewAll); return; }
    } catch { /* ignore */ }
    if (window.self !== window.top) return; // preview: only show saved translations
    translateBatch([activeEyebrow, activeHeading, activeCtaLabel], lang)
      .then((results) => {
        const e2 = results[0] ?? activeEyebrow;
        const h2 = results[1] ?? activeHeading;
        const v2 = results[2] ?? activeCtaLabel;
        setTrEyebrow(e2); setTrHeading(h2); setTrViewAll(v2);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ eyebrow: e2, heading: h2, viewAll: v2 })); } catch { /* ignore */ }
      }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(() => setLightbox(i => (i != null && i > 0 ? i - 1 : visible.length - 1)), [visible.length]);
  const next = useCallback(() => setLightbox(i => (i != null && i < visible.length - 1 ? i + 1 : 0)), [visible.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, close, prev, next]);

  if (visible.length === 0) return null;

  return (
    <>
      <section style={{ backgroundColor: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {(heading || eyebrow) && (
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              {eyebrow && <span className="section-label">{trEyebrow}</span>}
              {heading && <h2 className="section-title" style={{ fontSize: "2rem" }}>{trHeading}</h2>}
              <div className="section-divider" />
            </div>
          )}

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))", gap: 10 }}>
            {visible.map((src, i) => (
              <button
                key={i}
                onClick={() => setLightbox(i)}
                style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", borderRadius: 6, backgroundColor: "#1a2a3a", border: "none", padding: 0, cursor: "zoom-in", display: "block" }}
                aria-label={`Open image ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src} alt=""
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.3s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                {/* Hover overlay */}
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.28)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0)"; }}>
                  <span style={{ color: "#fff", fontSize: 22, opacity: 0, transition: "opacity 0.2s" }} className="gallery-zoom-icon">⊕</span>
                </div>
              </button>
            ))}
          </div>

          {/* View All CTA */}
          {activeShowCta && (
            <div style={{ textAlign: "center", marginTop: 48 }}>
              <a href={activeCtaHref}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 32px", background: "#2070B8", color: "#fff", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 14, boxShadow: "0 4px 16px rgba(32,112,184,0.35)", letterSpacing: "0.02em" }}>
                {trViewAll} →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightbox !== null && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={close}
        >
          {/* Close */}
          <button
            onClick={close}
            style={{ position: "absolute", top: 16, right: 18, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "50%", width: 40, height: 40, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}
            aria-label="Close"
          >✕</button>

          {/* Counter */}
          <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, letterSpacing: "0.05em" }}>
            {lightbox + 1} / {visible.length}
          </div>

          {/* Prev */}
          {visible.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              style={{ position: "absolute", left: 12, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "50%", width: 48, height: 48, fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s", zIndex: 2 }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              aria-label="Previous"
            >‹</button>
          )}

          {/* Image */}
          <div style={{ maxWidth: "min(90vw, 1100px)", maxHeight: "85vh", position: "relative" }}
            onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={lightbox}
              src={visible[lightbox]}
              alt={`Gallery image ${lightbox + 1}`}
              style={{ maxWidth: "min(90vw, 1100px)", maxHeight: "85vh", objectFit: "contain", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.6)", display: "block" }}
            />
          </div>

          {/* Next */}
          {visible.length > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              style={{ position: "absolute", right: 12, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "50%", width: 48, height: 48, fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s", zIndex: 2 }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
              aria-label="Next"
            >›</button>
          )}

          {/* Thumbnail strip */}
          {visible.length > 1 && (
            <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6, maxWidth: "80vw", overflowX: "auto", padding: "4px 8px" }}>
              {visible.map((src, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightbox(i); }}
                  style={{ width: 48, height: 48, borderRadius: 5, overflow: "hidden", flexShrink: 0, border: i === lightbox ? "2px solid #fff" : "2px solid rgba(255,255,255,0.2)", padding: 0, cursor: "pointer", opacity: i === lightbox ? 1 : 0.55, transition: "opacity 0.15s,border-color 0.15s" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .gallery-zoom-icon { display: none; }
        }
      `}</style>
    </>
  );
}

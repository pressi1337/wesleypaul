"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, ExternalLink } from "lucide-react";
import type { PopupConfig } from "@/app/api/popup/route";
import Link from "next/link";

/**
 * Show behaviour:
 *  - show_once ON  → shown only once ever (localStorage). Won't show again after dismiss.
 *  - show_once OFF → shown on every full page load / refresh.
 *  - Never re-shows on SPA navigation (component stays mounted in root layout).
 *  - ?test_popup=1 bypasses the show_once localStorage guard for admin previews.
 */

const seenKey = (cfg: { cta_href?: string; media_url?: string; title?: string }) =>
  `promo_popup_seen_${encodeURIComponent(cfg.cta_href || cfg.media_url || cfg.title || "").slice(0, 40)}`;

async function translateText(text: string, lang: string): Promise<string> {
  if (!text || lang === "en") return text;
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`
    );
    const d = await res.json() as { responseData?: { translatedText?: string } };
    return d.responseData?.translatedText || text;
  } catch {
    return text;
  }
}

export default function PromoPopup() {
  const pathname  = usePathname();
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [show, setShow]     = useState(false);
  const [title, setTitle]   = useState("");
  const [desc, setDesc]     = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    let active = true; // guards against React Strict-Mode double-invoke & unmount races

    const urlLang = new URLSearchParams(window.location.search).get("lang") || "en";
    // ?test_popup=1 lets admins preview without clearing localStorage
    const isTest  = new URLSearchParams(window.location.search).get("test_popup") === "1";

    fetch("/api/popup")
      .then(r => r.json())
      .then(async (d: { config?: PopupConfig }) => {
        if (!active) return;
        const cfg = d.config;
        if (!cfg?.enabled) return;
        if (!cfg.media_url && !cfg.title && !cfg.description) return;
        // Respect home_only setting
        if (cfg.home_only && pathname !== "/") return;
        // show_once: skip if visitor already dismissed — unless admin is testing
        if (!isTest && cfg.show_once && localStorage.getItem(seenKey(cfg))) return;

        // Pick per-language override if available, fall back to defaults
        const langOverride = (urlLang !== "en" && cfg.translations?.[urlLang]) || {};
        const activeShowMedia = langOverride.show_media !== undefined
          ? langOverride.show_media
          : (cfg.show_media !== false);
        const activeMedia  = activeShowMedia ? (langOverride.media_url  || cfg.media_url)  : "";
        const activePoster = activeShowMedia ? (langOverride.poster_url || cfg.poster_url) : "";
        const rawTitle     = langOverride.title       || cfg.title       || "";
        const rawDesc      = langOverride.description || cfg.description || "";
        const rawCta       = langOverride.cta_label   || cfg.cta_label   || "";

        const needsTranslate = urlLang !== "en" && !langOverride.title;
        const [t, cta] = needsTranslate
          ? await Promise.all([
              translateText(rawTitle, urlLang),
              translateText(rawCta,   urlLang),
            ])
          : [rawTitle, rawCta];

        if (!active) return; // may have been cancelled during async translate

        setTitle(t);
        setDesc(rawDesc);
        setCtaLabel(cta || rawCta);
        setConfig({ ...cfg, media_url: activeMedia, poster_url: activePoster });

        const delay = Math.max(0, cfg.show_delay ?? 1) * 1000;
        setTimeout(() => { if (active) setShow(true); }, delay);
      })
      .catch(() => {});

    return () => { active = false; };
  // pathname is stable per mount — listed to satisfy linter only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (config?.show_once) localStorage.setItem(seenKey(config), "1");
    setShow(false);
    videoRef.current?.pause();
  };

  if (!show || !config) return null;

  const isVideo = config.type === "video";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99998,
        background: "rgba(5,10,25,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "12px",
        backdropFilter: "blur(6px)",
      }}
      data-promo-popup=""
      onClick={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div style={{
        background: "#fff",
        borderRadius: 20,
        width: "100%",
        maxWidth: 700,
        boxShadow: "0 40px 100px rgba(0,0,0,0.55)",
        overflow: "hidden",
        animation: "popupIn 0.38s cubic-bezier(0.34,1.46,0.64,1)",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
      }}>

        {/* ── Accent bar shown when no media (content-only mode) ─────────── */}
        {!config.media_url && (
          <div style={{
            height: 6,
            background: "linear-gradient(90deg,#C0185A,#2070B8,#7c3aed)",
            flexShrink: 0,
          }} />
        )}

        {/* ── Media block ─────────────────────────────────────────────────── */}
        {config.media_url && (
          <div style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={close}
              aria-label="Close"
              style={{
                position: "absolute", top: 12, right: 12, zIndex: 10,
                width: 34, height: 34, borderRadius: "50%",
                background: "rgba(0,0,0,0.6)", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", transition: "background 0.15s",
                backdropFilter: "blur(4px)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.85)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.6)"; }}
            >
              <X size={15} />
            </button>

            {isVideo ? (
              <video
                ref={videoRef}
                src={config.media_url}
                poster={config.poster_url || undefined}
                controls
                autoPlay
                playsInline
                style={{
                  width: "100%", display: "block",
                  maxHeight: "55vh", objectFit: "cover",
                  background: "#000",
                }}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={config.media_url}
                alt={title || config.title}
                style={{
                  width: "100%", display: "block",
                  maxHeight: "55vh", objectFit: "cover",
                  objectPosition: config.image_position || "center",
                  transform: (config.image_zoom ?? 100) > 100 ? `scale(${(config.image_zoom ?? 100) / 100})` : undefined,
                  transformOrigin: config.image_position || "center",
                }}
              />
            )}
          </div>
        )}

        {/* ── Text body ───────────────────────────────────────────────────── */}
        {(title || desc || ctaLabel) && (
          <div style={{
            padding: "28px 32px 32px",
            textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            overflowY: "auto",
            /* when there is no media, add close button in top-right of text area */
            position: "relative",
          }}>
            {/* Close button when no media */}
            {!config.media_url && (
              <button
                onClick={close}
                aria-label="Close"
                style={{
                  position: "absolute", top: 14, right: 14,
                  width: 30, height: 30, borderRadius: "50%",
                  background: "#f1f5f9", border: "none",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#64748b", transition: "background 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "#e2e8f0"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; }}
              >
                <X size={14} />
              </button>
            )}

            {title && (
              <h2 style={{
                margin: 0,
                fontSize: "clamp(20px, 3.5vw, 28px)",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.2,
                maxWidth: 520,
              }}>
                {title}
              </h2>
            )}

            {desc && (
              <div
                dangerouslySetInnerHTML={{ __html: desc }}
                style={{
                  fontSize: "clamp(13px, 2vw, 15px)",
                  color: "#475569",
                  lineHeight: 1.7,
                  maxWidth: 500,
                  textAlign: "center",
                }}
              />
            )}

            {ctaLabel && config.cta_href && (
              config.cta_external ? (
                <a
                  href={config.cta_href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  style={{
                    marginTop: 6,
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "13px 30px", borderRadius: 10,
                    background: "linear-gradient(135deg,#C0185A,#2070B8)",
                    color: "#fff", fontWeight: 700,
                    fontSize: "clamp(13px, 2vw, 15px)",
                    textDecoration: "none", transition: "opacity 0.15s",
                    boxShadow: "0 4px 18px rgba(192,24,90,0.35)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                >
                  {ctaLabel} <ExternalLink size={15} />
                </a>
              ) : (
                <Link
                  href={config.cta_href}
                  onClick={close}
                  style={{
                    marginTop: 6,
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "13px 30px", borderRadius: 10,
                    background: "linear-gradient(135deg,#C0185A,#2070B8)",
                    color: "#fff", fontWeight: 700,
                    fontSize: "clamp(13px, 2vw, 15px)",
                    textDecoration: "none", transition: "opacity 0.15s",
                    boxShadow: "0 4px 18px rgba(192,24,90,0.35)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.88"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  {ctaLabel}
                </Link>
              )
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.84) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @media (max-width: 480px) {
          /* Full-width sheet on small phones */
          [data-promo-popup] > div {
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            max-height: 96vh !important;
          }
        }
      `}</style>
    </div>
  );
}

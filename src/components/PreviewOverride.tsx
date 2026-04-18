"use client";
/**
 * PreviewOverride — page-builder overlay for the Site Editor preview iframe.
 *
 * On the PUBLIC site this renders ONLY the HeroCarousel — zero page-builder
 * overhead, no overlays, no click-blockers, no cursor changes.
 *
 * When running inside the admin site-editor iframe (window.self !== window.top)
 * all page-builder features activate:
 *  - Blocks ALL link navigation (it's a preview, not a browser)
 *  - Click any section → sends SECTION_FOCUS to parent editor
 *  - Hover shows a toolbar: section label + Edit + Hide/Show
 *  - Listens for SECTION_VISIBILITY to visually dim hidden sections
 *  - Listens for PREVIEW_PAUSE / PREVIEW_RESUME for carousel control
 *  - Listens for PREVIEW_DRAFT to hot-swap section data
 */

import { useEffect, useState, useRef, useCallback } from "react";
import HeroCarousel, { HeroSlide } from "./HeroCarousel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMsg = { type?: string; key?: string; data?: any; slideIdx?: number; hidden?: string[] };

interface Props {
  initialHeroSlides: HeroSlide[];
}

const SECTION_LABELS: Record<string, string> = {
  home_hero_slides:   "Hero Carousel",
  home_stats_bar:     "Stats Bar",
  home_welcome:       "Welcome / About",
  home_impact:        "Impact Numbers",
  home_ministries:    "Ministries",
  home_sermons:       "Sermons / Watch",
  home_endorsements:  "Endorsements",
  home_gallery:         "Ministry in Action (Gallery)",
  home_news_section:    "News",
  home_blog_section:    "Blog",
  home_events_section:  "Events",
  home_media_section:   "Media Section",
  home_give_cta:         "Give / Donate CTA",
  footer_settings:       "Footer",
};

interface OverlayState {
  key: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function PreviewOverride({ initialHeroSlides }: Props) {
  const [heroSlides, setHeroSlides]     = useState<HeroSlide[]>(initialHeroSlides);
  const [isInIframe, setIsInIframe]     = useState(false);
  const [flashKey, setFlashKey]         = useState<string | null>(null);
  const [paused, setPaused]             = useState(false);
  const [forcedSlide, setForcedSlide]   = useState<number | undefined>(undefined);
  const [overlay, setOverlay]           = useState<OverlayState | null>(null);
  const [hiddenKeys, setHiddenKeys]     = useState<string[]>([]);
  const overlayRef                      = useRef<HTMLDivElement>(null);

  // Detect iframe on mount — client-only, no SSR hydration mismatch
  useEffect(() => {
    const inFrame = window.self !== window.top;
    setIsInIframe(inFrame);
    if (inFrame) {
      setPaused(true);
      // Signal the site editor that the page is hydrated and ready to receive broadcasts
      window.parent.postMessage({ type: "PREVIEW_READY" }, "*");
    }
  }, []);

  // ── postMessage listener (iframe only) ───────────────────────────────────
  useEffect(() => {
    if (!isInIframe) return;
    const handler = (e: MessageEvent) => {
      const msg = e.data as AnyMsg;
      if (!msg) return;

      if (msg.type === "PREVIEW_PAUSE") {
        setPaused(true);
        if (typeof msg.slideIdx === "number") setForcedSlide(msg.slideIdx);
        return;
      }
      if (msg.type === "PREVIEW_RESUME") {
        setPaused(false);
        setForcedSlide(undefined);
        return;
      }
      if (msg.type === "SECTION_VISIBILITY" && Array.isArray(msg.hidden)) {
        setHiddenKeys(msg.hidden);
        return;
      }
      if (msg.type !== "PREVIEW_DRAFT") return;

      setFlashKey(msg.key ?? null);
      setTimeout(() => setFlashKey(null), 1200);
      if (msg.key === "home_hero_slides" && Array.isArray(msg.data)) {
        setHeroSlides(msg.data as HeroSlide[]);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [isInIframe]);

  // ── Block ALL link navigation (iframe only) ───────────────────────────────
  useEffect(() => {
    if (!isInIframe) return;
    const block = (e: MouseEvent) => {
      const link = (e.target as Element).closest("a");
      if (link) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", block, true);
    return () => document.removeEventListener("click", block, true);
  }, [isInIframe]);

  // ── Click on section → focus it in editor (iframe only) ──────────────────
  useEffect(() => {
    if (!isInIframe) return;
    const handleClick = (e: MouseEvent) => {
      if (overlayRef.current?.contains(e.target as Node)) return;
      const sectionEl = (e.target as Element).closest("[data-site-section]");
      const key = sectionEl ? (sectionEl as HTMLElement).dataset.siteSection ?? "" : "";
      if (key) window.parent.postMessage({ type: "SECTION_FOCUS", key }, "*");
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isInIframe]);

  // ── Hover → show overlay toolbar (iframe only) ───────────────────────────
  const updateOverlay = useCallback((e: MouseEvent) => {
    if (overlayRef.current?.contains(e.target as Node)) return;
    const el = (e.target as Element).closest("[data-site-section]");
    if (!el) { setOverlay(null); return; }
    const key  = (el as HTMLElement).dataset.siteSection ?? "";
    const rect = el.getBoundingClientRect();
    setOverlay({ key, top: rect.top, left: rect.left, width: rect.width, height: rect.height });
  }, []);

  useEffect(() => {
    if (!isInIframe) return;
    document.addEventListener("mousemove", updateOverlay);
    document.addEventListener("mouseleave", () => setOverlay(null));
    return () => {
      document.removeEventListener("mousemove", updateOverlay);
      document.removeEventListener("mouseleave", () => setOverlay(null));
    };
  }, [isInIframe, updateOverlay]);

  // Clear overlay on scroll (rect changes)
  useEffect(() => {
    if (!isInIframe) return;
    const onScroll = () => setOverlay(null);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isInIframe]);

  // ── Apply visibility dimming (iframe only) ────────────────────────────────
  useEffect(() => {
    if (!isInIframe) return;
    document.querySelectorAll<HTMLElement>("[data-site-section]").forEach(el => {
      const key      = el.dataset.siteSection ?? "";
      const isHid    = hiddenKeys.includes(key);
      el.style.opacity       = isHid ? "0.18" : "";
      el.style.pointerEvents = isHid ? "none" : "";
    });
  }, [hiddenKeys, isInIframe]);

  const isHidden = (key: string) => hiddenKeys.includes(key);

  const toggleVisibility = (key: string) => {
    window.parent.postMessage({ type: "TOGGLE_SECTION", key }, "*");
  };

  const focusSection = (key: string) => {
    window.parent.postMessage({ type: "SECTION_FOCUS", key }, "*");
  };

  return (
    <>
      {/* ── Page-builder UI — only inside the admin iframe ──────────────── */}
      {isInIframe && (
        <>
          {/* Flash badge */}
          {flashKey && (
            <div style={{
              position: "fixed", top: 10, right: 10, zIndex: 99999,
              background: "#C0185A", color: "#fff",
              padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
              boxShadow: "0 2px 12px rgba(0,0,0,0.25)", animation: "previewFlash 1.2s ease forwards",
              pointerEvents: "none",
            }}>
              ⚡ Live Preview
            </div>
          )}

          {/* Paused badge */}
          {paused && (
            <div style={{
              position: "fixed", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 99999,
              background: "rgba(15,23,42,0.85)", color: "#fff",
              padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700,
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
              pointerEvents: "none", letterSpacing: "0.06em",
            }}>
              ⏸ PREVIEW PAUSED
            </div>
          )}

          {/* Section hover overlay */}
          {overlay && (
            <div
              style={{
                position: "fixed",
                top: overlay.top,
                left: overlay.left,
                width: overlay.width,
                height: overlay.height,
                zIndex: 99990,
                pointerEvents: "none",
                outline: isHidden(overlay.key)
                  ? "2px dashed rgba(148,163,184,0.7)"
                  : "2px solid rgba(192,24,90,0.7)",
                outlineOffset: "-2px",
                boxSizing: "border-box",
              }}
            >
              {/* Toolbar pill */}
              <div
                ref={overlayRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                  background: isHidden(overlay.key) ? "rgba(71,85,105,0.95)" : "rgba(192,24,90,0.95)",
                  borderRadius: "0 0 10px 10px",
                  padding: "4px 8px",
                  pointerEvents: "all",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                  userSelect: "none",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", padding: "0 4px" }}>
                  {SECTION_LABELS[overlay.key] ?? overlay.key}
                </span>

                <span style={{ width: 1, height: 14, background: "rgba(255,255,255,0.3)", margin: "0 2px" }} />

                <button
                  onClick={e => { e.stopPropagation(); focusSection(overlay.key); }}
                  title="Edit this section"
                  style={{
                    border: "none", background: "rgba(255,255,255,0.15)", color: "#fff",
                    borderRadius: 5, padding: "3px 8px", cursor: "pointer",
                    fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  ✏ Edit
                </button>

                <button
                  onClick={e => { e.stopPropagation(); toggleVisibility(overlay.key); }}
                  title={isHidden(overlay.key) ? "Show section on site" : "Hide section from site"}
                  style={{
                    border: "none",
                    background: isHidden(overlay.key) ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.12)",
                    color: "#fff",
                    borderRadius: 5, padding: "3px 8px", cursor: "pointer",
                    fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
                  }}
                >
                  {isHidden(overlay.key) ? "👁 Show" : "🚫 Hide"}
                </button>
              </div>

              {/* Hidden badge */}
              {isHidden(overlay.key) && (
                <div style={{
                  position: "absolute",
                  top: "50%", left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "rgba(15,23,42,0.75)",
                  color: "#fff",
                  padding: "6px 16px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  pointerEvents: "none",
                  letterSpacing: "0.05em",
                }}>
                  HIDDEN FROM SITE
                </div>
              )}
            </div>
          )}

          {/* Cursor + flash animation — only injected in iframe */}
          <style>{`
            @keyframes previewFlash {
              0%   { opacity: 0; transform: translateY(-6px); }
              20%  { opacity: 1; transform: translateY(0); }
              80%  { opacity: 1; }
              100% { opacity: 0; }
            }
            [data-site-section] { cursor: pointer; }
          `}</style>
        </>
      )}

      {/* HeroCarousel always renders — public site + admin iframe */}
      <HeroCarousel slides={heroSlides} paused={paused} forcedSlide={forcedSlide} />
    </>
  );
}

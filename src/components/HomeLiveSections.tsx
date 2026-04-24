"use client";

/**
 * HomeLiveSections — renders the Welcome and Ministries sections
 * with live preview support via postMessage PREVIEW_DRAFT from the Site Editor.
 */

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SafeImage from "./SafeImage";
import { translateBatch } from "@/lib/translate-client";

export interface WelcomeData {
  image: string;
  image_zoom?: number;
  image_position?: string;
  heading: string;
  body1: string;
  body2: string;
  cta_label: string;
  cta_href: string;
}

export interface Ministry {
  image: string;
  image_zoom?: number;
  image_position?: string;
  category: string;
  title: string;
  excerpt: string;
  href: string;
}

export interface Sermon {
  image: string;
  image_zoom?: number;
  image_position?: string;
  title: string;
  date: string;
  href: string;
}

export interface SermonsSectionMeta {
  heading?: string;
  desc?: string;
  watch_btn?: string;
  watch_url?: string;
  translations?: Record<string, Record<string, string>>;
}

interface UIStrings {
  welcomeLabel: string;
  whatWeDoLabel: string;
  programsHeading: string;
  readMore: string;
}

const DEFAULT_UI: UIStrings = {
  welcomeLabel:    "Welcome",
  whatWeDoLabel:   "What We Do",
  programsHeading: "Our Ministry Programs",
  readMore:        "Read More",
};

interface Props {
  initialWelcome: WelcomeData;
  initialMinistries: Ministry[];
}

export default function HomeLiveSections({ initialWelcome, initialMinistries }: Props) {
  const [welcome,     setWelcome]     = useState<WelcomeData>(initialWelcome);
  const [ministries,  setMinistries]  = useState<Ministry[]>(initialMinistries);
  const [ui,          setUi]          = useState<UIStrings>(DEFAULT_UI);

  const [lang, setLang] = useState("en");
  const searchParams = useSearchParams();
  useEffect(() => { setLang(searchParams.get("lang") ?? "en"); }, [searchParams]);

  useEffect(() => {
    if (lang === "en") {
      setWelcome(initialWelcome);
      setMinistries(initialMinistries);
      setUi(DEFAULT_UI);
      return;
    }

    const cacheKey = `home_tr_v5_${lang}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const c = JSON.parse(cached) as { welcome: WelcomeData; ministries: Ministry[]; ui: UIStrings };
        setWelcome(c.welcome); setMinistries(c.ministries); setUi(c.ui);
        return;
      }
    } catch { /* ignore */ }

    const uiOrder = Object.values(DEFAULT_UI);
    const wFields = [initialWelcome.heading, initialWelcome.body1, initialWelcome.body2, initialWelcome.cta_label];
    const mFlat: string[] = initialMinistries.flatMap(m => [m.category, m.title, m.excerpt]);
    const allTexts = [...uiOrder, ...wFields, ...mFlat];

    if (window.self !== window.top) return; // preview: only show saved translations
    translateBatch(allTexts, lang).then(results => {
      let idx = 0;
      const uiKeys = Object.keys(DEFAULT_UI) as (keyof UIStrings)[];
      const trUi = {} as UIStrings;
      uiKeys.forEach(k => { trUi[k] = results[idx++] ?? DEFAULT_UI[k]; });

      const trWelcome: WelcomeData = {
        ...initialWelcome,
        heading:   results[idx++] ?? initialWelcome.heading,
        body1:     results[idx++] ?? initialWelcome.body1,
        body2:     results[idx++] ?? initialWelcome.body2,
        cta_label: results[idx++] ?? initialWelcome.cta_label,
      };

      const trMinistries: Ministry[] = initialMinistries.map(m => ({
        ...m,
        category: results[idx++] ?? m.category,
        title:    results[idx++] ?? m.title,
        excerpt:  results[idx++] ?? m.excerpt,
      }));

      setWelcome(trWelcome); setMinistries(trMinistries); setUi(trUi);
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ welcome: trWelcome, ministries: trMinistries, ui: trUi })); } catch { /* ignore */ }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const welcomeRef    = useRef<HTMLElement>(null);
  const ministriesRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (welcomeRef.current)    welcomeRef.current.dataset.siteSection    = "home_welcome";
    if (ministriesRef.current) ministriesRef.current.dataset.siteSection = "home_ministries";
  }, []);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = e.data as { type?: string; key?: string; data?: any };
      if (!msg || msg.type !== "PREVIEW_DRAFT") return;
      if (msg.key === "home_welcome"    && msg.data) setWelcome(msg.data as WelcomeData);
      if (msg.key === "home_ministries" && Array.isArray(msg.data)) setMinistries(msg.data as Ministry[]);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const wZoom = welcome.image_zoom ?? 100;
  const wPos  = welcome.image_position || "center";

  return (
    <>
      {/* ── WELCOME / ABOUT ─────────────────────────── */}
      <section ref={welcomeRef} style={{ backgroundColor: "#f8f9fa" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 500px), 1fr))" }}>
            <div style={{ position: "relative", minHeight: "420px", overflow: "hidden", backgroundColor: "#1a2a3a" }}>
              <SafeImage
                src={welcome.image}
                alt=""
                fill
                style={{
                  objectFit: "cover",
                  objectPosition: wPos,
                  transform: wZoom > 100 ? `scale(${wZoom / 100})` : undefined,
                  transformOrigin: wPos,
                  transition: "transform 0.3s ease, object-position 0.3s ease",
                }}
                fallbackLabel="Wesley Paul Ministry"
                fallbackBg="linear-gradient(135deg, #0d1b2e 0%, #2070B8 100%)"
              />
            </div>
            <div className="welcome-text-col">
              <div>
                <span className="section-label">{ui.welcomeLabel}</span>
                <h2
                  className="section-title"
                  style={{ fontSize: "1.875rem", marginBottom: "16px" }}
                  dangerouslySetInnerHTML={{ __html: welcome.heading }}
                />
                <div className="section-divider-left" />
                <p style={{ color: "#6c757d", lineHeight: 1.7, marginBottom: "16px" }}>{welcome.body1}</p>
                <p style={{ color: "#6c757d", lineHeight: 1.7, marginBottom: "24px" }}>{welcome.body2}</p>
                <Link href={welcome.cta_href} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  {welcome.cta_label} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MINISTRY PROGRAMS ────────────────────────── */}
      <section ref={ministriesRef} style={{ backgroundColor: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label">{ui.whatWeDoLabel}</span>
            <h2 className="section-title" style={{ fontSize: "2rem" }}>{ui.programsHeading}</h2>
            <div className="section-divider" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "32px" }}>
            {ministries.map((m) => {
              const mZoom = m.image_zoom ?? 100;
              const mPos  = m.image_position || "center";
              return (
                <Link key={m.title} href={m.href} className="card-hover" style={{ display: "block", textDecoration: "none" }}>
                  <div style={{ position: "relative", height: "208px", overflow: "hidden", backgroundColor: "#1a2a3a" }}>
                    <SafeImage
                      src={m.image}
                      alt=""
                      fill
                      style={{
                        objectFit: "cover",
                        objectPosition: mPos,
                        transform: mZoom > 100 ? `scale(${mZoom / 100})` : undefined,
                        transformOrigin: mPos,
                        transition: "transform 0.3s ease, object-position 0.3s ease",
                      }}
                      fallbackLabel={m.category}
                      fallbackBg="linear-gradient(135deg, #0d1b2e 0%, #1a2a3a 100%)"
                    />
                    <div style={{ position: "absolute", top: "16px", left: "16px", padding: "4px 10px", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#fff", backgroundColor: "#C0185A", borderRadius: "3px" }}>
                      {m.category}
                    </div>
                  </div>
                  <div style={{ padding: "24px" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px", color: "#2070B8" }}>{m.title}</h3>
                    <p style={{ fontSize: "14px", color: "#6c757d", lineHeight: 1.7, marginBottom: "16px" }}>{m.excerpt}</p>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#C0185A" }}>
                      {ui.readMore} <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

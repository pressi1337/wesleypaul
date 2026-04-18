"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Play } from "lucide-react";
import SafeImage from "./SafeImage";
import { translateBatch } from "@/lib/translate-client";
import type { Sermon, SermonsSectionMeta } from "./HomeLiveSections";

const DEFAULT_HEADING  = "Watch and Listen to Dr. Wesley";
const DEFAULT_DESC     = "Subscribe to our YouTube channel for sermons, crusade highlights, and ministry updates from Dr. Wesley Paul.";
const DEFAULT_BTN      = "Watch on YouTube";
const DEFAULT_EYEBROW  = "Media";

interface Props {
  initialSermons: Sermon[];
  initialSermonsMeta?: SermonsSectionMeta;
}

export default function HomeSermonSection({ initialSermons, initialSermonsMeta }: Props) {
  const [sermons,     setSermons]     = useState<Sermon[]>(initialSermons);
  const [sermonsMeta, setSermonsMeta] = useState<SermonsSectionMeta | undefined>(initialSermonsMeta);

  const [lang, setLang] = useState("en");
  const searchParams = useSearchParams();
  useEffect(() => { setLang(searchParams.get("lang") ?? "en"); }, [searchParams]);

  // Translate sermon titles on lang change
  const [trTitles, setTrTitles]   = useState<string[]>(initialSermons.map(s => s.title));
  const [trHeading, setTrHeading] = useState(initialSermonsMeta?.heading ?? DEFAULT_HEADING);
  const [trBtn,     setTrBtn]     = useState(initialSermonsMeta?.watch_btn ?? DEFAULT_BTN);

  useEffect(() => {
    setTrTitles(sermons.map(s => s.title));
    setTrHeading(sermonsMeta?.heading ?? DEFAULT_HEADING);
    setTrBtn(sermonsMeta?.watch_btn ?? DEFAULT_BTN);
  }, [sermons, sermonsMeta]);

  useEffect(() => {
    if (lang === "en") {
      setTrTitles(sermons.map(s => s.title));
      setTrHeading(sermonsMeta?.translations?.[lang]?.heading ?? sermonsMeta?.heading ?? DEFAULT_HEADING);
      setTrBtn(sermonsMeta?.translations?.[lang]?.watch_btn ?? sermonsMeta?.watch_btn ?? DEFAULT_BTN);
      return;
    }
    // Use saved admin translations first
    const saved = sermonsMeta?.translations?.[lang];
    if (saved?.heading)   setTrHeading(saved.heading);
    if (saved?.watch_btn) setTrBtn(saved.watch_btn);

    if (window.self !== window.top) return; // preview: only show saved translations
    const cacheKey = `sermons_tr_v1_${lang}`;
    try {
      const c = JSON.parse(sessionStorage.getItem(cacheKey) ?? "null") as { titles: string[]; heading: string; btn: string } | null;
      if (c) { setTrTitles(c.titles); setTrHeading(c.heading); setTrBtn(c.btn); return; }
    } catch { /* ignore */ }

    const texts = [
      sermonsMeta?.heading ?? DEFAULT_HEADING,
      sermonsMeta?.watch_btn ?? DEFAULT_BTN,
      ...sermons.map(s => s.title),
    ];
    translateBatch(texts, lang).then(results => {
      const h  = results[0] ?? (sermonsMeta?.heading ?? DEFAULT_HEADING);
      const b  = results[1] ?? (sermonsMeta?.watch_btn ?? DEFAULT_BTN);
      const ts = sermons.map((s, i) => results[2 + i] ?? s.title);
      setTrHeading(h); setTrBtn(b); setTrTitles(ts);
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ titles: ts, heading: h, btn: b })); } catch { /* ignore */ }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // data-site-section added imperatively to avoid hydration mismatch
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (sectionRef.current) sectionRef.current.dataset.siteSection = "home_sermons";
  }, []);

  // Live preview: listen for PREVIEW_DRAFT from site editor
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = e.data as { type?: string; key?: string; data?: any };
      if (!msg || msg.type !== "PREVIEW_DRAFT" || msg.key !== "home_sermons") return;
      if (Array.isArray(msg.data)) {
        setSermons(msg.data as Sermon[]);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = msg.data as any;
        if (Array.isArray(d?.items)) setSermons(d.items as Sermon[]);
        setSermonsMeta(d as SermonsSectionMeta);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  if (sermons.length === 0) return null;

  const heading  = sermonsMeta?.translations?.[lang]?.heading ?? trHeading;
  const watchBtn = sermonsMeta?.translations?.[lang]?.watch_btn ?? trBtn;
  const watchUrl = sermonsMeta?.watch_url || "https://www.youtube.com/@DrWesleyPaul";

  return (
    <section ref={sectionRef} style={{ backgroundColor: "#f8f9fa", padding: "80px 24px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <span className="section-label">{DEFAULT_EYEBROW}</span>
          <h2 className="section-title" style={{ fontSize: "2rem" }}>{heading}</h2>
          <div className="section-divider" />
          <p style={{ color: "#6c757d", maxWidth: "480px", margin: "16px auto 0" }}>
            {sermonsMeta?.desc ?? DEFAULT_DESC}
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "32px", marginBottom: "40px" }}>
          {sermons.map((s, i) => {
            const sZoom = s.image_zoom ?? 100;
            const sPos  = s.image_position || "center";
            return (
              <a key={s.title + i} href={s.href} target="_blank" rel="noopener noreferrer" className="card-hover" style={{ display: "block", textDecoration: "none" }}>
                <div style={{ position: "relative", height: "192px", overflow: "hidden", backgroundColor: "#1a2a3a" }}>
                  <SafeImage
                    src={s.image}
                    alt=""
                    fill
                    style={{
                      objectFit: "cover",
                      objectPosition: sPos,
                      transform: sZoom > 100 ? `scale(${sZoom / 100})` : undefined,
                      transformOrigin: sPos,
                      transition: "transform 0.3s ease",
                    }}
                    fallbackBg="linear-gradient(135deg, #0d1b2e 0%, #1a2a3a 100%)"
                  />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#C0185A" }}>
                      <Play size={22} fill="white" color="white" style={{ marginLeft: "3px" }} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: "20px" }}>
                  <p style={{ fontSize: "12px", color: "#adb5bd", marginBottom: "8px" }}>{s.date}</p>
                  <h4 style={{ fontWeight: 700, fontSize: "14px", lineHeight: 1.4, color: "#2070B8" }}>{trTitles[i] ?? s.title}</h4>
                </div>
              </a>
            );
          })}
        </div>
        <div style={{ textAlign: "center" }}>
          <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Play size={16} /> {watchBtn}
          </a>
        </div>
      </div>
    </section>
  );
}

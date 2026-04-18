"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { translateBatch } from "@/lib/translate-client";

export interface ImpactStat { value: string; label: string; }
export interface GiveCTA {
  label: string; heading: string; body: string;
  primary_label: string; primary_href: string;
  secondary_label: string; secondary_href: string;
}

interface Props {
  impact: ImpactStat[];
  giveCTA: GiveCTA;
  galleryEyebrow?: string;
  galleryHeading?: string;
}


export default function HomeClientSections({ impact, giveCTA }: Props) {
  const [trImpact, setTrImpact] = useState<ImpactStat[]>(impact);
  const [trCta, setTrCta] = useState<GiveCTA>(giveCTA);

  const searchParams = useSearchParams();
  const [lang, setLang] = useState("en");
  useEffect(() => { setLang(searchParams.get("lang") ?? "en"); }, [searchParams]);

  // Live preview listener for Site Editor
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as { type?: string; key?: string; data?: unknown };
      if (!msg || msg.type !== "PREVIEW_DRAFT") return;
      if (msg.key === "home_impact" && Array.isArray(msg.data)) setTrImpact(msg.data as ImpactStat[]);
      if (msg.key === "home_give_cta" && msg.data) setTrCta(msg.data as GiveCTA);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (lang === "en") { setTrImpact(impact); setTrCta(giveCTA); return; }
    const cacheKey = `home_extra_tr_v4_${lang}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const c = JSON.parse(cached) as { impact: ImpactStat[]; cta: GiveCTA };
        setTrImpact(c.impact); setTrCta(c.cta); return;
      }
    } catch { /* ignore */ }

    const impactLabels = impact.map(s => s.label);
    const ctaTexts = [giveCTA.label, giveCTA.heading, giveCTA.body, giveCTA.primary_label, giveCTA.secondary_label];
    const allTexts = [...impactLabels, ...ctaTexts];

    if (window.self !== window.top) return; // preview: only show saved translations
    translateBatch(allTexts, lang).then(results => {
      let idx = 0;
      const newImpact: ImpactStat[] = impact.map(s => ({ ...s, label: results[idx++] ?? s.label }));
      const newCta: GiveCTA = {
        ...giveCTA,
        label: results[idx++] ?? giveCTA.label,
        heading: results[idx++] ?? giveCTA.heading,
        body: results[idx++] ?? giveCTA.body,
        primary_label: results[idx++] ?? giveCTA.primary_label,
        secondary_label: results[idx++] ?? giveCTA.secondary_label,
      };
      setTrImpact(newImpact); setTrCta(newCta);
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ impact: newImpact, cta: newCta })); } catch { /* ignore */ }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return (
    <>
      {/* ── IMPACT COUNTER ── */}
      <section data-site-section="home_impact" style={{ backgroundColor: "#2070B8", padding: "64px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "32px", textAlign: "center" }}>
            {trImpact.map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: "3rem", fontWeight: 800, color: "#f5a623", lineHeight: 1, marginBottom: "8px" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GIVE CTA ── */}
      <section
        data-site-section="home_give_cta"
        style={{ padding: "80px 24px", textAlign: "center", background: "linear-gradient(rgba(13,27,46,0.9), rgba(13,27,46,0.95)), #0d1b2e" }}
      >
        <div style={{ maxWidth: "768px", margin: "0 auto" }}>
          <span className="section-label" style={{ color: "#f5a623" }}>{trCta.label}</span>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "20px", marginTop: "8px" }}>
            {trCta.heading}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "40px", lineHeight: 1.7, fontSize: "1.1rem" }}>
            {trCta.body}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
            <Link href={trCta.primary_href} className="btn-primary">{trCta.primary_label}</Link>
            <Link href={trCta.secondary_href} className="btn-outline">{trCta.secondary_label}</Link>
          </div>
        </div>
      </section>
    </>
  );
}

export const dynamic = "force-dynamic";

import type React from "react";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import ContactFormClient from "@/components/ContactFormClient";
import BookingFormClient from "@/components/BookingFormClient";
import CustomFormRenderer from "@/components/CustomFormRenderer";
import pool from "@/lib/db";
import { SUPPORTED_LANG_CODES } from "@/lib/languages";

/** Returns the set of active language codes from the DB (falls back to static config). */
async function getActiveLangCodes(): Promise<Set<string>> {
  try {
    const [rows] = await pool.execute(
      "SELECT setting_value FROM site_settings WHERE setting_key = 'active_languages' LIMIT 1"
    );
    const arr = rows as { setting_value: string }[];
    if (arr.length > 0) {
      const langs = JSON.parse(arr[0].setting_value) as Array<{ code: string }>;
      if (langs.length > 0) return new Set(langs.map(l => l.code));
    }
  } catch { /* fall through */ }
  return new Set(SUPPORTED_LANG_CODES);
}

// ── Types ────────────────────────────────────────────────────────────────────
interface Page {
  id: number;
  title: string;
  slug: string;
  status: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  layout: string;
}

interface Section {
  id: number;
  section_type: string;
  sort_order: number;
  content_json: string;
}

interface SectionTranslationRow {
  section_id: number;
  language_code: string;
  content_json: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseContent(json: string): Record<string, unknown> {
  try { return JSON.parse(json) as Record<string, unknown>; }
  catch { return {}; }
}
function getString(obj: Record<string, unknown>, key: string): string {
  const val = obj[key]; return typeof val === "string" ? val : "";
}
function getArray<T>(obj: Record<string, unknown>, key: string): T[] {
  const val = obj[key]; return Array.isArray(val) ? (val as T[]) : [];
}

// ── DB query ─────────────────────────────────────────────────────────────────
async function getPageData(slug: string, lang: string) {
  try {
    const activeLangs = await getActiveLangCodes();

    const [pageRows] = await pool.execute(
      "SELECT * FROM pages WHERE slug = ? AND status = 'published' LIMIT 1",
      [slug]
    );
    const pages = pageRows as Page[];
    if (pages.length === 0) return null;
    const page = pages[0];

    const [sectionRows] = await pool.execute(
      "SELECT * FROM page_sections WHERE page_id = ? ORDER BY sort_order ASC",
      [page.id]
    );
    const sections = sectionRows as Section[];

    let sectionTranslations: SectionTranslationRow[] = [];
    if (lang && activeLangs.has(lang) && sections.length > 0) {
      const sectionIds = sections.map(s => s.id);
      const placeholders = sectionIds.map(() => "?").join(",");
      const [trRows] = await pool.execute(
        `SELECT section_id, language_code, content_json FROM section_translations
         WHERE section_id IN (${placeholders}) AND language_code = ?`,
        [...sectionIds, lang]
      );
      sectionTranslations = trRows as SectionTranslationRow[];
    }

    const mergedSections: Section[] = sections.map(sec => {
      if (!lang || !activeLangs.has(lang)) return sec;
      const tr = sectionTranslations.find(t => t.section_id === sec.id && t.language_code === lang);
      if (!tr) return sec;
      const english = parseContent(sec.content_json);
      const translated = parseContent(tr.content_json);
      return { ...sec, content_json: JSON.stringify(mergeContent(english, translated)) };
    });

    return { page, sections: mergedSections };
  } catch {
    return null;
  }
}

function mergeContent(
  english: Record<string, unknown>,
  translated: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...english };
  for (const [key, trVal] of Object.entries(translated)) {
    if (typeof trVal === "string" && trVal.trim()) {
      result[key] = trVal;
    } else if (Array.isArray(trVal) && Array.isArray(english[key])) {
      const engArr = english[key] as Record<string, unknown>[];
      const trArr = trVal as Record<string, unknown>[];
      result[key] = engArr.map((engItem, i) => {
        const trItem = trArr[i];
        if (!trItem || typeof trItem !== "object") return engItem;
        return mergeContent(engItem, trItem as Record<string, unknown>);
      });
    }
  }
  return result;
}

// ── Section background helper ─────────────────────────────────────────────────
function getBgStyle(content: Record<string, unknown>): React.CSSProperties {
  const img = getString(content, "bg_image");
  if (!img) return {};
  const pos = getString(content, "bg_position") || "center";
  const zoom = Number(content.bg_zoom ?? 100);
  const bgSize = zoom > 100 ? `${zoom}%` : "cover";
  return { backgroundImage: `url(${img})`, backgroundSize: bgSize, backgroundPosition: pos, position: "relative" };
}
function getBgOverlayOpacity(content: Record<string, unknown>): number {
  return Number(content.bg_overlay ?? 50) / 100;
}
function BgImageOverlay({ content }: { content: Record<string, unknown> }) {
  if (!getString(content, "bg_image")) return null;
  return <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${getBgOverlayOpacity(content)})`, zIndex: 0, pointerEvents: "none" }} />;
}

// ── Section renderers ─────────────────────────────────────────────────────────

function PageHeaderSection({ content }: { content: Record<string, unknown> }) {
  const eyebrow = getString(content, "eyebrow");
  const heading = getString(content, "heading");
  const subheading = getString(content, "subheading");
  const bgImg = getString(content, "bg_image") || getString(content, "image");
  const overlayOpacity = getBgOverlayOpacity(content);
  const bgZoom = Number(content.bg_zoom ?? content.image_zoom ?? 100);
  const bgPos = getString(content, "bg_position") || getString(content, "image_position") || "center";
  const bgSize = bgZoom > 100 ? `${bgZoom}%` : "cover";
  const bg = bgImg
    ? `linear-gradient(rgba(13,27,46,${overlayOpacity}),rgba(13,27,46,${overlayOpacity})), url(${bgImg}) ${bgPos}/${bgSize} no-repeat`
    : (getString(content, "bg_color") ? `linear-gradient(135deg, ${getString(content, "bg_color")}, ${getString(content, "bg_color")})` : "linear-gradient(135deg, #0a1523 0%, #2070B8 100%)");
  return (
    <section style={{ padding: "80px 24px", background: bg }}>
      <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", color: "#fff" }}>
        {eyebrow && <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" as const, marginBottom: 12, color: "#f5a623" }}>{eyebrow}</p>}
        {heading && <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 16 }}>{heading}</h1>}
        <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
        {subheading && <p style={{ marginTop: 24, fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", maxWidth: 560, margin: "24px auto 0" }}>{subheading}</p>}
      </div>
    </section>
  );
}

function HeroSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading");
  const subheading = getString(content, "subheading");
  const ctaText = getString(content, "cta_text");
  const ctaLink = getString(content, "cta_link");
  const image = getString(content, "image");
  const imageZoom = Number(content.image_zoom ?? 100);
  const imagePosition = getString(content, "image_position") || "center";
  return (
    <section style={{ position: "relative", background: image ? undefined : "#0a1523", height: "clamp(280px, 35vw, 420px)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", overflow: "hidden" }}>
      {image && <Image src={image} alt={heading} fill style={{ objectFit: "cover", objectPosition: imagePosition, transform: imageZoom > 100 ? `scale(${imageZoom / 100})` : undefined, transformOrigin: imagePosition }} priority />}
      {image && <div style={{ position: "absolute", inset: 0, background: "rgba(10,21,35,0.65)" }} />}
      <div style={{ position: "relative", zIndex: 1, padding: "0 24px", maxWidth: 800 }}>
        {heading && <h1 style={{ fontSize: "clamp(28px, 5vw, 56px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: "0 0 16px" }}>{heading}</h1>}
        {subheading && <p style={{ fontSize: "clamp(16px, 2.5vw, 22px)", color: "rgba(255,255,255,0.82)", margin: "0 0 28px", lineHeight: 1.6 }}>{subheading}</p>}
        {ctaText && ctaLink && (
          <a href={ctaLink} style={{ display: "inline-block", padding: "14px 32px", background: "#C0185A", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>{ctaText}</a>
        )}
      </div>
    </section>
  );
}

function TextSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading");
  const body = getString(content, "body");
  const align = getString(content, "align") || "left";
  const hasBg = !!getString(content, "bg_image");
  const bgColor = getString(content, "bg_color") || "#0a1523";
  return (
    <section style={{ padding: "60px 24px", ...(hasBg ? { backgroundColor: bgColor } : { background: "transparent" }), textAlign: align === "center" ? "center" : "left", ...getBgStyle(content) }}>
      <BgImageOverlay content={content} />
      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {heading && <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 700, color: hasBg ? "#fff" : "#2070B8", margin: "0 0 20px" }}>{heading}</h2>}
        {body && (
          <div style={{ color: hasBg ? "rgba(255,255,255,0.85)" : "#4a5568", lineHeight: 1.8, fontSize: 17 }}>
            {body.split("\n").map((para, i) => para.trim() ? <p key={i} style={{ margin: "0 0 16px" }}>{para}</p> : null)}
          </div>
        )}
      </div>
    </section>
  );
}

interface CardItem { title?: string; description?: string; color?: string; }
function CardsGridSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading");
  const subtitle = getString(content, "subtitle");
  const bgLight = content["bg_light"] !== false;
  const items = getArray<CardItem>(content, "items");
  const hasBg = !!getString(content, "bg_image");
  const bgColor = getString(content, "bg_color") || "#0a1523";
  return (
    <section style={{ padding: "80px 24px", backgroundColor: hasBg ? bgColor : (bgLight ? "#f8f9fa" : "#fff"), ...getBgStyle(content) }}>
<BgImageOverlay content={content} />
      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {(heading || subtitle) && (
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            {heading && <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: hasBg ? "#fff" : "#2070B8", marginBottom: 12 }}>{heading}</h2>}
            <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
            {subtitle && <p style={{ color: "#6c757d", maxWidth: 600, margin: "16px auto 0", lineHeight: 1.8 }}>{subtitle}</p>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "1.5rem" }}>
          {items.map((item, i) => {
            const color = item.color || "#2070B8";
            const emojiMatch = item.title?.match(/^([\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}📅📍📖✉🎵🎤🎭✝️🙏💛]+)\s*/u);
            const emoji = emojiMatch ? emojiMatch[1] : null;
            const titleText = emoji ? item.title!.slice(emojiMatch![0].length).trim() : item.title;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", background: "#fff", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", overflow: "hidden", border: "1px solid rgba(0,0,0,0.05)" }}>
                {/* Top accent bar */}
                <div style={{ height: 4, background: color, flexShrink: 0 }} />
                {/* Icon + title */}
                <div style={{ padding: "20px 22px 14px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: `${color}1a`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: emoji ? 22 : 18 }}>
                    {emoji ?? <span style={{ color, fontWeight: 800 }}>✦</span>}
                  </div>
                  {titleText && <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", lineHeight: 1.35, margin: 0 }}>{titleText}</h3>}
                </div>
                {/* Body */}
                {item.description && (
                  <div style={{ padding: "0 22px 22px", color: "#475569", fontSize: 14, lineHeight: 1.75, flex: 1 }} dangerouslySetInnerHTML={{ __html:
                    item.description
                      .replace(/<a\s/gi, '<a style="color:#2070B8;text-decoration:underline;text-underline-offset:3px;font-weight:600;" ')
                      .replace(/<ul/gi, '<ul style="list-style:disc;padding-left:18px;margin:0 0 4px;"')
                      .replace(/<ol/gi, '<ol style="list-style:decimal;padding-left:18px;margin:0 0 4px;"')
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface SermonItem { image?: string; title?: string; date?: string; href?: string; }
function SermonsGridSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading");
  const subtitle = getString(content, "subtitle");
  const youtubeUrl = getString(content, "youtube_url");
  const items = getArray<SermonItem>(content, "items");
  return (
    <section style={{ padding: "80px 24px", backgroundColor: "#f8f9fa" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          {heading && <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#2070B8", marginBottom: 12 }}>{heading}</h2>}
          <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
          {subtitle && <p style={{ color: "#6c757d", maxWidth: 480, margin: "16px auto 0", lineHeight: 1.8 }}>{subtitle}</p>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 32, marginBottom: 40 }}>
          {items.map((s, i) => (
            <a key={i} href={s.href || "#"} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none" }}>
              <div style={{ position: "relative", height: 192, overflow: "hidden", backgroundColor: "#1a2a3a", borderRadius: "4px 4px 0 0" }}>
                {s.image && <Image src={s.image} alt={s.title || ""} fill style={{ objectFit: "cover" }} />}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#C0185A" }}>
                    <span style={{ color: "#fff", fontSize: 22, marginLeft: 3 }}>▶</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: "20px", background: "#fff", borderRadius: "0 0 4px 4px", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}>
                {s.date && <p style={{ fontSize: 12, color: "#adb5bd", marginBottom: 8 }}>{s.date}</p>}
                {s.title && <h4 style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4, color: "#2070B8" }}>{s.title}</h4>}
              </div>
            </a>
          ))}
        </div>
        {youtubeUrl && (
          <div style={{ textAlign: "center" }}>
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>▶</span> Watch on YouTube
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function TwoColSection({ content }: { content: Record<string, unknown> }) {
  const label = getString(content, "label");
  const heading = getString(content, "heading");
  const body = getString(content, "body");
  const image = getString(content, "image");
  const imageSide = getString(content, "image_side") || "left";
  const imageFit = getString(content, "image_fit") || "cover";
  const ctaLabel = getString(content, "cta_label");
  const ctaHref = getString(content, "cta_href");
  const ctaSecondaryLabel = getString(content, "cta_secondary_label");
  const ctaSecondaryHref = getString(content, "cta_secondary_href");
  const imageZoom = Number(content.image_zoom ?? 100);
  const imagePosition = getString(content, "image_position") || "center";

  const imgCol = image ? (
    imageFit === "contain" ? (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={heading || "image"} style={{ maxWidth: "min(100%, 380px)", height: "auto", display: "block", borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.1)", transform: imageZoom > 100 ? `scale(${imageZoom / 100})` : undefined, transformOrigin: "center" }} />
      </div>
    ) : (
      <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", minHeight: 400, backgroundColor: "#1a2a3a", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}>
        <Image src={image} alt={heading || "image"} fill style={{ objectFit: "cover", objectPosition: imagePosition, transform: imageZoom > 100 ? `scale(${imageZoom / 100})` : undefined, transformOrigin: imagePosition }} />
      </div>
    )
  ) : null;

  const textCol = (
    <div style={{ backgroundColor: "#fff", borderRadius: 8, padding: 40, boxShadow: "0 2px 15px rgba(0,0,0,0.07)" }}>
      {label && <span className="section-label">{label}</span>}
      {heading && <h2 className="section-title" style={{ fontSize: "1.8rem", marginBottom: 16 }}>{heading}</h2>}
      <div className="section-divider-left" />
      {body && body.split("\n\n").map((para, i) => (
        <p key={i} style={{ color: "#6c757d", lineHeight: 1.8, marginBottom: 16 }}>{para}</p>
      ))}
      {(ctaLabel || ctaSecondaryLabel) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>
          {ctaLabel && ctaHref && <a href={ctaHref} className="btn-primary">{ctaLabel}</a>}
          {ctaSecondaryLabel && ctaSecondaryHref && <a href={ctaSecondaryHref} className="btn-outline-accent">{ctaSecondaryLabel}</a>}
        </div>
      )}
    </div>
  );

  return (
    <section style={{ padding: "80px 24px", backgroundColor: "#f8f9fa" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "3rem", alignItems: "center" }}>
          {imageSide === "left" ? <>{imgCol}{textCol}</> : <>{textCol}{imgCol}</>}
        </div>
      </div>
    </section>
  );
}

interface GalleryItem { image?: string; caption?: string; }
function GallerySection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading");
  const items = getArray<GalleryItem>(content, "items");
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px" }}>
      {heading && <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 700, color: "#2070B8", margin: "0 0 28px", textAlign: "center" }}>{heading}</h2>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {item.image && (
              <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: 10, overflow: "hidden" }}>
                <Image src={item.image} alt={item.caption || `Gallery image ${i + 1}`} fill style={{ objectFit: "cover" }} />
              </div>
            )}
            {item.caption && <p style={{ fontSize: 13.5, color: "#64748b", textAlign: "center", margin: 0 }}>{item.caption}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading");
  const body = getString(content, "body");
  const primaryText = getString(content, "primary_cta_text");
  const primaryLink = getString(content, "primary_cta_link");
  const secondaryText = getString(content, "secondary_cta_text");
  const secondaryLink = getString(content, "secondary_cta_link");
  const bgColor = getString(content, "bg_color") || "#0d1b2e";
  return (
    <section style={{ backgroundColor: bgColor, padding: "80px 24px", textAlign: "center", ...getBgStyle(content) }}>
      <BgImageOverlay content={content} />
      <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {heading && <h2 style={{ fontSize: "clamp(24px, 3.5vw, 42px)", fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>{heading}</h2>}
        {body && <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", margin: "0 0 32px", lineHeight: 1.7 }}>{body}</p>}
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          {primaryText && primaryLink && (
            <a href={primaryLink} style={{ padding: "14px 32px", background: "#C0185A", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>{primaryText}</a>
          )}
          {secondaryText && secondaryLink && (
            <a href={secondaryLink} style={{ padding: "14px 32px", border: "2px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 16, textDecoration: "none" }}>{secondaryText}</a>
          )}
        </div>
      </div>
    </section>
  );
}

interface FaqItem { question?: string; answer?: string; }
function FaqSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading");
  const items = getArray<FaqItem>(content, "items");
  return (
    <section style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px" }}>
      {heading && <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 700, color: "#2070B8", margin: "0 0 28px" }}>{heading}</h2>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item, i) => (
          <details key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            <summary style={{ padding: "16px 20px", fontWeight: 600, fontSize: 16, color: "#0f172a", cursor: "pointer", background: "#f8fafc", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {item.question}
            </summary>
            {item.answer && <div style={{ padding: "16px 20px", color: "#4a5568", lineHeight: 1.7, fontSize: 15 }}>{item.answer}</div>}
          </details>
        ))}
      </div>
    </section>
  );
}

interface TeamItem { name?: string; role?: string; image?: string; bio?: string; }
function TeamSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading");
  const items = getArray<TeamItem>(content, "items");
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px" }}>
      {heading && <h2 style={{ fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 700, color: "#2070B8", margin: "0 0 32px", textAlign: "center" }}>{heading}</h2>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
        {items.map((member, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
            {member.image && (
              <div style={{ position: "relative", height: 220 }}>
                <Image src={member.image} alt={member.name || "Team member"} fill style={{ objectFit: "cover" }} />
              </div>
            )}
            <div style={{ padding: "16px 18px" }}>
              {member.name && <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{member.name}</h3>}
              {member.role && <p style={{ fontSize: 13, color: "#2070B8", fontWeight: 600, margin: "0 0 10px" }}>{member.role}</p>}
              {member.bio && <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: 0 }}>{member.bio}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContactFormSection({ content }: { content: Record<string, unknown> }) {
  return (
    <ContactFormClient content={content as Parameters<typeof ContactFormClient>[0]["content"]} />
  );
}

function BookingFormSection() {
  return <BookingFormClient />;
}

async function LatestPostsSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading") || "Latest Posts";
  const subtitle = getString(content, "subtitle");
  const postType = getString(content, "post_type") || "all";
  const count = parseInt(getString(content, "count") || "6", 10);
  interface PostRow { id: number; title: string; slug: string; post_type: string; excerpt: string; featured_image: string; created_at: string; }
  let posts: PostRow[] = [];
  try {
    if (postType === "all") {
      const [rows2] = await pool.execute(`SELECT id,title,slug,post_type,excerpt,featured_image,created_at FROM posts WHERE status='published' ORDER BY created_at DESC LIMIT ?`, [count]);
      posts = rows2 as PostRow[];
    } else {
      const [rows2] = await pool.execute(`SELECT id,title,slug,post_type,excerpt,featured_image,created_at FROM posts WHERE status='published' AND post_type=? ORDER BY created_at DESC LIMIT ?`, [postType, count]);
      posts = rows2 as PostRow[];
    }
  } catch { /* DB not ready */ }
  const typeColors: Record<string, string> = { blog: "#2070B8", news: "#16a34a", event: "#7c3aed" };
  return (
    <section style={{ padding: "60px 24px", background: "#f8f9fa" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {heading && <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, color: "#0f172a", textAlign: "center", marginBottom: 8 }}>{heading}</h2>}
        {subtitle && <p style={{ textAlign: "center", color: "#64748b", fontSize: 16, marginBottom: 36 }}>{subtitle}</p>}
        {posts.length === 0 ? <p style={{ textAlign: "center", color: "#94a3b8" }}>No posts published yet.</p> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 }}>
            {posts.map(post => {
              const date = new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const tc = typeColors[post.post_type] ?? "#2070B8";
              const href = `/${post.post_type === "event" ? "events" : post.post_type === "news" ? "news" : "blog"}/${post.slug}`;
              return (
                <a key={post.id} href={href} style={{ textDecoration: "none", display: "flex", flexDirection: "column", background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "transform 0.15s" }}>
                  {post.featured_image ? <img src={post.featured_image} alt={post.title} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} /> : <div style={{ height: 100, background: `linear-gradient(135deg,${tc}22,${tc}11)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📰</div>}
                  <div style={{ padding: "16px 18px", flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, background: tc, color: "#fff", padding: "2px 8px", borderRadius: 3, textTransform: "uppercase" }}>{post.post_type}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>{date}</span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.4, marginBottom: 8 }}>{post.title}</h3>
                    {post.excerpt && <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>{post.excerpt.slice(0, 100)}{post.excerpt.length > 100 ? "…" : ""}</p>}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

async function CustomFormSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading") || "Get in Touch";
  const description = getString(content, "description");
  // form_id may be stored as a number or string in content_json
  const formId = Number(content["form_id"] ?? 0);
  if (!formId) return null;
  const submitLabel = getString(content, "submit_label") || "Submit";
  interface FormRow { id: number; name: string; fields_json: unknown; success_message: string; }
  let form: FormRow | null = null;
  try {
    const [rows] = await pool.execute("SELECT id,name,fields_json,success_message FROM forms WHERE id=? LIMIT 1", [formId]);
    form = (rows as FormRow[])[0] ?? null;
  } catch { /* DB not ready */ }
  if (!form) return null;
  const fields: unknown[] = Array.isArray(form.fields_json)
    ? form.fields_json
    : (() => { try { return JSON.parse(form.fields_json as string) as unknown[]; } catch { return []; } })();

  const layout = getString(content, "layout") || "left_form";
  const formHeading = getString(content, "form_heading");
  const hasBg = !!getString(content, "bg_image");
  const bgColor = getString(content, "bg_color") || (hasBg ? "#0a1523" : "#f8f9fa");
  const isDark = hasBg || (bgColor !== "#f8f9fa" && bgColor !== "#fff" && bgColor !== "#ffffff");

  const formCard = (
    <div style={{ background: "#fff", borderRadius: 16, padding: "36px 32px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
      {formHeading && layout === "left_form" && (
        <h3 style={{ fontSize: "clamp(16px, 2vw, 20px)", fontWeight: 700, color: "#0f172a", margin: "0 0 20px", paddingBottom: 14, borderBottom: "2px solid #f1f5f9" }}>
          {formHeading}
        </h3>
      )}
      <Suspense>
        <CustomFormRenderer
          formId={form.id}
          fields={fields as Parameters<typeof CustomFormRenderer>[0]["fields"]}
          successMessage={form.success_message}
          submitLabel={submitLabel}
        />
      </Suspense>
    </div>
  );

  return (
    <section id="contact" style={{ padding: "80px 24px", backgroundColor: bgColor, ...getBgStyle(content) }}>
      <BgImageOverlay content={content} />
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {layout === "form_only" ? (
          <div style={{ maxWidth: 660, margin: "0 auto" }}>
            {heading && (
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <h2 style={{ fontSize: "clamp(26px,3.5vw,42px)", fontWeight: 800, color: isDark ? "#fff" : "#0f172a", margin: "0 0 14px", lineHeight: 1.15 }}>{heading}</h2>
                <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto 18px" }} />
                {description && (
                  <div style={{ color: isDark ? "rgba(255,255,255,0.8)" : "#4a5568", fontSize: 15, lineHeight: 1.75, maxWidth: 540, margin: "0 auto" }}
                    dangerouslySetInnerHTML={{ __html: description }} />
                )}
              </div>
            )}
            {formCard}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: "4rem", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 800, color: isDark ? "#fff" : "#0f172a", lineHeight: 1.2, margin: "0 0 20px" }}>{heading}</h2>
              <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, marginBottom: 24 }} />
              {description && (
                <div style={{ color: isDark ? "rgba(255,255,255,0.85)" : "#4a5568", fontSize: 16, lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{ __html: description }} />
              )}
            </div>
            {formCard}
          </div>
        )}
      </div>
    </section>
  );
}

function DonateStripSection({ content }: { content: Record<string, unknown> }) {
  const text = getString(content, "text") || "Partner with us — every gift reaches another soul with the Gospel.";
  const buttonLabel = getString(content, "button_label") || "Give Now";
  const buttonHref = getString(content, "button_href") || "/give";
  const bgColor = getString(content, "bg_color") || "#1B3A76";
  const btnColor = getString(content, "btn_color") || "#9B1030";
  const btnHover = btnColor === "#9B1030" ? "#720B23" : btnColor + "cc";
  return (
    <div style={{ backgroundColor: bgColor, padding: "20px 24px" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
        <p style={{ fontWeight: 700, fontSize: "15px", color: "#fff", margin: 0 }}>{text}</p>
        <a
          href={buttonHref}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 24px", backgroundColor: btnColor, color: "#fff", fontWeight: 700, fontSize: "13px", borderRadius: "3px", textDecoration: "none", whiteSpace: "nowrap", transition: "background-color 0.2s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = btnHover)}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.backgroundColor = btnColor)}
        >
          {buttonLabel}
        </a>
      </div>
    </div>
  );
}

interface VideoItem { url: string; title?: string; }
function VideoGridSection({ content }: { content: Record<string, unknown> }) {
  const heading  = getString(content, "heading");
  const subtitle = getString(content, "subtitle");
  const bgLight  = content["bg_light"] !== false;
  const videos   = getArray<VideoItem>(content, "videos");
  if (!videos.length) return <div data-vg="empty" />;
  const single = videos.length === 1;
  return (
    <section data-vg="loaded" style={{ padding: "72px 24px", backgroundColor: bgLight ? "#f8f9fa" : "#0a1523" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {(heading || subtitle) && (
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            {heading && <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, color: bgLight ? "#2070B8" : "#fff", marginBottom: 12 }}>{heading}</h2>}
            <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
            {subtitle && <p style={{ color: bgLight ? "#6c757d" : "rgba(255,255,255,0.7)", maxWidth: 560, margin: "14px auto 0", lineHeight: 1.8 }}>{subtitle}</p>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: single ? "1fr" : "repeat(auto-fit,minmax(min(100%,480px),1fr))", gap: "2rem" }}>
          {videos.map((v, i) => (
            <div key={i} style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.18)", background: "#000" }}>
              <video
                controls
                preload="metadata"
                style={{ width: "100%", display: "block", maxHeight: 360, background: "#000" }}
                src={v.url}
              />
              {v.title && (
                <div style={{ padding: "12px 18px", background: bgLight ? "#fff" : "#111827" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: bgLight ? "#1e293b" : "#e2e8f0", margin: 0 }}>{v.title}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function renderSection(section: Section) {
  const content = parseContent(section.content_json);
  switch (section.section_type) {
    case "page_header":  return <PageHeaderSection key={section.id} content={content} />;
    case "hero":         return <HeroSection key={section.id} content={content} />;
    case "text":         return <TextSection key={section.id} content={content} />;
    case "cards_grid":   return <CardsGridSection key={section.id} content={content} />;
    case "sermons_grid": return <SermonsGridSection key={section.id} content={content} />;
    case "two_col":      return <TwoColSection key={section.id} content={content} />;
    case "gallery":      return <GallerySection key={section.id} content={content} />;
    case "cta":          return <CtaSection key={section.id} content={content} />;
    case "faq":          return <FaqSection key={section.id} content={content} />;
    case "team":         return <TeamSection key={section.id} content={content} />;
    case "contact_form": return <ContactFormSection key={section.id} content={content} />;
    case "booking_form": return <BookingFormSection key={section.id} />;
    case "latest_posts": return <LatestPostsSection key={section.id} content={content} />;
    case "custom_form":  return <CustomFormSection key={section.id} content={content} />;
    case "donate_strip": return <DonateStripSection key={section.id} content={content} />;
    case "video_grid":   return <VideoGridSection key={section.id} content={content} />;
    default:             return null;
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const data = await getPageData(slug.join("/"), "en");
  if (!data) return {};
  const { page } = data;
  return {
    title: page.meta_title || page.title,
    description: page.meta_description || undefined,
    keywords: page.meta_keywords || undefined,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function SlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ lang?: string; preview?: string }>;
}) {
  const { slug } = await params;
  const { lang = "en" } = await searchParams;

  // Join segments so both /about and /test/test resolve to the correct DB slug
  const fullSlug = slug.join("/");
  const data = await getPageData(fullSlug, lang);
  if (!data) notFound();

  const { sections } = data;
  const supportedCodes = await getActiveLangCodes();
  const activeLang = supportedCodes.has(lang) ? lang : "en";

  return (
    <main>
      {activeLang !== "en" && (
        <div style={{ background: "#f5a62315", borderBottom: "2px solid #f5a623", padding: "8px 24px", textAlign: "center", fontSize: 13, color: "#92400e", fontWeight: 500 }}>
          Viewing in {activeLang.toUpperCase()} —{" "}
          <span style={{ color: "#64748b", fontWeight: 400 }}>Some content may still appear in English if not yet translated.</span>
        </div>
      )}
      {sections.map(section => renderSection(section))}
    </main>
  );
}

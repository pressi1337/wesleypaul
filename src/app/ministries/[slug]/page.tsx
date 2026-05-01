export const revalidate = 60;

import { notFound } from "next/navigation";
import Image from "next/image";
import ContactFormClient from "@/components/ContactFormClient";
import BookingFormClient from "@/components/BookingFormClient";
import pool from "@/lib/db";
import { SUPPORTED_LANG_CODES } from "@/lib/languages";

// Re-uses the same section rendering logic as [slug]/page.tsx
// Queries with slug = "ministries/<param>" so DB slugs must include the prefix.

interface Page { id: number; title: string; slug: string; status: string; meta_title: string; meta_description: string; meta_keywords: string; layout: string; }
interface Section { id: number; section_type: string; sort_order: number; content_json: string; }
interface SectionTranslationRow { section_id: number; language_code: string; content_json: string; }

function parseContent(json: string): Record<string, unknown> { try { return JSON.parse(json) as Record<string, unknown>; } catch { return {}; } }
function getString(obj: Record<string, unknown>, key: string): string { const val = obj[key]; return typeof val === "string" ? val : ""; }
function getArray<T>(obj: Record<string, unknown>, key: string): T[] { const val = obj[key]; return Array.isArray(val) ? (val as T[]) : []; }

function getBgStyle(c: Record<string, unknown>): React.CSSProperties {
  const img = getString(c, "bg_image");
  if (!img) return {};
  const pos = getString(c, "bg_position") || "center";
  const zoom = Number(c.bg_zoom ?? 100);
  return { backgroundImage: `url(${img})`, backgroundSize: zoom > 100 ? `${zoom}%` : "cover", backgroundPosition: pos };
}
function BgImageOverlay({ content }: { content: Record<string, unknown> }) {
  if (!getString(content, "bg_image")) return null;
  const opacity = Number(content.bg_overlay ?? 50) / 100;
  return <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${opacity})`, zIndex: 0, pointerEvents: "none" }} />;
}

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
        `SELECT section_id, language_code, content_json FROM section_translations WHERE section_id IN (${placeholders}) AND language_code = ?`,
        [...sectionIds, lang]
      );
      sectionTranslations = trRows as SectionTranslationRow[];
    }
    const mergedSections = sections.map(sec => {
      if (!lang || !activeLangs.has(lang)) return sec;
      const tr = sectionTranslations.find(t => t.section_id === sec.id && t.language_code === lang);
      if (!tr) return sec;
      const english = parseContent(sec.content_json);
      const translated = parseContent(tr.content_json);
      return { ...sec, content_json: JSON.stringify(mergeContent(english, translated)) };
    });
    return { page, sections: mergedSections };
  } catch { return null; }
}

function mergeContent(english: Record<string, unknown>, translated: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...english };
  for (const [key, trVal] of Object.entries(translated)) {
    if (typeof trVal === "string" && trVal.trim()) { result[key] = trVal; }
    else if (Array.isArray(trVal) && Array.isArray(english[key])) {
      const engArr = english[key] as Record<string, unknown>[];
      const trArr = trVal as Record<string, unknown>[];
      result[key] = engArr.map((engItem, i) => { const trItem = trArr[i]; if (!trItem || typeof trItem !== "object") return engItem; return mergeContent(engItem, trItem as Record<string, unknown>); });
    }
  }
  return result;
}

// Section renderers (same as [slug]/page.tsx)
function PageHeaderSection({ content }: { content: Record<string, unknown> }) {
  const eyebrow = getString(content, "eyebrow"), heading = getString(content, "heading"), subheading = getString(content, "subheading");
  const image = getString(content, "bg_image") || getString(content, "image");
  const bg = image ? `linear-gradient(rgba(13,27,46,0.82),rgba(13,27,46,0.87)), url(${image}) center/cover no-repeat` : "linear-gradient(135deg, #0a1523 0%, #2070B8 100%)";
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

function TextSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading"), body = getString(content, "body"), align = getString(content, "align") || "left";
  return (
    <section style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px", textAlign: align === "center" ? "center" : "left" }}>
      {heading && <h2 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 700, color: "#2070B8", margin: "0 0 20px" }}>{heading}</h2>}
      {body && <div style={{ color: "#4a5568", lineHeight: 1.8, fontSize: 17 }}>{body.split("\n").map((p, i) => p.trim() ? <p key={i} style={{ margin: "0 0 16px" }}>{p}</p> : null)}</div>}
    </section>
  );
}

interface CardItem { title?: string; description?: string; color?: string; }
function CardsGridSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading"), subtitle = getString(content, "subtitle");
  const bgLight = content["bg_light"] !== false;
  const items = getArray<CardItem>(content, "items");
  return (
    <section style={{ padding: "80px 24px", backgroundColor: bgLight ? "#f8f9fa" : "#fff" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {(heading || subtitle) && (
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            {heading && <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: "#2070B8", marginBottom: 12 }}>{heading}</h2>}
            <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
            {subtitle && <p style={{ color: "#6c757d", maxWidth: 600, margin: "16px auto 0", lineHeight: 1.8 }}>{subtitle}</p>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,300px),1fr))", gap: "2rem" }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 20, padding: "28px", background: "#fff", borderRadius: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", borderLeft: `4px solid ${item.color || "#2070B8"}` }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: item.color || "#2070B8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>✦</span>
              </div>
              <div>
                {item.title && <h3 style={{ fontSize: 15, fontWeight: 700, color: "#2070B8", marginBottom: 8 }}>{item.title}</h3>}
                {item.description && <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.75 }}>{item.description}</p>}
              </div>
            </div>
          ))}
        </div>
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
  const sideImage = getString(content, "side_image");

  const buttons = (
    <div style={{ display: "flex", gap: 14, justifyContent: sideImage ? "flex-start" : "center", flexWrap: "wrap" }}>
      {primaryText && primaryLink && <a href={primaryLink} style={{ padding: "14px 32px", background: "#C0185A", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>{primaryText}</a>}
      {secondaryText && secondaryLink && <a href={secondaryLink} style={{ padding: "14px 32px", border: "2px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 16, textDecoration: "none" }}>{secondaryText}</a>}
    </div>
  );

  return (
    <section style={{ backgroundColor: bgColor, padding: "80px 24px", textAlign: sideImage ? "left" : "center", position: "relative", ...getBgStyle(content) }}>
      <BgImageOverlay content={content} />
      <div style={{ maxWidth: sideImage ? 1000 : 700, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {heading && <h2 style={{ fontSize: "clamp(24px,3.5vw,42px)", fontWeight: 800, color: "#fff", margin: "0 0 32px", textAlign: "center" }}>{heading}</h2>}
        {sideImage ? (
          <div style={{ display: "flex", gap: 40, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flexShrink: 0, width: "clamp(140px, 22vw, 220px)" }}>
              <Image src={sideImage} alt={heading || ""} width={220} height={280} style={{ width: "100%", height: "auto", borderRadius: 12, objectFit: "cover", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              {body && <p style={{ fontSize: 18, color: "rgba(255,255,255,0.75)", margin: "0 0 28px", lineHeight: 1.8 }}>{body}</p>}
              {buttons}
            </div>
          </div>
        ) : (
          <>
            {body && <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", margin: "0 0 32px", lineHeight: 1.7 }}>{body}</p>}
            {buttons}
          </>
        )}
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
      {heading && <h2 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 700, color: "#2070B8", margin: "0 0 28px" }}>{heading}</h2>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item, i) => (
          <details key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            <summary style={{ padding: "16px 20px", fontWeight: 600, fontSize: 16, color: "#0f172a", cursor: "pointer", background: "#f8fafc", listStyle: "none" }}>{item.question}</summary>
            {item.answer && <div style={{ padding: "16px 20px", color: "#4a5568", lineHeight: 1.7, fontSize: 15 }}>{item.answer}</div>}
          </details>
        ))}
      </div>
    </section>
  );
}

function TwoColSection({ content }: { content: Record<string, unknown> }) {
  const label = getString(content, "label"), heading = getString(content, "heading"), body = getString(content, "body"), image = getString(content, "image"), imageSide = getString(content, "image_side") || "left", ctaLabel = getString(content, "cta_label"), ctaHref = getString(content, "cta_href"), ctaSecondaryLabel = getString(content, "cta_secondary_label"), ctaSecondaryHref = getString(content, "cta_secondary_href");
  const imgCol = image ? <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", minHeight: 400, backgroundColor: "#1a2a3a", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}><Image src={image} alt={heading || "image"} fill style={{ objectFit: "cover", objectPosition: "top" }} /></div> : null;
  const textCol = (
    <div style={{ backgroundColor: "#fff", borderRadius: 8, padding: 40, boxShadow: "0 2px 15px rgba(0,0,0,0.07)" }}>
      {label && <span className="section-label">{label}</span>}
      {heading && <h2 className="section-title" style={{ fontSize: "1.8rem", marginBottom: 16 }}>{heading}</h2>}
      <div className="section-divider-left" />
      {body && body.split("\n\n").map((p, i) => <p key={i} style={{ color: "#6c757d", lineHeight: 1.8, marginBottom: 16 }}>{p}</p>)}
      {(ctaLabel || ctaSecondaryLabel) && <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 8 }}>{ctaLabel && ctaHref && <a href={ctaHref} className="btn-primary">{ctaLabel}</a>}{ctaSecondaryLabel && ctaSecondaryHref && <a href={ctaSecondaryHref} className="btn-outline-accent">{ctaSecondaryLabel}</a>}</div>}
    </div>
  );
  return (
    <section style={{ padding: "80px 24px", backgroundColor: "#f8f9fa" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "3rem", alignItems: "center" }}>
          {imageSide === "left" ? <>{imgCol}{textCol}</> : <>{textCol}{imgCol}</>}
        </div>
      </div>
    </section>
  );
}

function ContactFormSection({ content }: { content: Record<string, unknown> }) {
  return <ContactFormClient content={content as Parameters<typeof ContactFormClient>[0]["content"]} />;
}
function BookingFormSection() { return <BookingFormClient />; }

function renderSection(section: Section) {
  const content = parseContent(section.content_json);
  switch (section.section_type) {
    case "page_header":  return <PageHeaderSection key={section.id} content={content} />;
    case "text":         return <TextSection key={section.id} content={content} />;
    case "cards_grid":   return <CardsGridSection key={section.id} content={content} />;
    case "two_col":      return <TwoColSection key={section.id} content={content} />;
    case "cta":          return <CtaSection key={section.id} content={content} />;
    case "faq":          return <FaqSection key={section.id} content={content} />;
    case "contact_form": return <ContactFormSection key={section.id} content={content} />;
    case "booking_form": return <BookingFormSection key={section.id} />;
    default:             return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPageData(`ministries/${slug}`, "en");
  if (!data) return {};
  const { page } = data;
  return { title: page.meta_title || page.title, description: page.meta_description || undefined };
}

export default async function MinistrySlugPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { slug } = await params;
  const { lang = "en" } = await searchParams;
  const data = await getPageData(`ministries/${slug}`, lang);
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

export const revalidate = 60;

import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import ContactFormClient from "@/components/ContactFormClient";
import BookingFormClient from "@/components/BookingFormClient";
import CustomFormRenderer from "@/components/CustomFormRenderer";
import pool from "@/lib/db";
import { SUPPORTED_LANG_CODES } from "@/lib/languages";

interface Page { id: number; title: string; slug: string; status: string; meta_title: string; meta_description: string; meta_keywords: string; layout: string; }
interface Section { id: number; section_type: string; sort_order: number; content_json: string; }
interface SectionTranslationRow { section_id: number; language_code: string; content_json: string; }

function parseContent(json: string): Record<string, unknown> { try { return JSON.parse(json) as Record<string, unknown>; } catch { return {}; } }
function getString(obj: Record<string, unknown>, key: string): string { const val = obj[key]; return typeof val === "string" ? val : ""; }
function getArray<T>(obj: Record<string, unknown>, key: string): T[] { const val = obj[key]; return Array.isArray(val) ? (val as T[]) : []; }
function getBgOverlayOpacity(c: Record<string, unknown>) { return Number(c.bg_overlay ?? 50) / 100; }
function getBgStyle(c: Record<string, unknown>): React.CSSProperties {
  const img = getString(c, "bg_image"); if (!img) return {};
  const pos = getString(c, "bg_position") || "center";
  const zoom = Number(c.bg_zoom ?? 100);
  return { backgroundImage: `url(${img})`, backgroundSize: zoom > 100 ? `${zoom}%` : "cover", backgroundPosition: pos, position: "relative" };
}
function BgImageOverlay({ content }: { content: Record<string, unknown> }) {
  if (!getString(content, "bg_image")) return null;
  return <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${getBgOverlayOpacity(content)})`, zIndex: 0, pointerEvents: "none" }} />;
}
import type React from "react";

async function getActiveLangCodes(): Promise<Set<string>> {
  try {
    const [rows] = await pool.execute("SELECT setting_value FROM site_settings WHERE setting_key = 'active_languages' LIMIT 1");
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
    const [pageRows] = await pool.execute("SELECT * FROM pages WHERE slug = ? AND status = 'published' LIMIT 1", [slug]);
    const pages = pageRows as Page[];
    if (pages.length === 0) return null;
    const page = pages[0];
    const [sectionRows] = await pool.execute("SELECT * FROM page_sections WHERE page_id = ? ORDER BY sort_order ASC", [page.id]);
    const sections = sectionRows as Section[];
    let sectionTranslations: SectionTranslationRow[] = [];
    if (lang && activeLangs.has(lang) && sections.length > 0) {
      const ids = sections.map(s => s.id);
      const placeholders = ids.map(() => "?").join(",");
      const [trRows] = await pool.execute(
        `SELECT section_id, language_code, content_json FROM section_translations WHERE section_id IN (${placeholders}) AND language_code = ?`,
        [...ids, lang]
      );
      sectionTranslations = trRows as SectionTranslationRow[];
    }
    const mergedSections = sections.map(sec => {
      if (!lang || !activeLangs.has(lang)) return sec;
      const tr = sectionTranslations.find(t => t.section_id === sec.id && t.language_code === lang);
      if (!tr) return sec;
      const en = parseContent(sec.content_json);
      const translated = parseContent(tr.content_json);
      return { ...sec, content_json: JSON.stringify(mergeContent(en, translated)) };
    });
    return { page, sections: mergedSections };
  } catch { return null; }
}

function mergeContent(en: Record<string, unknown>, tr: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...en };
  for (const [key, trVal] of Object.entries(tr)) {
    if (typeof trVal === "string" && trVal.trim()) { result[key] = trVal; }
    else if (Array.isArray(trVal) && Array.isArray(en[key])) {
      const engArr = en[key] as Record<string, unknown>[];
      const trArr = trVal as Record<string, unknown>[];
      result[key] = engArr.map((e, i) => { const t = trArr[i]; if (!t || typeof t !== "object") return e; return mergeContent(e, t as Record<string, unknown>); });
    }
  }
  return result;
}

// ── Section renderers ─────────────────────────────────────────────────────────

function PageHeaderSection({ content }: { content: Record<string, unknown> }) {
  const eyebrow = getString(content, "eyebrow"), heading = getString(content, "heading"), subheading = getString(content, "subheading");
  const bgImg = getString(content, "bg_image") || getString(content, "image");
  const overlayOpacity = getBgOverlayOpacity(content);
  const bgZoom = Number(content.bg_zoom ?? content.image_zoom ?? 100);
  const bgPos = getString(content, "bg_position") || getString(content, "image_position") || "center";
  const bgSize = bgZoom > 100 ? `${bgZoom}%` : "cover";
  const bg = bgImg
    ? `linear-gradient(rgba(13,27,46,${overlayOpacity}),rgba(13,27,46,${overlayOpacity})), url(${bgImg}) ${bgPos}/${bgSize} no-repeat`
    : getString(content, "bg_color")
      ? `linear-gradient(135deg, ${getString(content, "bg_color")}, ${getString(content, "bg_color")})`
      : "linear-gradient(135deg, #0a1523 0%, #2070B8 100%)";
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
  const hasBg = !!getString(content, "bg_image");
  const bgColor = getString(content, "bg_color") || (hasBg ? "#0a1523" : "transparent");
  return (
    <section style={{ padding: "80px 24px", backgroundColor: bgColor, ...getBgStyle(content) }}>
      <BgImageOverlay content={content} />
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: align === "center" ? "center" : "left", position: "relative", zIndex: 1 }}>
        {heading && <h2 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 700, color: hasBg ? "#fff" : "#2070B8", margin: "0 0 20px" }}>{heading}</h2>}
        {body && <div style={{ color: hasBg ? "rgba(255,255,255,0.88)" : "#4a5568", lineHeight: 1.9, fontSize: 16 }}>
          {body.split("\n").map((p, i) => p.trim() ? <p key={i} style={{ margin: "0 0 16px" }}>{p}</p> : null)}
        </div>}
      </div>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,280px),1fr))", gap: "2rem" }}>
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

function TwoColSection({ content }: { content: Record<string, unknown> }) {
  const label = getString(content, "label"), heading = getString(content, "heading"), body = getString(content, "body");
  const image = getString(content, "image"), imageSide = getString(content, "image_side") || "left";
  const imageZoom = Number(content.image_zoom ?? 100), imagePosition = getString(content, "image_position") || "center";
  const ctaLabel = getString(content, "cta_label"), ctaHref = getString(content, "cta_href");
  const ctaSecondaryLabel = getString(content, "cta_secondary_label"), ctaSecondaryHref = getString(content, "cta_secondary_href");
  const imgCol = image ? (
    <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", minHeight: 400, backgroundColor: "#1a2a3a", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}>
      <Image src={image} alt={heading || "image"} fill style={{ objectFit: "cover", objectPosition: imagePosition, transform: imageZoom > 100 ? `scale(${imageZoom / 100})` : undefined, transformOrigin: imagePosition }} />
    </div>
  ) : null;
  const textCol = (
    <div style={{ backgroundColor: "#fff", borderRadius: 8, padding: 40, boxShadow: "0 2px 15px rgba(0,0,0,0.07)" }}>
      {label && <span className="section-label">{label}</span>}
      {heading && <h2 className="section-title" style={{ fontSize: "1.8rem", marginBottom: 16 }}>{heading}</h2>}
      <div className="section-divider-left" />
      {body && body.split("\n\n").map((p, i) => <p key={i} style={{ color: "#6c757d", lineHeight: 1.8, marginBottom: 16 }}>{p}</p>)}
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,420px),1fr))", gap: "3rem", alignItems: "center" }}>
          {imageSide === "left" ? <>{imgCol}{textCol}</> : <>{textCol}{imgCol}</>}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading"), body = getString(content, "body");
  const primaryText = getString(content, "primary_cta_text"), primaryLink = getString(content, "primary_cta_link");
  const secondaryText = getString(content, "secondary_cta_text"), secondaryLink = getString(content, "secondary_cta_link");
  return (
    <section style={{ background: "#0d1b2e", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {heading && <h2 style={{ fontSize: "clamp(24px,3.5vw,42px)", fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>{heading}</h2>}
        {body && <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", margin: "0 0 32px", lineHeight: 1.7 }}>{body}</p>}
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          {primaryText && primaryLink && <a href={primaryLink} style={{ padding: "14px 32px", background: "#C0185A", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: "none" }}>{primaryText}</a>}
          {secondaryText && secondaryLink && <a href={secondaryLink} style={{ padding: "14px 32px", border: "2px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 8, fontWeight: 600, fontSize: 16, textDecoration: "none" }}>{secondaryText}</a>}
        </div>
      </div>
    </section>
  );
}

function ContactFormSection({ content }: { content: Record<string, unknown> }) {
  return <ContactFormClient content={content as Parameters<typeof ContactFormClient>[0]["content"]} />;
}
function BookingFormSection() { return <BookingFormClient />; }

async function CustomFormSection({ content }: { content: Record<string, unknown> }) {
  const heading = getString(content, "heading") || "Get in Touch";
  const description = getString(content, "description");
  // form_id may be stored as a number or a string in content_json
  const formId = Number(content["form_id"] ?? 0);
  if (!formId) return null;
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
  const submitLabel = getString(content, "submit_label") || "Submit";
  const hasBg = !!getString(content, "bg_image");
  const bgColor = getString(content, "bg_color") || (hasBg ? "#0a1523" : "#f8f9fa");
  const isDark = hasBg || (bgColor && bgColor !== "#f8f9fa" && bgColor !== "#fff" && bgColor !== "#ffffff");
  const formCard = (
    <div style={{ background: "#fff", borderRadius: 16, padding: "36px 32px", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
      {formHeading && layout === "left_form" && (
        <h3 style={{ fontSize: "clamp(16px,2vw,20px)", fontWeight: 700, color: "#0f172a", margin: "0 0 20px", paddingBottom: 14, borderBottom: "2px solid #f1f5f9" }}>{formHeading}</h3>
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
              <h2 style={{ fontSize: "clamp(26px,3.5vw,44px)", fontWeight: 800, color: isDark ? "#fff" : "#0f172a", lineHeight: 1.2, margin: "0 0 20px" }}>{heading}</h2>
              <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, marginBottom: 24 }} />
              {description && <div style={{ color: isDark ? "rgba(255,255,255,0.85)" : "#4a5568", fontSize: 16, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: description }} />}
            </div>
            {formCard}
          </div>
        )}
      </div>
    </section>
  );
}

function renderSection(section: Section) {
  const content = parseContent(section.content_json);
  switch (section.section_type) {
    case "page_header":  return <PageHeaderSection key={section.id} content={content} />;
    case "text":         return <TextSection key={section.id} content={content} />;
    case "cards_grid":   return <CardsGridSection key={section.id} content={content} />;
    case "two_col":      return <TwoColSection key={section.id} content={content} />;
    case "cta":          return <CtaSection key={section.id} content={content} />;
    case "contact_form": return <ContactFormSection key={section.id} content={content} />;
    case "booking_form": return <BookingFormSection key={section.id} />;
    case "custom_form":  return <CustomFormSection key={section.id} content={content} />;
    default:             return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPageData(`events/${slug}`, "en");
  if (!data) return {};
  const { page } = data;
  return { title: page.meta_title || page.title, description: page.meta_description || undefined };
}

export default async function EventSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang = "en" } = await searchParams;
  const data = await getPageData(`events/${slug}`, lang);
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

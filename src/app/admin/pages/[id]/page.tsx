"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Globe, Trash2, Plus, GripVertical,
  X, Languages, AlertCircle, CheckCircle, Eye, Settings2,
  Monitor, Smartphone, Tablet, LayoutTemplate, Pencil, ChevronDown,
} from "lucide-react";
import { LANG_OPTIONS } from "@/lib/languages";
import RichTextEditor from "@/components/RichTextEditor";

// ── Interfaces ───────────────────────────────────────────────────────────────
interface Section { id: number; section_type: string; sort_order: number; content_json: string; }
interface Translation { id: number; language_code: string; field_key: string; content: string; status: string; }
interface SectionTranslation { id: number; section_id: number; language_code: string; content_json: string; status: string; }
interface Page { id: number; title: string; slug: string; layout: string; status: string; meta_title: string; meta_description: string; meta_keywords: string; }
interface MediaItem { id: number; filename: string; file_path: string; original_name: string; alt_text: string; mime_type?: string; }

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseContent(json: string): Record<string, unknown> {
  try { return JSON.parse(json) as Record<string, unknown>; }
  catch { return {}; }
}
function getString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key]; return typeof v === "string" ? v : "";
}
function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

// ── Translation field helpers ─────────────────────────────────────────────────
type EditField = { path: string; label: string; multiline?: boolean };

function getEditableFields(section_type: string, content: Record<string, unknown>): EditField[] {
  const f: EditField[] = [];
  const itemCount = Array.isArray(content.items) ? (content.items as unknown[]).length : 0;
  switch (section_type) {
    case "hero":        f.push({ path: "heading", label: "Heading" }, { path: "subheading", label: "Subheading" }, { path: "cta_text", label: "CTA Text" }); break;
    case "text":        f.push({ path: "heading", label: "Heading" }, { path: "body", label: "Body", multiline: true }); break;
    case "page_header": f.push({ path: "eyebrow", label: "Eyebrow" }, { path: "heading", label: "Heading" }, { path: "subheading", label: "Subheading", multiline: true }); break;
    case "two_col":     f.push({ path: "label", label: "Label" }, { path: "heading", label: "Heading" }, { path: "body", label: "Body", multiline: true }, { path: "cta_label", label: "CTA Label" }, { path: "cta_secondary_label", label: "Secondary CTA" }); break;
    case "cta":         f.push({ path: "heading", label: "Heading" }, { path: "body", label: "Body", multiline: true }, { path: "primary_cta_text", label: "Primary Button" }, { path: "secondary_cta_text", label: "Secondary Button" }); break;
    case "contact_form": f.push({ path: "heading", label: "Heading" }, { path: "hours", label: "Office Hours" }); break;
    case "cards_grid":
      f.push({ path: "heading", label: "Heading" }, { path: "subtitle", label: "Subtitle", multiline: true });
      for (let i = 0; i < itemCount; i++) { f.push({ path: `items.${i}.title`, label: `Card ${i+1} Title` }, { path: `items.${i}.description`, label: `Card ${i+1} Desc`, multiline: true }); }
      break;
    case "faq":
      f.push({ path: "heading", label: "Heading" });
      for (let i = 0; i < itemCount; i++) { f.push({ path: `items.${i}.question`, label: `Q${i+1}` }, { path: `items.${i}.answer`, label: `A${i+1}`, multiline: true }); }
      break;
    case "sermons_grid":
      f.push({ path: "heading", label: "Heading" }, { path: "subtitle", label: "Subtitle" });
      for (let i = 0; i < itemCount; i++) { f.push({ path: `items.${i}.title`, label: `Video ${i+1} Title` }); }
      break;
    case "team":
      f.push({ path: "heading", label: "Heading" });
      for (let i = 0; i < itemCount; i++) { f.push({ path: `items.${i}.name`, label: `Member ${i+1} Name` }, { path: `items.${i}.role`, label: `Member ${i+1} Role` }, { path: `items.${i}.bio`, label: `Member ${i+1} Bio`, multiline: true }); }
      break;
    case "gallery":     f.push({ path: "heading", label: "Heading" }); break;
    case "custom_form":
      f.push({ path: "heading", label: "Section Heading" });
      if (typeof content.form_heading === "string" && content.form_heading.trim())
        f.push({ path: "form_heading", label: "Form Card Heading" });
      if (typeof content.description === "string" && content.description.trim())
        f.push({ path: "description", label: "Left Section Content (HTML)", multiline: true });
      break;
    case "latest_posts": f.push({ path: "heading", label: "Heading" }, { path: "subtitle", label: "Subtitle" }); break;
    case "donate_strip": f.push({ path: "text", label: "Strip Text" }, { path: "button_label", label: "Button Label" }); break;
  }
  return f;
}

function getAtPath(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return "";
    cur = Array.isArray(cur) ? (cur as unknown[])[Number(p)] : (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : "";
}

function setAtPath(obj: Record<string, unknown>, path: string, value: string): Record<string, unknown> {
  const parts = path.split(".");
  if (parts.length === 1) return { ...obj, [path]: value };
  const [head, ...rest] = parts;
  if (head === "items" && !isNaN(Number(rest[0]))) {
    const idx = Number(rest[0]);
    const arr = Array.isArray(obj.items) ? [...(obj.items as Record<string, unknown>[])] : [];
    arr[idx] = setAtPath((arr[idx] as Record<string, unknown>) ?? {}, rest.slice(1).join("."), value);
    return { ...obj, items: arr };
  }
  return { ...obj, [head]: setAtPath((obj[head] as Record<string, unknown>) ?? {}, rest.join("."), value) };
}

// ── Constants ────────────────────────────────────────────────────────────────
type LangEntry = { code: string; label: string; flag: string; nativeName: string };
// Default fallback; overridden at runtime by active languages from DB
const DEFAULT_LANGS: LangEntry[] = LANG_OPTIONS.filter(l => !l.isDefault).map(l => ({
  code: l.code, label: l.label, flag: l.flag, nativeName: l.nativeLabel,
}));

const SECTION_TYPES = [
  { value: "page_header",  label: "Page Header",    color: "#0a1523", icon: "▬", desc: "Dark gradient banner with eyebrow, heading & subtext" },
  { value: "hero",         label: "Hero Banner",    color: "#7c3aed", icon: "◉", desc: "Full-width header with image & CTA button" },
  { value: "text",         label: "Text Block",     color: "#2070B8", icon: "¶", desc: "Heading and multi-paragraph body text" },
  { value: "two_col",      label: "Two Column",     color: "#0891b2", icon: "⊟", desc: "Image + text side-by-side layout" },
  { value: "cards_grid",   label: "Cards Grid",     color: "#16a34a", icon: "⊞", desc: "Grid of feature cards with title & description" },
  { value: "sermons_grid", label: "Sermons Grid",   color: "#7c3aed", icon: "▶", desc: "Video thumbnail grid with YouTube link" },
  { value: "gallery",      label: "Gallery",        color: "#0891b2", icon: "⊡", desc: "Image grid with captions" },
  { value: "cta",          label: "Call to Action", color: "#C0185A", icon: "→", desc: "Dark CTA strip with two buttons" },
  { value: "faq",          label: "FAQ / Accordion",color: "#d97706", icon: "?", desc: "Accordion question/answer pairs" },
  { value: "team",         label: "Team Grid",      color: "#16a34a", icon: "◎", desc: "Member cards with image, role & bio" },
  { value: "contact_form", label: "Contact Form",   color: "#C0185A", icon: "✉", desc: "Contact info sidebar + message form" },
  { value: "booking_form", label: "Booking Form",   color: "#0a7c52", icon: "📅", desc: "Full event booking form with date picker" },
  { value: "latest_posts", label: "Latest Posts",   color: "#7c3aed", icon: "📰", desc: "Auto-fetching grid of recent blog, news or event posts" },
  { value: "custom_form",  label: "Custom Form",    color: "#0a7c52", icon: "📋", desc: "Embed a form built in the Form Builder" },
  { value: "donate_strip", label: "Donate Strip",   color: "#1B3A76", icon: "💛", desc: "Full-width banner with text and a Give Now button" },
];

// ── Focal point grid constants ────────────────────────────────────────────────
const FOCAL_POINTS = [
  ["top left",    "top center",    "top right"],
  ["center left", "center",        "center right"],
  ["bottom left", "bottom center", "bottom right"],
];

// ── MediaPicker (library + upload modal, with delete + sync) ─────────────────
function MediaPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoImported = useRef(false);

  const loadMedia = async () => {
    const r = await fetch("/api/admin/media");
    const d = await r.json() as { media: MediaItem[] };
    setMedia((d.media || []).filter(m => !m.mime_type || m.mime_type.startsWith("image/")));
  };

  const importExisting = async () => {
    setImporting(true);
    await fetch("/api/admin/media/import", { method: "POST" });
    await loadMedia();
    setImporting(false);
  };

  const openModal = async () => {
    setOpen(true);
    setTab("library");
    await loadMedia();
    if (!hasAutoImported.current) {
      hasAutoImported.current = true;
      void importExisting();
    }
  };

  const deleteMedia = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Delete this image from the library?")) return;
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    setMedia(prev => prev.filter(m => m.id !== id));
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError("File too large (max 10 MB)."); return; }
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/admin/media", { method: "POST", body: fd });
      const d = await r.json() as { success?: boolean; media?: MediaItem; error?: string };
      if (d.success && d.media) {
        onChange(d.media.file_path);
        await loadMedia();
        setTab("library");
        setOpen(false);
      } else {
        setUploadError(d.error || "Upload failed");
      }
    } catch { setUploadError("Upload failed — check your connection"); }
    setUploading(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void uploadFile(f);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void uploadFile(f);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: value ? 6 : 0 }}>
        <input
          style={{ flex: 1, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12.5, fontFamily: "inherit", outline: "none" }}
          value={value} onChange={e => onChange(e.target.value)} placeholder="/uploads/image.jpg"
        />
        <button type="button" onClick={openModal}
          style={{ padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>
          Browse
        </button>
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" style={{ height: 60, borderRadius: 5, border: "1px solid #e2e8f0", objectFit: "cover" }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
      )}
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setOpen(false)}>
          <div style={{ background: "#fff", borderRadius: 12, width: 700, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Pick Image</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => void importExisting()} disabled={importing}
                  style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", fontSize: 11, color: "#64748b" }}>
                  {importing ? "Syncing…" : "🔄 Sync files"}
                </button>
                <button onClick={() => setOpen(false)} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}><X size={16} /></button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 14px", background: "#f8fafc" }}>
              {(["library", "upload"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: "9px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: tab === t ? "#2070B8" : "#94a3b8", borderBottom: tab === t ? "2px solid #2070B8" : "2px solid transparent", marginBottom: -1 }}>
                  {t === "library" ? `📚 Library (${media.length})` : "⬆ Upload New"}
                </button>
              ))}
            </div>

            {/* Library tab */}
            {tab === "library" && (
              <div style={{ overflowY: "auto", padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 8 }}>
                {media.length === 0 && (
                  <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                    <p style={{ fontSize: 13, margin: "0 0 10px" }}>No images yet</p>
                    <button onClick={() => setTab("upload")} style={{ padding: "6px 14px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Upload First Image</button>
                  </div>
                )}
                {media.map(m => (
                  <div key={m.id} style={{ position: "relative" }}>
                    <button onClick={() => { onChange(m.file_path); setOpen(false); }}
                      style={{ border: "2px solid #e2e8f0", borderRadius: 7, overflow: "hidden", cursor: "pointer", background: "none", padding: 0, width: "100%" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "#2070B8")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.file_path} alt={m.alt_text || m.original_name} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                      <div style={{ padding: "4px 6px", fontSize: 10, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.original_name}</div>
                    </button>
                    <button onClick={e => void deleteMedia(e, m.id)}
                      style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload tab */}
            {tab === "upload" && (
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: `2px dashed ${dragOver ? "#2070B8" : "#c9d5e8"}`, borderRadius: 10, padding: "44px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "#eff6ff" : "#f8fafc", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{uploading ? "⏳" : "🖼"}</div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 6 }}>
                    {uploading ? "Uploading…" : "Drag & drop an image here"}
                  </p>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 14px" }}>
                    JPG, PNG, WebP, GIF · Max 10 MB
                  </p>
                  {!uploading && (
                    <button type="button" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      style={{ padding: "8px 20px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      Choose File
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
                </div>

                {uploadError && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "9px 13px", fontSize: 12.5, color: "#dc2626" }}>
                    ⚠ {uploadError}
                  </div>
                )}

                <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#92400e", lineHeight: 1.7 }}>
                  <strong>Recommended image sizes:</strong><br />
                  Page Header / Hero background: <strong>1920 × 600 px</strong><br />
                  Section background (full-width): <strong>1920 × 800 px</strong><br />
                  Two-column image: <strong>800 × 700 px</strong><br />
                  Team / person photo: <strong>400 × 400 px</strong> (square)<br />
                  Blog thumbnail: <strong>800 × 450 px</strong> (16:9)<br />
                  <span style={{ color: "#a16207" }}>Use JPG or WebP · Compress to under 500 KB for fast load</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PageImageControlPanel — picker + zoom + focal point ──────────────────────
function PageImageControlPanel({
  value, zoom = 100, position = "center",
  onChange, onZoomChange, onPositionChange,
}: {
  value: string; zoom?: number; position?: string;
  onChange: (v: string) => void;
  onZoomChange?: (v: number) => void;
  onPositionChange?: (v: string) => void;
}) {
  const lb: React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 700, color: "#374151", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" };
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 10px 8px" }}>
      <MediaPicker value={value} onChange={onChange} />

      {value && (
        <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
          {/* Live thumbnail */}
          <div style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 6, border: "1px solid #e2e8f0", overflow: "hidden", position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              objectPosition: position,
              transform: `scale(${zoom / 100})`,
              transformOrigin: position,
              transition: "transform 0.2s, object-position 0.2s",
            }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Zoom slider */}
            {onZoomChange && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <label style={lb}>Zoom</label>
                  <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>{zoom}%</span>
                </div>
                <input type="range" min={100} max={200} step={5}
                  value={zoom} onChange={e => onZoomChange(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#2070B8" }} />
              </div>
            )}

            {/* Focal point grid */}
            {onPositionChange && (
              <div>
                <label style={lb}>Focal Point</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3 }}>
                  {FOCAL_POINTS.flat().map(fp => (
                    <button key={fp} type="button"
                      onClick={() => onPositionChange(fp)}
                      title={fp}
                      style={{
                        padding: "5px 0", border: `2px solid ${position === fp ? "#2070B8" : "#e2e8f0"}`,
                        borderRadius: 4, background: position === fp ? "#eff6ff" : "#fff",
                        cursor: "pointer", fontSize: 9, color: position === fp ? "#2070B8" : "#94a3b8",
                        fontWeight: position === fp ? 700 : 400, textTransform: "capitalize",
                      }}>
                      {fp.replace("center", "ctr").replace("bottom","btm").replace("top","top")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section preview (themed, matches real site) ──────────────────────────────
// Computes wrapper style when a section has a custom bg_image set
function bgWrapStyle(c: Record<string, unknown>): React.CSSProperties | null {
  const img = getString(c, "bg_image");
  if (!img) return null;
  const pos = getString(c, "bg_position") || "center";
  const zoom = Number(c.bg_zoom ?? 100);
  const bgSize = zoom > 100 ? `${zoom}%` : "cover";
  return {
    position: "relative",
    backgroundImage: `url(${img})`,
    backgroundSize: bgSize,
    backgroundPosition: pos,
    isolation: "isolate",
  };
}

function BgOverlay({ opacity }: { opacity: number }) {
  return <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${opacity})`, zIndex: 0, pointerEvents: "none" }} />;
}

function SectionPreview({ sec, translatedJson, previewDevice = "desktop" }: { sec: Section; translatedJson?: string; previewDevice?: "desktop" | "tablet" | "mobile" }) {
  const c = parseContent(translatedJson ?? sec.content_json);

  if (sec.section_type === "hero") {
    const img = getString(c, "image");
    const heading = getString(c, "heading") || "Hero Heading";
    const sub = getString(c, "subheading");
    const cta = getString(c, "cta_text");
    const zoom = Number(c.image_zoom ?? 100);
    const pos = getString(c, "image_position") || "center";
    return (
      <div style={{ position: "relative", background: img ? "none" : "#0a1523", minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", overflow: "hidden" }}>
        {img && <img src={img} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: pos, transform: zoom > 100 ? `scale(${zoom / 100})` : undefined, transformOrigin: pos, transition: "transform 0.2s" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(0,0,0,0.75) 40%,rgba(0,0,0,0.45))" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "32px 24px" }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "#C0185A", textTransform: "uppercase", marginBottom: 10 }}>Hero</p>
          <h2 style={{ fontSize: "clamp(22px,3.5vw,38px)", fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 14, textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>{heading}</h2>
          {sub && <p style={{ fontSize: 15, color: "rgba(255,255,255,0.78)", marginBottom: 18 }}>{sub}</p>}
          {cta && <span style={{ display: "inline-block", padding: "10px 24px", border: "2px solid #fff", color: "#fff", fontWeight: 700, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>{cta}</span>}
        </div>
      </div>
    );
  }

  if (sec.section_type === "text") {
    const heading = getString(c, "heading") || "Section Heading";
    const body = getString(c, "body");
    const align = getString(c, "align") === "center" ? "center" : "left";
    const bgStyle = bgWrapStyle(c);
    const overlayOpacity = Number(c.bg_overlay ?? 50) / 100;
    const textColor = bgStyle ? "#fff" : "#2070B8";
    const bodyColor = bgStyle ? "rgba(255,255,255,0.82)" : "#6c757d";
    return (
      <div style={{ padding: "44px 32px", ...(bgStyle ? { backgroundColor: getString(c, "bg_color") || "#0a1523" } : { background: "#fff" }), textAlign: align, ...bgStyle }}>
        {bgStyle && <BgOverlay opacity={overlayOpacity} />}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ width: 40, height: 3, background: "#C0185A", borderRadius: 2, marginBottom: 14, display: "block", ...(align === "center" ? { margin: "0 auto 14px" } : {}) }} />
          <h2 style={{ fontSize: "clamp(20px,2.5vw,30px)", fontWeight: 700, color: textColor, marginBottom: 14 }}>{heading}</h2>
          {body && <p style={{ fontSize: 15, color: bodyColor, lineHeight: 1.75, maxWidth: 700, ...(align === "center" ? { margin: "0 auto" } : {}) }}>{body.slice(0, 200)}{body.length > 200 ? "…" : ""}</p>}
        </div>
      </div>
    );
  }

  if (sec.section_type === "gallery") {
    const heading = getString(c, "heading") || "Gallery";
    const items = Array.isArray(c.items) ? (c.items as { image?: string; caption?: string }[]) : [];
    return (
      <div style={{ padding: "40px 32px", background: "#f8f9fa" }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#2070B8", marginBottom: 20, textAlign: "center" }}>{heading}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10 }}>
          {items.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "20px 0" }}>No gallery items yet</div>}
          {items.slice(0, 6).map((item, i) => (
            <div key={i} style={{ aspectRatio: "1/1", background: "#e2e8f0", borderRadius: 6, overflow: "hidden" }}>
              {item.image && <img src={item.image} alt={item.caption || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sec.section_type === "cta") {
    const heading = getString(c, "heading") || "Take Action Today";
    const body = getString(c, "body");
    const p1 = getString(c, "primary_cta_text") || "Get Started";
    const p2 = getString(c, "secondary_cta_text");
    return (
      <div style={{ padding: "60px 32px", background: "#0d1b2e", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, color: "#fff", marginBottom: 14 }}>{heading}</h2>
        {body && <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", marginBottom: 28, maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.7 }}>{body.slice(0, 160)}{body.length > 160 ? "…" : ""}</p>}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <span style={{ padding: "11px 28px", background: "#C0185A", color: "#fff", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>{p1}</span>
          {p2 && <span style={{ padding: "11px 28px", border: "2px solid rgba(255,255,255,0.3)", color: "#fff", borderRadius: 6, fontWeight: 600, fontSize: 13 }}>{p2}</span>}
        </div>
      </div>
    );
  }

  if (sec.section_type === "faq") {
    const heading = getString(c, "heading") || "Frequently Asked Questions";
    const items = Array.isArray(c.items) ? (c.items as { question?: string; answer?: string }[]) : [];
    return (
      <div style={{ padding: "44px 32px", background: "#fff" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#2070B8", marginBottom: 20 }}>{heading}</h2>
        {items.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13 }}>No FAQ items yet</p>}
        {items.slice(0, 3).map((item, i) => (
          <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
            <div style={{ padding: "13px 16px", fontWeight: 600, fontSize: 14, color: "#0f172a", background: "#f8fafc", display: "flex", justifyContent: "space-between" }}>
              {item.question || `Question ${i + 1}`}
              <ChevronDown size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
            </div>
            {item.answer && <div style={{ padding: "12px 16px", fontSize: 13.5, color: "#4a5568", lineHeight: 1.65 }}>{item.answer.slice(0, 120)}…</div>}
          </div>
        ))}
        {items.length > 3 && <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>+{items.length - 3} more</p>}
      </div>
    );
  }

  if (sec.section_type === "team") {
    const heading = getString(c, "heading") || "Our Team";
    const items = Array.isArray(c.items) ? (c.items as { name?: string; role?: string; image?: string }[]) : [];
    return (
      <div style={{ padding: "44px 32px", background: "#f8f9fa" }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#2070B8", marginBottom: 20, textAlign: "center" }}>{heading}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 14 }}>
          {items.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, gridColumn: "1/-1", textAlign: "center" }}>No team members yet</p>}
          {items.slice(0, 4).map((m, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" }}>
              <div style={{ height: 90, background: "#e2e8f0", overflow: "hidden" }}>
                {m.image && <img src={m.image} alt={m.name || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{m.name || "Member"}</div>
                <div style={{ fontSize: 11.5, color: "#2070B8", fontWeight: 600 }}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sec.section_type === "page_header") {
    const eyebrow = getString(c, "eyebrow");
    const heading = getString(c, "heading") || "Page Title";
    const sub = getString(c, "subheading");
    const img = getString(c, "bg_image") || getString(c, "image");
    const zoom = Number(c.bg_zoom ?? c.image_zoom ?? 100);
    const pos = getString(c, "bg_position") || getString(c, "image_position") || "center";
    const bgSize = zoom > 100 ? `${zoom}%` : "cover";
    const bg = img ? `linear-gradient(rgba(13,27,46,0.82),rgba(13,27,46,0.87)), url(${img}) ${pos}/${bgSize}` : "linear-gradient(135deg, #0a1523 0%, #2070B8 100%)";
    return (
      <div style={{ padding: "48px 32px", background: bg, textAlign: "center" }}>
        {eyebrow && <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#f5a623", marginBottom: 10 }}>{eyebrow}</p>}
        <h1 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 700, color: "#fff", marginBottom: 14 }}>{heading}</h1>
        <div style={{ width: 48, height: 4, background: "#C0185A", borderRadius: 2, margin: "0 auto 14px" }} />
        {sub && <p style={{ fontSize: 14, color: "rgba(255,255,255,0.78)", maxWidth: 480, margin: "0 auto" }}>{sub.slice(0, 120)}{sub.length > 120 ? "…" : ""}</p>}
      </div>
    );
  }

  if (sec.section_type === "donate_strip") {
    const text = getString(c, "text") || "Partner with us — every gift reaches another soul with the Gospel.";
    const btnLabel = getString(c, "button_label") || "Give Now";
    return (
      <div style={{ backgroundColor: "#1B3A76", padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <p style={{ fontWeight: 700, fontSize: 14, color: "#fff", margin: 0 }}>{text}</p>
        <span style={{ padding: "9px 22px", backgroundColor: "#9B1030", color: "#fff", fontWeight: 700, fontSize: 12, borderRadius: 3 }}>{btnLabel}</span>
      </div>
    );
  }

  if (sec.section_type === "two_col") {
    const img = getString(c, "image");
    const heading = getString(c, "heading") || "Section Heading";
    const body = getString(c, "body");
    const label = getString(c, "label");
    const cta = getString(c, "cta_label");
    const imageFit = getString(c, "image_fit") || "cover";
    const zoom2col = Number(c.image_zoom ?? 100);
    const imgCol = img ? (
      imageFit === "contain"
        ? <div style={{ background: "#fff", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={img} alt="" style={{ maxWidth: "100%", height: "auto", display: "block", transform: zoom2col > 100 ? `scale(${zoom2col / 100})` : undefined, transformOrigin: "center" }} />
          </div>
        : <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: getString(c, "image_position") || "center", minHeight: 160, transform: zoom2col > 100 ? `scale(${zoom2col / 100})` : undefined, transformOrigin: getString(c, "image_position") || "center" }} />
    ) : <div style={{ background: "#0a1523", minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Image</span></div>;
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#f8f9fa", minHeight: 180 }}>
        {imgCol}
        <div style={{ padding: "28px 20px", background: "#fff" }}>
          {label && <span style={{ fontSize: 11, fontWeight: 700, color: "#C0185A", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>}
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#2070B8", margin: "8px 0 10px" }}>{heading}</h3>
          {body && <p style={{ fontSize: 12.5, color: "#6c757d", lineHeight: 1.7 }}>{body.slice(0, 120)}…</p>}
          {cta && <span style={{ display: "inline-block", marginTop: 12, padding: "7px 16px", background: "#C0185A", color: "#fff", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>{cta}</span>}
        </div>
      </div>
    );
  }

  if (sec.section_type === "cards_grid") {
    const heading = getString(c, "heading") || "Cards Grid";
    const items = Array.isArray(c.items) ? (c.items as { title?: string; description?: string; color?: string }[]) : [];
    const bgStyle = bgWrapStyle(c);
    const overlayOpacity = Number(c.bg_overlay ?? 50) / 100;
    return (
      <div style={{ padding: "40px 28px", ...(bgStyle ? { backgroundColor: getString(c, "bg_color") || "#0a1523" } : { background: "#f8f9fa" }), ...bgStyle }}>
        {bgStyle && <BgOverlay opacity={overlayOpacity} />}
        <div style={{ position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: bgStyle ? "#fff" : "#2070B8", marginBottom: 20, textAlign: "center" }}>{heading}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          {items.length === 0 && <p style={{ color: "#94a3b8", fontSize: 13, gridColumn: "1/-1", textAlign: "center" }}>No cards yet</p>}
          {items.slice(0, 4).map((item, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 8, padding: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${item.color || "#2070B8"}` }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: item.color || "#2070B8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <span style={{ color: "#fff", fontWeight: 800 }}>✦</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#2070B8", marginBottom: 5 }}>{item.title || `Card ${i + 1}`}</div>
              <div style={{ fontSize: 11.5, color: "#6c757d", lineHeight: 1.6 }}>{(item.description || "").slice(0, 70)}{(item.description || "").length > 70 ? "…" : ""}</div>
            </div>
          ))}
          {items.length > 4 && <div style={{ background: "#fff", borderRadius: 8, padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>+{items.length - 4} more</div>}
        </div>
        </div>
      </div>
    );
  }

  if (sec.section_type === "sermons_grid") {
    const heading = getString(c, "heading") || "Sermons";
    const items = Array.isArray(c.items) ? (c.items as { image?: string; title?: string; date?: string }[]) : [];
    return (
      <div style={{ padding: "40px 28px", background: "#f8f9fa" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#2070B8", marginBottom: 20, textAlign: "center" }}>{heading}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 12 }}>
          {items.slice(0, 4).map((s, i) => (
            <div key={i} style={{ background: "#1a2a3a", borderRadius: 6, overflow: "hidden" }}>
              {s.image ? <img src={s.image} alt="" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} /> : <div style={{ height: 80, background: "#0a1523", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 18 }}>▶</span></div>}
              <div style={{ padding: "8px 10px" }}>
                <div style={{ fontSize: 11, color: "#adb5bd", marginBottom: 4 }}>{s.date}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#fff", lineHeight: 1.4 }}>{(s.title || "").slice(0, 50)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sec.section_type === "contact_form") return (
    <div style={{ padding: "40px 28px", background: "#fff", display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24 }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#2070B8", marginBottom: 16 }}>Contact Information</div>
        {[getString(c, "address") || "P.O. Box 88, Springfield, KY", getString(c, "email") || "info@wesleypaul.org", getString(c, "phone") || "+1 (859) 806-6424"].map((info, i) => <div key={i} style={{ fontSize: 12, color: "#6c757d", marginBottom: 10, paddingLeft: 8, borderLeft: "2px solid #2070B8" }}>{info}</div>)}
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#2070B8", marginBottom: 16 }}>Send Us a Message</div>
        {["Full Name", "Email Address", "Subject", "Message"].map(p => <div key={p} style={{ height: p === "Message" ? 48 : 28, background: "#f1f5f9", borderRadius: 5, marginBottom: 8, border: "1px solid #e2e8f0" }} />)}
        <div style={{ display: "inline-block", padding: "8px 20px", background: "#C0185A", color: "#fff", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>Send Message</div>
      </div>
    </div>
  );

  if (sec.section_type === "booking_form") return (
    <div style={{ padding: "40px 28px", background: "#f8f9fa", textAlign: "center" }}>
      <div style={{ fontSize: 30, marginBottom: 10 }}>📅</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#2070B8", marginBottom: 8 }}>Booking Form</div>
      <div style={{ fontSize: 12.5, color: "#6c757d" }}>Full event booking form with date picker, event type selector, and contact fields</div>
    </div>
  );

  if (sec.section_type === "latest_posts") {
    const heading = getString(c, "heading") || "Latest Posts";
    const postType = getString(c, "post_type") || "all";
    const typeColors: Record<string, string> = { blog: "#2070B8", news: "#16a34a", event: "#7c3aed", all: "#475569" };
    const tc = typeColors[postType] ?? "#2070B8";
    return (
      <div style={{ padding: "40px 28px", background: "#f8f9fa" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 6, textAlign: "center" }}>{heading}</h2>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <span style={{ background: tc, color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>{postType}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
              <div style={{ height: 80, background: `linear-gradient(135deg,${tc}33,${tc}11)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📰</div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ height: 9, background: "#e2e8f0", borderRadius: 4, marginBottom: 6, width: "80%" }} />
                <div style={{ height: 7, background: "#f1f5f9", borderRadius: 4, width: "60%" }} />
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 10 }}>Posts auto-loaded from database at runtime</p>
      </div>
    );
  }

  if (sec.section_type === "custom_form") {
    const heading = getString(c, "heading") || "Get in Touch";
    const description = getString(c, "description");
    const formHeading = getString(c, "form_heading");
    const formId = getString(c, "form_id");
    const layout = getString(c, "layout") || "left_form";
    const bgImg = getString(c, "bg_image");
    const bgColor = getString(c, "bg_color") || (bgImg ? "#0a1523" : "#f8f9fa");
    const overlayOpacity = Number(c.bg_overlay ?? 50) / 100;
    const sectionStyle: React.CSSProperties = bgImg
      ? { position: "relative", backgroundImage: `url(${bgImg})`, backgroundSize: "cover", backgroundPosition: getString(c, "bg_position") || "center", padding: "40px 28px" }
      : { padding: "40px 28px", backgroundColor: bgColor };
    const textColor = bgImg ? "#fff" : "#0f172a";
    const subColor = bgImg ? "rgba(255,255,255,0.8)" : "#64748b";
    // Form card mockup
    const formCard = (
      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 18px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
        {formHeading && layout === "left_form" && (
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 14, paddingBottom: 10, borderBottom: "2px solid #f1f5f9" }}>{formHeading}</div>
        )}
        {formId ? (
          <>
            {[1,2,3].map(n => (
              <div key={n} style={{ marginBottom: 12 }}>
                <div style={{ height: 8, background: "#e2e8f0", borderRadius: 3, width: "40%", marginBottom: 5 }} />
                <div style={{ height: 32, background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }} />
              </div>
            ))}
            <div style={{ height: 36, background: "#2070B8", borderRadius: 7, marginTop: 8 }} />
            <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>Form ID: {formId}</div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 12 }}>
            📋 No form selected<br /><span style={{ fontSize: 11 }}>Choose a form in the left panel</span>
          </div>
        )}
      </div>
    );
    return (
      <div style={sectionStyle}>
        {bgImg && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})`, zIndex: 0, pointerEvents: "none" }} />}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
          {layout === "form_only" ? (
            /* Centred form-only layout */
            <div style={{ maxWidth: 560, margin: "0 auto" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: textColor, marginBottom: 10, textAlign: "center" }}>{heading}</div>
              <div style={{ width: 40, height: 3, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto 18px" }} />
              {formCard}
            </div>
          ) : previewDevice === "mobile" ? (
            /* Mobile: stacked single column */
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: textColor, marginBottom: 8, lineHeight: 1.2 }}>{heading}</div>
                <div style={{ width: 32, height: 3, backgroundColor: "#C0185A", borderRadius: 2, marginBottom: 10 }} />
                {description ? (
                  <div style={{ fontSize: 11, color: subColor, lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: description.slice(0, 150) + (description.length > 150 ? "…" : "") }} />
                ) : (
                  <div style={{ fontSize: 11, color: subColor, fontStyle: "italic" }}>Add left section content above</div>
                )}
              </div>
              {formCard}
            </div>
          ) : (
            /* Desktop/tablet: two-column layout */
            <div style={{ display: "grid", gridTemplateColumns: previewDevice === "tablet" ? "1fr 1.2fr" : "1fr 1fr", gap: "2rem", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: textColor, marginBottom: 10, lineHeight: 1.2 }}>{heading}</div>
                <div style={{ width: 40, height: 3, backgroundColor: "#C0185A", borderRadius: 2, marginBottom: 12 }} />
                {description ? (
                  <div style={{ fontSize: 12, color: subColor, lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: description.slice(0, 300) + (description.length > 300 ? "…" : "") }} />
                ) : (
                  <div style={{ fontSize: 11, color: subColor, fontStyle: "italic" }}>Add left section content above</div>
                )}
              </div>
              {formCard}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: "#f8fafc", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
      Unknown section type: {sec.section_type}
    </div>
  );
}

// ── FormIdSelector (used by custom_form SectionEditor) ───────────────────────
function FormIdSelector({ content, set, fs, lb, row }: {
  content: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
  fs: React.CSSProperties; lb: React.CSSProperties; row: React.CSSProperties;
}) {
  const [forms, setForms] = useState<{ id: number; name: string }[]>([]);
  useEffect(() => {
    fetch("/api/admin/forms").then(r => r.json()).then((d: { forms?: { id: number; name: string }[] }) => setForms(d.forms ?? [])).catch(() => {});
  }, []);
  const getStr = (k: string) => { const v = content[k]; return typeof v === "string" ? v : ""; };
  const layout = getStr("layout") || "left_form"; // "left_form" | "form_only"

  return (
    <div>
      {/* Layout toggle */}
      <div style={{ ...row as React.CSSProperties }}>
        <label style={lb}>Layout</label>
        <div style={{ display: "flex", gap: 8 }}>
          {([["left_form", "⊟ Left + Form"], ["form_only", "⊡ Form Only"]] as const).map(([val, label]) => (
            <button key={val} type="button"
              onClick={() => set("layout", val)}
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 7, cursor: "pointer",
                fontSize: 12, fontWeight: 700, border: "1px solid",
                borderColor: layout === val ? "#2070B8" : "#e2e8f0",
                background: layout === val ? "#eff6ff" : "#fff",
                color: layout === val ? "#2070B8" : "#64748b",
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Heading (always) */}
      <div style={row}><label style={lb}>Heading</label>
        <input style={fs} value={getStr("heading")} onChange={e => set("heading", e.target.value)} placeholder="e.g. Get in Touch" />
      </div>

      {/* Left section content — only in two-column mode */}
      {layout === "left_form" && (
        <div style={{ ...row as React.CSSProperties }}>
          <label style={{ ...lb, marginBottom: 6 }}>Left Section Content</label>
          <RichTextEditor
            value={getStr("description")}
            onChange={v => set("description", v)}
            minHeight={180}
            placeholder="Write intro text, bullet points, contact details… Rich formatting supported."
          />
        </div>
      )}

      {/* Form heading — shown above the form card (two-column only) */}
      {layout === "left_form" && (
        <div style={row}><label style={lb}>Form Heading (appears above the form)</label>
          <input style={fs} value={getStr("form_heading")} onChange={e => set("form_heading", e.target.value)} placeholder="e.g. Send Us a Message" />
        </div>
      )}

      {/* Form selector (always) */}
      <div style={row}>
        <label style={lb}>Form</label>
        <select style={fs} value={getStr("form_id")} onChange={e => set("form_id", e.target.value)}>
          <option value="">— Select a form —</option>
          {forms.map(f => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
        </select>
        <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
          <a href="/admin/forms" target="_blank" rel="noopener noreferrer" style={{ color: "#2070B8" }}>Manage Forms →</a>
        </div>
      </div>
    </div>
  );
}

// ── BackgroundPanel — universal background image / color for any section ─────
function BackgroundPanel({ sec, onUpdate }: { sec: Section; onUpdate: (sec: Section) => void }) {
  const [open, setOpen] = useState(false);
  const content = parseContent(sec.content_json);
  const set = (key: string, value: unknown) =>
    onUpdate({ ...sec, content_json: JSON.stringify({ ...content, [key]: value }) });
  const fs: React.CSSProperties = { width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" };
  const lb: React.CSSProperties = { display: "block", fontSize: 10, fontWeight: 700, color: "#374151", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" };
  const hasBg = !!(getString(content, "bg_image") || getString(content, "bg_color"));
  return (
    <div style={{ marginTop: 16, borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: hasBg ? "#eff6ff" : "#f8fafc", border: `1px solid ${hasBg ? "#bfdbfe" : "#e2e8f0"}`, borderRadius: 7, padding: "7px 10px", cursor: "pointer", fontSize: 12, fontWeight: 700, color: hasBg ? "#2070B8" : "#64748b" }}>
        <span>🖼 Background Image / Color</span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 7px 7px", padding: "12px 10px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Recommended size hint */}
          <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 5, padding: "7px 10px", fontSize: 11, color: "#92400e", lineHeight: 1.5 }}>
            <strong>Recommended sizes:</strong><br />
            Page Header / Hero: <strong>1920 × 600 px</strong><br />
            Section background: <strong>1920 × 800 px</strong><br />
            Two-column image: <strong>800 × 700 px</strong><br />
            Format: JPG/WebP · Max 500 KB for fast load
          </div>
          <div>
            <label style={lb}>Background Image</label>
            <MediaPicker value={getString(content, "bg_image")} onChange={v => set("bg_image", v)} />
          </div>
          {/* Overlay opacity */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <label style={lb}>Overlay Opacity (darkens image for readable text)</label>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>{Number(content.bg_overlay ?? 50)}%</span>
            </div>
            <input type="range" min={0} max={90} step={5}
              value={Number(content.bg_overlay ?? 50)}
              onChange={e => set("bg_overlay", Number(e.target.value))}
              style={{ width: "100%", accentColor: "#2070B8" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#cbd5e1", marginTop: 2 }}>
              <span>0% (no overlay)</span><span>90% (very dark)</span>
            </div>
          </div>

          {/* Zoom */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <label style={lb}>Image Zoom</label>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>{Number(content.bg_zoom ?? 100)}%</span>
            </div>
            <input type="range" min={100} max={200} step={5}
              value={Number(content.bg_zoom ?? 100)}
              onChange={e => set("bg_zoom", Number(e.target.value))}
              style={{ width: "100%", accentColor: "#2070B8" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#cbd5e1", marginTop: 2 }}>
              <span>100% (fit)</span><span>150% (zoomed)</span><span>200% (close-up)</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={lb}>Image Focal Point</label>
              <select style={fs} value={getString(content, "bg_position") || "center"} onChange={e => set("bg_position", e.target.value)}>
                <option value="center">Center (default)</option>
                <option value="top center">Top</option>
                <option value="bottom center">Bottom</option>
                <option value="center left">Left</option>
                <option value="center right">Right</option>
                <option value="top left">Top-Left</option>
                <option value="top right">Top-Right</option>
                <option value="bottom left">Bottom-Left</option>
                <option value="bottom right">Bottom-Right</option>
              </select>
            </div>
            <div>
              <label style={lb}>Fallback Color</label>
              <input type="color" style={{ ...fs, padding: "3px", height: 34, cursor: "pointer" }}
                value={getString(content, "bg_color") || "#0a1523"}
                onChange={e => set("bg_color", e.target.value)} />
            </div>
          </div>
          {getString(content, "bg_image") && (
            <button onClick={() => { set("bg_image", ""); }}
              style={{ fontSize: 11, padding: "4px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 5, cursor: "pointer", color: "#C0185A", fontWeight: 600, width: "fit-content" }}>
              ✕ Remove background image
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── SectionEditor (left panel form) ─────────────────────────────────────────
function SectionEditor({ sec, onUpdate }: { sec: Section; onUpdate: (sec: Section) => void }) {
  const content = parseContent(sec.content_json);
  const set = (key: string, value: unknown) =>
    onUpdate({ ...sec, content_json: JSON.stringify({ ...content, [key]: value }) });
  function setItem<T extends Record<string, unknown>>(arrKey: string, i: number, field: string, value: unknown) {
    const arr = Array.isArray(content[arrKey]) ? [...(content[arrKey] as T[])] : [];
    arr[i] = { ...arr[i], [field]: value };
    onUpdate({ ...sec, content_json: JSON.stringify({ ...content, [arrKey]: arr }) });
  }
  function addItem(arrKey: string, template: Record<string, unknown>) {
    const arr = Array.isArray(content[arrKey]) ? [...(content[arrKey] as Record<string, unknown>[])] : [];
    onUpdate({ ...sec, content_json: JSON.stringify({ ...content, [arrKey]: [...arr, template] }) });
  }
  function removeItem(arrKey: string, i: number) {
    const arr = Array.isArray(content[arrKey]) ? [...(content[arrKey] as Record<string, unknown>[])] : [];
    arr.splice(i, 1);
    onUpdate({ ...sec, content_json: JSON.stringify({ ...content, [arrKey]: arr }) });
  }

  const fs = { width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const, background: "#fff" };
  const lb = { display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.04em" };
  const row = { marginBottom: 12 };

  if (sec.section_type === "hero") return (
    <div>
      <div style={row}><label style={lb}>Heading</label><input style={fs} value={getString(content, "heading")} onChange={e => set("heading", e.target.value)} /></div>
      <div style={row}><label style={lb}>Subheading</label><input style={fs} value={getString(content, "subheading")} onChange={e => set("subheading", e.target.value)} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div><label style={lb}>Button Text</label><input style={fs} value={getString(content, "cta_text")} onChange={e => set("cta_text", e.target.value)} /></div>
        <div><label style={lb}>Button Link</label><input style={fs} value={getString(content, "cta_link")} onChange={e => set("cta_link", e.target.value)} /></div>
      </div>
      <div><label style={lb}>Background Image</label>
        <PageImageControlPanel
          value={getString(content, "image")}
          zoom={Number(content.image_zoom ?? 100)}
          position={getString(content, "image_position") || "center"}
          onChange={v => set("image", v)}
          onZoomChange={v => set("image_zoom", v)}
          onPositionChange={v => set("image_position", v)}
        />
      </div>
    </div>
  );

  if (sec.section_type === "text") return (
    <div>
      <div style={row}><label style={lb}>Heading</label><input style={fs} value={getString(content, "heading")} onChange={e => set("heading", e.target.value)} /></div>
      <div style={row}><label style={lb}>Body</label><textarea style={{ ...fs, minHeight: 120, resize: "vertical" }} value={getString(content, "body")} onChange={e => set("body", e.target.value)} /></div>
      <div><label style={lb}>Alignment</label>
        <select style={fs} value={getString(content, "align") || "left"} onChange={e => set("align", e.target.value)}>
          <option value="left">Left</option><option value="center">Center</option>
        </select>
      </div>
    </div>
  );

  if (sec.section_type === "gallery") {
    const items = Array.isArray(content.items) ? (content.items as { image?: string; caption?: string }[]) : [];
    return (
      <div>
        <div style={row}><label style={lb}>Heading</label><input style={fs} value={getString(content, "heading")} onChange={e => set("heading", e.target.value)} /></div>
        <label style={lb}>Items</label>
        {items.map((item, i) => (
          <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "10px 12px", marginBottom: 8, background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Item {i + 1}</span>
              <button onClick={() => removeItem("items", i)} style={{ background: "none", border: "none", color: "#C0185A", cursor: "pointer", fontSize: 12, padding: 0 }}>✕ Remove</button>
            </div>
            <div style={{ marginBottom: 8 }}><label style={lb}>Image</label>
              <PageImageControlPanel
                value={item.image || ""}
                zoom={Number((item as Record<string,unknown>).image_zoom ?? 100)}
                position={String((item as Record<string,unknown>).image_position ?? "center")}
                onChange={v => setItem("items", i, "image", v)}
                onZoomChange={v => setItem("items", i, "image_zoom", v)}
                onPositionChange={v => setItem("items", i, "image_position", v)}
              />
            </div>
            <div><label style={lb}>Caption</label><input style={fs} value={item.caption || ""} onChange={e => setItem("items", i, "caption", e.target.value)} /></div>
          </div>
        ))}
        <button onClick={() => addItem("items", { image: "", caption: "" })} style={{ fontSize: 12, padding: "6px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", color: "#2070B8", fontWeight: 600 }}>
          + Add Item
        </button>
      </div>
    );
  }

  if (sec.section_type === "cta") return (
    <div>
      <div style={row}><label style={lb}>Heading</label><input style={fs} value={getString(content, "heading")} onChange={e => set("heading", e.target.value)} /></div>
      <div style={row}><label style={lb}>Body</label><textarea style={{ ...fs, minHeight: 80, resize: "vertical" }} value={getString(content, "body")} onChange={e => set("body", e.target.value)} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div><label style={lb}>Primary Text</label><input style={fs} value={getString(content, "primary_cta_text")} onChange={e => set("primary_cta_text", e.target.value)} /></div>
        <div><label style={lb}>Primary Link</label><input style={fs} value={getString(content, "primary_cta_link")} onChange={e => set("primary_cta_link", e.target.value)} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div><label style={lb}>Secondary Text</label><input style={fs} value={getString(content, "secondary_cta_text")} onChange={e => set("secondary_cta_text", e.target.value)} /></div>
        <div><label style={lb}>Secondary Link</label><input style={fs} value={getString(content, "secondary_cta_link")} onChange={e => set("secondary_cta_link", e.target.value)} /></div>
      </div>
    </div>
  );

  if (sec.section_type === "faq") {
    const items = Array.isArray(content.items) ? (content.items as { question?: string; answer?: string }[]) : [];
    return (
      <div>
        <div style={row}><label style={lb}>Heading</label><input style={fs} value={getString(content, "heading")} onChange={e => set("heading", e.target.value)} /></div>
        <label style={lb}>Questions</label>
        {items.map((item, i) => (
          <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "10px 12px", marginBottom: 8, background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Q{i + 1}</span>
              <button onClick={() => removeItem("items", i)} style={{ background: "none", border: "none", color: "#C0185A", cursor: "pointer", fontSize: 12, padding: 0 }}>✕</button>
            </div>
            <div style={{ marginBottom: 8 }}><label style={lb}>Question</label><input style={fs} value={item.question || ""} onChange={e => setItem("items", i, "question", e.target.value)} /></div>
            <div><label style={lb}>Answer</label><textarea style={{ ...fs, minHeight: 70, resize: "vertical" }} value={item.answer || ""} onChange={e => setItem("items", i, "answer", e.target.value)} /></div>
          </div>
        ))}
        <button onClick={() => addItem("items", { question: "", answer: "" })} style={{ fontSize: 12, padding: "6px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", color: "#2070B8", fontWeight: 600 }}>
          + Add Question
        </button>
      </div>
    );
  }

  if (sec.section_type === "team") {
    const items = Array.isArray(content.items) ? (content.items as { name?: string; role?: string; bio?: string; image?: string }[]) : [];
    return (
      <div>
        <div style={row}><label style={lb}>Heading</label><input style={fs} value={getString(content, "heading")} onChange={e => set("heading", e.target.value)} /></div>
        <label style={lb}>Members</label>
        {items.map((item, i) => (
          <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "10px 12px", marginBottom: 8, background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Member {i + 1}</span>
              <button onClick={() => removeItem("items", i)} style={{ background: "none", border: "none", color: "#C0185A", cursor: "pointer", fontSize: 12, padding: 0 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><label style={lb}>Name</label><input style={fs} value={item.name || ""} onChange={e => setItem("items", i, "name", e.target.value)} /></div>
              <div><label style={lb}>Role</label><input style={fs} value={item.role || ""} onChange={e => setItem("items", i, "role", e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: 8 }}><label style={lb}>Bio</label><textarea style={{ ...fs, minHeight: 60, resize: "vertical" }} value={item.bio || ""} onChange={e => setItem("items", i, "bio", e.target.value)} /></div>
            <div><label style={lb}>Photo</label>
              <PageImageControlPanel
                value={item.image || ""}
                zoom={Number((item as Record<string,unknown>).image_zoom ?? 100)}
                position={String((item as Record<string,unknown>).image_position ?? "center")}
                onChange={v => setItem("items", i, "image", v)}
                onZoomChange={v => setItem("items", i, "image_zoom", v)}
                onPositionChange={v => setItem("items", i, "image_position", v)}
              />
            </div>
          </div>
        ))}
        <button onClick={() => addItem("items", { name: "", role: "", bio: "", image: "" })} style={{ fontSize: 12, padding: "6px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", color: "#2070B8", fontWeight: 600 }}>
          + Add Member
        </button>
      </div>
    );
  }

  if (sec.section_type === "page_header") return (
    <div>
      <div style={row}><label style={lb}>Eyebrow Text</label><input style={fs} value={getString(content, "eyebrow")} onChange={e => set("eyebrow", e.target.value)} placeholder="e.g. Ministry Programs" /></div>
      <div style={row}><label style={lb}>Heading</label><input style={fs} value={getString(content, "heading")} onChange={e => set("heading", e.target.value)} /></div>
      <div style={row}><label style={lb}>Subheading</label><textarea style={{ ...fs, minHeight: 70, resize: "vertical" }} value={getString(content, "subheading")} onChange={e => set("subheading", e.target.value)} /></div>
      <div><label style={lb}>Background Image (optional)</label>
        <PageImageControlPanel
          value={getString(content, "image")}
          zoom={Number(content.image_zoom ?? 100)}
          position={getString(content, "image_position") || "center"}
          onChange={v => set("image", v)}
          onZoomChange={v => set("image_zoom", v)}
          onPositionChange={v => set("image_position", v)}
        />
      </div>
    </div>
  );

  if (sec.section_type === "two_col") return (
    <div>
      <div style={row}><label style={lb}>Label (small tag)</label><input style={fs} value={getString(content, "label")} onChange={e => set("label", e.target.value)} placeholder="e.g. Biography" /></div>
      <div style={row}><label style={lb}>Heading</label><input style={fs} value={getString(content, "heading")} onChange={e => set("heading", e.target.value)} /></div>
      <div style={row}><label style={lb}>Body (separate paragraphs with blank line)</label><textarea style={{ ...fs, minHeight: 140, resize: "vertical" }} value={getString(content, "body")} onChange={e => set("body", e.target.value)} /></div>
      <div style={row}><label style={lb}>Image</label>
        <PageImageControlPanel
          value={getString(content, "image")}
          zoom={Number(content.image_zoom ?? 100)}
          position={getString(content, "image_position") || "center"}
          onChange={v => set("image", v)}
          onZoomChange={v => set("image_zoom", v)}
          onPositionChange={v => set("image_position", v)}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div><label style={lb}>Image Side</label>
          <select style={fs} value={getString(content, "image_side") || "left"} onChange={e => set("image_side", e.target.value)}>
            <option value="left">Left</option><option value="right">Right</option>
          </select>
        </div>
        <div><label style={lb}>Image Fit</label>
          <select style={fs} value={getString(content, "image_fit") || "cover"} onChange={e => set("image_fit", e.target.value)}>
            <option value="cover">Cover (photos)</option>
            <option value="contain">Contain (QR / logo)</option>
          </select>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div><label style={lb}>CTA Label</label><input style={fs} value={getString(content, "cta_label")} onChange={e => set("cta_label", e.target.value)} /></div>
        <div><label style={lb}>CTA Link</label><input style={fs} value={getString(content, "cta_href")} onChange={e => set("cta_href", e.target.value)} /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div><label style={lb}>Secondary Label</label><input style={fs} value={getString(content, "cta_secondary_label")} onChange={e => set("cta_secondary_label", e.target.value)} /></div>
        <div><label style={lb}>Secondary Link</label><input style={fs} value={getString(content, "cta_secondary_href")} onChange={e => set("cta_secondary_href", e.target.value)} /></div>
      </div>
    </div>
  );

  if (sec.section_type === "cards_grid") {
    const items = Array.isArray(content.items) ? (content.items as { title?: string; description?: string; color?: string }[]) : [];
    return (
      <div>
        <div style={row}><label style={lb}>Heading</label><input style={fs} value={getString(content, "heading")} onChange={e => set("heading", e.target.value)} /></div>
        <div style={row}><label style={lb}>Subtitle</label><input style={fs} value={getString(content, "subtitle")} onChange={e => set("subtitle", e.target.value)} /></div>
        <label style={lb}>Cards</label>
        {items.map((item, i) => (
          <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "10px 12px", marginBottom: 8, background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Card {i + 1}</span>
              <button onClick={() => removeItem("items", i)} style={{ background: "none", border: "none", color: "#C0185A", cursor: "pointer", fontSize: 12, padding: 0 }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8, marginBottom: 8 }}>
              <div><label style={lb}>Title</label><input style={fs} value={item.title || ""} onChange={e => setItem("items", i, "title", e.target.value)} /></div>
              <div><label style={lb}>Color</label><input type="color" style={{ ...fs, padding: "3px", height: 34, cursor: "pointer" }} value={item.color || "#2070B8"} onChange={e => setItem("items", i, "color", e.target.value)} /></div>
            </div>
            <div><label style={lb}>Description</label><textarea style={{ ...fs, minHeight: 60, resize: "vertical" }} value={item.description || ""} onChange={e => setItem("items", i, "description", e.target.value)} /></div>
          </div>
        ))}
        <button onClick={() => addItem("items", { title: "", description: "", color: "#2070B8" })} style={{ fontSize: 12, padding: "6px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", color: "#2070B8", fontWeight: 600 }}>
          + Add Card
        </button>
      </div>
    );
  }

  if (sec.section_type === "sermons_grid") {
    const items = Array.isArray(content.items) ? (content.items as { image?: string; title?: string; date?: string; href?: string }[]) : [];
    return (
      <div>
        <div style={row}><label style={lb}>Heading</label><input style={fs} value={getString(content, "heading")} onChange={e => set("heading", e.target.value)} /></div>
        <div style={row}><label style={lb}>Subtitle</label><input style={fs} value={getString(content, "subtitle")} onChange={e => set("subtitle", e.target.value)} /></div>
        <div style={row}><label style={lb}>YouTube Channel URL</label><input style={fs} value={getString(content, "youtube_url")} onChange={e => set("youtube_url", e.target.value)} placeholder="https://www.youtube.com/@..." /></div>
        <label style={lb}>Videos</label>
        {items.map((item, i) => (
          <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "10px 12px", marginBottom: 8, background: "#f8fafc" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Video {i + 1}</span>
              <button onClick={() => removeItem("items", i)} style={{ background: "none", border: "none", color: "#C0185A", cursor: "pointer", fontSize: 12, padding: 0 }}>✕</button>
            </div>
            <div style={{ marginBottom: 8 }}><label style={lb}>Thumbnail Image</label>
              <PageImageControlPanel
                value={item.image || ""}
                zoom={Number((item as Record<string,unknown>).image_zoom ?? 100)}
                position={String((item as Record<string,unknown>).image_position ?? "center")}
                onChange={v => setItem("items", i, "image", v)}
                onZoomChange={v => setItem("items", i, "image_zoom", v)}
                onPositionChange={v => setItem("items", i, "image_position", v)}
              />
            </div>
            <div style={{ marginBottom: 8 }}><label style={lb}>Title</label><input style={fs} value={item.title || ""} onChange={e => setItem("items", i, "title", e.target.value)} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><label style={lb}>Date</label><input style={fs} value={item.date || ""} onChange={e => setItem("items", i, "date", e.target.value)} placeholder="Jan 13, 2024" /></div>
              <div><label style={lb}>Video URL / Link</label><input style={fs} value={item.href || ""} onChange={e => setItem("items", i, "href", e.target.value)} /></div>
            </div>
          </div>
        ))}
        <button onClick={() => addItem("items", { image: "", title: "", date: "", href: "" })} style={{ fontSize: 12, padding: "6px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", color: "#2070B8", fontWeight: 600 }}>
          + Add Video
        </button>
      </div>
    );
  }

  if (sec.section_type === "contact_form") return (
    <div>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Edit the contact info displayed alongside the form.</p>
      <div style={row}><label style={lb}>Mailing Address</label><input style={fs} value={getString(content, "address")} onChange={e => set("address", e.target.value)} /></div>
      <div style={row}><label style={lb}>Office Location</label><input style={fs} value={getString(content, "office_address")} onChange={e => set("office_address", e.target.value)} /></div>
      <div style={row}><label style={lb}>Email</label><input style={fs} value={getString(content, "email")} onChange={e => set("email", e.target.value)} /></div>
      <div style={row}><label style={lb}>Phone</label><input style={fs} value={getString(content, "phone")} onChange={e => set("phone", e.target.value)} /></div>
      <div><label style={lb}>Office Hours</label><input style={fs} value={getString(content, "hours")} onChange={e => set("hours", e.target.value)} /></div>
    </div>
  );

  if (sec.section_type === "booking_form") return (
    <div style={{ padding: "14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", textAlign: "center" }}>
      <span style={{ fontSize: 18, display: "block", marginBottom: 8 }}>📅</span>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 4px" }}>Booking Form</p>
      <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>This section renders the full booking form. No editable fields needed here.</p>
    </div>
  );

  if (sec.section_type === "latest_posts") return (
    <div>
      <div style={row}><label style={lb}>Heading</label><input style={fs} value={getString(content, "heading")} onChange={e => set("heading", e.target.value)} /></div>
      <div style={row}><label style={lb}>Subtitle</label><input style={fs} value={getString(content, "subtitle")} onChange={e => set("subtitle", e.target.value)} /></div>
      <div style={row}><label style={lb}>Post Type</label>
        <select style={fs} value={getString(content, "post_type") || "all"} onChange={e => set("post_type", e.target.value)}>
          <option value="all">All Posts</option>
          <option value="blog">Blog Only</option>
          <option value="news">News Only</option>
          <option value="event">Events Only</option>
        </select>
      </div>
      <div style={row}><label style={lb}>Number of Posts</label>
        <select style={fs} value={getString(content, "count") || "6"} onChange={e => set("count", e.target.value)}>
          {["3","4","6","8","12"].map(n => <option key={n} value={n}>{n} posts</option>)}
        </select>
      </div>
    </div>
  );

  if (sec.section_type === "custom_form") return (
    <FormIdSelector content={content} set={set} fs={fs} lb={lb} row={row} />
  );

  if (sec.section_type === "donate_strip") return (
    <div>
      <div style={row}><label style={lb}>Strip Text</label><input style={fs} value={getString(content, "text")} onChange={e => set("text", e.target.value)} placeholder="Partner with us…" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div><label style={lb}>Button Label</label><input style={fs} value={getString(content, "button_label")} onChange={e => set("button_label", e.target.value)} placeholder="Give Now" /></div>
        <div><label style={lb}>Button URL</label><input style={fs} value={getString(content, "button_href")} onChange={e => set("button_href", e.target.value)} placeholder="/give" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div><label style={lb}>Background Color</label><input style={fs} type="color" value={getString(content, "bg_color") || "#1B3A76"} onChange={e => set("bg_color", e.target.value)} /></div>
        <div><label style={lb}>Button Color</label><input style={fs} type="color" value={getString(content, "btn_color") || "#9B1030"} onChange={e => set("btn_color", e.target.value)} /></div>
      </div>
    </div>
  );

  return (
    <div>
      <label style={lb}>Raw JSON</label>
      <textarea style={{ ...fs, minHeight: 100, resize: "vertical", fontFamily: "monospace", fontSize: 11 }}
        value={sec.content_json} onChange={e => onUpdate({ ...sec, content_json: e.target.value })} />
    </div>
  );
}

// ── PublishModal ─────────────────────────────────────────────────────────────
function PublishModal({ page, sections, languages, onClose, onPublished }: { page: Page; sections: Section[]; languages: LangEntry[]; onClose: () => void; onPublished: () => void; }) {
  const [selectedLangs, setSelectedLangs] = useState<Set<string>>(() => new Set(languages.map((l: LangEntry) => l.code)));
  const [progress, setProgress] = useState<Record<string, "idle" | "translating" | "done" | "error">>(() => Object.fromEntries(languages.map((l: LangEntry) => [l.code, "idle"])));
  const [publishing, setPublishing] = useState(false);
  const [translationsDone, setTranslationsDone] = useState(false);
  const toggleLang = (code: string) => setSelectedLangs(prev => { const n = new Set(prev); n.has(code) ? n.delete(code) : n.add(code); return n; });

  const runTranslations = async () => {
    for (const lang of [...selectedLangs]) {
      setProgress(p => ({ ...p, [lang]: "translating" }));
      try {
        for (const { key, value } of [{ key: "title", value: page.title }, { key: "meta_title", value: page.meta_title }, { key: "meta_description", value: page.meta_description }].filter(f => f.value)) {
          const r = await fetch("/api/admin/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: value, target: lang }) });
          const d = await r.json() as { success?: boolean; translated?: string };
          if (d.success && d.translated) await fetch("/api/admin/translations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ page_id: page.id, language_code: lang, field_key: key, content: d.translated }) });
        }
        for (const section of sections) {
          const r = await fetch("/api/admin/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section_type: section.section_type, content_json: section.content_json, target: lang }) });
          const d = await r.json() as { success?: boolean; translated_content_json?: string };
          if (d.success && d.translated_content_json) await fetch("/api/admin/section-translations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section_id: section.id, language_code: lang, content_json: d.translated_content_json }) });
        }
        setProgress(p => ({ ...p, [lang]: "done" }));
      } catch { setProgress(p => ({ ...p, [lang]: "error" })); }
    }
    setTranslationsDone(true);
  };

  const doPublish = async () => {
    setPublishing(true);
    await fetch(`/api/admin/pages/${page.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...page, status: "published" }) });
    setPublishing(false);
    onPublished();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 14, width: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Publish Page</h2><p style={{ fontSize: 12, color: "#64748b", margin: "3px 0 0" }}>Translate before publishing?</p></div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={16} /></button>
        </div>
        <div style={{ padding: "18px 22px" }}>
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: "11px 14px", marginBottom: 16, border: "1px solid #f1f5f9" }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0f172a" }}>{page.title}</div>
            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>{sections.length} section{sections.length !== 1 ? "s" : ""}</div>
          </div>
          {languages.map((lang: LangEntry) => {
            const checked = selectedLangs.has(lang.code);
            const prog = progress[lang.code];
            return (
              <div key={lang.code} onClick={() => !translationsDone && toggleLang(lang.code)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, border: `1px solid ${checked ? "#bfdbfe" : "#e2e8f0"}`, background: checked ? "#eff6ff" : "#fff", marginBottom: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleLang(lang.code)} disabled={translationsDone} style={{ accentColor: "#2070B8" }} />
                  <span style={{ fontSize: 16 }}>{lang.flag}</span>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{lang.label}</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{lang.nativeName}</div></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {prog !== "idle" && <span style={{ fontSize: 11.5, fontWeight: 600, color: prog === "done" ? "#16a34a" : prog === "error" ? "#dc2626" : "#2070B8" }}>
                    {prog === "translating" ? "Translating…" : prog === "done" ? "Done" : "Error"}
                  </span>}
                  {prog === "done" && <CheckCircle size={14} style={{ color: "#16a34a" }} />}
                  {prog === "error" && <AlertCircle size={14} style={{ color: "#dc2626" }} />}
                </div>
              </div>
            );
          })}
          <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 7, padding: "9px 13px", marginTop: 14, fontSize: 12, color: "#92400e" }}>
            Auto-translated via MyMemory free API. Review translations after publishing.
          </div>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {!translationsDone ? (
            <>
              <button onClick={onClose} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>Cancel</button>
              <button onClick={doPublish} style={{ padding: "8px 16px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Publish English Only</button>
              <button onClick={runTranslations} disabled={selectedLangs.size === 0}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", background: selectedLangs.size === 0 ? "#cbd5e1" : "#2070B8", color: "#fff", border: "none", borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                <Languages size={13} /> Translate & Publish
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} style={{ padding: "8px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Review Translations</button>
              <button onClick={doPublish} disabled={publishing}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
                <Globe size={13} /> {publishing ? "Publishing…" : "Publish Now"}
              </button>
            </>
          )}
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

// ── Main Editor ──────────────────────────────────────────────────────────────
export default function PageEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const savedSectionsRef = useRef<Section[]>([]);  // snapshot of last saved state
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [sideTab, setSideTab] = useState<"sections" | "page" | "add" | "translate">("sections");
  const [languages, setLanguages] = useState<LangEntry[]>(DEFAULT_LANGS);
  const [transLang, setTransLang] = useState<string>(DEFAULT_LANGS[0]?.code ?? "es");
  const [previewLang, setPreviewLang] = useState<string>("en");
  const [transStatus, setTransStatus] = useState<Record<string, "idle" | "loading" | "done" | "error">>({});
  const [sectionTranslations, setSectionTranslations] = useState<Record<string, Record<string, string>>>({});
  // Manual editing: which section is open for editing, and the draft field values
  const [editingSec, setEditingSec] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [translatingAllLangs, setTranslatingAllLangs] = useState(false);
  const [allLangsProgress, setAllLangsProgress] = useState<{ done: number; total: number } | null>(null);

  // Drag state
  const dragIdx = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3200); };

  const load = useCallback(async () => {
    const [pr, tr] = await Promise.all([
      fetch(`/api/admin/pages/${id}`),
      fetch(`/api/admin/section-translations?page_id=${id}`),
    ]);
    const pd = await pr.json() as { page: Page; sections: Section[] };
    const td = await tr.json() as { section_translations: SectionTranslation[] };
    const sorted = (pd.sections || []).sort((a, b) => a.sort_order - b.sort_order);
    setPage(pd.page);
    setSections(sorted);
    savedSectionsRef.current = sorted;
    setHasChanges(false);
    // Build a map: sectionId -> { lang -> content_json }
    const map: Record<string, Record<string, string>> = {};
    for (const t of (td.section_translations || [])) {
      if (!map[t.section_id]) map[t.section_id] = {};
      map[t.section_id][t.language_code] = t.content_json;
    }
    setSectionTranslations(map);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Fetch active languages from admin settings
  useEffect(() => {
    fetch("/api/languages")
      .then(r => r.json())
      .then((data: { languages?: { code: string; label: string; nativeLabel: string; flag: string }[] }) => {
        if (Array.isArray(data.languages) && data.languages.length > 0) {
          const mapped = data.languages.map(l => ({ code: l.code, label: l.label, flag: l.flag, nativeName: l.nativeLabel }));
          setLanguages(mapped);
          setTransLang(mapped[0].code);
        }
      })
      .catch(() => { /* keep defaults */ });
  }, []);

  const saveWithStatus = async (status: "draft" | "published") => {
    if (!page) return;
    setSaving(true);
    const updatedPage = { ...page, status };
    await fetch(`/api/admin/pages/${page.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedPage) });
    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      await fetch(`/api/admin/sections/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...s, sort_order: i }) });
    }
    setPage(updatedPage);
    savedSectionsRef.current = sections;
    setHasChanges(false);
    setSaving(false);
    showToast(status === "draft" ? "Saved as draft" : "Published — page is now live!");
  };

  const saveDraftPage = () => saveWithStatus("draft");
  const publishPage   = () => saveWithStatus("published");

  const addSection = async (type: string) => {
    const maxOrder = sections.reduce((m, s) => Math.max(m, s.sort_order), -1);
    const defaults: Record<string, string> = {
      hero: JSON.stringify({ heading: "New Section", subheading: "", cta_text: "Learn More", cta_link: "/", image: "" }),
      text: JSON.stringify({ heading: "New Text Section", body: "Enter your content here.", align: "left" }),
      gallery: JSON.stringify({ heading: "Gallery", items: [] }),
      cta: JSON.stringify({ heading: "Take Action", body: "Your message here.", primary_cta_text: "Get Started", primary_cta_link: "/" }),
      faq: JSON.stringify({ heading: "FAQ", items: [{ question: "Question?", answer: "Answer here." }] }),
      team: JSON.stringify({ heading: "Our Team", items: [] }),
    };
    const r = await fetch("/api/admin/sections", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id: page?.id, section_type: type, sort_order: maxOrder + 1, content_json: defaults[type] || "{}" }),
    });
    const d = await r.json() as { id: number };
    const newSec: Section = { id: d.id, section_type: type, sort_order: maxOrder + 1, content_json: defaults[type] || "{}" };
    setSections(s => [...s, newSec]);
    setSelectedId(newSec.id);
    setSideTab("sections");
    showToast("Section added");
  };

  const deleteSection = async (secId: number) => {
    if (!confirm("Delete this section?")) return;
    const r = await fetch(`/api/admin/sections/${secId}`, { method: "DELETE" });
    if (!r.ok) {
      const d = await r.json().catch(() => ({})) as { error?: string };
      showToast(d.error || `Delete failed (${r.status})`, false);
      return;
    }
    setSections(s => s.filter(x => x.id !== secId));
    if (selectedId === secId) setSelectedId(null);
    showToast("Section deleted");
  };

  const updateSection = (updated: Section) => {
    setSections(s => s.map(x => x.id === updated.id ? updated : x));
    setHasChanges(true);
  };

  const resetChanges = () => {
    if (!confirm("Discard all unsaved changes?")) return;
    setSections(savedSectionsRef.current);
    setHasChanges(false);
    setSelectedId(null);
    showToast("Changes discarded", true);
  };

  // Drag & drop
  const onDragStart = (idx: number) => { dragIdx.current = idx; };
  const onDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const onDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    const fromIdx = dragIdx.current;
    if (fromIdx === null || fromIdx === toIdx) { setDragOverIdx(null); dragIdx.current = null; return; }
    const next = [...sections];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    setSections(next.map((s, i) => ({ ...s, sort_order: i })));
    setHasChanges(true);
    dragIdx.current = null;
    setDragOverIdx(null);
  };
  const onDragEnd = () => { dragIdx.current = null; setDragOverIdx(null); };

  const autoTranslateSection = async (sec: Section, lang: string) => {
    const key = `${sec.id}-${lang}`;
    setTransStatus(s => ({ ...s, [key]: "loading" }));
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_type: sec.section_type, content_json: sec.content_json, target: lang }),
      });
      const d = await res.json() as { success: boolean; translated_content_json: string };
      if (!d.success) throw new Error("translate failed");
      // Save translation
      await fetch("/api/admin/section-translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_id: sec.id, language_code: lang, content_json: d.translated_content_json, status: "pending" }),
      });
      setSectionTranslations(prev => ({
        ...prev,
        [sec.id]: { ...(prev[sec.id] || {}), [lang]: d.translated_content_json },
      }));
      setTransStatus(s => ({ ...s, [key]: "done" }));
    } catch {
      setTransStatus(s => ({ ...s, [key]: "error" }));
    }
  };

  const autoTranslateAll = async (lang: string) => {
    for (const sec of sections) {
      await autoTranslateSection(sec, lang);
    }
  };

  const autoTranslateAllLanguages = async () => {
    if (translatingAllLangs) return;
    setTranslatingAllLangs(true);
    const total = languages.length * sections.length;
    let done = 0;
    setAllLangsProgress({ done: 0, total });
    for (const lang of languages) {
      for (const sec of sections) {
        await autoTranslateSection(sec, lang.code);
        done++;
        setAllLangsProgress({ done, total });
      }
    }
    setTranslatingAllLangs(false);
    setAllLangsProgress(null);
    showToast(`All sections translated into ${languages.length} languages`);
  };

  const openManualEdit = (sec: Section, lang: string) => {
    if (editingSec === sec.id) { setEditingSec(null); return; }
    const originalContent = parseContent(sec.content_json);
    const existingTranslation = sectionTranslations[sec.id]?.[lang];
    const translatedContent = existingTranslation ? parseContent(existingTranslation) : originalContent;
    const fields = getEditableFields(sec.section_type, originalContent);
    const draft: Record<string, string> = {};
    for (const f of fields) { draft[f.path] = getAtPath(translatedContent, f.path); }
    setEditDraft(draft);
    setEditingSec(sec.id);
    // Auto-switch preview canvas to the language being edited
    setPreviewLang(lang);
  };

  const saveManualEdit = async (sec: Section, lang: string) => {
    setEditSaving(true);
    const originalContent = parseContent(sec.content_json);
    // Deep-merge edits into original (keeps non-text fields from original)
    let merged = { ...originalContent };
    for (const [path, value] of Object.entries(editDraft)) {
      if (value.trim()) merged = setAtPath(merged, path, value);
    }
    const translatedJson = JSON.stringify(merged);
    await fetch("/api/admin/section-translations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section_id: sec.id, language_code: lang, content_json: translatedJson, status: "reviewed" }),
    });
    setSectionTranslations(prev => ({
      ...prev,
      [sec.id]: { ...(prev[sec.id] || {}), [lang]: translatedJson },
    }));
    setEditSaving(false);
    setEditingSec(null);
    showToast("Translation saved");
  };

  const selectedSec = sections.find(s => s.id === selectedId) ?? null;

  // When preview is in a translation language, show translated content in the section editor
  const editableSec: Section | null = selectedSec
    ? previewLang !== "en"
      ? { ...selectedSec, content_json: sectionTranslations[selectedSec.id]?.[previewLang] ?? selectedSec.content_json }
      : selectedSec
    : null;

  // Update handler: in translation preview mode, persist edits as a translation, not the base section
  const updateEditableSec = (updated: Section) => {
    if (previewLang !== "en") {
      // Update in-memory for instant preview
      setSectionTranslations(prev => ({
        ...prev,
        [updated.id]: { ...(prev[updated.id] ?? {}), [previewLang]: updated.content_json },
      }));
      // Persist to DB (fire-and-forget — user can still use Save button for base content)
      void fetch("/api/admin/section-translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_id: updated.id, language_code: previewLang, content_json: updated.content_json, status: "reviewed" }),
      });
    } else {
      updateSection(updated);
    }
  };

  const previewWidth = previewDevice === "desktop" ? "100%" : previewDevice === "tablet" ? 768 : 390;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f1f5f9" }}>
      <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading editor…</div>
    </div>
  );

  if (!page) return <div style={{ padding: "2rem", color: "#94a3b8" }}>Page not found.</div>;

  const typeInfo = (t: string) => SECTION_TYPES.find(x => x.value === t) ?? { label: t, color: "#64748b", icon: "◻" };

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#f1f5f9", fontFamily: "system-ui,sans-serif", zIndex: 100 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 14, right: 18, zIndex: 9999, background: toast.ok ? "#16a34a" : "#dc2626", color: "#fff", padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 7, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
          {toast.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {toast.msg}
        </div>
      )}

      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div style={{ height: 52, background: "#0f172a", display: "flex", alignItems: "center", gap: 10, padding: "0 14px", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
        <button onClick={() => router.push("/admin/pages")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.7)", fontSize: 12.5, cursor: "pointer" }}>
          <ArrowLeft size={13} /> Pages
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            value={page.title}
            onChange={e => setPage(p => p ? { ...p, title: e.target.value, slug: slugify(e.target.value) } : p)}
            style={{ background: "transparent", border: "none", outline: "none", fontSize: 15, fontWeight: 700, color: "#fff", width: "100%", fontFamily: "inherit" }}
            placeholder="Page title…"
          />
        </div>
        <span style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 20, fontWeight: 600, background: page.status === "published" ? "rgba(22,163,74,0.2)" : "rgba(234,179,8,0.2)", color: page.status === "published" ? "#4ade80" : "#fbbf24" }}>
          {page.status}
        </span>

        {/* Device preview switcher */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.07)", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
          {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as [string, typeof Monitor][]).map(([d, Icon]) => (
            <button key={d} onClick={() => setPreviewDevice(d as "desktop" | "tablet" | "mobile")}
              style={{ padding: "6px 10px", background: previewDevice === d ? "rgba(32,112,184,0.5)" : "none", border: "none", cursor: "pointer", color: previewDevice === d ? "#60a5fa" : "rgba(255,255,255,0.5)", display: "flex", alignItems: "center" }}>
              <Icon size={14} />
            </button>
          ))}
        </div>

        <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", textDecoration: "none" }}>
          <Eye size={13} /> View
        </a>
        {/* Translate All */}
        <button onClick={() => void autoTranslateAllLanguages()} disabled={translatingAllLangs}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 6, color: "#a78bfa", fontSize: 12.5, fontWeight: 700, cursor: translatingAllLangs ? "wait" : "pointer", whiteSpace: "nowrap" }}>
          <Languages size={13} />
          {translatingAllLangs
            ? allLangsProgress
              ? `Translating ${allLangsProgress.done}/${allLangsProgress.total}…`
              : "Translating…"
            : `Translate All (${languages.length} langs)`}
        </button>
        {hasChanges && (
          <>
            <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, background: "rgba(234,179,8,0.12)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 20, padding: "3px 10px", whiteSpace: "nowrap" }}>
              ● Unsaved changes
            </span>
            <button onClick={resetChanges}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 6, color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              <X size={12} /> Reset
            </button>
          </>
        )}
        <button onClick={() => void saveDraftPage()} disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.4)", borderRadius: 6, color: "#fbbf24", fontSize: 12.5, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
          <Save size={13} /> {saving && page.status === "draft" ? "Saving…" : "Save Draft"}
        </button>
        <button onClick={() => void publishPage()} disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "#16a34a", border: "none", borderRadius: 6, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}>
          <Globe size={13} /> {saving && page.status === "published" ? "Publishing…" : "Publish"}
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <div style={{ width: 290, flexShrink: 0, background: "#fff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Sidebar tab switcher */}
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
            {([["sections", LayoutTemplate, "Sections"], ["add", Plus, "Add"], ["page", Settings2, "Page"], ["translate", Globe, "Translate"]] as [string, typeof Plus, string][]).map(([t, Icon, label]) => (
              <button key={t} onClick={() => { setSideTab(t as "sections" | "add" | "page" | "translate"); if (t === "add") setSelectedId(null); }}
                style={{ flex: 1, padding: "10px 0", border: "none", background: sideTab === t ? "#fff" : "#f8fafc", borderBottom: sideTab === t ? "2px solid #2070B8" : "2px solid transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: sideTab === t ? "#2070B8" : "#94a3b8" }}>
                <Icon size={14} />
                <span style={{ fontSize: 9, fontWeight: 700 }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Sidebar content */}
          <div style={{ flex: 1, overflowY: "auto" }}>

            {/* ADD SECTION palette */}
            {sideTab === "add" && (
              <div style={{ padding: 14 }}>
                <p style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Click to add section</p>
                {SECTION_TYPES.map(t => (
                  <button key={t.value} onClick={() => addSection(t.value)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", marginBottom: 7, border: "1px solid #e2e8f0", borderRadius: 9, background: "#f8fafc", cursor: "pointer", textAlign: "left", transition: "all 0.12s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = t.color + "10"; e.currentTarget.style.borderColor = t.color + "60"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
                    <div style={{ width: 34, height: 34, borderRadius: 7, background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", flexShrink: 0 }}>{t.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{t.desc}</div>
                    </div>
                    <Plus size={13} style={{ color: "#94a3b8", marginLeft: "auto", flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            )}

            {/* SECTIONS list + editor */}
            {sideTab === "sections" && (
              <div style={{ padding: 12 }}>
                {sections.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 16px" }}>
                    <LayoutTemplate size={32} style={{ color: "#e2e8f0", margin: "0 auto 10px" }} />
                    <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>No sections yet</p>
                    <button onClick={() => setSideTab("add")} style={{ padding: "8px 18px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      + Add First Section
                    </button>
                  </div>
                ) : editableSec ? (
                  // Section editor form
                  <div>
                    <button onClick={() => setSelectedId(null)}
                      style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 14, background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 12.5, padding: 0, fontFamily: "inherit" }}>
                      <ArrowLeft size={13} /> All sections
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: previewLang !== "en" ? 8 : 16 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: typeInfo(editableSec.section_type).color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff" }}>
                        {typeInfo(editableSec.section_type).icon}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{typeInfo(editableSec.section_type).label}</span>
                    </div>
                    {/* Translation mode banner + quick translate */}
                    {previewLang !== "en" && (() => {
                      const lang = LANG_OPTIONS.find(l => l.code === previewLang);
                      const secKey = `${editableSec.id}-${previewLang}`;
                      const secStatus = transStatus[secKey] || "idle";
                      const hasTranslation = !!(sectionTranslations[editableSec.id]?.[previewLang]);
                      return (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px 6px 0 0", padding: "6px 10px", fontSize: 11.5, color: "#2070B8", fontWeight: 600 }}>
                            <Globe size={12} />
                            {lang?.flag} Editing {lang?.label} translation — changes auto-save
                          </div>
                          <button
                            onClick={() => void autoTranslateSection(editableSec, previewLang)}
                            disabled={secStatus === "loading"}
                            style={{ width: "100%", padding: "6px 10px", background: secStatus === "loading" ? "#f1f5f9" : hasTranslation ? "#f0fdf4" : "#2070B8", border: "1px solid", borderTop: "none", borderRadius: "0 0 6px 6px", cursor: secStatus === "loading" ? "wait" : "pointer", fontSize: 11.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                              color: secStatus === "loading" ? "#94a3b8" : hasTranslation ? "#16a34a" : "#fff",
                              borderColor: secStatus === "loading" ? "#e2e8f0" : hasTranslation ? "#bbf7d0" : "#2070B8",
                            }}>
                            <Languages size={12} />
                            {secStatus === "loading" ? "Translating…" : secStatus === "error" ? "✗ Retry Auto-Translate" : hasTranslation ? "✓ Re-Translate This Section" : `Auto-Translate to ${lang?.label}`}
                          </button>
                        </div>
                      );
                    })()}
                    <SectionEditor sec={editableSec} onUpdate={updateEditableSec} />
                    {previewLang === "en" && (
                      <BackgroundPanel sec={editableSec} onUpdate={updateEditableSec} />
                    )}
                    {previewLang === "en" && (
                      <button onClick={() => deleteSection(editableSec.id)}
                        style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 18, padding: "7px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#C0185A" }}>
                        <Trash2 size={12} /> Delete Section
                      </button>
                    )}
                  </div>
                ) : (
                  // Section list
                  sections.map((sec, idx) => {
                    const ti = typeInfo(sec.section_type);
                    const isSelected = selectedId === sec.id;
                    const isDragTarget = dragOverIdx === idx;
                    return (
                      <div key={sec.id}
                        draggable
                        onDragStart={() => onDragStart(idx)}
                        onDragOver={e => onDragOver(e, idx)}
                        onDrop={e => onDrop(e, idx)}
                        onDragEnd={onDragEnd}
                        onClick={() => setSelectedId(sec.id)}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", marginBottom: 6, border: `1px solid ${isSelected ? "#2070B8" : isDragTarget ? "#93c5fd" : "#e2e8f0"}`, borderRadius: 8, cursor: "pointer", background: isSelected ? "#eff6ff" : isDragTarget ? "#e0f2fe" : "#f8fafc", transition: "all 0.12s", userSelect: "none" }}>
                        <GripVertical size={12} style={{ color: "#cbd5e1", flexShrink: 0, cursor: "grab" }} />
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: ti.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", flexShrink: 0 }}>{ti.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a" }}>{ti.label}</div>
                          <div style={{ fontSize: 10.5, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {getString(parseContent(sec.content_json), "heading") || "—"}
                          </div>
                        </div>
                        <Pencil size={11} style={{ color: "#94a3b8", flexShrink: 0 }} />
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* PAGE SETTINGS */}
            {sideTab === "page" && (
              <div style={{ padding: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>Page Settings</p>
                {([["Page Title", "title"], ["Slug", "slug"], ["Meta Title", "meta_title"], ["Meta Keywords", "meta_keywords"]] as [string, keyof Page][]).map(([label, key]) => (
                  <div key={key} style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
                    <input
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                      value={String(page[key] || "")}
                      onChange={e => setPage(p => p ? { ...p, [key]: e.target.value } : p)}
                    />
                  </div>
                ))}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Meta Description</label>
                  <textarea
                    style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12.5, fontFamily: "inherit", outline: "none", resize: "vertical", minHeight: 80, boxSizing: "border-box" }}
                    value={page.meta_description || ""}
                    onChange={e => setPage(p => p ? { ...p, meta_description: e.target.value } : p)}
                  />
                </div>
              </div>
            )}

            {/* TRANSLATE TAB */}
            {sideTab === "translate" && (
              <div style={{ padding: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Translations</p>

                {/* Language selector */}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                  {languages.map(({ code, flag, nativeName }) => (
                    <button key={code} onClick={() => { setTransLang(code); setEditingSec(null); }}
                      style={{ flex: "1 1 0", padding: "6px 2px", border: "1px solid", borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700,
                        background: transLang === code ? "#2070B8" : "#f8fafc",
                        color: transLang === code ? "#fff" : "#64748b",
                        borderColor: transLang === code ? "#2070B8" : "#e2e8f0",
                      }}>
                      {flag} {nativeName}
                    </button>
                  ))}
                </div>

                {/* Translate All (selected lang) */}
                <button onClick={() => void autoTranslateAll(transLang)}
                  style={{ width: "100%", padding: "7px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 11.5, cursor: "pointer", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Globe size={11} /> Auto-Translate All ({languages.find(l => l.code === transLang)?.nativeName})
                </button>

                {/* Translate ALL sections × ALL languages */}
                <button
                  onClick={() => void autoTranslateAllLanguages()}
                  disabled={translatingAllLangs}
                  style={{ width: "100%", padding: "7px", background: translatingAllLangs ? "#64748b" : "#0f172a", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 11.5, cursor: translatingAllLangs ? "wait" : "pointer", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Languages size={11} />
                  {translatingAllLangs && allLangsProgress
                    ? `Translating… ${allLangsProgress.done}/${allLangsProgress.total}`
                    : `Translate All Sections × All Languages (${languages.length})`}
                </button>

                {/* Per-section rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sections.map(sec => {
                    const ti = typeInfo(sec.section_type);
                    const key = `${sec.id}-${transLang}`;
                    const st = transStatus[key] || "idle";
                    const hasTr = !!(sectionTranslations[sec.id]?.[transLang]);
                    const isEditing = editingSec === sec.id;
                    const fields = isEditing ? getEditableFields(sec.section_type, parseContent(sec.content_json)) : [];
                    const origContent = parseContent(sec.content_json);

                    return (
                      <div key={sec.id} style={{ border: `1px solid ${isEditing ? "#2070B8" : "#e2e8f0"}`, borderRadius: 8, overflow: "hidden", background: hasTr ? "#f0fdf4" : "#f8fafc" }}>
                        {/* Section header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 10px" }}>
                          <div style={{ width: 18, height: 18, borderRadius: 3, background: ti.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", flexShrink: 0 }}>{ti.icon}</div>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: "#0f172a", flex: 1 }}>{ti.label}</span>
                          {hasTr && !isEditing && <span style={{ fontSize: 9, color: "#16a34a", fontWeight: 800, background: "#dcfce7", padding: "1px 5px", borderRadius: 3 }}>✓ DONE</span>}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 4, padding: "0 10px 9px" }}>
                          <button onClick={() => void autoTranslateSection(sec, transLang)} disabled={st === "loading"}
                            style={{ flex: 1, padding: "5px 4px", background: st === "loading" ? "#f1f5f9" : "#fff", border: `1px solid ${st === "error" ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 5, cursor: st === "loading" ? "wait" : "pointer", fontSize: 10, fontWeight: 600, color: st === "loading" ? "#94a3b8" : st === "error" ? "#dc2626" : "#2070B8" }}>
                            {st === "loading" ? "…" : st === "error" ? "✗ Retry" : hasTr ? "Re-auto" : "Auto"}
                          </button>
                          {fields.length > 0 || !isEditing ? (
                            <button onClick={() => openManualEdit(sec, transLang)}
                              style={{ flex: 1, padding: "5px 4px", background: isEditing ? "#2070B8" : "#fff", border: `1px solid ${isEditing ? "#2070B8" : "#e2e8f0"}`, borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 600, color: isEditing ? "#fff" : "#374151" }}>
                              {isEditing ? "✕ Close" : "✎ Edit"}
                            </button>
                          ) : null}
                        </div>

                        {/* Manual editor (inline) */}
                        {isEditing && fields.length > 0 && (
                          <div style={{ borderTop: "1px solid #e2e8f0", background: "#fff", padding: "12px 10px" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                              Manual Edit — {transLang.toUpperCase()}
                            </p>
                            {fields.map(field => {
                              const eng = getAtPath(origContent, field.path);
                              return (
                                <div key={field.path} style={{ marginBottom: 10 }}>
                                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#374151", marginBottom: 3 }}>{field.label}</label>
                                  {/* English reference */}
                                  {eng && (
                                    <div style={{ fontSize: 10.5, color: "#94a3b8", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 4, padding: "4px 7px", marginBottom: 3, lineHeight: 1.5, maxHeight: 50, overflow: "hidden" }}>
                                      {eng.slice(0, 120)}{eng.length > 120 ? "…" : ""}
                                    </div>
                                  )}
                                  {/* Translated value */}
                                  {field.multiline ? (
                                    <textarea
                                      rows={3}
                                      value={editDraft[field.path] ?? ""}
                                      onChange={e => setEditDraft(d => ({ ...d, [field.path]: e.target.value }))}
                                      placeholder={`${field.label} in ${transLang}…`}
                                      style={{ width: "100%", padding: "5px 7px", border: "1px solid #bfdbfe", borderRadius: 5, fontSize: 11.5, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", background: "#eff6ff" }}
                                    />
                                  ) : (
                                    <input
                                      type="text"
                                      value={editDraft[field.path] ?? ""}
                                      onChange={e => setEditDraft(d => ({ ...d, [field.path]: e.target.value }))}
                                      placeholder={`${field.label} in ${transLang}…`}
                                      style={{ width: "100%", padding: "5px 7px", border: "1px solid #bfdbfe", borderRadius: 5, fontSize: 11.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#eff6ff" }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                            <button onClick={() => saveManualEdit(sec, transLang)} disabled={editSaving}
                              style={{ width: "100%", padding: "7px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 11.5, cursor: "pointer", opacity: editSaving ? 0.7 : 1 }}>
                              {editSaving ? "Saving…" : "✓ Save Translation"}
                            </button>
                          </div>
                        )}

                        {isEditing && fields.length === 0 && (
                          <div style={{ borderTop: "1px solid #e2e8f0", background: "#fff", padding: "12px 10px", fontSize: 11.5, color: "#94a3b8", textAlign: "center" }}>
                            No text fields to edit for this section type.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {sections.length === 0 && (
                  <p style={{ fontSize: 12.5, color: "#94a3b8", textAlign: "center", marginTop: 20 }}>Add sections first to translate them.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── PREVIEW CANVAS ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", background: "#e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 16px 40px" }}>

          {/* Home page note */}
          {page.slug === "home" && (
            <div style={{ alignSelf: "stretch", marginBottom: 12, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
              <span style={{ fontSize: 16 }}>ℹ️</span>
              <span style={{ color: "#1e40af", flex: 1 }}>The Home page's main sections (Hero, Stats, Welcome…) are managed in the <strong>Site Editor</strong>. This builder handles <em>extra</em> sections added below them.</span>
              <a href="/admin/site-editor" target="_blank" rel="noopener noreferrer" style={{ color: "#2070B8", fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>Open Site Editor →</a>
            </div>
          )}

          {/* Language preview selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, background: "#fff", borderRadius: 8, padding: "6px 10px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", alignSelf: "flex-start" }}>
            <Globe size={12} style={{ color: "#2070B8", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>Preview:</span>
            <button onClick={() => setPreviewLang("en")}
              style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid", fontSize: 11, fontWeight: 700, cursor: "pointer",
                background: previewLang === "en" ? "#2070B8" : "#f8fafc",
                color: previewLang === "en" ? "#fff" : "#374151",
                borderColor: previewLang === "en" ? "#2070B8" : "#e2e8f0" }}>
              🇺🇸 English
            </button>
            {languages.map(({ code, flag, nativeName }) => (
              <button key={code} onClick={() => setPreviewLang(code)}
                style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  background: previewLang === code ? "#2070B8" : "#f8fafc",
                  color: previewLang === code ? "#fff" : "#374151",
                  borderColor: previewLang === code ? "#2070B8" : "#e2e8f0" }}>
                {flag} {nativeName}
              </button>
            ))}
          </div>

          {/* Device frame */}
          <div style={{
            width: previewWidth,
            maxWidth: "100%",
            background: "#fff",
            boxShadow: previewDevice !== "desktop" ? "0 0 0 2px #334155, 0 20px 60px rgba(0,0,0,0.35)" : "0 4px 32px rgba(0,0,0,0.12)",
            borderRadius: previewDevice !== "desktop" ? 16 : 6,
            transition: "width 0.3s ease",
          }}>

            {/* Mock navbar */}
            <div style={{ height: 52, background: "#0d1523", display: "flex", alignItems: "center", padding: "0 20px", gap: 20 }}>
              <div style={{ width: 100, height: 28, background: "rgba(255,255,255,0.08)", borderRadius: 4 }} />
              <div style={{ flex: 1, display: "flex", gap: 12 }}>
                {["HOME", "ABOUT", "MINISTRIES", "SERMONS", "CONTACT"].map(n => (
                  <div key={n} style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.07em" }}>{n}</div>
                ))}
              </div>
              <div style={{ width: 60, height: 26, background: "#9B1030", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>DONATE</span>
              </div>
            </div>

            {/* Sections with drag & drop and selection overlays */}
            {sections.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <LayoutTemplate size={48} style={{ color: "#e2e8f0", margin: "0 auto 16px" }} />
                <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>This page has no sections yet.</p>
                <button onClick={() => setSideTab("add")}
                  style={{ padding: "10px 22px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  + Add First Section
                </button>
              </div>
            ) : (
              sections.map((sec, idx) => {
                const isSelected = selectedId === sec.id;
                const isDragTarget = dragOverIdx === idx;
                const ti = typeInfo(sec.section_type);
                return (
                  <div key={sec.id}
                    draggable
                    onDragStart={() => onDragStart(idx)}
                    onDragOver={e => onDragOver(e, idx)}
                    onDrop={e => onDrop(e, idx)}
                    onDragEnd={onDragEnd}
                    style={{ position: "relative", outline: isSelected ? `2px solid #2070B8` : isDragTarget ? `2px dashed #93c5fd` : "none", outlineOffset: -2, cursor: "default" }}
                    onClick={() => { setSelectedId(sec.id); setSideTab("sections"); }}>

                    {/* Section preview content — live when editing */}
                    <SectionPreview sec={sec} previewDevice={previewDevice} translatedJson={(() => {
                      if (previewLang === "en") return undefined;
                      // Live preview: merge editDraft into translation for the section being edited
                      if (editingSec === sec.id && previewLang === transLang) {
                        const base = parseContent(sectionTranslations[sec.id]?.[previewLang] ?? sec.content_json);
                        let merged: Record<string, unknown> = { ...base };
                        for (const [path, value] of Object.entries(editDraft)) {
                          merged = setAtPath(merged, path, value);
                        }
                        return JSON.stringify(merged);
                      }
                      return sectionTranslations[sec.id]?.[previewLang];
                    })()} />

                    {/* Hover / selected overlay controls */}
                    <div className="sec-overlay" style={{
                      position: "absolute", inset: 0, opacity: isSelected ? 1 : 0, transition: "opacity 0.15s",
                      background: isSelected ? "rgba(32,112,184,0.04)" : "transparent",
                      pointerEvents: isSelected ? "auto" : "none",
                    }}>
                      {/* Type badge top-left */}
                      <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 5, background: ti.color, color: "#fff", padding: "3px 9px 3px 7px", borderRadius: 5, fontSize: 11, fontWeight: 700 }}>
                        <GripVertical size={10} style={{ cursor: "grab" }} />
                        {ti.label}
                      </div>
                      {/* Delete top-right */}
                      <button
                        onClick={e => { e.stopPropagation(); deleteSection(sec.id); }}
                        style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 6, background: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <Trash2 size={12} style={{ color: "#C0185A" }} />
                      </button>
                    </div>

                    {/* Always-visible thin hover ring on hover */}
                    <style>{`.sec-overlay:hover{opacity:1!important}`}</style>
                  </div>
                );
              })
            )}

            {/* Mock footer */}
            <div style={{ background: "#0a1628", padding: "28px 24px", display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ width: 100, height: 20, background: "rgba(255,255,255,0.08)", borderRadius: 3, marginBottom: 10 }} />
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>Wesley Paul International Ministries</div>
              </div>
              {["Quick Links", "Ministries"].map(col => (
                <div key={col} style={{ minWidth: 100 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#f5a623", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>{col}</div>
                  {[1, 2, 3].map(i => <div key={i} style={{ height: 8, width: "70%", background: "rgba(255,255,255,0.07)", borderRadius: 2, marginBottom: 8 }} />)}
                </div>
              ))}
            </div>
          </div>

          {/* Add section button below canvas */}
          <button onClick={() => setSideTab("add")}
            style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", background: "#fff", border: "2px dashed #cbd5e1", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#64748b" }}>
            <Plus size={14} /> Add Section
          </button>
        </div>
      </div>

      {showPublishModal && page && (
        <PublishModal
          page={page} sections={sections} languages={languages}
          onClose={() => setShowPublishModal(false)}
          onPublished={() => { setShowPublishModal(false); setPage(p => p ? { ...p, status: "published" } : p); showToast("Page published!"); }}
        />
      )}

      <style>{`
        .sec-overlay { pointer-events: none; }
        [draggable] { user-select: none; }
        [draggable]:hover .sec-overlay { opacity: 1 !important; pointer-events: auto; }
      `}</style>
    </div>
  );
}

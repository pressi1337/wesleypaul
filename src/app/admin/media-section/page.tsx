"use client";

import { useEffect, useState, useRef } from "react";
import {
  Plus, Trash2, GripVertical, X, ExternalLink, PlayCircle,
  Eye, EyeOff, Save, Image as ImageIcon, Link as LinkIcon,
  RefreshCw, Upload,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────────── */
interface MediaItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  play_mode: "inline" | "external";
}

interface LangMeta { code: string; label: string; flag: string; }

interface TranslationEntry {
  heading?: string;
  eyebrow?: string;
  cta_label?: string;
  items?: Record<string, string>; // itemId → translated title
}

interface MediaSectionData {
  show?: boolean;
  heading?: string;
  eyebrow?: string;
  items: MediaItem[];
  translations?: Record<string, TranslationEntry>;
}

interface LibraryItem {
  id: number;
  filename: string;
  file_path: string;
  original_name: string;
  alt_text: string;
  mime_type?: string;
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

function getAutoThumb(url: string): string {
  const id = extractYouTubeId(url);
  if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return "";
}

function detectType(url: string): "youtube" | "instagram" | "other" {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/instagram\.com/.test(url)) return "instagram";
  return "other";
}

const TYPE_COLOR: Record<string, string> = { youtube: "#dc2626", instagram: "#C0185A", other: "#64748b" };
const TYPE_LABEL: Record<string, string> = { youtube: "YouTube", instagram: "Instagram", other: "Other" };

function genId() { return Math.random().toString(36).slice(2, 10); }

const labelStyle: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 5 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 7, fontSize: 13, color: "#0f172a", outline: "none", boxSizing: "border-box" };

/* ── Image Picker Modal ─────────────────────────────────────────────────────── */
function ImagePickerModal({ onSelect, onClose }: { onSelect: (path: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [media, setMedia] = useState<LibraryItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoImported = useRef(false);

  const loadMedia = async () => {
    const r = await fetch("/api/admin/media");
    const d = await r.json() as { media: LibraryItem[] };
    setMedia((d.media || []).filter(m => !m.mime_type || m.mime_type.startsWith("image/")));
  };

  const importExisting = async () => {
    setImporting(true);
    await fetch("/api/admin/media/import", { method: "POST" });
    await loadMedia();
    setImporting(false);
  };

  useEffect(() => {
    void loadMedia();
    if (!hasAutoImported.current) {
      hasAutoImported.current = true;
      void importExisting();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError("File too large (max 10 MB)."); return; }
    setUploading(true); setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/admin/media", { method: "POST", body: fd });
      const d = await r.json() as { success?: boolean; media?: LibraryItem; error?: string };
      if (d.success && d.media) onSelect(d.media.file_path);
      else setUploadError(d.error || "Upload failed");
    } catch { setUploadError("Upload failed — check your connection"); }
    setUploading(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0]; if (f) void uploadFile(f);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 12, width: 720, maxHeight: "82vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Choose Thumbnail Image</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => void importExisting()} disabled={importing}
              style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
              <RefreshCw size={11} /> {importing ? "Syncing…" : "Sync files"}
            </button>
            <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}><X size={16} /></button>
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 14px", background: "#f8fafc" }}>
          {(["library", "upload"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "9px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: tab === t ? "#2070B8" : "#94a3b8", borderBottom: tab === t ? "2px solid #2070B8" : "2px solid transparent", marginBottom: -1 }}>
              {t === "library" ? `📚 Library (${media.length})` : "⬆ Upload New"}
            </button>
          ))}
        </div>

        {tab === "library" && (
          <div style={{ overflowY: "auto", padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8 }}>
            {media.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                <p style={{ fontSize: 13, margin: "0 0 10px" }}>No images yet</p>
                <button onClick={() => setTab("upload")} style={{ padding: "6px 14px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Upload Image</button>
              </div>
            )}
            {media.map(m => (
              <button key={m.id} onClick={() => onSelect(m.file_path)}
                style={{ border: "2px solid #e2e8f0", borderRadius: 8, overflow: "hidden", cursor: "pointer", background: "none", padding: 0, width: "100%", textAlign: "left" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#2070B8")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.file_path} alt={m.alt_text || m.original_name} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                <div style={{ padding: "4px 6px", fontSize: 10, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.original_name}</div>
              </button>
            ))}
          </div>
        )}

        {tab === "upload" && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? "#2070B8" : "#c9d5e8"}`, borderRadius: 10, padding: "48px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "#eff6ff" : "#f8fafc" }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>{uploading ? "⏳" : "🖼"}</div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 6 }}>{uploading ? "Uploading…" : "Drag & drop an image here"}</p>
              <p style={{ fontSize: 12, color: "#94a3b8" }}>JPG, PNG, WebP · Max 10 MB</p>
            </div>
            {uploadError && <p style={{ color: "#ef4444", fontSize: 13 }}>{uploadError}</p>}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) void uploadFile(f); e.target.value = ""; }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Item Edit Modal ────────────────────────────────────────────────────────── */
interface EditModalProps {
  item: MediaItem;
  langs: LangMeta[];
  itemTranslations: Record<string, string>; // lang → translated title
  onSave: (item: MediaItem, translations: Record<string, string>) => void;
  onClose: () => void;
}

function ItemEditModal({ item: initial, langs, itemTranslations: initTr, onSave, onClose }: EditModalProps) {
  const [item, setItem] = useState<MediaItem>({ ...initial });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [trTitles, setTrTitles] = useState<Record<string, string>>(initTr);
  const [activeLang, setActiveLang] = useState(langs[0]?.code ?? "");
  const [translating, setTranslating] = useState(false);

  const autoTranslateAll = async () => {
    if (!item.title.trim()) return;
    setTranslating(true);
    const updated = { ...trTitles };
    for (const l of langs) {
      try {
        const r = await fetch("/api/admin/translate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: item.title, target: l.code }),
        });
        const d = await r.json() as { translated?: string };
        if (d.translated) updated[l.code] = d.translated;
      } catch { /* skip */ }
    }
    setTrTitles(updated);
    setTranslating(false);
  };

  const [modalTab, setModalTab] = useState<"details" | "translations">("details");

  const set = <K extends keyof MediaItem>(k: K, v: MediaItem[K]) =>
    setItem(p => ({ ...p, [k]: v }));

  const autoThumb = getAutoThumb(item.url);
  const thumbSrc = item.thumbnail || autoThumb;
  const type = detectType(item.url);
  const filledLangs = langs.filter(l => trTitles[l.code]);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "90vh", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }}
        >
          {/* Header */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
              {initial.url ? "Edit Media Item" : "Add Media Item"}
            </span>
            <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", flexShrink: 0 }}>
            <button onClick={() => setModalTab("details")}
              style={{ flex: 1, padding: "10px 0", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: modalTab === "details" ? "#2070B8" : "#94a3b8", borderBottom: modalTab === "details" ? "2px solid #2070B8" : "2px solid transparent" }}>
              Details
            </button>
            {langs.length > 0 && (
              <button onClick={() => setModalTab("translations")}
                style={{ flex: 1, padding: "10px 0", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: modalTab === "translations" ? "#2070B8" : "#94a3b8", borderBottom: modalTab === "translations" ? "2px solid #2070B8" : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                🌐 Translations
                {filledLangs.length > 0 && (
                  <span style={{ background: "#16a34a", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{filledLangs.length}</span>
                )}
              </button>
            )}
          </div>

          {/* Body — Details tab */}
          {modalTab === "details" && (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
              <div>
                <label style={labelStyle}>Video / Media URL *</label>
                <div style={{ position: "relative" }}>
                  <LinkIcon size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input value={item.url} onChange={e => set("url", e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://www.instagram.com/reel/..."
                    style={{ ...inputStyle, paddingLeft: 30 }} />
                </div>
                {item.url && (
                  <span style={{ fontSize: 11, color: TYPE_COLOR[type], fontWeight: 600, marginTop: 4, display: "block" }}>
                    Detected: {TYPE_LABEL[type]}{type === "instagram" && " — will always open in new tab"}
                  </span>
                )}
              </div>

              <div>
                <label style={labelStyle}>Title</label>
                <input value={item.title} onChange={e => set("title", e.target.value)}
                  placeholder="e.g. Sunday Service – April 2025" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>
                  Thumbnail
                  {autoThumb && !item.thumbnail && <span style={{ fontWeight: 400, color: "#94a3b8", marginLeft: 6 }}>(auto-detected from YouTube)</span>}
                </label>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flexShrink: 0, width: 110, height: 65, borderRadius: 7, overflow: "hidden", border: "1.5px solid #e2e8f0", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {thumbSrc
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={thumbSrc} alt="thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      : <ImageIcon size={22} style={{ color: "#cbd5e1" }} />}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                    <button type="button" onClick={() => setPickerOpen(true)}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", border: "1.5px solid #bae6fd", background: "#f0f9ff", borderRadius: 7, cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#0369a1" }}>
                      <ImageIcon size={13} /> Choose from Library
                    </button>
                    <input value={item.thumbnail ?? ""} onChange={e => set("thumbnail", e.target.value)}
                      placeholder={autoThumb || "Or paste image URL…"}
                      style={{ ...inputStyle, fontSize: 11.5, padding: "6px 10px" }} />
                    {item.thumbnail && (
                      <button type="button" onClick={() => set("thumbnail", "")}
                        style={{ fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
                        × Remove custom thumbnail (use auto)
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Play Mode</label>
                <div style={{ display: "flex", gap: 10 }}>
                  {(["inline", "external"] as const).map(m => (
                    <label key={m} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 13, color: "#374151", padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${item.play_mode === m ? "#2070B8" : "#e2e8f0"}`, background: item.play_mode === m ? "#eff6ff" : "#fff" }}>
                      <input type="radio" name="play_mode" value={m} checked={item.play_mode === m} onChange={() => set("play_mode", m)} style={{ accentColor: "#2070B8" }} />
                      {m === "inline" ? "▶ Inline (lightbox)" : "↗ New Tab (external)"}
                    </label>
                  ))}
                </div>
                {type === "instagram" && item.play_mode === "inline" && (
                  <p style={{ fontSize: 11, color: "#f59e0b", marginTop: 6 }}>Instagram will still open in a new tab regardless of this setting.</p>
                )}
              </div>
            </div>
          )}

          {/* Body — Translations tab */}
          {modalTab === "translations" && langs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              {/* Translate All button */}
              <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>EN: <strong>{item.title || "—"}</strong></span>
                <button onClick={() => void autoTranslateAll()} disabled={translating || !item.title.trim()}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", background: translating ? "#f8fafc" : "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, cursor: (translating || !item.title.trim()) ? "not-allowed" : "pointer", fontSize: 12.5, color: "#2070B8", fontWeight: 700 }}>
                  {translating ? "⟳ Translating…" : "⚡ Translate All Languages"}
                </button>
              </div>

              {/* Lang tabs row */}
              <div style={{ display: "flex", gap: 4, padding: "10px 16px 0", flexWrap: "wrap", flexShrink: 0 }}>
                {langs.map(l => (
                  <button key={l.code} onClick={() => setActiveLang(l.code)}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", border: `1.5px solid ${activeLang === l.code ? "#2070B8" : "#e2e8f0"}`, borderRadius: 6, background: activeLang === l.code ? "#eff6ff" : "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: activeLang === l.code ? "#2070B8" : "#64748b" }}>
                    {l.flag} {l.label}
                    {trTitles[l.code] && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />}
                  </button>
                ))}
              </div>

              {/* Active lang input */}
              {activeLang && (
                <div style={{ padding: "16px 20px", flex: 1 }}>
                  <label style={{ ...labelStyle, marginBottom: 8 }}>
                    {langs.find(l => l.code === activeLang)?.flag} {langs.find(l => l.code === activeLang)?.label} Title
                  </label>
                  <input
                    value={trTitles[activeLang] ?? ""}
                    onChange={e => setTrTitles(p => ({ ...p, [activeLang]: e.target.value }))}
                    placeholder={item.title ? `${item.title} (${activeLang})` : `Enter title in ${activeLang}`}
                    style={inputStyle}
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 8, background: "#f8fafc", flexShrink: 0 }}>
            <button onClick={onClose} style={{ padding: "8px 18px", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 7, cursor: "pointer", fontSize: 13, color: "#64748b" }}>Cancel</button>
            <button
              onClick={() => { if (!item.url.trim()) return; onSave({ ...item, thumbnail: item.thumbnail || "" }, trTitles); }}
              disabled={!item.url.trim()}
              style={{ padding: "8px 20px", background: item.url.trim() ? "#2070B8" : "#94a3b8", color: "#fff", border: "none", borderRadius: 7, cursor: item.url.trim() ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700 }}>
              Save Item
            </button>
          </div>
        </div>
      </div>

      {/* Image picker opens on top of edit modal */}
      {pickerOpen && (
        <ImagePickerModal
          onSelect={path => { set("thumbnail", path); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

/* ── Translation Panel ──────────────────────────────────────────────────────── */
function TranslationPanel({
  heading, eyebrow, ctaLabel, items,
  translations, onChange,
  langs,
}: {
  heading: string; eyebrow: string; ctaLabel: string; items: MediaItem[];
  translations: Record<string, TranslationEntry>;
  onChange: (t: Record<string, TranslationEntry>) => void;
  langs: LangMeta[];
}) {
  const [activeLang, setActiveLang] = useState(langs[0]?.code ?? "hi");
  const [translating, setTranslating] = useState(false);

  if (langs.length === 0) return null;
  const draft = translations[activeLang] ?? {};

  const setField = (field: "heading" | "eyebrow" | "cta_label", val: string) =>
    onChange({ ...translations, [activeLang]: { ...draft, [field]: val } });

  const setItemTitle = (id: string, val: string) =>
    onChange({ ...translations, [activeLang]: { ...draft, items: { ...(draft.items ?? {}), [id]: val } } });

  const autoTranslate = async () => {
    setTranslating(true);
    const updated: TranslationEntry = { ...draft };

    // Section fields
    const sectionFields: Array<{ key: "heading" | "eyebrow" | "cta_label"; src: string }> = [
      { key: "heading", src: heading },
      { key: "eyebrow", src: eyebrow },
      { key: "cta_label", src: ctaLabel },
    ];
    for (const f of sectionFields) {
      if (!f.src) continue;
      try {
        const r = await fetch("/api/admin/translate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: f.src, target: activeLang }),
        });
        const d = await r.json() as { translated?: string };
        if (d.translated) updated[f.key] = d.translated;
      } catch { /* skip */ }
    }

    // Item titles
    const itemResults: Record<string, string> = { ...(updated.items ?? {}) };
    for (const item of items) {
      if (!item.title) continue;
      try {
        const r = await fetch("/api/admin/translate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: item.title, target: activeLang }),
        });
        const d = await r.json() as { translated?: string };
        if (d.translated) itemResults[item.id] = d.translated;
      } catch { /* skip */ }
    }
    updated.items = itemResults;

    onChange({ ...translations, [activeLang]: updated });
    setTranslating(false);
  };

  const isFilled = (code: string) => {
    const t = translations[code] ?? {};
    return !!(t.heading || t.eyebrow || t.cta_label || (t.items && Object.keys(t.items).length > 0));
  };

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginTop: 20 }}>
      <div style={{ background: "#f8fafc", padding: "12px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>🌐 Translations</span>
        <button onClick={() => void autoTranslate()} disabled={translating}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", background: translating ? "#f8fafc" : "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, cursor: translating ? "wait" : "pointer", fontSize: 12, color: "#2070B8", fontWeight: 700 }}>
          {translating ? "⟳ Translating…" : "⚡ Translate All"}
        </button>
      </div>

      {/* Language tabs */}
      <div style={{ display: "flex", gap: 4, padding: "10px 14px 0", flexWrap: "wrap" }}>
        {langs.map(l => (
          <button key={l.code} onClick={() => setActiveLang(l.code)}
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", border: `1.5px solid ${activeLang === l.code ? "#2070B8" : "#e2e8f0"}`, borderRadius: 6, background: activeLang === l.code ? "#eff6ff" : "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: activeLang === l.code ? "#2070B8" : "#64748b", marginBottom: 4 }}>
            {l.flag} {l.label}
            {isFilled(l.code) && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block", marginLeft: 2 }} />}
          </button>
        ))}
      </div>

      {/* Section fields */}
      <div style={{ padding: "14px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Section Labels</p>
        {[
          { key: "heading" as const, label: "Heading", src: heading },
          { key: "eyebrow" as const, label: "Eyebrow", src: eyebrow },
          { key: "cta_label" as const, label: "View All Button", src: ctaLabel },
        ].map(f => (
          <div key={f.key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>{f.label}</label>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>EN: {f.src}</span>
            </div>
            <input value={draft[f.key] ?? ""} onChange={e => setField(f.key, e.target.value)}
              placeholder={`${f.src} (${activeLang})`} style={inputStyle} />
          </div>
        ))}
      </div>

      {/* Item title translations */}
      {items.length > 0 && (
        <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
            Video Titles ({items.length})
          </p>
          {items.map((item, idx) => (
            <div key={item.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>#{idx + 1} Title</label>
                <span style={{ fontSize: 11, color: "#94a3b8", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>EN: {item.title || "—"}</span>
              </div>
              <input
                value={draft.items?.[item.id] ?? ""}
                onChange={e => setItemTitle(item.id, e.target.value)}
                placeholder={item.title ? `${item.title} (${activeLang})` : `Title ${idx + 1} (${activeLang})`}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
      )}
      {items.length === 0 && <div style={{ padding: "0 16px 14px", fontSize: 12, color: "#94a3b8" }}>Add videos above to translate their titles.</div>}
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────────── */
export default function MediaSectionAdminPage() {
  const [data, setData] = useState<MediaSectionData>({ show: true, heading: "Watch & Listen to Dr. Wesley", eyebrow: "Media", items: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [langs, setLangs] = useState<LangMeta[]>([]);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/languages")
      .then(r => r.json())
      .then((d: { languages?: LangMeta[] }) => { if (Array.isArray(d.languages)) setLangs(d.languages); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/admin/site-content?key=home_media_section")
      .then(r => r.json())
      .then((d: { data?: { content_json: string } | null }) => {
        if (d.data?.content_json) {
          try {
            const parsed = JSON.parse(d.data.content_json) as MediaSectionData;
            setData({
              show: parsed.show !== false,
              heading: parsed.heading || "Watch & Listen to Dr. Wesley",
              eyebrow: parsed.eyebrow || "Media",
              items: (parsed.items || []).map(item => ({ ...item, id: item.id || genId() })),
              translations: parsed.translations ?? {},
            });
          } catch { /* ignore */ }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const save = async (payload = data) => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_key: "home_media_section", content_json: JSON.stringify(payload) }),
      });
      const d = await res.json() as { success?: boolean; error?: string };
      if (!d.success) setError(d.error || "Save failed");
      else {
        setSaved(true); setDirty(false);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaved(false), 3000);
      }
    } catch { setError("Network error"); }
    setSaving(false);
  };

  const update = (patch: Partial<MediaSectionData>) => {
    setData(p => ({ ...p, ...patch }));
    setSaved(false); setDirty(true);
  };

  const saveItem = (item: MediaItem, itemTr: Record<string, string>) => {
    const next = isNew
      ? [...data.items, item]
      : data.items.map(i => i.id === item.id ? item : i);
    // Merge per-item translations into data.translations[lang].items[item.id]
    const mergedTr = { ...(data.translations ?? {}) };
    for (const [lang, title] of Object.entries(itemTr)) {
      if (!title) continue;
      mergedTr[lang] = { ...(mergedTr[lang] ?? {}), items: { ...(mergedTr[lang]?.items ?? {}), [item.id]: title } };
    }
    setData(p => ({ ...p, items: next, translations: mergedTr }));
    setEditItem(null);
    setSaved(false); setDirty(true);
  };

  const removeItem = (id: string) => {
    setData(p => ({ ...p, items: p.items.filter(i => i.id !== id) }));
    setSaved(false); setDirty(true);
  };

  const openAdd = () => {
    setEditItem({ id: genId(), url: "", title: "", thumbnail: "", play_mode: "inline" });
    setIsNew(true);
  };

  const openEdit = (item: MediaItem) => {
    setEditItem({ ...item });
    setIsNew(false);
  };

  // Drag reorder
  const onDragStart = (idx: number) => setDragIdx(idx);
  const onDragEnter = (idx: number) => setDragOverIdx(idx);
  const onDragEnd = () => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      const next = [...data.items];
      const [item] = next.splice(dragIdx, 1);
      next.splice(dragOverIdx, 0, item);
      setData(p => ({ ...p, items: next }));
      setSaved(false); setDirty(true);
    }
    setDragIdx(null); setDragOverIdx(null);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>Loading media section…</div>;
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Media Section Manager</h1>
          <p style={{ fontSize: 13, color: "#64748b" }}>Manage YouTube &amp; Instagram videos shown in the "Watch &amp; Listen to Dr. Wesley" section on the homepage.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Saved</span>}
          {error && <span style={{ fontSize: 12, color: "#dc2626" }}>{error}</span>}
          <button
            onClick={openAdd}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#0369a1" }}>
            <Plus size={14} /> Add Video
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: saving ? "#94a3b8" : "#2070B8", color: "#fff", border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
            <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Unsaved changes banner */}
      {dirty && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>⚠ You have unsaved changes.</span>
          <button onClick={() => void save()} disabled={saving}
            style={{ padding: "5px 14px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            {saving ? "Saving…" : "Save Now"}
          </button>
        </div>
      )}

      {/* Section Settings Card */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "18px 20px", marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <PlayCircle size={15} style={{ color: "#2070B8" }} /> Section Settings
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={labelStyle}>Section Heading</label>
            <input
              value={data.heading || ""}
              onChange={e => update({ heading: e.target.value })}
              placeholder="Watch & Listen to Dr. Wesley"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Eyebrow Label</label>
            <input
              value={data.eyebrow || ""}
              onChange={e => update({ eyebrow: e.target.value })}
              placeholder="Media"
              style={inputStyle}
            />
          </div>
          <button
            onClick={() => update({ show: !data.show })}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px",
              border: `1.5px solid ${data.show ? "#86efac" : "#fca5a5"}`,
              background: data.show ? "#f0fdf4" : "#fef2f2",
              borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 700,
              color: data.show ? "#16a34a" : "#dc2626",
            }}
          >
            {data.show ? <Eye size={14} /> : <EyeOff size={14} />}
            {data.show ? "Visible" : "Hidden"}
          </button>
        </div>
        <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 10 }}>
          {data.items.length} item{data.items.length !== 1 ? "s" : ""} · Drag cards to reorder · Click "Save Changes" to publish
        </p>

        {/* Translations */}
        <TranslationPanel
          heading={data.heading || "Watch & Listen to Dr. Wesley"}
          eyebrow={data.eyebrow || "Media"}
          ctaLabel="View All Media"
          items={data.items}
          translations={data.translations ?? {}}
          onChange={t => update({ translations: t })}
          langs={langs}
        />
      </div>

      {/* Hidden warning */}
      {!data.show && (
        <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#92400e", display: "flex", alignItems: "center", gap: 8 }}>
          <EyeOff size={14} /> This section is hidden from the public site.
        </div>
      )}

      {/* Empty state */}
      {data.items.length === 0 && (
        <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 12, padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>No videos yet</h3>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Add YouTube or Instagram Reels to display in the Watch &amp; Listen section.</p>
          <button
            onClick={openAdd}
            style={{ padding: "10px 24px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> Add First Video
          </button>
        </div>
      )}

      {/* Items grid */}
      {data.items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {data.items.map((item, idx) => {
            const type = detectType(item.url);
            const thumb = item.thumbnail || getAutoThumb(item.url);
            const isDragging = dragIdx === idx;
            const isOver = dragOverIdx === idx && dragIdx !== idx;

            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragEnter={() => onDragEnter(idx)}
                onDragEnd={onDragEnd}
                onDragOver={e => e.preventDefault()}
                style={{
                  background: "#fff",
                  border: `2px solid ${isOver ? "#2070B8" : "#e2e8f0"}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  opacity: isDragging ? 0.45 : 1,
                  transition: "border-color 0.15s, opacity 0.15s",
                  cursor: "grab",
                }}
              >
                {/* Thumbnail */}
                <div style={{ position: "relative", height: 140, background: "#1a2a3a", overflow: "hidden" }}>
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0f2740,#2070B8)" }}>
                      <ImageIcon size={32} style={{ color: "rgba(255,255,255,0.2)" }} />
                    </div>
                  )}
                  <span style={{ position: "absolute", top: 8, left: 8, padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: TYPE_COLOR[type] || "#64748b", color: "#fff" }}>
                    {TYPE_LABEL[type]}
                  </span>
                  <span style={{ position: "absolute", top: 8, right: 8, padding: "2px 6px", borderRadius: 20, fontSize: 9.5, fontWeight: 600, background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.9)" }}>
                    {item.play_mode === "external" ? "↗ New tab" : "▶ Inline"}
                  </span>
                  <div style={{ position: "absolute", bottom: 6, left: 6, background: "rgba(0,0,0,0.4)", borderRadius: 5, padding: "3px 5px" }}>
                    <GripVertical size={12} color="#fff" />
                  </div>
                  <div style={{ position: "absolute", bottom: 6, right: 36, background: "rgba(0,0,0,0.4)", borderRadius: 5, padding: "2px 6px", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                    #{idx + 1}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{ position: "absolute", bottom: 4, right: 4, width: 26, height: 26, borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={11} />
                  </button>
                </div>

                {/* Info + edit */}
                <div style={{ padding: "10px 12px" }}>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color: "#0f172a", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.title || <span style={{ color: "#94a3b8" }}>No title</span>}
                  </p>
                  <p style={{ fontSize: 10.5, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 8 }}>
                    {item.url}
                  </p>
                  <button
                    onClick={() => openEdit(item)}
                    style={{ width: "100%", padding: "6px 0", border: "1px solid #e2e8f0", background: "#f8fafc", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    Edit
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add more card */}
          <button
            onClick={openAdd}
            style={{ border: "2px dashed #c9d5e8", borderRadius: 10, background: "#f8fafc", cursor: "pointer", minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#94a3b8", padding: 16 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#2070B8"; e.currentTarget.style.color = "#2070B8"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#c9d5e8"; e.currentTarget.style.color = "#94a3b8"; }}>
            <Plus size={24} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Add Video</span>
          </button>
        </div>
      )}

      {/* Bottom save bar */}
      {data.items.length > 0 && (
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ Changes saved</span>}
          {error && <span style={{ fontSize: 13, color: "#dc2626" }}>{error}</span>}
          <button
            onClick={() => void save()}
            disabled={saving}
            style={{ padding: "10px 28px", background: saving ? "#94a3b8" : "#2070B8", color: "#fff", border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      {/* Edit / Add Modal */}
      {editItem && (
        <ItemEditModal
          item={editItem}
          langs={langs}
          itemTranslations={Object.fromEntries(
            Object.entries(data.translations ?? {}).map(([lang, t]) => [lang, t.items?.[editItem.id] ?? ""])
          )}
          onSave={saveItem}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}

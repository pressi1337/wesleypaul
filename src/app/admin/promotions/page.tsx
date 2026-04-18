"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Save, Check, AlertCircle, Layout, Megaphone,
  Image as ImageIcon, Film, FolderOpen, X, Globe, Languages, Loader,
} from "lucide-react";
import MediaPickerModal from "@/components/MediaPickerModal";
import RichTextEditor from "@/components/RichTextEditor";
import type { PopupLangContent } from "@/app/api/popup/route";

// ── Styles ─────────────────────────────────────────────────────────────────────
const inp = {
  width: "100%", padding: "8px 11px", border: "1px solid #e2e8f0",
  borderRadius: 7, fontSize: 13, fontFamily: "inherit", outline: "none",
  background: "#fff", boxSizing: "border-box" as const,
};
const lbl = { display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 } as const;
const card = {
  background: "#fff", borderRadius: 12, border: "1px solid #e8ecf0",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 20, overflow: "hidden" as const,
};
const cardHead = {
  display: "flex", alignItems: "center", gap: 10,
  padding: "14px 20px", borderBottom: "1px solid #f1f5f9",
  background: "#f8fafc",
};

interface ActiveLang { code: string; label: string; nativeLabel: string; flag: string; }

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      position: "relative", width: 40, height: 22, borderRadius: 11,
      background: checked ? "#16a34a" : "#cbd5e1", border: "none",
      cursor: "pointer", flexShrink: 0, transition: "background 0.2s",
    }}>
      <span style={{
        position: "absolute", top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

/** URL input + Gallery button + preview.
 *  `fallback` = English default URL shown when value is empty (read-only preview). */
function MediaField({
  label, value, onChange, accept, placeholder, fallback,
}: {
  label: string; value: string; onChange: (v: string) => void;
  accept: "image" | "video"; placeholder?: string; fallback?: string;
}) {
  const [picker, setPicker] = useState(false);
  const hasOverride  = value.trim().length > 0;
  const previewUrl   = hasOverride ? value : (fallback || "");
  const showPreview  = previewUrl.length > 0;
  const isImg        = accept === "image";
  const isFallback   = !hasOverride && showPreview;

  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display: "flex", gap: 6, marginBottom: showPreview ? 10 : 0 }}>
        <input style={{ ...inp, flex: 1 }} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder || "https://… or pick from gallery"} />
        <button type="button" onClick={() => setPicker(true)} style={{
          display: "flex", alignItems: "center", gap: 5, padding: "8px 12px",
          borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc",
          color: "#475569", cursor: "pointer", fontSize: 12, fontWeight: 600,
          whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#2070B8"; e.currentTarget.style.color = "#2070B8"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
        >
          <FolderOpen size={13} /> Gallery
        </button>
        {hasOverride && (
          <button type="button" onClick={() => onChange("")} style={{
            padding: "8px 9px", borderRadius: 7, border: "1px solid #fca5a5",
            background: "#fff1f2", color: "#ef4444", cursor: "pointer", flexShrink: 0,
          }}><X size={13} /></button>
        )}
      </div>
      {showPreview && (
        <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${isFallback ? "#fde68a" : "#e8ecf0"}`, background: "#0a0a0a", position: "relative", maxHeight: isImg ? 220 : 160 }}>
          {isImg
            ? /* eslint-disable-next-line @next/next/no-img-element */
              <img src={previewUrl} alt="preview" style={{ width: "100%", maxHeight: 220, objectFit: "contain", display: "block" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            : <video src={previewUrl} controls style={{ width: "100%", maxHeight: 160, objectFit: "contain", display: "block" }} />
          }
          {/* Badge: override label or "English default" */}
          <div style={{ position: "absolute", top: 6, left: 6, background: isFallback ? "rgba(180,120,0,0.85)" : "rgba(0,0,0,0.6)", borderRadius: 5, padding: "2px 7px", fontSize: 10, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
            {isImg ? <ImageIcon size={10} /> : <Film size={10} />}
            {isFallback ? "🇺🇸 English default" : (isImg ? "IMAGE" : "VIDEO")}
          </div>
        </div>
      )}
      {picker && <MediaPickerModal accept={accept} onPick={url => onChange(url)} onClose={() => setPicker(false)} />}
    </div>
  );
}

type S = Record<string, string>;

export default function PromotionsPage() {
  const [s, setS]             = useState<S>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);
  const [langs, setLangs]     = useState<ActiveLang[]>([]);
  const [activeLang, setActiveLang] = useState("en");
  const [translating, setTranslating] = useState(false);
  // Per-language content overrides
  const [translations, setTranslations] = useState<Record<string, PopupLangContent>>({});

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  const load = useCallback(async () => {
    try {
      const [sr, lr] = await Promise.all([
        fetch("/api/admin/settings").then(r => r.json()) as Promise<{ settings?: S }>,
        fetch("/api/languages").then(r => r.json()) as Promise<{ languages?: ActiveLang[] }>,
      ]);

      const settings: S = sr.settings ?? {};
      if (settings.promo_popup) {
        const p = JSON.parse(settings.promo_popup) as Record<string, unknown>;
        settings.promo_popup_enabled      = p.enabled ? "1" : "0";
        settings.promo_popup_type         = String(p.type || "image");
        settings.promo_popup_media_url    = String(p.media_url || "");
        settings.promo_popup_poster_url   = String(p.poster_url || "");
        settings.promo_popup_title        = String(p.title || "");
        settings.promo_popup_description  = String(p.description || "");
        settings.promo_popup_cta_label    = String(p.cta_label || "Learn More");
        settings.promo_popup_cta_href     = String(p.cta_href || "/");
        settings.promo_popup_cta_external = p.cta_external ? "1" : "0";
        settings.promo_popup_show_once    = p.show_once === false ? "0" : "1";
        settings.promo_popup_delay        = String(p.show_delay ?? 1);
        settings.promo_popup_home_only    = p.home_only === false ? "0" : "1";
        settings.promo_popup_show_media   = p.show_media === false ? "0" : "1";
        if (p.translations && typeof p.translations === "object") {
          setTranslations(p.translations as Record<string, PopupLangContent>);
        }
      }
      setS(settings);
      setLangs(lr.languages || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const set    = (key: string, val: string) => setS(prev => ({ ...prev, [key]: val }));
  const toggle = (key: string) => set(key, s[key] === "1" ? "0" : "1");
  const isOn   = (key: string) => s[key] === "1";
  const isVideo = (s.promo_popup_type || "image") === "video";

  // Per-language helpers
  const getLang = (code: string): PopupLangContent => translations[code] || {};
  const setLangField = (code: string, field: keyof PopupLangContent, value: string | boolean) => {
    setTranslations(prev => ({
      ...prev,
      [code]: { ...prev[code], [field]: value },
    }));
  };

  // Auto-translate English content into the active language
  const autoTranslate = async () => {
    if (translating) return;
    setTranslating(true);
    try {
      const translate = async (text: string) => {
        if (!text) return "";
        const r = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${activeLang}`
        );
        const d = await r.json() as { responseData?: { translatedText?: string } };
        return d.responseData?.translatedText || text;
      };

      // Strip HTML tags for description before translating, then wrap back
      const rawDesc = (s.promo_popup_description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

      const [t, de, cta] = await Promise.all([
        translate(s.promo_popup_title   || ""),
        translate(rawDesc),
        translate(s.promo_popup_cta_label || ""),
      ]);

      setTranslations(prev => ({
        ...prev,
        [activeLang]: {
          ...prev[activeLang],
          title:       t   || prev[activeLang]?.title,
          description: de  ? `<p>${de}</p>` : prev[activeLang]?.description,
          cta_label:   cta || prev[activeLang]?.cta_label,
        },
      }));
      showToast(`Translated to ${currentLang?.nativeLabel}`);
    } catch {
      showToast("Translation failed", false);
    }
    setTranslating(false);
  };

  const save = async () => {
    setSaving(true);
    const popupConfig = {
      enabled:      s.promo_popup_enabled === "1",
      type:         s.promo_popup_type || "image",
      media_url:    s.promo_popup_media_url || "",
      poster_url:   s.promo_popup_poster_url || "",
      title:        s.promo_popup_title || "",
      description:  s.promo_popup_description || "",
      cta_label:    s.promo_popup_cta_label || "Learn More",
      cta_href:     s.promo_popup_cta_href || "/",
      cta_external: s.promo_popup_cta_external === "1",
      show_once:    s.promo_popup_show_once !== "0",
      show_delay:   parseInt(s.promo_popup_delay || "1", 10),
      home_only:    s.promo_popup_home_only !== "0",
      show_media:   s.promo_popup_show_media !== "0",
      translations,
    };
    const r = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { promo_popup: JSON.stringify(popupConfig) } }),
    });
    setSaving(false);
    showToast(r.ok ? "Promotion saved successfully" : "Save failed", r.ok);
  };

  if (loading) return <div style={{ color: "#94a3b8", padding: "3rem 0", textAlign: "center" }}>Loading…</div>;

  const allLangTabs = [
    { code: "en", label: "English", nativeLabel: "English", flag: "🇺🇸" },
    ...langs,
  ];
  const currentLang = allLangTabs.find(l => l.code === activeLang)!;
  const isEnTab = activeLang === "en";

  return (
    <div style={{ maxWidth: 780 }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
            <Megaphone size={20} style={{ color: "#7c3aed" }} /> Promotions
          </h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>Control the popup that appears to visitors on your public site.</p>
        </div>
        <button onClick={save} disabled={saving} style={{
          display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", borderRadius: 8,
          background: saving ? "#94a3b8" : "#2070B8", color: "#fff", border: "none",
          cursor: saving ? "default" : "pointer", fontSize: 13, fontWeight: 700,
        }}>
          <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Promo Popup Card */}
      <div style={card}>
        {/* Card header with enable toggle */}
        <div style={cardHead}>
          <Layout size={16} style={{ color: "#7c3aed" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Promo Popup / Welcome Modal</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: isOn("promo_popup_enabled") ? "#16a34a" : "#94a3b8", fontWeight: 600 }}>
              {isOn("promo_popup_enabled") ? "Enabled" : "Disabled"}
            </span>
            <Toggle checked={isOn("promo_popup_enabled")} onChange={() => toggle("promo_popup_enabled")} />
          </div>
        </div>

        {/* Language tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, borderBottom: "1px solid #f1f5f9", padding: "0 20px", overflowX: "auto" }}>
          <Globe size={13} style={{ color: "#94a3b8", marginRight: 8, flexShrink: 0 }} />
          {allLangTabs.map(l => (
            <button
              key={l.code}
              onClick={() => setActiveLang(l.code)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 14px", border: "none", background: "none",
                cursor: "pointer", fontSize: 13, fontWeight: activeLang === l.code ? 700 : 500,
                color: activeLang === l.code ? "#2070B8" : "#64748b",
                borderBottom: `2px solid ${activeLang === l.code ? "#2070B8" : "transparent"}`,
                marginBottom: -1, whiteSpace: "nowrap", flexShrink: 0,
                transition: "color 0.15s",
              }}
            >
              <span style={{ fontSize: 16 }}>{l.flag}</span>
              {l.nativeLabel}
              {!isEnTab && l.code !== "en" && translations[l.code]?.media_url && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Disabled warning — only on English tab */}
          {isEnTab && !isOn("promo_popup_enabled") && (
            <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#92400e" }}>
              Popup is currently <strong>disabled</strong>. Enable the toggle above, fill in the details, then save.
            </div>
          )}

          {/* Non-English language info + translate button */}
          {!isEnTab && (() => {
            const hasEnglish = !!(s.promo_popup_title || s.promo_popup_description || s.promo_popup_cta_label);
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#1e40af", display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>{currentLang?.flag}</span>
                  <span>
                    Override content for <strong>{currentLang?.nativeLabel}</strong>.
                    Leave a field blank to fall back to the English version.
                  </span>
                </div>
                {hasEnglish && (
                  <button
                    onClick={autoTranslate}
                    disabled={translating}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "9px 16px", borderRadius: 8, border: "none",
                      background: translating ? "#e2e8f0" : "linear-gradient(135deg,#2070B8,#7c3aed)",
                      color: translating ? "#94a3b8" : "#fff",
                      cursor: translating ? "default" : "pointer",
                      fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                      boxShadow: translating ? "none" : "0 2px 10px rgba(32,112,184,0.3)",
                    }}
                  >
                    {translating
                      ? <><Loader size={13} style={{ animation: "spin 0.8s linear infinite" }} /> Translating…</>
                      : <><Languages size={13} /> Auto-Translate from English</>
                    }
                  </button>
                )}
              </div>
            );
          })()}

          {/* ── ENGLISH TAB: global settings + default content ── */}
          {isEnTab && (
            <>
              {/* Type selector */}
              <div>
                <label style={lbl}>Popup Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { v: "image", l: "Image / Poster", icon: <ImageIcon size={13} /> },
                    { v: "video", l: "Video", icon: <Film size={13} /> },
                  ].map(t => (
                    <button key={t.v} onClick={() => set("promo_popup_type", t.v)} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", borderRadius: 7,
                      border: `2px solid ${s.promo_popup_type === t.v ? "#7c3aed" : "#e2e8f0"}`,
                      background: s.promo_popup_type === t.v ? "#f5f3ff" : "#fff",
                      color: s.promo_popup_type === t.v ? "#7c3aed" : "#64748b",
                      cursor: "pointer", fontWeight: 600, fontSize: 13,
                    }}>
                      {t.icon} {t.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media fields */}
              <div style={{ display: "grid", gridTemplateColumns: isVideo ? "1fr 1fr" : "1fr", gap: 16 }}>
                <MediaField
                  label={isVideo ? "Video File (.mp4)" : "Popup Image"}
                  value={s.promo_popup_media_url || ""}
                  onChange={v => set("promo_popup_media_url", v)}
                  accept={isVideo ? "video" : "image"}
                  placeholder="Paste URL or click Gallery"
                />
                {isVideo && (
                  <MediaField
                    label="Poster / Thumbnail Image"
                    value={s.promo_popup_poster_url || ""}
                    onChange={v => set("promo_popup_poster_url", v)}
                    accept="image"
                    placeholder="Optional cover image"
                  />
                )}
              </div>

              {/* Title */}
              <div>
                <label style={lbl}>Title</label>
                <input style={inp} value={s.promo_popup_title || ""} onChange={e => set("promo_popup_title", e.target.value)} placeholder="New Event Coming Soon" />
              </div>

              {/* Description rich text */}
              <div>
                <label style={lbl}>Description</label>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                  <RichTextEditor
                    value={s.promo_popup_description || ""}
                    onChange={v => set("promo_popup_description", v)}
                    minHeight={160}
                    placeholder="Add event details, date, venue, highlights…"
                  />
                </div>
              </div>

              {/* CTA */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: 14 }}>
                <div>
                  <label style={lbl}>CTA Button Label</label>
                  <input style={inp} value={s.promo_popup_cta_label || ""} onChange={e => set("promo_popup_cta_label", e.target.value)} placeholder="Learn More" />
                </div>
                <div>
                  <label style={lbl}>CTA URL</label>
                  <input style={inp} value={s.promo_popup_cta_href || ""} onChange={e => set("promo_popup_cta_href", e.target.value)} placeholder="/events or https://…" />
                </div>
                <div>
                  <label style={lbl}>Delay (sec)</label>
                  <input style={inp} type="number" min="0" max="30" value={s.promo_popup_delay || "1"} onChange={e => set("promo_popup_delay", e.target.value)} />
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { key: "promo_popup_show_media",   title: "Show media",     sub: "Display image / video in popup" },
                  { key: "promo_popup_home_only",    title: "Homepage only",  sub: "Show only on the home page ( / )" },
                  { key: "promo_popup_show_once",    title: "Show once",      sub: "Per visitor via localStorage" },
                  { key: "promo_popup_cta_external", title: "External link",  sub: "Open CTA in new tab" },
                ].map(t => (
                  <label key={t.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                    <Toggle checked={isOn(t.key)} onChange={() => toggle(t.key)} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{t.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* ── NON-ENGLISH TAB: per-language overrides ── */}
          {!isEnTab && (
            <>
              {/* Show media toggle for this language */}
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                <Toggle
                  checked={getLang(activeLang).show_media !== false && isOn("promo_popup_show_media")}
                  onChange={v => setLangField(activeLang, "show_media", v)}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>Show media for {currentLang.nativeLabel}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    {getLang(activeLang).show_media === false
                      ? "Content-only popup for this language"
                      : "Image / video shown (follows English setting if not overridden)"}
                  </div>
                </div>
              </label>

              {/* Media override — only if show_media is on */}
              {getLang(activeLang).show_media !== false && isOn("promo_popup_show_media") && (
              <div style={{ display: "grid", gridTemplateColumns: isVideo ? "1fr 1fr" : "1fr", gap: 16 }}>
                <MediaField
                  label={isVideo ? `Video — ${currentLang.nativeLabel}` : `Image — ${currentLang.nativeLabel}`}
                  value={getLang(activeLang).media_url || ""}
                  onChange={v => setLangField(activeLang, "media_url", v)}
                  accept={isVideo ? "video" : "image"}
                  placeholder="Leave blank to use English default"
                  fallback={s.promo_popup_media_url || ""}
                />
                {isVideo && (
                  <MediaField
                    label={`Poster — ${currentLang.nativeLabel}`}
                    value={getLang(activeLang).poster_url || ""}
                    onChange={v => setLangField(activeLang, "poster_url", v)}
                    accept="image"
                    placeholder="Leave blank to use English default"
                    fallback={s.promo_popup_poster_url || ""}
                  />
                )}
              </div>
              )}

              {/* Title override */}
              <div>
                <label style={lbl}>Title — {currentLang.nativeLabel}</label>
                <input
                  style={inp}
                  value={getLang(activeLang).title || ""}
                  onChange={e => setLangField(activeLang, "title", e.target.value)}
                  placeholder={`Leave blank to use: "${s.promo_popup_title || ""}"`}
                />
              </div>

              {/* Description override */}
              <div>
                <label style={lbl}>Description — {currentLang.nativeLabel}</label>
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                  <RichTextEditor
                    value={getLang(activeLang).description || ""}
                    onChange={v => setLangField(activeLang, "description", v)}
                    minHeight={160}
                    placeholder="Leave blank to use English description"
                  />
                </div>
              </div>

              {/* CTA label override */}
              <div style={{ maxWidth: 320 }}>
                <label style={lbl}>CTA Button Label — {currentLang.nativeLabel}</label>
                <input
                  style={inp}
                  value={getLang(activeLang).cta_label || ""}
                  onChange={e => setLangField(activeLang, "cta_label", e.target.value)}
                  placeholder={`Leave blank to use: "${s.promo_popup_cta_label || "Learn More"}"`}
                />
              </div>
            </>
          )}

          {/* Info note */}
          <div style={{ background: "#f5f3ff", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#7c3aed", border: "1px solid #ede9fe", display: "flex", alignItems: "flex-start", gap: 8 }}>
            <Layout size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>How it works:</strong> Popup shows after the chosen delay. Needs at least a <strong>Title</strong> or a <strong>media file</strong>.
              Each language can have its own image/video and text — visitors see the version matching their selected language.
              To test again, clear <code>promo_popup_seen</code> from browser localStorage.
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: toast.ok ? "#16a34a" : "#dc2626",
          color: "#fff", padding: "11px 18px", borderRadius: 10,
          fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)", animation: "slideUp 0.25s ease",
        }}>
          {toast.ok ? <Check size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

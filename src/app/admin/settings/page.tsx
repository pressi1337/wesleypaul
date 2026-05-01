"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Save, Check, Plus, Trash2, Globe, BarChart2, Layout,
  Languages, Zap, CheckCircle, AlertCircle, ImageIcon, KeyRound, Eye, EyeOff,
} from "lucide-react";

// ── Styles ────────────────────────────────────────────────────────────────────
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

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        position: "relative", width: 40, height: 22, borderRadius: 11,
        background: checked ? "#16a34a" : "#cbd5e1", border: "none",
        cursor: "pointer", flexShrink: 0, transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

// ── Known languages catalogue ─────────────────────────────────────────────────
const KNOWN_LANGS = [
  { code: "hi", label: "Hindi",      nativeLabel: "हिन्दी",   flag: "🇮🇳" },
  { code: "ta", label: "Tamil",      nativeLabel: "தமிழ்",    flag: "🇮🇳" },
  { code: "te", label: "Telugu",     nativeLabel: "తెలుగు",   flag: "🇮🇳" },
  { code: "ml", label: "Malayalam",  nativeLabel: "മലയാളം",  flag: "🇮🇳" },
  { code: "kn", label: "Kannada",    nativeLabel: "ಕನ್ನಡ",   flag: "🇮🇳" },
  { code: "mr", label: "Marathi",    nativeLabel: "मराठी",    flag: "🇮🇳" },
  { code: "bn", label: "Bengali",    nativeLabel: "বাংলা",    flag: "🇧🇩" },
  { code: "gu", label: "Gujarati",   nativeLabel: "ગુજરાતી", flag: "🇮🇳" },
  { code: "pa", label: "Punjabi",    nativeLabel: "ਪੰਜਾਬੀ",  flag: "🇮🇳" },
  { code: "ur", label: "Urdu",       nativeLabel: "اردو",     flag: "🇵🇰" },
  { code: "es", label: "Spanish",    nativeLabel: "Español",  flag: "🇪🇸" },
  { code: "fr", label: "French",     nativeLabel: "Français", flag: "🇫🇷" },
  { code: "de", label: "German",     nativeLabel: "Deutsch",  flag: "🇩🇪" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português",flag: "🇧🇷" },
  { code: "it", label: "Italian",    nativeLabel: "Italiano", flag: "🇮🇹" },
  { code: "ru", label: "Russian",    nativeLabel: "Русский",  flag: "🇷🇺" },
  { code: "ar", label: "Arabic",     nativeLabel: "العربية",  flag: "🇸🇦" },
  { code: "zh", label: "Chinese",    nativeLabel: "中文",      flag: "🇨🇳" },
  { code: "ja", label: "Japanese",   nativeLabel: "日本語",   flag: "🇯🇵" },
  { code: "ko", label: "Korean",     nativeLabel: "한국어",   flag: "🇰🇷" },
  { code: "sw", label: "Swahili",    nativeLabel: "Kiswahili",flag: "🇰🇪" },
  { code: "yo", label: "Yoruba",     nativeLabel: "Yorùbá",  flag: "🇳🇬" },
  { code: "ha", label: "Hausa",      nativeLabel: "Hausa",    flag: "🇳🇬" },
  { code: "am", label: "Amharic",    nativeLabel: "አማርኛ",    flag: "🇪🇹" },
];

interface ActiveLang { code: string; label: string; nativeLabel: string; flag: string; enabled: boolean }

type S = Record<string, string>;

// ── Logo upload card ──────────────────────────────────────────────────────────
function LogoCard({ logoUrl, onLogoChange }: { logoUrl: string; onLogoChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) { setErr("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setErr("File too large — max 5 MB."); return; }
    setUploading(true); setErr("");
    const fd = new FormData(); fd.append("file", file);
    try {
      const r = await fetch("/api/admin/media", { method: "POST", body: fd });
      const d = await r.json() as { success?: boolean; media?: { file_path: string }; error?: string };
      if (d.success && d.media) onLogoChange(d.media.file_path);
      else setErr(d.error || "Upload failed");
    } catch { setErr("Upload failed"); }
    setUploading(false);
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8ecf0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 20, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
        <ImageIcon size={16} style={{ color: "#2070B8" }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Logo</span>
        <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>Shown in the top navigation and footer on every page</span>
      </div>
      <div style={{ padding: "18px 20px", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Preview */}
        <div style={{ width: 180, height: 72, borderRadius: 8, border: "1px solid #e2e8f0", background: "#0d1523", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl || "/logo-nav.png"} alt="Logo preview"
            style={{ maxWidth: 160, maxHeight: 60, objectFit: "contain", display: "block" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo-nav.png"; }} />
        </div>
        {/* Controls */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Logo URL</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              style={{ flex: 1, padding: "8px 11px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box" as const }}
              value={logoUrl}
              onChange={e => onLogoChange(e.target.value)}
              placeholder="/logo-nav.png"
            />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ padding: "8px 14px", background: uploading ? "#94a3b8" : "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 7, cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: "#2070B8", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5 }}>
              {uploading ? "Uploading…" : "📂 Upload New"}
            </button>
          </div>
          {err && <p style={{ fontSize: 12, color: "#dc2626", margin: "0 0 8px" }}>{err}</p>}
          <p style={{ fontSize: 11.5, color: "#94a3b8", margin: 0 }}>
            Recommended: PNG or SVG · Transparent background · ~200×60 px · Dark-background safe
          </p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
        </div>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  const [s, setS] = useState<S>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeLangs, setActiveLangs] = useState<ActiveLang[]>([]);
  const [showAddLang, setShowAddLang] = useState(false);
  const [customLang, setCustomLang] = useState({ code: "", label: "", nativeLabel: "", flag: "" });
  const [modalLangCodes, setModalLangCodes] = useState<string[]>([]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  };

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/settings");
    const d = await r.json() as { settings?: S };
    const settings: S = d.settings ?? {};

    setS(settings);

    // Parse active languages
    try {
      const stored: ActiveLang[] = JSON.parse(settings.active_languages || "[]");
      setActiveLangs(stored.length ? stored : [
        { code: "hi", label: "Hindi",   nativeLabel: "हिन्दी", flag: "🇮🇳", enabled: true },
        { code: "ta", label: "Tamil",   nativeLabel: "தமிழ்",  flag: "🇮🇳", enabled: true },
        { code: "es", label: "Spanish", nativeLabel: "Español",flag: "🇪🇸", enabled: true },
      ]);
    } catch {
      setActiveLangs([
        { code: "hi", label: "Hindi",   nativeLabel: "हिन्दी", flag: "🇮🇳", enabled: true },
        { code: "ta", label: "Tamil",   nativeLabel: "தமிழ்",  flag: "🇮🇳", enabled: true },
        { code: "es", label: "Spanish", nativeLabel: "Español",flag: "🇪🇸", enabled: true },
      ]);
    }

    // Parse modal language codes (defaults to all active if not set)
    try {
      const stored: string[] = JSON.parse(settings.lang_modal_languages || "[]");
      setModalLangCodes(stored);
    } catch {
      setModalLangCodes([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const set = (key: string, val: string) => setS(prev => ({ ...prev, [key]: val }));
  const toggle = (key: string) => set(key, s[key] === "1" ? "0" : "1");
  const isOn = (key: string) => s[key] === "1";

  const saveAll = async () => {
    setSaving(true);
    const toSave = {
      ...s,
      active_languages: JSON.stringify(activeLangs),
      lang_modal_languages: JSON.stringify(modalLangCodes),
    };
    const r = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: toSave }),
    });
    setSaving(false);
    showToast(r.ok ? "Settings saved successfully" : "Save failed", r.ok);
  };

  const addLang = (lang: { code: string; label: string; nativeLabel: string; flag: string }) => {
    if (activeLangs.some(l => l.code === lang.code)) return;
    setActiveLangs(prev => [...prev, { ...lang, enabled: true }]);
    setShowAddLang(false);
    setCustomLang({ code: "", label: "", nativeLabel: "", flag: "" });
  };

  const removeLang = (code: string) => {
    if (!confirm(`Remove "${code}" language? Saved translations won't be deleted from the database.`)) return;
    setActiveLangs(prev => prev.filter(l => l.code !== code));
  };

  const toggleLang = (code: string) =>
    setActiveLangs(prev => prev.map(l => l.code === code ? { ...l, enabled: !l.enabled } : l));

  if (loading) return <div style={{ color: "#94a3b8", padding: "2rem" }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 860, fontFamily: "inherit" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, right: 20, zIndex: 9999,
          background: toast.ok ? "#16a34a" : "#dc2626", color: "#fff",
          padding: "10px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 8,
        }}>
          {toast.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Features & Settings</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", margin: "4px 0 0" }}>
            Enable or disable features, configure integrations, and manage languages.
          </p>
        </div>
        <button onClick={() => void saveAll()} disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 22px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(32,112,184,0.3)" }}>
          {saving ? <><Save size={14} /> Saving…</> : <><Check size={14} /> Save All Changes</>}
        </button>
      </div>

      {/* ── Translation Provider ───────────────────────────────────────── */}
      <div style={card}>
        <div style={cardHead}>
          <Languages size={16} style={{ color: "#7c3aed" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Translation Provider</span>
          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>Used for auto-translating content to all languages</span>
        </div>
        <div style={{ padding: "18px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
            {[
              { val: "mymemory", name: "MyMemory", badge: "Free", badgeColor: "#16a34a", desc: "500 words/day · No key needed · Crowd-sourced quality" },
              { val: "google",   name: "Google Translate", badge: "Paid", badgeColor: "#e37400", desc: "$20 / 1M chars · Best quality for Indian languages" },
              { val: "deepl",    name: "DeepL", badge: "Freemium", badgeColor: "#0891b2", desc: "500K chars/month free · Best European languages" },
            ].map(p => {
              const active = (s.translate_provider || "mymemory") === p.val;
              return (
                <button key={p.val} onClick={() => set("translate_provider", p.val)}
                  style={{
                    padding: "14px 16px", border: `2px solid ${active ? "#7c3aed" : "#e2e8f0"}`,
                    borderRadius: 10, background: active ? "#f5f3ff" : "#f8fafc",
                    cursor: "pointer", textAlign: "left",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${active ? "#7c3aed" : "#94a3b8"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7c3aed" }} />}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: active ? "#7c3aed" : "#0f172a" }}>{p.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: p.badgeColor + "20", color: p.badgeColor }}>{p.badge}</span>
                  </div>
                  <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
                </button>
              );
            })}
          </div>
          {(s.translate_provider === "google") && (
            <div>
              <label style={lbl}>Google Translate API Key</label>
              <input style={inp} type="password" value={s.google_translate_key || ""} onChange={e => set("google_translate_key", e.target.value)} placeholder="AIzaSy…" />
              <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "5px 0 0" }}>Get from Google Cloud Console → APIs & Services → Credentials</p>
            </div>
          )}
          {(s.translate_provider === "deepl") && (
            <div>
              <label style={lbl}>DeepL API Key</label>
              <input style={inp} type="password" value={s.deepl_api_key || ""} onChange={e => set("deepl_api_key", e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx" />
              <p style={{ fontSize: 11.5, color: "#94a3b8", margin: "5px 0 0" }}>Get from deepl.com → Account → Authentication Key</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Analytics ─────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={cardHead}>
          <BarChart2 size={16} style={{ color: "#0891b2" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Analytics & Tracking</span>
        </div>
        <div style={{ padding: "4px 0" }}>
          {[
            { key: "ga", name: "Google Analytics 4", icon: "G", color: "#e37400", placeholder: "G-XXXXXXXXXX", idKey: "ga_tracking_id", desc: "Track traffic and user behaviour" },
            { key: "fb", name: "Facebook / Meta Pixel", icon: "f", color: "#1877f2", placeholder: "123456789012345", idKey: "fb_pixel_id", desc: "Measure Facebook ad conversions" },
            { key: "gtm", name: "Google Tag Manager", icon: "T", color: "#4285f4", placeholder: "GTM-XXXXXXX", idKey: "gtm_id", desc: "Manage all scripts from one place" },
          ].map((a, i) => (
            <div key={a.key} style={{ padding: "16px 20px", borderTop: i > 0 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: isOn(`${a.key}_enabled`) ? 12 : 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: a.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: a.color, flexShrink: 0 }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{a.desc}</div>
                </div>
                <Toggle checked={isOn(`${a.key}_enabled`)} onChange={() => toggle(`${a.key}_enabled`)} />
              </div>
              {isOn(`${a.key}_enabled`) && (
                <div style={{ marginLeft: 48 }}>
                  <label style={lbl}>{a.name} ID</label>
                  <input style={{ ...inp, maxWidth: 320 }} value={s[a.idKey] || ""} onChange={e => set(a.idKey, e.target.value)} placeholder={a.placeholder} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Site Features ──────────────────────────────────────────────── */}
      <div style={card}>
        <div style={cardHead}>
          <Layout size={16} style={{ color: "#C0185A" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Site Features</span>
          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>Toggle pages and UI features on or off</span>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {[
              { key: "feature_contact_form",  label: "Contact Form",       icon: "✉",  desc: "Contact page with enquiry form" },
              { key: "feature_booking_form",  label: "Booking / Enquiry",  icon: "📅", desc: "Book Dr. Wesley form" },
              { key: "feature_gallery",       label: "Photo Gallery",      icon: "🖼",  desc: "/gallery page" },
              { key: "feature_blog",          label: "Blog / News",        icon: "📰", desc: "/news and /blog pages" },
              { key: "feature_events",        label: "Events",             icon: "📍", desc: "/events listing page" },
              { key: "feature_lang_switcher", label: "Language Switcher",  icon: "🌐", desc: "Language selector in navbar" },
              { key: "feature_give_page",     label: "Give / Donate Page", icon: "💛", desc: "/give donation page" },
              { key: "feature_sermons_page",  label: "Sermons Page",       icon: "🎙", desc: "/sermons listing page" },
            ].map(f => (
              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 9, background: isOn(f.key) ? "#f0fdf4" : "#f8fafc" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{f.desc}</div>
                </div>
                <Toggle checked={isOn(f.key)} onChange={() => toggle(f.key)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Languages ──────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={cardHead}>
          <Globe size={16} style={{ color: "#2070B8" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Languages</span>
          <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>Active languages appear in the site's language switcher and translation tools</span>
        </div>
        <div style={{ padding: "16px 20px" }}>
          {/* English (always on) */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 9, background: "#f0fdf4", marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🇺🇸</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>English</span>
              <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 8 }}>Default language — always active</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "#dcfce7", color: "#15803d" }}>DEFAULT</span>
          </div>

          {/* Active languages */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
            {activeLangs.map(l => (
              <div key={l.code} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: `1px solid ${l.enabled ? "#bfdbfe" : "#e2e8f0"}`, borderRadius: 9, background: l.enabled ? "#eff6ff" : "#f8fafc" }}>
                <span style={{ fontSize: 20 }}>{l.flag}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{l.label}</span>
                  <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{l.nativeLabel}</span>
                  <code style={{ fontSize: 10, color: "#94a3b8", marginLeft: 8, background: "#f1f5f9", padding: "1px 5px", borderRadius: 3 }}>{l.code}</code>
                </div>
                <Toggle checked={l.enabled} onChange={() => toggleLang(l.code)} />
                <button onClick={() => removeLang(l.code)}
                  style={{ padding: "4px 7px", border: "1px solid #fecaca", borderRadius: 6, background: "#fef2f2", cursor: "pointer", color: "#C0185A", display: "flex", alignItems: "center" }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* ── Language Preference Modal ── */}
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid #e8ecf0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Globe size={14} style={{ color: "#7c3aed" }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Language Preference Modal</span>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px" }}>
              Choose which languages are shown in the first-visit &ldquo;Choose your language&rdquo; popup.
              English is always included. Leave all unchecked to show every active language.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 8 }}>
              {activeLangs.filter(l => l.enabled !== false).map(l => {
                const checked = modalLangCodes.length === 0 || modalLangCodes.includes(l.code);
                return (
                  <label key={l.code} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", border: `1px solid ${checked ? "#c4b5fd" : "#e2e8f0"}`,
                    borderRadius: 8, background: checked ? "#f5f3ff" : "#f8fafc",
                    cursor: "pointer",
                  }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const base = modalLangCodes.length === 0
                          ? activeLangs.filter(x => x.enabled !== false).map(x => x.code)
                          : [...modalLangCodes];
                        const next = base.includes(l.code)
                          ? base.filter(c => c !== l.code)
                          : [...base, l.code];
                        setModalLangCodes(next.length === activeLangs.filter(x => x.enabled !== false).length ? [] : next);
                      }}
                      style={{ width: 14, height: 14, accentColor: "#7c3aed", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 18 }}>{l.flag}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: "#0f172a" }}>{l.nativeLabel}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{l.label}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            {modalLangCodes.length > 0 && (
              <p style={{ fontSize: 11.5, color: "#7c3aed", marginTop: 8 }}>
                Modal will show: English + {modalLangCodes.join(", ")}
              </p>
            )}
            {modalLangCodes.length === 0 && activeLangs.filter(l => l.enabled !== false).length > 0 && (
              <p style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 8 }}>
                All active languages selected — modal shows all of them.
              </p>
            )}
          </div>

          {/* Add language */}
          {!showAddLang ? (
            <button onClick={() => setShowAddLang(true)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", border: "1px dashed #bfdbfe", borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 13, color: "#2070B8", fontWeight: 600 }}>
              <Plus size={14} /> Add Language
            </button>
          ) : (
            <div style={{ border: "1px solid #bfdbfe", borderRadius: 10, padding: 16, background: "#eff6ff" }}>
              <p style={{ fontWeight: 700, fontSize: 13, color: "#1d4ed8", marginBottom: 12, marginTop: 0 }}>Add from catalogue</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, marginBottom: 14 }}>
                {KNOWN_LANGS.filter(l => !activeLangs.some(a => a.code === l.code)).map(l => (
                  <button key={l.code} onClick={() => addLang(l)}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", border: "1px solid #bfdbfe", borderRadius: 7, background: "#fff", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 16 }}>{l.flag}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12.5, color: "#0f172a" }}>{l.label}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{l.nativeLabel} · {l.code}</div>
                    </div>
                  </button>
                ))}
              </div>
              <p style={{ fontWeight: 700, fontSize: 12.5, color: "#374151", marginBottom: 10 }}>Or enter custom language</p>
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 1fr 60px", gap: 8, marginBottom: 10 }}>
                <div>
                  <label style={lbl}>Flag emoji</label>
                  <input style={inp} value={customLang.flag} onChange={e => setCustomLang(p => ({ ...p, flag: e.target.value }))} placeholder="🏳" maxLength={4} />
                </div>
                <div>
                  <label style={lbl}>English name</label>
                  <input style={inp} value={customLang.label} onChange={e => setCustomLang(p => ({ ...p, label: e.target.value }))} placeholder="French" />
                </div>
                <div>
                  <label style={lbl}>Native name</label>
                  <input style={inp} value={customLang.nativeLabel} onChange={e => setCustomLang(p => ({ ...p, nativeLabel: e.target.value }))} placeholder="Français" />
                </div>
                <div>
                  <label style={lbl}>Code</label>
                  <input style={inp} value={customLang.code} onChange={e => setCustomLang(p => ({ ...p, code: e.target.value.toLowerCase() }))} placeholder="fr" maxLength={5} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  disabled={!customLang.code || !customLang.label}
                  onClick={() => customLang.code && customLang.label && addLang(customLang)}
                  style={{ padding: "7px 16px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 12.5, fontWeight: 700 }}>
                  Add Custom
                </button>
                <button onClick={() => setShowAddLang(false)}
                  style={{ padding: "7px 14px", background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", fontSize: 12.5 }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Branding / Logo ───────────────────────────────────────────── */}
      <LogoCard logoUrl={s.logo_url || ""} onLogoChange={url => set("logo_url", url)} />

      {/* ── Site Identity ───────────────────────────────────────────────── */}
      <div style={card}>
        <div style={cardHead}>
          <Zap size={16} style={{ color: "#0f172a" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Site Identity</span>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { key: "site_title",       label: "Site Title",       placeholder: "Wesley Paul International Ministries" },
              { key: "site_tagline",     label: "Tagline",          placeholder: "Surrendered Lives, Eternal Purpose" },
              { key: "contact_email",    label: "Contact Email",    placeholder: "info@wesleypaul.org" },
              { key: "contact_phone",    label: "Contact Phone",    placeholder: "+1 (555) 000-0000" },
              { key: "facebook_url",     label: "Facebook URL",     placeholder: "https://facebook.com/wesleypaul.org" },
              { key: "youtube_url",      label: "YouTube URL",      placeholder: "https://youtube.com/@DrWesleyPaul" },
              { key: "instagram_url",    label: "Instagram URL",    placeholder: "https://instagram.com/drwesleypaul" },
              { key: "site_description", label: "Meta Description", placeholder: "Global evangelistic ministry…" },
            ].map(f => (
              <div key={f.key}>
                <label style={lbl}>{f.label}</label>
                <input style={inp} value={s[f.key] || ""} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Change Password ─────────────────────────────────────────────── */}
      <ChangePasswordCard />

      {/* Bottom save */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 40 }}>
        <button onClick={() => void saveAll()} disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 28px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(32,112,184,0.3)" }}>
          {saving ? <><Save size={14} /> Saving…</> : <><Check size={14} /> Save All Changes</>}
        </button>
      </div>
    </div>
  );
}

/* ── Password input field — defined at module scope so React keeps the same
   component reference across parent re-renders (prevents focus loss on keypress) */
const pwInp: React.CSSProperties = {
  width: "100%", padding: "8px 38px 8px 11px", border: "1px solid #e2e8f0",
  borderRadius: 7, fontSize: 13, fontFamily: "inherit", outline: "none",
  background: "#fff", boxSizing: "border-box" as const,
};

function PwField({ label, value, show, onToggle, onChange }: {
  label: string; value: string; show: boolean;
  onToggle: () => void; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={pwInp}
          autoComplete="new-password"
        />
        <button type="button" onClick={onToggle}
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}>
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

/* ── Change Password card ──────────────────────────────────────────────────── */
function ChangePasswordCard() {
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showCur, setShowCur]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [busy, setBusy]         = useState(false);
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    setMsg(null);
    if (!current || !next || !confirm) { setMsg({ ok: false, text: "All fields are required." }); return; }
    if (next !== confirm)              { setMsg({ ok: false, text: "New passwords do not match." }); return; }
    if (next.length < 8)               { setMsg({ ok: false, text: "Password must be at least 8 characters." }); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const d = await r.json() as { success?: boolean; error?: string };
      if (d.success) {
        setMsg({ ok: true, text: "Password changed successfully." });
        setCurrent(""); setNext(""); setConfirm("");
      } else {
        setMsg({ ok: false, text: d.error ?? "Failed to change password." });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={card}>
      <div style={cardHead}>
        <KeyRound size={16} style={{ color: "#7c3aed" }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Change Password</span>
      </div>
      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 480 }}>
        <PwField label="Current Password" value={current} show={showCur} onToggle={() => setShowCur(v => !v)} onChange={setCurrent} />
        <PwField label="New Password"     value={next}    show={showNew} onToggle={() => setShowNew(v => !v)} onChange={setNext} />
        <PwField label="Confirm New Password" value={confirm} show={showNew} onToggle={() => setShowNew(v => !v)} onChange={setConfirm} />

        {msg && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 13px", borderRadius: 7, fontSize: 13,
            background: msg.ok ? "#f0fdf4" : "#fef2f2", color: msg.ok ? "#16a34a" : "#dc2626",
            border: `1px solid ${msg.ok ? "#bbf7d0" : "#fecaca"}` }}>
            {msg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {msg.text}
          </div>
        )}

        <div>
          <button onClick={() => void submit()} disabled={busy}
            style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 22px", background: busy ? "#e2e8f0" : "#7c3aed",
              color: busy ? "#94a3b8" : "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: busy ? "default" : "pointer", boxShadow: busy ? "none" : "0 2px 8px rgba(124,58,237,0.3)" }}>
            <KeyRound size={13} /> {busy ? "Saving…" : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

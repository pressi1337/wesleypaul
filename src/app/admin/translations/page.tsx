"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Globe, Zap, CheckCircle, Clock, Navigation, AlignLeft } from "lucide-react";

interface LangOption { code: string; label: string; flag: string; }
interface PageRow { id: number; title: string; slug: string; translation_count: number; languages: string[]; }
interface NavItem { id: number; label: string; href: string; parent_id: number | null; translations: Record<string, string>; }
interface FooterTr { tagline: string; cta_strip_text: string; cta_strip_label: string; }

type MainTab = "pages" | "menu" | "footer";

export default function TranslationsPage() {
  const [mainTab, setMainTab] = useState<MainTab>("pages");
  const [langs, setLangs] = useState<LangOption[]>([]);

  useEffect(() => {
    fetch("/api/languages")
      .then(r => r.json())
      .then((d: { languages?: Array<{ code: string; label: string; flag: string }> }) => {
        setLangs(d.languages ?? []);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Translations</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Manage multilingual content across all active languages.</p>
      </div>

      {/* Main tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", padding: 4, width: "fit-content" }}>
        {([["pages", Globe, "Pages"], ["menu", Navigation, "Menu / Navbar"], ["footer", AlignLeft, "Footer"]] as [MainTab, typeof Globe, string][]).map(([t, Icon, label]) => (
          <button key={t} onClick={() => setMainTab(t)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: mainTab === t ? "#fff" : "transparent", color: mainTab === t ? "#2070B8" : "#64748b", boxShadow: mainTab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {langs.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading languages…</div>
      ) : (
        <>
          {mainTab === "pages" && <PagesTab langs={langs} />}
          {mainTab === "menu" && <MenuTab langs={langs} />}
          {mainTab === "footer" && <FooterTab langs={langs} />}
        </>
      )}
    </div>
  );
}

// ── Pages Tab ─────────────────────────────────────────────────────────────────
function PagesTab({ langs }: { langs: LangOption[] }) {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLang, setFilterLang] = useState("all");

  useEffect(() => {
    fetch("/api/admin/translations").then(r => r.json()).then(d => { setPages(d.pages || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filterLang === "all" ? pages : filterLang === "missing" ? pages.filter(p => p.languages.length < langs.length) : pages.filter(p => p.languages.includes(filterLang));
  const totalTranslated = pages.filter(p => p.languages.length === langs.length).length;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[{ label: "Total Pages", value: pages.length, color: "#2070B8", icon: Globe }, { label: "Fully Translated", value: totalTranslated, color: "#16a34a", icon: CheckCircle }, { label: "Need Translation", value: pages.length - totalTranslated, color: "#d97706", icon: Clock }].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: "#fff", borderRadius: 10, padding: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <Icon size={18} style={{ color: s.color, opacity: 0.6 }} />
              </div>
              <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[{ key: "all", label: "All Pages" }, { key: "missing", label: "Needs Work" }, ...langs.map(l => ({ key: l.code, label: `${l.flag} ${l.label}` }))].map(f => (
          <button key={f.key} onClick={() => setFilterLang(f.key)}
            style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid", fontSize: 12.5, fontWeight: 600, cursor: "pointer", background: filterLang === f.key ? "#2070B8" : "#fff", color: filterLang === f.key ? "#fff" : "#64748b", borderColor: filterLang === f.key ? "#2070B8" : "#e2e8f0" }}>
            {f.label}
          </button>
        ))}
      </div>
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading…</div> : filtered.length === 0 ? <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>No pages found.</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Page", "Languages", "Coverage", ""].map(h => <th key={h} style={{ textAlign: "left", padding: "11px 20px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(page => (
                <tr key={page.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0f172a" }}>{page.title}</div>
                    <code style={{ fontSize: 11.5, color: "#94a3b8", background: "#f1f5f9", padding: "1px 6px", borderRadius: 3 }}>/{page.slug}</code>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {langs.map(l => { const done = page.languages.includes(l.code); return <span key={l.code} style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 20, fontWeight: 600, background: done ? "#dcfce7" : "#f1f5f9", color: done ? "#15803d" : "#94a3b8" }}>{l.flag} {l.label}</span>; })}
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 80, height: 6, background: "#f1f5f9", borderRadius: 3 }}>
                        <div style={{ height: "100%", borderRadius: 3, background: page.languages.length === langs.length ? "#16a34a" : page.languages.length > 0 ? "#d97706" : "#e2e8f0", width: `${langs.length > 0 ? (page.languages.length / langs.length) * 100 : 0}%` }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{page.languages.length}/{langs.length}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <Link href={`/admin/pages/${page.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 12.5, fontWeight: 600, color: "#2070B8", textDecoration: "none" }}>
                      <Zap size={12} /> Open Editor
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// ── Menu Tab ──────────────────────────────────────────────────────────────────
function MenuTab({ langs }: { langs: LangOption[] }) {
  const [lang, setLang] = useState(langs[0]?.code ?? "");
  const [items, setItems] = useState<NavItem[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [translating, setTranslating] = useState<number | null>(null);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);
  const [loading, setLoading] = useState(true);

  // Keep default lang in sync if langs loads after render
  useEffect(() => {
    if (!lang && langs.length > 0) setLang(langs[0].code);
  }, [langs, lang]);

  const load = useCallback(() => {
    if (!lang) return;
    setLoading(true);
    fetch("/api/admin/nav-translations").then(r => r.json()).then((d: { items?: NavItem[] }) => {
      setItems(d.items ?? []);
      const initial: Record<number, string> = {};
      (d.items ?? []).forEach(item => { initial[item.id] = item.translations?.[lang] ?? ""; });
      setDrafts(initial);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [lang]);

  useEffect(() => { load(); }, [load]);

  const saveItem = async (item: NavItem, label: string) => {
    setSaving(item.id);
    await fetch("/api/admin/nav-translations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nav_item_id: item.id, language_code: lang, translated_label: label }) });
    setSaving(null);
  };

  const save = (item: NavItem) => saveItem(item, drafts[item.id] ?? "");

  const autoTranslate = async (item: NavItem) => {
    setTranslating(item.id);
    try {
      const res = await fetch("/api/admin/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: item.label, target: lang }) });
      const d = await res.json() as { translated?: string };
      if (d.translated) { setDrafts(prev => ({ ...prev, [item.id]: d.translated! })); }
    } catch { /* ignore */ }
    setTranslating(null);
  };

  const autoTranslateAndSaveAll = async () => {
    setBulkWorking(true);
    setBulkDone(false);
    for (const item of items) {
      setTranslating(item.id);
      try {
        const res = await fetch("/api/admin/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: item.label, target: lang }) });
        const d = await res.json() as { translated?: string };
        const label = d.translated ?? item.translations?.[lang] ?? item.label;
        setDrafts(prev => ({ ...prev, [item.id]: label }));
        await fetch("/api/admin/nav-translations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nav_item_id: item.id, language_code: lang, translated_label: label }) });
      } catch { /* ignore */ }
      setTranslating(null);
    }
    setBulkWorking(false);
    setBulkDone(true);
    setTimeout(() => setBulkDone(false), 3000);
  };

  const saveAll = async () => {
    setBulkWorking(true);
    for (const item of items) { await saveItem(item, drafts[item.id] ?? ""); }
    setBulkWorking(false);
    setBulkDone(true);
    setTimeout(() => setBulkDone(false), 3000);
  };

  const currentLang = langs.find(l => l.code === lang);

  return (
    <div>
      {/* Lang selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Language:</span>
        {langs.map(l => (
          <button key={l.code} onClick={() => setLang(l.code)}
            style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid", fontSize: 12, fontWeight: 700, cursor: "pointer", background: lang === l.code ? "#2070B8" : "#f8fafc", color: lang === l.code ? "#fff" : "#64748b", borderColor: lang === l.code ? "#2070B8" : "#e2e8f0" }}>
            {l.flag} {l.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          {bulkDone && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>✓ All saved!</span>}
          <button onClick={() => void autoTranslateAndSaveAll()} disabled={bulkWorking}
            style={{ padding: "6px 14px", background: bulkWorking ? "#f1f5f9" : "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 12, fontWeight: 700, color: bulkWorking ? "#94a3b8" : "#2070B8", cursor: bulkWorking ? "not-allowed" : "pointer" }}>
            {bulkWorking ? "Working…" : "🌐 Auto-Translate & Save All"}
          </button>
          <button onClick={() => void saveAll()} disabled={bulkWorking}
            style={{ padding: "6px 14px", background: bulkWorking ? "#f1f5f9" : "#2070B8", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, color: bulkWorking ? "#94a3b8" : "#fff", cursor: bulkWorking ? "not-allowed" : "pointer" }}>
            Save All
          </button>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        {loading ? <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>Loading…</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Menu Item", "English", `${currentLang?.flag ?? ""} Translation`, ""].map(h => <th key={h} style={{ textAlign: "left", padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 18px" }}>
                    {item.parent_id && <span style={{ color: "#c4c4c4", marginRight: 6 }}>└</span>}
                    <code style={{ fontSize: 11.5, color: "#64748b", background: "#f1f5f9", padding: "1px 6px", borderRadius: 3 }}>{item.href}</code>
                  </td>
                  <td style={{ padding: "12px 18px", fontWeight: 600, fontSize: 13.5, color: "#0f172a" }}>{item.label}</td>
                  <td style={{ padding: "8px 18px" }}>
                    <input
                      value={drafts[item.id] ?? ""}
                      onChange={e => setDrafts(prev => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder={`${item.label} in ${currentLang?.label ?? lang}…`}
                      style={{ width: "100%", padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: drafts[item.id] ? "#f0fdf4" : "#fff" }}
                    />
                  </td>
                  <td style={{ padding: "8px 18px", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => void autoTranslate(item)} disabled={translating === item.id}
                        style={{ padding: "5px 10px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, fontSize: 11, fontWeight: 700, color: "#2070B8", cursor: "pointer" }}>
                        {translating === item.id ? "…" : "🌐"}
                      </button>
                      <button onClick={() => void save(item)} disabled={saving === item.id}
                        style={{ padding: "5px 10px", background: saving === item.id ? "#f1f5f9" : "#16a34a", border: "none", borderRadius: 5, fontSize: 11, fontWeight: 700, color: saving === item.id ? "#94a3b8" : "#fff", cursor: "pointer" }}>
                        {saving === item.id ? "…" : "Save"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Footer Tab ────────────────────────────────────────────────────────────────
function FooterTab({ langs }: { langs: LangOption[] }) {
  const [lang, setLang] = useState(langs[0]?.code ?? "");
  const [draft, setDraft] = useState<FooterTr>({ tagline: "", cta_strip_text: "", cta_strip_label: "" });
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!lang && langs.length > 0) setLang(langs[0].code);
  }, [langs, lang]);

  const load = useCallback(() => {
    if (!lang) return;
    fetch(`/api/admin/footer-translations?lang=${lang}`).then(r => r.json()).then((d: { translation?: FooterTr }) => {
      setDraft(d.translation ?? { tagline: "", cta_strip_text: "", cta_strip_label: "" });
    }).catch(() => {});
  }, [lang]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    await fetch("/api/admin/footer-translations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language_code: lang, ...draft }) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const FOOTER_FIELDS: { key: keyof FooterTr; label: string; multiline?: boolean }[] = [
    { key: "tagline", label: "Tagline / About blurb", multiline: true },
    { key: "cta_strip_text", label: "CTA Strip Text" },
    { key: "cta_strip_label", label: "CTA Strip Button Label" },
  ];

  const autoTranslateAll = async () => {
    setTranslating(true);
    setSaved(false);
    const ORIGINALS: Record<keyof FooterTr, string> = {
      tagline: "A global evangelistic ministry committed to proclaiming the life-transforming message of Jesus Christ and strengthening marriages and families across the world.",
      cta_strip_text: "Partner with us — every gift reaches another soul with the Gospel.",
      cta_strip_label: "Give Now",
    };
    const newDraft = { ...draft };
    for (const { key } of FOOTER_FIELDS) {
      try {
        const res = await fetch("/api/admin/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: ORIGINALS[key], target: lang }) });
        const d = await res.json() as { translated?: string };
        if (d.translated) newDraft[key] = d.translated;
      } catch { /* ignore */ }
    }
    setDraft(newDraft);
    await fetch("/api/admin/footer-translations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language_code: lang, ...newDraft }) });
    setTranslating(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const currentLang = langs.find(l => l.code === lang);

  return (
    <div>
      {/* Lang selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Language:</span>
        {langs.map(l => (
          <button key={l.code} onClick={() => setLang(l.code)}
            style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid", fontSize: 12, fontWeight: 700, cursor: "pointer", background: lang === l.code ? "#2070B8" : "#f8fafc", color: lang === l.code ? "#fff" : "#64748b", borderColor: lang === l.code ? "#2070B8" : "#e2e8f0" }}>
            {l.flag} {l.label}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 24, maxWidth: 640 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
            {currentLang?.flag} Footer — {currentLang?.label}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {saved && !saving && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>✓ Translated & saved!</span>}
            <button onClick={() => void autoTranslateAll()} disabled={translating || saving}
              style={{ padding: "6px 14px", background: translating ? "#f1f5f9" : "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: 6, fontSize: 12, fontWeight: 700, color: translating ? "#94a3b8" : "#2070B8", cursor: translating ? "not-allowed" : "pointer" }}>
              {translating ? "Translating & saving…" : "🌐 Auto-Translate & Save"}
            </button>
          </div>
        </div>
        {FOOTER_FIELDS.map(({ key, label, multiline }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
            {multiline ? (
              <textarea rows={3} value={draft[key]} onChange={e => setDraft(prev => ({ ...prev, [key]: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            ) : (
              <input value={draft[key]} onChange={e => setDraft(prev => ({ ...prev, [key]: e.target.value }))}
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            )}
          </div>
        ))}
        <button onClick={() => void save()} disabled={saving}
          style={{ padding: "9px 22px", background: saved ? "#16a34a" : "#2070B8", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save Footer Translation"}
        </button>
      </div>
    </div>
  );
}

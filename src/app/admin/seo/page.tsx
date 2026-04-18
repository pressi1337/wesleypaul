"use client";

import { useEffect, useState } from "react";
import { Save, Search, CheckCircle } from "lucide-react";

interface Page { id: number; title: string; slug: string; meta_title: string; meta_description: string; meta_keywords: string; }

const inp = { width: "100%", padding: "8px 11px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, outline: "none", background: "#fff", boxSizing: "border-box" as const, fontFamily: "inherit" };

export default function SeoPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/pages").then(r => r.json()).then(d => { setPages(d.pages || []); setLoading(false); });
  }, []);

  const update = (id: number, field: keyof Page, value: string) =>
    setPages(ps => ps.map(p => p.id === id ? { ...p, [field]: value } : p));

  const savePage = async (page: Page) => {
    setSaving(page.id);
    await fetch(`/api/admin/pages/${page.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(page),
    });
    setSaving(null); setSaved(page.id);
    setTimeout(() => setSaved(null), 2500);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>SEO Manager</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Edit meta titles, descriptions, keywords and slugs for each page.</p>
      </div>

      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13.5, color: "#1d4ed8" }}>
        <strong>Tip:</strong> Keep meta titles under 60 characters and descriptions under 160 for best search engine results.
      </div>

      {loading ? (
        <div style={{ color: "#94a3b8", padding: "2rem 0" }}>Loading pages…</div>
      ) : pages.length === 0 ? (
        <div style={{ color: "#94a3b8", padding: "2rem 0", textAlign: "center" }}>No pages found. Create pages first.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {pages.map(page => (
            <div key={page.id} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              {/* Page header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                <Search size={14} style={{ color: "#94a3b8" }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", flex: 1 }}>{page.title}</span>
                <code style={{ fontSize: 11.5, color: "#94a3b8", background: "#f1f5f9", padding: "2px 7px", borderRadius: 4 }}>/{page.slug}</code>
                {saved === page.id && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                    <CheckCircle size={13} /> Saved
                  </span>
                )}
                <button onClick={() => savePage(page)} disabled={saving === page.id}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  <Save size={12} /> {saving === page.id ? "Saving…" : "Save"}
                </button>
              </div>

              {/* SEO fields */}
              <div style={{ padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Meta Title <span style={{ color: (page.meta_title || "").length > 60 ? "#dc2626" : "#94a3b8", fontWeight: 400 }}>({(page.meta_title || "").length}/60)</span>
                  </label>
                  <input style={{ ...inp, borderColor: (page.meta_title || "").length > 60 ? "#fca5a5" : undefined }}
                    value={page.meta_title || ""}
                    onChange={e => update(page.id, "meta_title", e.target.value)}
                    placeholder="SEO title for this page…"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Slug</label>
                  <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: 6, overflow: "hidden" }}>
                    <span style={{ padding: "8px 9px", background: "#f8fafc", fontSize: 12, color: "#94a3b8", borderRight: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>wesleypaul.org/</span>
                    <input style={{ ...inp, border: "none", borderRadius: 0, flex: 1 }}
                      value={page.slug}
                      onChange={e => update(page.id, "slug", e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                    Meta Description <span style={{ color: (page.meta_description || "").length > 160 ? "#dc2626" : "#94a3b8", fontWeight: 400 }}>({(page.meta_description || "").length}/160)</span>
                  </label>
                  <textarea style={{ ...inp, height: 70, resize: "vertical", borderColor: (page.meta_description || "").length > 160 ? "#fca5a5" : undefined }}
                    value={page.meta_description || ""}
                    onChange={e => update(page.id, "meta_description", e.target.value)}
                    placeholder="Brief description for search results…"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Keywords</label>
                  <input style={inp} value={page.meta_keywords || ""}
                    onChange={e => update(page.id, "meta_keywords", e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                {/* Mini Google preview */}
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Preview</label>
                  <div style={{ padding: "10px 12px", background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 7, fontSize: 12 }}>
                    <div style={{ color: "#1a0dab", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.meta_title || page.title || "Title"}</div>
                    <div style={{ color: "#006621", fontSize: 11 }}>wesleypaul.org › {page.slug}</div>
                    <div style={{ color: "#545454", fontSize: 11.5, marginTop: 2, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {page.meta_description || "No description set."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

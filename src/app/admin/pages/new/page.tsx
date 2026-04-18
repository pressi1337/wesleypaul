"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe, Save } from "lucide-react";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

const inp = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13.5, outline: "none", background: "#fff", boxSizing: "border-box" as const, fontFamily: "inherit" };
const lbl = { display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 5 } as const;

export default function NewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", slug: "", status: "draft", meta_title: "", meta_description: "", meta_keywords: "" });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (status = form.status) => {
    if (!form.title || !form.slug) { setError("Title and slug are required."); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/pages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) router.push(`/admin/pages/${data.id}`);
    else setError(data.error || "Failed to create page");
  };

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push("/admin/pages")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Create New Page</h1>
          <p style={{ fontSize: 13, color: "#64748b" }}>Fill in the details below to add a new page to your site.</p>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "11px 16px", color: "#dc2626", fontSize: 13.5, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>
        {/* Main */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px 24px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>Page Details</h2>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Title *</label>
              <input style={{ ...inp, fontSize: 16, fontWeight: 600 }} value={form.title}
                onChange={e => { set("title", e.target.value); set("slug", slugify(e.target.value)); }}
                placeholder="Enter page title…" />
            </div>
            <div>
              <label style={lbl}>Permalink</label>
              <div style={{ display: "flex", border: "1px solid #e2e8f0", borderRadius: 7, overflow: "hidden" }}>
                <span style={{ padding: "9px 12px", background: "#f8fafc", fontSize: 13, color: "#94a3b8", borderRight: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>wesleypaul.org/</span>
                <input style={{ ...inp, border: "none", borderRadius: 0, flex: 1 }} value={form.slug}
                  onChange={e => set("slug", e.target.value)} placeholder="page-slug" />
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px 24px" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>SEO Settings</h2>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Meta Title <span style={{ color: "#94a3b8", fontWeight: 400 }}>({form.meta_title.length}/60)</span></label>
              <input style={inp} value={form.meta_title} onChange={e => set("meta_title", e.target.value)} placeholder="SEO title (leave blank to use page title)" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Meta Description <span style={{ color: "#94a3b8", fontWeight: 400 }}>({form.meta_description.length}/160)</span></label>
              <textarea style={{ ...inp, height: 80, resize: "vertical" }} value={form.meta_description}
                onChange={e => set("meta_description", e.target.value)} placeholder="Brief description for search results…" />
            </div>
            <div>
              <label style={lbl}>Keywords</label>
              <input style={inp} value={form.meta_keywords} onChange={e => set("meta_keywords", e.target.value)} placeholder="keyword1, keyword2, keyword3" />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Publish</div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Status</label>
                <select style={inp} value={form.status} onChange={e => set("status", e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
            <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => handleSave("published")} disabled={saving}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%" }}>
                <Globe size={13} /> Create & Publish
              </button>
              <button onClick={() => handleSave("draft")} disabled={saving}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px", background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer", width: "100%" }}>
                <Save size={13} /> Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

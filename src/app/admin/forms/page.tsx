"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, ClipboardList, Inbox } from "lucide-react";

interface Form {
  id: number;
  name: string;
  description: string;
  field_count: number;
  created_at: string;
}

export default function FormsListPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/forms")
      .then(r => r.json())
      .then(d => { setForms((d as { forms: Form[] }).forms || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete form "${name}"? All submissions will also be deleted.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/forms/${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  };

  const filtered = forms.filter(f => f.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Forms</h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>{forms.length} form{forms.length !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={() => router.push("/admin/forms/new")}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "#2070B8", color: "#fff", borderRadius: 8, border: "none", fontSize: 13.5, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(32,112,184,0.3)" }}>
          <Plus size={15} /> New Form
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 16, maxWidth: 360 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search forms…"
          style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13.5, outline: "none", background: "#fff", boxSizing: "border-box" as const }} />
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <ClipboardList size={48} style={{ color: "#cbd5e1", margin: "0 auto 14px", display: "block" }} />
            <p style={{ color: "#64748b", fontWeight: 600, marginBottom: 6 }}>{query ? "No forms match your search" : "No forms yet"}</p>
            {!query && (
              <button onClick={() => router.push("/admin/forms/new")}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "9px 18px", background: "#2070B8", color: "#fff", borderRadius: 7, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={13} /> Create your first form
              </button>
            )}
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Name", "Description", "Fields", "Created", ""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 20px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(form => (
                  <tr key={form.id} style={{ borderTop: "1px solid #f1f5f9" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{form.name}</div>
                    </td>
                    <td style={{ padding: "13px 20px", fontSize: 13, color: "#64748b", maxWidth: 260 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.description || "—"}</div>
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "#eff6ff", color: "#2070B8" }}>
                        {form.field_count ?? 0} fields
                      </span>
                    </td>
                    <td style={{ padding: "13px 20px", fontSize: 12.5, color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {new Date(form.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => router.push(`/admin/forms/${form.id}?tab=submissions`)}
                          title="View Submissions"
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                          <Inbox size={13} />
                        </button>
                        <button onClick={() => router.push(`/admin/forms/${form.id}`)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, background: "#eff6ff", color: "#2070B8", border: "1px solid #bfdbfe", cursor: "pointer" }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(form.id, form.name)} disabled={deleting === form.id}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, background: "#fef2f2", color: "#C0185A", border: "1px solid #fecaca", cursor: deleting === form.id ? "not-allowed" : "pointer" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "10px 20px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8" }}>
              Showing {filtered.length} of {forms.length} forms
            </div>
          </>
        )}
      </div>
    </div>
  );
}

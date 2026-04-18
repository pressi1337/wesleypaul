"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, FileText, Search } from "lucide-react";

interface Page { id: number; title: string; slug: string; layout: string; status: string; updated_at: string; }

export default function PagesListPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/pages").then(r => r.json()).then(d => { setPages(d.pages || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  };

  const filtered = pages.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.slug.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Pages</h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>{pages.length} page{pages.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link href="/admin/pages/new" style={{
          display: "flex", alignItems: "center", gap: 7, padding: "9px 18px",
          background: "#2070B8", color: "#fff", borderRadius: 8,
          textDecoration: "none", fontSize: 13.5, fontWeight: 600,
          boxShadow: "0 2px 8px rgba(32,112,184,0.3)",
        }}>
          <Plus size={15} /> New Page
        </Link>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 360 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search pages…"
          style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13.5, outline: "none", background: "#fff", boxSizing: "border-box" }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <FileText size={48} style={{ color: "#cbd5e1", margin: "0 auto 14px" }} />
            <p style={{ color: "#64748b", fontWeight: 600, marginBottom: 6 }}>{query ? "No pages match your search" : "No pages yet"}</p>
            {!query && (
              <Link href="/admin/pages/new" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "9px 18px", background: "#2070B8", color: "#fff", borderRadius: 7, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                <Plus size={13} /> Create your first page
              </Link>
            )}
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Title", "Slug", "Layout", "Status", "Updated", ""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 20px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((page) => (
                  <tr key={page.id} style={{ borderTop: "1px solid #f1f5f9" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{page.title}</div>
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <code style={{ fontSize: 12.5, color: "#64748b", background: "#f1f5f9", padding: "2px 7px", borderRadius: 4 }}>/{page.slug}</code>
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <span style={{ fontSize: 12.5, color: "#64748b", textTransform: "capitalize" }}>{page.layout}</span>
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: page.status === "published" ? "#dcfce7" : "#fef9c3",
                        color: page.status === "published" ? "#15803d" : "#92400e",
                      }}>{page.status}</span>
                    </td>
                    <td style={{ padding: "13px 20px", fontSize: 12.5, color: "#94a3b8", whiteSpace: "nowrap" }}>
                      {new Date(page.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer"
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", textDecoration: "none" }}>
                          <Eye size={13} />
                        </a>
                        <button onClick={() => router.push(`/admin/pages/${page.id}`)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, background: "#eff6ff", color: "#2070B8", border: "1px solid #bfdbfe", cursor: "pointer" }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(page.id, page.title)} disabled={deleting === page.id}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, background: "#fef2f2", color: "#C0185A", border: "1px solid #fecaca", cursor: deleting === page.id ? "not-allowed" : "pointer" }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "10px 20px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8" }}>
              Showing {filtered.length} of {pages.length} pages
            </div>
          </>
        )}
      </div>
    </div>
  );
}

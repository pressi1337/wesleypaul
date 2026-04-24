"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { FileText, Globe, Eye, Plus, Search, Mail, BarChart2, ArrowRight, Clock, Layers, Navigation, Image as ImageIcon, Megaphone, MapPin } from "lucide-react";

const VisitMap = dynamic(() => import("./visit-analytics/VisitMap"), { ssr: false });

interface Page { id: number; title: string; slug: string; status: string; updated_at: string; layout: string; }
interface MapPoint { lat: number; lng: number; country: string; city: string; visits: number; }

export default function AdminDashboard() {
  const [pages, setPages]       = useState<Page[]>([]);
  const [loading, setLoading]   = useState(true);
  const [langCount, setLangCount] = useState<number>(0);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);

  useEffect(() => {
    // Load pages
    fetch("/api/admin/pages")
      .then(r => r.json())
      .then(d => { setPages(d.pages || []); setLoading(false); })
      .catch(() => setLoading(false));

    // Load active language count (+1 for English which is always active)
    fetch("/api/languages")
      .then(r => r.json())
      .then((d: { languages?: { code: string }[] }) => {
        setLangCount((d.languages?.length ?? 0) + 1);
      })
      .catch(() => setLangCount(1));

    // Load visitor map points (last 30 days)
    fetch("/api/admin/visit-analytics?days=30")
      .then(r => r.json())
      .then(d => setMapPoints(d.mapPoints ?? []))
      .catch(() => {});
  }, []);

  const total     = pages.length;
  const published = pages.filter(p => p.status === "published").length;
  const draft     = pages.filter(p => p.status === "draft").length;

  const stats = [
    { label: "Total Pages",     value: loading ? "—" : total,     icon: FileText, color: "#2070B8", bg: "#eff6ff" },
    { label: "Published",       value: loading ? "—" : published,  icon: Eye,      color: "#16a34a", bg: "#f0fdf4" },
    { label: "Drafts",          value: loading ? "—" : draft,      icon: Clock,    color: "#d97706", bg: "#fffbeb" },
    { label: "Languages",       value: langCount || "—",           icon: Globe,    color: "#7c3aed", bg: "#f5f3ff" },
  ];

  const quickLinks = [
    { label: "New Page",      href: "/admin/pages/new",    icon: Plus,       color: "#2070B8", desc: "Create a new content page" },
    { label: "Site Editor",   href: "/admin/site-editor",  icon: Layers,     color: "#C0185A", desc: "Edit home sections & footer" },
    { label: "Menu",          href: "/admin/menu",         icon: Navigation, color: "#0891b2", desc: "Manage navigation items" },
    { label: "Translations",  href: "/admin/translations", icon: Globe,      color: "#7c3aed", desc: "Manage multilingual content" },
    { label: "SEO Manager",   href: "/admin/seo",          icon: Search,     color: "#0f766e", desc: "Edit meta tags & slugs" },
    { label: "Email Config",  href: "/admin/email",        icon: Mail,       color: "#d97706", desc: "Configure SMTP settings" },
    { label: "Promotions",    href: "/admin/promotions",   icon: Megaphone,  color: "#7c3aed", desc: "Popup banners & welcome modals" },
    { label: "Marketing",     href: "/admin/marketing",    icon: BarChart2,  color: "#16a34a", desc: "Analytics & tracking IDs" },
    { label: "Media Library", href: "/admin/media",        icon: ImageIcon,  color: "#64748b", desc: "Upload & manage images" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Welcome back. Here&rsquo;s what&rsquo;s happening with your site.</p>
      </div>

      {/* Top quick-edit banners */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 }}>
        <Link href="/admin/site-editor" style={{ textDecoration: "none" }}>
          <div style={{ background: "linear-gradient(135deg,#0a1523,#1a3a5c)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 4px 14px rgba(0,0,0,0.15)", cursor: "pointer" }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(32,112,184,0.3)", border: "1px solid rgba(32,112,184,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Layers size={20} style={{ color: "#60a5fa" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Hero Carousel & Home Sections</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Edit slides, stats, welcome, give CTA…</div>
            </div>
            <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
          </div>
        </Link>

        <Link href="/admin/promotions" style={{ textDecoration: "none" }}>
          <div style={{ background: "linear-gradient(135deg,#1a0a2e,#3b1070)", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 4px 14px rgba(0,0,0,0.15)", cursor: "pointer" }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Megaphone size={20} style={{ color: "#c4b5fd" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Promotions</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Manage popup banners & welcome modals</div>
            </div>
            <ArrowRight size={14} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 20px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{s.label}</div>
                </div>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div style={{ color: "#94a3b8", padding: "2rem 0" }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, marginBottom: 20 }}>
            {/* Recent pages */}
            <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Recent Pages</h2>
                <Link href="/admin/pages" style={{ fontSize: 12, color: "#2070B8", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  All pages <ArrowRight size={12} />
                </Link>
              </div>
              {pages.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <FileText size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />
                  <p style={{ color: "#94a3b8", fontSize: 14 }}>No pages yet.</p>
                  <Link href="/admin/pages/new" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "8px 16px", background: "#2070B8", color: "#fff", borderRadius: 6, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                    <Plus size={13} /> Create first page
                  </Link>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      {["Title", "Status", "Updated"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 20px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {pages.slice(0, 8).map((page) => (
                      <tr key={page.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 20px" }}>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0f172a" }}>{page.title}</div>
                          <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 1 }}>/{page.slug}</div>
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <span style={{
                            padding: "3px 9px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                            background: page.status === "published" ? "#dcfce7" : "#fef9c3",
                            color: page.status === "published" ? "#15803d" : "#92400e",
                          }}>{page.status}</span>
                        </td>
                        <td style={{ padding: "12px 20px", fontSize: 12, color: "#94a3b8" }}>
                          {new Date(page.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td style={{ padding: "12px 20px", textAlign: "right" }}>
                          <Link href={`/admin/pages/${page.id}`} style={{ fontSize: 12, color: "#2070B8", textDecoration: "none", fontWeight: 600 }}>Edit</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Quick actions */}
            <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", padding: "16px 20px 8px" }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 14 }}>Quick Actions</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {quickLinks.map(l => {
                  const Icon = l.icon;
                  return (
                    <Link key={l.href} href={l.href} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "11px 12px",
                      borderRadius: 9, textDecoration: "none",
                      background: "#f8fafc", border: "1px solid #f1f5f9",
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: l.color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={15} style={{ color: l.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{l.label}</div>
                        <div style={{ fontSize: 11.5, color: "#94a3b8" }}>{l.desc}</div>
                      </div>
                      <ArrowRight size={13} style={{ color: "#cbd5e1", marginLeft: "auto" }} />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Visitor Map ── */}
          <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin size={15} style={{ color: "#2070B8" }} />
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: 0 }}>Visitor Locations</h2>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>last 30 days</span>
              </div>
              <Link href="/admin/visit-analytics" style={{ fontSize: 12, color: "#2070B8", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                Full Analytics <ArrowRight size={12} />
              </Link>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <VisitMap points={mapPoints} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

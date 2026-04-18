"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, Globe, Search, Mail,
  BarChart2, ChevronRight, Menu, X, LogOut,
  Settings, Eye, Plus, Layers, Navigation, Image as ImageIcon, Inbox,
  BookOpen, ClipboardList, Megaphone, GalleryHorizontal, PlayCircle,
  Activity, Shield, HardDrive,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    heading: "Content",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Pages", href: "/admin/pages", icon: FileText },
      { label: "Posts", href: "/admin/posts", icon: BookOpen },
      { label: "Forms", href: "/admin/forms", icon: ClipboardList },
      { label: "Media Library", href: "/admin/media", icon: ImageIcon },
      { label: "Gallery", href: "/admin/gallery", icon: GalleryHorizontal },
      { label: "Media Section", href: "/admin/media-section", icon: PlayCircle },
      { label: "Submissions", href: "/admin/submissions", icon: Inbox },
      { label: "Translations", href: "/admin/translations", icon: Globe },
    ],
  },
  {
    heading: "Design",
    items: [
      { label: "Site Editor", href: "/admin/site-editor", icon: Layers },
      { label: "Menu", href: "/admin/menu", icon: Navigation },
      { label: "Promotions", href: "/admin/promotions", icon: Megaphone },
    ],
  },
  {
    heading: "Optimize",
    items: [
      { label: "SEO Manager", href: "/admin/seo", icon: Search },
      { label: "Marketing", href: "/admin/marketing", icon: BarChart2 },
    ],
  },
  {
    heading: "Analytics & Security",
    items: [
      { label: "Visitor Analytics", href: "/admin/visit-analytics", icon: Activity },
      { label: "Audit Log",         href: "/admin/audit-log",        icon: Shield },
      { label: "Backup",            href: "/admin/backup",           icon: HardDrive },
    ],
  },
  {
    heading: "Settings",
    items: [
      { label: "Email Config", href: "/admin/email", icon: Mail },
      { label: "Site Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [username, setUsername] = useState("Admin");

  useEffect(() => {
    if (pathname === "/admin/login") { setChecking(false); return; }
    fetch("/api/admin/auth")
      .then((res) => {
        if (!res.ok) { router.replace("/admin/login"); return; }
        return res.json();
      })
      .then((data) => {
        if (data?.user?.username) setUsername(data.user.username);
        setChecking(false);
      })
      .catch(() => router.replace("/admin/login"));
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  };

  // Site editor runs full-screen — no sidebar or topbar
  if (pathname === "/admin/site-editor") return <>{children}</>;

  if (pathname === "/admin/login") return <>{children}</>;
  if (checking) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f1f5f9", fontFamily: "system-ui,sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #2070B8", borderTopColor: "transparent", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "#64748b", fontSize: 14 }}>Loading CMS…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "system-ui, -apple-system, sans-serif", background: "#f1f5f9" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width: 256,
        flexShrink: 0,
        background: "#0f172a",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0, bottom: 0,
        left: sidebarOpen ? 0 : "var(--sb-offset, 0)",
        zIndex: 50,
        transition: "left 0.25s ease",
        boxShadow: "2px 0 12px rgba(0,0,0,0.25)",
      }}
        className="admin-sidebar"
      >
        {/* Brand */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", fontWeight: 700, color: "#C0185A", textTransform: "uppercase", marginBottom: 3 }}>
                CMS Panel
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Wesley Paul</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>International Ministries</div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 4, display: "none" }}
              className="close-sidebar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ padding: "12px 12px 8px" }}>
          <Link
            href="/admin/pages/new"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 7,
              background: "rgba(32,112,184,0.18)",
              border: "1px solid rgba(32,112,184,0.35)",
              color: "#93c5fd", textDecoration: "none",
              fontSize: 13, fontWeight: 600,
              transition: "background 0.15s",
            }}
          >
            <Plus size={14} /> New Page
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "4px 0 12px" }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.heading} style={{ marginBottom: 4 }}>
              <div style={{ padding: "10px 16px 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                {section.heading}
              </div>
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "9px 16px",
                      color: active ? "#fff" : "rgba(255,255,255,0.55)",
                      background: active ? "rgba(32,112,184,0.2)" : "transparent",
                      borderLeft: `3px solid ${active ? "#2070B8" : "transparent"}`,
                      textDecoration: "none", fontSize: 13.5,
                      fontWeight: active ? 600 : 400,
                      transition: "all 0.12s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Icon size={15} style={{ opacity: active ? 1 : 0.7 }} />
                      {item.label}
                    </div>
                    {active && <ChevronRight size={12} style={{ opacity: 0.5 }} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "linear-gradient(135deg,#2070B8,#C0185A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{username}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Administrator</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                padding: "7px", borderRadius: 6,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 500,
                textDecoration: "none", cursor: "pointer",
              }}
            >
              <Eye size={13} /> View Site
            </a>
            <button
              onClick={handleLogout}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                padding: "7px", borderRadius: 6,
                background: "rgba(192,24,90,0.12)", border: "1px solid rgba(192,24,90,0.25)",
                color: "#fb7185", fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", marginLeft: 256 }} className="admin-main">
        {/* Top bar */}
        <header style={{
          height: 52, background: "#fff", borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", flexShrink: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4, display: "none" }}
              className="hamburger-btn"
            >
              <Menu size={20} />
            </button>
            {/* Breadcrumb */}
            <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b" }}>
              <Link href="/admin" style={{ color: "#2070B8", textDecoration: "none", fontWeight: 500 }}>CMS</Link>
              {pathname !== "/admin" && (
                <>
                  <ChevronRight size={13} style={{ opacity: 0.4 }} />
                  <span style={{ color: "#0f172a", fontWeight: 600, textTransform: "capitalize" }}>
                    {pathname.split("/admin/")[1]?.split("/")[0]?.replace(/-/g, " ") || ""}
                  </span>
                </>
              )}
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <a href="/" target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b", textDecoration: "none", padding: "5px 10px", borderRadius: 5, border: "1px solid #e2e8f0" }}>
              <Eye size={13} /> View Site
            </a>
            <Link href="/admin/pages/new"
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#fff", textDecoration: "none", padding: "5px 12px", borderRadius: 5, background: "#2070B8", fontWeight: 600 }}>
              <Plus size={13} /> New Page
            </Link>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#2070B8,#C0185A)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
              {username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar { --sb-offset: -256px; left: var(--sb-offset) !important; }
          .admin-sidebar.open { left: 0 !important; }
          .admin-main { margin-left: 0 !important; }
          .hamburger-btn { display: flex !important; }
          .close-sidebar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

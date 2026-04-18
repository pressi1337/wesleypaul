"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Menu, X, ChevronDown, Heart, ChevronRight, Check } from "lucide-react";
import { FacebookIcon, YoutubeIcon, InstagramIcon } from "./SocialIcons";
import LangSwitcher, { REGIONS } from "./LangSwitcher";

export interface NavItemData {
  id?: number;
  label: string;
  href: string;
  open_new_tab?: number;
  children?: { id?: number; label: string; href: string; open_new_tab?: number }[];
}

const DEFAULT_NAV_ITEMS: NavItemData[] = [
  { label: "HOME", href: "/" },
  {
    label: "ABOUT", href: "/who-we-are",
    children: [
      { label: "Dr. Wesley Paul's Bio", href: "/meet-wesley" },
      { label: "Who We Are", href: "/who-we-are" },
      { label: "What We Do", href: "/what-we-do" },
    ],
  },
  {
    label: "MINISTRIES", href: "/what-we-do",
    children: [
      { label: "Gospel Festivals", href: "/ministries/gospel-festivals" },
      { label: "Renewals & Revivals", href: "/ministries/renewals-revivals" },
      { label: "Evangelism Seminars", href: "/ministries/evangelism" },
      { label: "Marriage & Family Seminars", href: "/ministries/marriage-family" },
      { label: "Youth Outreach", href: "/ministries/youth-outreach" },
    ],
  },
  { label: "SERMONS", href: "/sermons" },
  { label: "CONTACT", href: "/contact" },
];

const socialLinks = [
  { icon: YoutubeIcon, href: "https://www.youtube.com/@DrWesleyPaul", label: "YouTube" },
  { icon: InstagramIcon, href: "https://www.instagram.com/drwesleypaul/", label: "Instagram" },
  { icon: FacebookIcon, href: "https://www.facebook.com/wesleypaul.org/", label: "Facebook" },
];

const NAV_BG     = "#ffffff";
const NAV_BORDER = "rgba(0,0,0,0.07)";
const ACCENT     = "#9B1030";
const ACCENT_DARK = "#720B23";
const DROP_BG    = "#ffffff";
const NAV_TEXT   = "#1B3A76";
const NAV_TEXT_MUTED = "rgba(27,58,118,0.55)";

/* ── Dropdown animation styles injected once ── */
const DROPDOWN_CSS = `
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.nav-dropdown { animation: dropIn 0.18s ease forwards; }
.nav-drop-item { transition: background 0.15s, padding-left 0.15s, color 0.15s; }
.nav-drop-item:hover { background: rgba(155,16,48,0.07) !important; padding-left: 22px !important; color: #9B1030 !important; }
`;

function DropdownMenu({ items }: { items: { label: string; href: string }[] }) {
  return (
    <div
      className="nav-dropdown absolute z-50"
      style={{
        top: "calc(100% + 2px)",
        left: "50%",
        transform: "translateX(-50%)",
        minWidth: "220px",
        backgroundColor: DROP_BG,
        borderRadius: "8px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)",
        border: "1px solid rgba(0,0,0,0.08)",
        overflow: "hidden",
        /* Extend hit area upward so mouse moving from button→dropdown doesn't miss */
        paddingTop: "0px",
      }}
    >
      {/* Arrow pointer */}
      <div style={{
        position: "absolute",
        top: "-6px",
        left: "50%",
        transform: "translateX(-50%)",
        width: 0,
        height: 0,
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderBottom: `6px solid ${DROP_BG}`,
        filter: "drop-shadow(0 -2px 2px rgba(0,0,0,0.06))",
      }} />

      {/* Accent top bar */}
      <div style={{ height: "3px", background: `linear-gradient(90deg, ${ACCENT}, #c0185a)` }} />

      {/* Items */}
      <div style={{ padding: "6px 0" }}>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="nav-drop-item"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 18px",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.03em",
              color: "#374151",
              textDecoration: "none",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <span>{item.label}</span>
            <ChevronRight size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
          </Link>
        ))}
      </div>
    </div>
  );
}

function NavLogo({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Wesley Paul International Ministries"
      style={{ height: "80px", width: "auto", display: "block", marginTop: "-8px", marginBottom: "-8px" }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo-nav.png"; }}
    />
  );
}

const STORAGE_KEY = "preferred_lang";

function MobileLangPanel({
  lang, pathname, router, onClose,
}: {
  lang: string;
  pathname: string;
  router: AppRouterInstance;
  onClose: () => void;
}) {
  const switchLang = (code: string) => {
    localStorage.setItem(STORAGE_KEY, code);
    const params = new URLSearchParams(window.location.search);
    if (code === "en") params.delete("lang"); else params.set("lang", code);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    onClose();
  };

  return (
    <div style={{ paddingTop: 14, borderTop: `1px solid ${NAV_BORDER}`, marginTop: 4 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
        Select Language
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {REGIONS.flatMap(r => r.languages.map(l => ({ ...l, flag: r.flag }))).map(l => {
          const active = lang === l.code;
          return (
            <button
              key={l.code}
              onClick={() => switchLang(l.code)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 14px", borderRadius: 8,
                background: active ? "rgba(27,58,118,0.08)" : "#f8fafc",
                border: `1px solid ${active ? "rgba(27,58,118,0.4)" : NAV_BORDER}`,
                color: active ? NAV_TEXT : "#475569",
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{l.flag}</span>
              <span>{l.nativeLabel}</span>
              {active && <Check size={12} style={{ color: NAV_TEXT, marginLeft: 2 }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Navbar({ items, logo }: { items?: NavItemData[]; logo?: string }) {
  const baseItems = items && items.length > 0 ? items : DEFAULT_NAV_ITEMS;
  const [displayItems, setDisplayItems] = useState<NavItemData[]>(baseItems);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParams = useSearchParams();
  const router   = useRouter();
  const pathname = usePathname();
  const [lang, setLang] = useState("en");
  useEffect(() => {
    setLang(searchParams.get("lang") ?? "en");
  }, [searchParams]);

  // Apply nav translations when language changes
  useEffect(() => {
    setDisplayItems(baseItems);
    if (lang === "en") return;
    fetch(`/api/nav-translations?lang=${lang}`)
      .then(r => r.json())
      .then((d: { items?: Array<{ id: number; label: string; href: string; parent_id: number | null }> }) => {
        if (!d.items) return;
        const trMap: Record<number, string> = {};
        d.items.forEach(i => { trMap[i.id] = i.label; });
        setDisplayItems(baseItems.map(item => ({
          ...item,
          label: (item.id && trMap[item.id]) ? trMap[item.id] : item.label,
          children: item.children?.map(child => ({
            ...child,
            label: (child.id && trMap[child.id]) ? trMap[child.id] : child.label,
          })),
        })));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const openMenu = (label: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(label);
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route navigation
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  return (
    <>
      <style>{DROPDOWN_CSS}</style>

      {/* Main Navbar */}
      <header
        ref={navRef}
        className="sticky top-0 z-50"
        style={{ backgroundColor: NAV_BG, borderBottom: `1px solid ${NAV_BORDER}`, overflow: "visible", boxShadow: "0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.05)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between" style={{ height: "72px" }}>

            {/* Logo */}
            <Link href="/" className="shrink-0">
              <NavLogo src={logo || "/logo-nav.png"} />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center" style={{ gap: "2px" }}>
              {displayItems.map((item) =>
                item.children && item.children.length > 0 ? (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => openMenu(item.label)}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "8px 14px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        color: openDropdown === item.label ? ACCENT : NAV_TEXT,
                        background: openDropdown === item.label ? "rgba(155,16,48,0.07)" : "none",
                        borderRadius: "4px",
                        border: "none",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "color 0.15s, background 0.15s",
                      }}
                    >
                      {item.label}
                      <ChevronDown
                        size={11}
                        style={{
                          transform: openDropdown === item.label ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s",
                          color: openDropdown === item.label ? ACCENT : NAV_TEXT_MUTED,
                        }}
                      />
                    </button>
                    {/* Active underline indicator */}
                    {openDropdown === item.label && (
                      <div style={{
                        position: "absolute",
                        bottom: 0,
                        left: "14px",
                        right: "14px",
                        height: "2px",
                        background: ACCENT,
                        borderRadius: "1px",
                      }} />
                    )}
                    {openDropdown === item.label && (
                      <>
                        {/* Transparent bridge fills the gap so mouse movement doesn't close menu */}
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, height: "10px" }} />
                        <DropdownMenu items={item.children!} />
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    style={{
                      display: "block",
                      padding: "8px 14px",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      color: NAV_TEXT,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      borderRadius: "4px",
                      transition: "color 0.15s, background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = ACCENT;
                      e.currentTarget.style.background = "rgba(155,16,48,0.07)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = NAV_TEXT;
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Right: socials + CTA */}
            <div className="hidden lg:flex items-center" style={{ gap: "8px" }}>
              <div
                className="flex items-center"
                style={{ gap: "12px", marginRight: "8px", paddingRight: "14px", borderRight: `1px solid ${NAV_BORDER}` }}
              >
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    style={{ color: NAV_TEXT_MUTED, transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = NAV_TEXT_MUTED)}
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>

              {/* Language switcher */}
              <LangSwitcher dark={true} />

              <Link
                href="/book"
                style={{
                  padding: "7px 14px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: NAV_TEXT,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  borderRadius: "4px",
                  border: `1px solid ${NAV_BORDER}`,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = ACCENT;
                  e.currentTarget.style.borderColor = ACCENT;
                  e.currentTarget.style.background = "rgba(155,16,48,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = NAV_TEXT;
                  e.currentTarget.style.borderColor = NAV_BORDER;
                  e.currentTarget.style.background = "none";
                }}
              >
                Book Dr. Wesley
              </Link>

              <Link
                href="/give"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  backgroundColor: ACCENT,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "12px",
                  letterSpacing: "0.03em",
                  textDecoration: "none",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                  transition: "background-color 0.2s, transform 0.15s",
                  boxShadow: `0 2px 12px rgba(155,16,48,0.4)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = ACCENT_DARK;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ACCENT;
                  e.currentTarget.style.transform = "none";
                }}
              >
                <Heart size={13} fill="currentColor" />
                Donate
              </Link>
            </div>

            {/* Mobile: Donate + hamburger */}
            <div className="flex lg:hidden items-center" style={{ gap: "8px" }}>
              <Link
                href="/give"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 22px",
                  backgroundColor: ACCENT,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "15px",
                  textDecoration: "none",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                  boxShadow: `0 2px 10px rgba(155,16,48,0.4)`,
                }}
              >
                <Heart size={15} fill="currentColor" />
                Donate
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 12px",
                  color: NAV_TEXT,
                  background: mobileOpen ? "rgba(27,58,118,0.07)" : "none",
                  border: `1px solid ${NAV_BORDER}`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div
            className="lg:hidden"
            style={{
              backgroundColor: DROP_BG,
              borderTop: `1px solid ${NAV_BORDER}`,
              boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            }}
          >
            {/* Accent stripe */}
            <div style={{ height: "2px", background: `linear-gradient(90deg, ${ACCENT}, transparent)` }} />

            <div style={{ padding: "8px 16px 16px" }}>
              {displayItems.map((item) =>
                item.children && item.children.length > 0 ? (
                  <div key={item.label} style={{ borderBottom: `1px solid ${NAV_BORDER}` }}>
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "13px 4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        color: mobileExpanded === item.label ? ACCENT : NAV_TEXT,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                    >
                      {item.label}
                      <ChevronDown
                        size={14}
                        style={{
                          transform: mobileExpanded === item.label ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s",
                          color: mobileExpanded === item.label ? ACCENT : NAV_TEXT_MUTED,
                        }}
                      />
                    </button>

                    {mobileExpanded === item.label && (
                      <div
                        style={{
                          marginBottom: "8px",
                          marginLeft: "4px",
                          paddingLeft: "14px",
                          borderLeft: `2px solid ${ACCENT}`,
                        }}
                      >
                        {item.children!.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "9px 8px",
                              fontSize: "13px",
                              fontWeight: 500,
                              color: "#475569",
                              textDecoration: "none",
                              borderRadius: "4px",
                              transition: "color 0.15s, background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = ACCENT;
                              e.currentTarget.style.background = "rgba(155,16,48,0.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#475569";
                              e.currentTarget.style.background = "none";
                            }}
                            onClick={() => setMobileOpen(false)}
                          >
                            <ChevronRight size={11} style={{ color: ACCENT, flexShrink: 0 }} />
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    style={{
                      display: "block",
                      padding: "13px 4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      color: NAV_TEXT,
                      textDecoration: "none",
                      borderBottom: `1px solid ${NAV_BORDER}`,
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}

              {/* Mobile Language Switcher */}
              <MobileLangPanel lang={lang} pathname={pathname} router={router} onClose={() => setMobileOpen(false)} />

              {/* Mobile CTAs */}
              <div style={{ paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  href="/book"
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "12px",
                    border: `1px solid ${NAV_BORDER}`,
                    color: NAV_TEXT,
                    fontWeight: 600,
                    fontSize: "13px",
                    textDecoration: "none",
                    borderRadius: "6px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(27,58,118,0.05)"; e.currentTarget.style.borderColor = NAV_TEXT; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = NAV_BORDER; }}
                  onClick={() => setMobileOpen(false)}
                >
                  Book Dr. Wesley
                </Link>
                <Link
                  href="/give"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "12px",
                    backgroundColor: ACCENT,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "13px",
                    textDecoration: "none",
                    borderRadius: "6px",
                    boxShadow: `0 4px 14px rgba(155,16,48,0.35)`,
                  }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Heart size={14} fill="currentColor" />
                  Give / Donate
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/+18598066424"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ChevronDown, Heart, Globe } from "lucide-react";
import { FacebookIcon, YoutubeIcon, InstagramIcon } from "./SocialIcons";

const aboutLinks = [
  { label: "Dr. Wesley Paul's Bio", href: "/meet-wesley" },
  { label: "Who We Are", href: "/who-we-are" },
  { label: "What We Do", href: "/what-we-do" },
];

const ministriesLinks = [
  { label: "Gospel Festivals", href: "/ministries/gospel-festivals" },
  { label: "Renewals & Revivals", href: "/ministries/renewals-revivals" },
  { label: "Evangelism Seminars", href: "/ministries/evangelism" },
  { label: "Marriage & Family Seminars", href: "/ministries/marriage-family" },
  { label: "Youth Outreach", href: "/ministries/youth-outreach" },
];

const navItems = [
  { label: "HOME", href: "/" },
  { label: "ABOUT", href: "/who-we-are", dropdown: aboutLinks },
  { label: "MINISTRIES", href: "/what-we-do", dropdown: ministriesLinks },
  { label: "SERMONS", href: "/sermons" },
  { label: "CONTACT", href: "/contact" },
];

const socialLinks = [
  { icon: YoutubeIcon, href: "https://www.youtube.com/@DrWesleyPaul", label: "YouTube" },
  { icon: InstagramIcon, href: "https://www.instagram.com/drwesleypaul/", label: "Instagram" },
  { icon: FacebookIcon, href: "https://www.facebook.com/wesleypaul.org/", label: "Facebook" },
];

const NAV_BG = "#0d1523";
const NAV_BORDER = "rgba(255,255,255,0.07)";

function DropdownMenu({ items }: { items: { label: string; href: string }[] }) {
  return (
    <div
      className="absolute top-full left-0 mt-0 w-56 z-50 shadow-2xl overflow-hidden"
      style={{ backgroundColor: "#12203a", borderTop: "3px solid #C0185A" }}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="block px-5 py-2.5 text-sm font-medium border-b transition-colors"
          style={{ color: "rgba(255,255,255,0.8)", borderColor: "rgba(255,255,255,0.07)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#C0185A";
            (e.currentTarget as HTMLElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)";
          }}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

/** Logo matching the real Wesley Paul globe mark */
function NavLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", userSelect: "none" }}>
      {/* Globe icon mark — matches the logo */}
      <div
        style={{
          position: "relative",
          width: "38px",
          height: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Globe size={32} strokeWidth={1.5} style={{ color: "#C0185A" }} />
      </div>
      {/* Wordmark */}
      <div style={{ lineHeight: 1 }}>
        <div
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: "1rem",
            letterSpacing: "0.01em",
            textTransform: "uppercase",
          }}
        >
          Wesley Paul
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.5rem",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginTop: "2px",
          }}
        >
          International Ministries
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      {/* Main Navbar */}
      <header
        ref={navRef}
        className="sticky top-0 z-50 shadow-lg"
        style={{ backgroundColor: NAV_BG, borderBottom: `1px solid ${NAV_BORDER}` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between" style={{ height: "70px" }}>

            {/* Logo */}
            <Link href="/" className="shrink-0">
              <NavLogo />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center" style={{ gap: "2px" }}>
              {navItems.map((item) =>
                item.dropdown ? (
                  <div
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(item.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "8px 14px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        color: openDropdown === item.label ? "#C0185A" : "rgba(255,255,255,0.85)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                      <ChevronDown
                        size={11}
                        style={{
                          transform: openDropdown === item.label ? "rotate(180deg)" : "none",
                          transition: "transform 0.2s",
                        }}
                      />
                    </button>
                    {openDropdown === item.label && <DropdownMenu items={item.dropdown} />}
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
                      letterSpacing: "0.06em",
                      color: "rgba(255,255,255,0.85)",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#C0185A")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Right: socials + CTA */}
            <div className="hidden lg:flex items-center" style={{ gap: "8px" }}>
              {/* Social icons */}
              <div
                className="flex items-center"
                style={{
                  gap: "10px",
                  marginRight: "8px",
                  paddingRight: "12px",
                  borderRight: `1px solid ${NAV_BORDER}`,
                }}
              >
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    style={{ color: "rgba(255,255,255,0.45)", transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>

              <Link
                href="/book"
                style={{
                  padding: "6px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: "rgba(255,255,255,0.7)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              >
                Book Dr. Wesley
              </Link>

              {/* Donate — CFAN red heart button */}
              <Link
                href="/give"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  backgroundColor: "#C0185A",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "13px",
                  textDecoration: "none",
                  borderRadius: "3px",
                  whiteSpace: "nowrap",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#960E47")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#C0185A")}
              >
                <Heart size={14} fill="currentColor" />
                Donate
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 rounded"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{ color: "#fff" }}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden" style={{ backgroundColor: "#12203a", borderTop: `1px solid ${NAV_BORDER}` }}>
            <div style={{ padding: "12px 16px" }}>
              {navItems.map((item) =>
                item.dropdown ? (
                  <div key={item.label}>
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        color: "rgba(255,255,255,0.85)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                    >
                      {item.label}
                      <ChevronDown size={14} style={{ transform: mobileExpanded === item.label ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                    </button>
                    {mobileExpanded === item.label && (
                      <div style={{ marginLeft: "16px", paddingLeft: "12px", borderLeft: "2px solid #C0185A" }}>
                        {item.dropdown.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            style={{ display: "block", padding: "8px 0", fontSize: "13px", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}
                            onClick={() => setMobileOpen(false)}
                          >
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
                      padding: "10px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      color: "rgba(255,255,255,0.85)",
                      textDecoration: "none",
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}
              <div style={{ paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link
                  href="/book"
                  style={{ display: "block", textAlign: "center", padding: "10px", border: "2px solid rgba(255,255,255,0.3)", color: "#fff", fontWeight: 600, fontSize: "13px", textDecoration: "none", borderRadius: "3px" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Book Dr. Wesley
                </Link>
                <Link
                  href="/give"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px", backgroundColor: "#C0185A", color: "#fff", fontWeight: 700, fontSize: "13px", textDecoration: "none", borderRadius: "3px" }}
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

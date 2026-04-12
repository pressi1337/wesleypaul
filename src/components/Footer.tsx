"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail, Phone, Clock } from "lucide-react";
import { FacebookIcon, YoutubeIcon, InstagramIcon, TwitterXIcon, TiktokIcon } from "./SocialIcons";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Who We Are", href: "/who-we-are" },
  { label: "Meet Dr. Wesley", href: "/meet-wesley" },
  { label: "What We Do", href: "/what-we-do" },
  { label: "Sermons", href: "/sermons" },
  { label: "Book Dr. Wesley", href: "/book" },
  { label: "Give / Donate", href: "/give" },
  { label: "Contact", href: "/contact" },
];

const ministryLinks = [
  { label: "Gospel Festivals", href: "/ministries/gospel-festivals" },
  { label: "Renewals & Revivals", href: "/ministries/renewals-revivals" },
  { label: "Marriage & Family Seminars", href: "/ministries/marriage-family" },
  { label: "Evangelism Seminars", href: "/ministries/evangelism" },
  { label: "Youth Outreach", href: "/ministries/youth-outreach" },
];

const social = [
  { icon: FacebookIcon, href: "https://www.facebook.com/wesleypaul.org/", label: "Facebook" },
  { icon: YoutubeIcon, href: "https://www.youtube.com/@DrWesleyPaul", label: "YouTube" },
  { icon: InstagramIcon, href: "https://www.instagram.com/drwesleypaul/", label: "Instagram" },
  { icon: TwitterXIcon, href: "https://twitter.com/DrWesleyPaul", label: "Twitter/X" },
  { icon: TiktokIcon, href: "https://www.tiktok.com/@DrWesleyPaul", label: "TikTok" },
];

const contactDetails = [
  { icon: MapPin, lines: ["P.O. Box 88, Springfield, KY 40069"] },
  { icon: Mail, lines: ["info@wesleypaul.org"], href: "mailto:info@wesleypaul.org" },
  { icon: Phone, lines: ["+1 (859) 806-6424"], href: "tel:+18598066424" },
  { icon: Clock, lines: ["Mon – Fri: 9:00 AM – 6:00 PM"] },
];

const FT = "rgba(255,255,255,0.55)";
const FT_HOVER = "#fff";
const BORDER = "rgba(255,255,255,0.08)";
const BG = "#0a1628";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: BG, color: "#fff" }}>
      {/* Top CTA strip */}
      <div style={{ backgroundColor: "#1B3A76", padding: "20px 24px" }}>
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: "15px", color: "#fff", margin: 0 }}>
            Partner with us — every gift reaches another soul with the Gospel.
          </p>
          <Link
            href="/give"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 24px",
              backgroundColor: "#9B1030",
              color: "#fff",
              fontWeight: 700,
              fontSize: "13px",
              borderRadius: "3px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#720B23")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#9B1030")}
          >
            Give Now
          </Link>
        </div>
      </div>

      {/* Main footer body */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "64px 24px 40px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "48px",
            marginBottom: "48px",
          }}
        >

          {/* ── Column 1: Brand ── */}
          <div style={{ gridColumn: "span 1" }}>
            {/* Logo */}
            <div style={{ marginBottom: "20px" }}>
              <Image
                src="/logo-nav.png"
                alt="Wesley Paul International Ministries"
                width={200}
                height={64}
                style={{ objectFit: "contain", display: "block" }}
              />
            </div>

            <p style={{ fontSize: "13px", lineHeight: 1.8, color: FT, marginBottom: "24px" }}>
              A global evangelistic ministry committed to proclaiming the life-transforming message
              of Jesus Christ and strengthening marriages and families across the world.
            </p>

            {/* Social icons */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {social.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.07)",
                    color: FT,
                    textDecoration: "none",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#9B1030";
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.color = FT;
                  }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* ── Column 2: Quick Links ── */}
          <div>
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#f5a623",
                marginBottom: "20px",
              }}
            >
              Quick Links
            </h4>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {quickLinks.map((l) => (
                <li key={l.href} style={{ marginBottom: "10px" }}>
                  <Link
                    href={l.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "13px",
                      color: FT,
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = FT_HOVER)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = FT)}
                  >
                    <span style={{ color: "#9B1030", fontSize: "14px", lineHeight: 1 }}>›</span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Ministries ── */}
          <div>
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#f5a623",
                marginBottom: "20px",
              }}
            >
              Ministries
            </h4>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {ministryLinks.map((l) => (
                <li key={l.href} style={{ marginBottom: "10px" }}>
                  <Link
                    href={l.href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "13px",
                      color: FT,
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = FT_HOVER)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = FT)}
                  >
                    <span style={{ color: "#9B1030", fontSize: "14px", lineHeight: 1 }}>›</span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Contact ── */}
          <div>
            <h4
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#f5a623",
                marginBottom: "20px",
              }}
            >
              Contact Us
            </h4>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {contactDetails.map(({ icon: Icon, lines, href }, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
                  <Icon size={14} style={{ color: "#9B1030", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    {lines.map((line) =>
                      href ? (
                        <a
                          key={line}
                          href={href}
                          style={{ display: "block", fontSize: "13px", color: FT, textDecoration: "none", transition: "color 0.2s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = FT_HOVER)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = FT)}
                        >
                          {line}
                        </a>
                      ) : (
                        <span key={line} style={{ display: "block", fontSize: "13px", color: FT }}>{line}</span>
                      )
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/book"
              style={{
                display: "inline-block",
                marginTop: "8px",
                padding: "9px 20px",
                backgroundColor: "#1B3A76",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                textDecoration: "none",
                borderRadius: "3px",
                border: "1px solid rgba(255,255,255,0.15)",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a5a9a")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1B3A76")}
            >
              Book Dr. Wesley
            </Link>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          style={{
            borderTop: `1px solid ${BORDER}`,
            paddingTop: "24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: 0 }}>
            &copy; {new Date().getFullYear()} Wesley Paul International Ministries. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "20px" }}>
            {["Privacy Policy", "Terms of Use", "Contact"].map((label, i) => (
              <Link
                key={label}
                href="/contact"
                style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

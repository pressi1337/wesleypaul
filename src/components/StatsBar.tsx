"use client";

import { FacebookIcon, YoutubeIcon, InstagramIcon } from "./SocialIcons";

const followLinks = [
  { icon: FacebookIcon, href: "https://www.facebook.com/wesleypaul.org/", label: "Facebook" },
  { icon: YoutubeIcon, href: "https://www.youtube.com/@DrWesleyPaul", label: "YouTube" },
  { icon: InstagramIcon, href: "https://www.instagram.com/drwesleypaul/", label: "Instagram" },
];

export default function StatsBar() {
  return (
    <section
      style={{
        backgroundColor: "#fff",
        borderBottom: "1px solid #e9ecef",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Counter */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span
            style={{
              fontSize: "2.25rem",
              fontWeight: 800,
              lineHeight: 1,
              color: "#0d1523",
            }}
          >
            30+
          </span>
          <div
            style={{
              width: "1px",
              alignSelf: "stretch",
              backgroundColor: "#e9ecef",
            }}
          />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#6c757d" }}>
            Nations Served &amp; Thousands of Souls Transformed Through the Gospel
          </span>
        </div>

        {/* Follow icons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#6c757d",
              marginRight: "4px",
            }}
          >
            Follow
          </span>
          {followLinks.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #e9ecef",
                color: "#6c757d",
                textDecoration: "none",
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#C0185A";
                (e.currentTarget as HTMLElement).style.color = "#C0185A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#e9ecef";
                (e.currentTarget as HTMLElement).style.color = "#6c757d";
              }}
            >
              <Icon size={16} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

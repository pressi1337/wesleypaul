"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { FacebookIcon, YoutubeIcon, InstagramIcon } from "./SocialIcons";
import { translateBatch } from "@/lib/translate-client";

export interface StatsBarData {
  count?: string;
  tagline?: string;
  social?: { facebook?: string; youtube?: string; instagram?: string };
}

const DEFAULT_TAGLINE = "Nations Served & Thousands of Souls Transformed Through the Gospel";
const DEFAULT_FOLLOW = "Follow";

export default function StatsBar({ data }: { data?: StatsBarData }) {
  const [liveData, setLiveData] = useState(data);
  const count = liveData?.count ?? "30+";
  const baseTagline = liveData?.tagline ?? DEFAULT_TAGLINE;
  const [tagline, setTagline] = useState(baseTagline);
  const [followLabel, setFollowLabel] = useState(DEFAULT_FOLLOW);
  const prevTaglineRef = useRef(baseTagline);

  // Keep tagline in sync when liveData changes via preview
  useEffect(() => {
    if (prevTaglineRef.current !== baseTagline) {
      prevTaglineRef.current = baseTagline;
      setTagline(baseTagline);
    }
  }, [baseTagline]);

  // Live preview listener for Site Editor
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as { type?: string; key?: string; data?: unknown };
      if (msg?.type === "PREVIEW_DRAFT" && msg.key === "home_stats_bar") {
        setLiveData(msg.data as StatsBarData);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const searchParams = useSearchParams();
  const [lang, setLang] = useState("en");
  useEffect(() => { setLang(searchParams.get("lang") ?? "en"); }, [searchParams]);

  useEffect(() => {
    if (lang === "en") { setTagline(baseTagline); setFollowLabel(DEFAULT_FOLLOW); return; }
    const cacheKey = `statsbar_tr_v4_${lang}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) { const c = JSON.parse(cached) as { tagline: string; follow: string }; setTagline(c.tagline); setFollowLabel(c.follow); return; }
    } catch { /* ignore */ }
    if (window.self !== window.top) return; // preview: only show saved translations
    translateBatch([baseTagline, DEFAULT_FOLLOW], lang)
      .then((results) => {
        const t = results[0] ?? baseTagline;
        const f = results[1] ?? DEFAULT_FOLLOW;
        setTagline(t); setFollowLabel(f);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ tagline: t, follow: f })); } catch { /* ignore */ }
      }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);
  const followLinks = [
    { icon: FacebookIcon, href: liveData?.social?.facebook || "https://www.facebook.com/wesleypaul.org/", label: "Facebook" },
    { icon: YoutubeIcon, href: liveData?.social?.youtube || "https://www.youtube.com/@DrWesleyPaul", label: "YouTube" },
    { icon: InstagramIcon, href: liveData?.social?.instagram || "https://www.instagram.com/drwesleypaul/", label: "Instagram" },
  ];
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
            {count}
          </span>
          <div
            style={{
              width: "1px",
              alignSelf: "stretch",
              backgroundColor: "#e9ecef",
            }}
          />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#6c757d" }}>
            {tagline}
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
            {followLabel}
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

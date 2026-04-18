"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { translateBatch } from "@/lib/translate-client";

export interface EndorsementItem {
  quote: string;
  name: string;
  title: string;
  initials: string;
  color: string;
}

const DEFAULT_ENDORSEMENTS: EndorsementItem[] = [
  {
    quote: "Wesley Paul is a gifted evangelist who has a deep passion for the lost. His ministry is marked by integrity, excellence, and genuine compassion for every soul he encounters.",
    name: "Luis Palau",
    title: "President, Luis Palau Evangelistic Association",
    initials: "LP",
    color: "#2070B8",
  },
  {
    quote: "I have known Wesley Paul for many years. He is a man of God, a man of prayer, and a man with a genuine burden for the lost that is evident in every ministry he undertakes.",
    name: "Dr. Lon Allison",
    title: "Former Executive Director, Billy Graham Center at Wheaton",
    initials: "LA",
    color: "#C0185A",
  },
  {
    quote: "Dr. Wesley Paul brings theological depth combined with evangelistic urgency. His ministry has impacted thousands across the globe and continues to bear lasting fruit.",
    name: "Dr. Ramesh Richard",
    title: "President, RREACH — Dallas Theological Seminary",
    initials: "RR",
    color: "#0a7c52",
  },
  {
    quote: "Wesley Paul's Gospel Festival in Nairobi was one of the most powerful evangelistic events our city has seen in recent years. Lives were genuinely and permanently changed.",
    name: "Bishop Arthur Kitonga",
    title: "Founder, Redeemed Gospel Churches, Nairobi",
    initials: "AK",
    color: "#7c3a9b",
  },
  {
    quote: "I have watched Wesley grow into a powerful man of God. His heart for the Gospel and for people is absolutely genuine — he lives what he preaches.",
    name: "Dr. Don Wilton",
    title: "Billy Graham's Pastor, First Baptist Church",
    initials: "DW",
    color: "#c0622b",
  },
];

export default function EndorsementsSection({ items }: { items?: EndorsementItem[] }) {
  const baseEndorsements = items && items.length > 0 ? items : DEFAULT_ENDORSEMENTS;
  const [endorsements, setEndorsements] = useState<EndorsementItem[]>(baseEndorsements);
  const [sectionLabel, setSectionLabel] = useState("Endorsements");
  const [sectionHeading, setSectionHeading] = useState("Trusted by Global Leaders");
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const searchParams = useSearchParams();
  const [lang, setLang] = useState("en");
  useEffect(() => { setLang(searchParams.get("lang") ?? "en"); }, [searchParams]);

  useEffect(() => {
    if (lang === "en") {
      setEndorsements(baseEndorsements);
      setSectionLabel("Endorsements");
      setSectionHeading("Trusted by Global Leaders");
      return;
    }
    const cacheKey = `endorsements_tr_v4_${lang}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const c = JSON.parse(cached) as { endorsements: EndorsementItem[]; label: string; heading: string };
        setEndorsements(c.endorsements); setSectionLabel(c.label); setSectionHeading(c.heading);
        return;
      }
    } catch { /* ignore */ }

    // Flatten: [label, heading, quote0, title0, quote1, title1, ...]
    const texts = [
      "Endorsements",
      "Trusted by Global Leaders",
      ...baseEndorsements.flatMap(e => [e.quote, e.title]),
    ];

    if (window.self !== window.top) return; // preview: only show saved translations
    translateBatch(texts, lang)
      .then((results) => {
        const label = results[0] ?? "Endorsements";
        const heading = results[1] ?? "Trusted by Global Leaders";
        let idx = 2;
        const trEndorsements: EndorsementItem[] = baseEndorsements.map(e => ({
          ...e,
          quote: results[idx++] ?? e.quote,
          title: results[idx++] ?? e.title,
        }));
        setEndorsements(trEndorsements); setSectionLabel(label); setSectionHeading(heading);
        try { sessionStorage.setItem(cacheKey, JSON.stringify({ endorsements: trEndorsements, label, heading })); } catch { /* ignore */ }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Live preview listener for Site Editor
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as { type?: string; key?: string; data?: unknown };
      if (msg?.type === "PREVIEW_DRAFT" && msg.key === "home_endorsements" && Array.isArray(msg.data)) {
        setEndorsements(msg.data as EndorsementItem[]);
        setCurrent(0);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (isAnimating) return;
      setDirection(dir === 1 ? "right" : "left");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrent((c) => (c + dir + endorsements.length) % endorsements.length);
        setIsAnimating(false);
      }, 250);
    },
    [isAnimating, endorsements.length]
  );

  useEffect(() => {
    const t = setInterval(() => go(1), 7000);
    return () => clearInterval(t);
  }, [go]);

  const e = endorsements[current];

  return (
    <section
      style={{
        padding: "96px 24px",
        background: "linear-gradient(160deg, #0a1628 0%, #0d1b2e 50%, #111e35 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorative cross */}
      <div
        style={{
          position: "absolute",
          right: "-80px",
          top: "50%",
          transform: "translateY(-50%)",
          opacity: 0.03,
          pointerEvents: "none",
        }}
      >
        <svg width="400" height="400" viewBox="0 0 100 100" fill="white">
          <rect x="42" y="5" width="16" height="90" />
          <rect x="5" y="35" width="90" height="16" />
        </svg>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#f5a623",
              display: "block",
              marginBottom: "12px",
            }}
          >
            {sectionLabel}
          </span>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
            }}
          >
            {sectionHeading}
          </h2>
          <div
            style={{
              width: "50px",
              height: "3px",
              backgroundColor: "#C0185A",
              margin: "16px auto 0",
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Carousel card */}
        <div
          style={{
            position: "relative",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "16px",
            padding: "clamp(32px, 5vw, 64px)",
            backdropFilter: "blur(8px)",
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating
              ? `translateX(${direction === "right" ? "20px" : "-20px"})`
              : "translateX(0)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
          }}
        >
          {/* Large quote mark */}
          <div style={{ marginBottom: "24px" }}>
            <Quote
              size={48}
              style={{
                color: "#C0185A",
                opacity: 0.7,
                transform: "scaleX(-1)",
              }}
              fill="#C0185A"
            />
          </div>

          {/* Quote text */}
          <blockquote
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              fontStyle: "italic",
              color: "rgba(255,255,255,0.88)",
              lineHeight: 1.8,
              marginBottom: "40px",
              fontWeight: 400,
            }}
          >
            {e.quote}
          </blockquote>

          {/* Divider */}
          <div
            style={{
              width: "40px",
              height: "2px",
              backgroundColor: "#C0185A",
              marginBottom: "24px",
            }}
          />

          {/* Author */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Initials avatar */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: e.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: `0 0 0 3px rgba(255,255,255,0.1)`,
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "16px",
                  letterSpacing: "0.05em",
                }}
              >
                {e.initials}
              </span>
            </div>
            <div>
              <p style={{ color: "#ffffff", fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>
                {e.name}
              </p>
              <p style={{ color: "#f5a623", fontSize: "13px", fontWeight: 500 }}>{e.title}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "40px",
          }}
        >
          {/* Prev arrow */}
          <button
            onClick={() => go(-1)}
            aria-label="Previous"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.15)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#C0185A";
              (e.currentTarget as HTMLElement).style.borderColor = "#C0185A";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
            }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* Dots */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {endorsements.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (!isAnimating) {
                    setDirection(i > current ? "right" : "left");
                    setIsAnimating(true);
                    setTimeout(() => {
                      setCurrent(i);
                      setIsAnimating(false);
                    }, 250);
                  }
                }}
                aria-label={`Go to endorsement ${i + 1}`}
                style={{
                  width: i === current ? "28px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  backgroundColor: i === current ? "#C0185A" : "rgba(255,255,255,0.25)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={() => go(1)}
            aria-label="Next"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.15)",
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "#fff",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#C0185A";
              (e.currentTarget as HTMLElement).style.borderColor = "#C0185A";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Counter */}
        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.1em",
          }}
        >
          {current + 1} / {endorsements.length}
        </p>
      </div>
    </section>
  );
}

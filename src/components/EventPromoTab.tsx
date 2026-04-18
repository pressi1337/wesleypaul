"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X, CalendarDays, ChevronRight } from "lucide-react";
import type { EventPromoTabConfig } from "@/app/api/event-promo-tab/route";

function formatDate(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function EventPromoTab() {
  const pathname     = usePathname();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [config, setConfig]     = useState<EventPromoTabConfig | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => {
    setMounted(true);
    if (pathname?.startsWith("/admin")) return;

    fetch("/api/event-promo-tab")
      .then(r => r.json())
      .then((d: { config?: EventPromoTabConfig }) => {
        if (d.config) setConfig(d.config);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const collapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(false);
  };

  const navigate = () => router.push(config?.cta_href || "/events");

  if (!mounted || pathname?.startsWith("/admin")) return null;
  if (!config?.enabled) return null;
  if (pathname === (config.cta_href || "/events")) return null;

  const urlLang = searchParams.get("lang") || "en";
  const lang = (urlLang !== "en" && config.translations?.[urlLang]) || {};

  const tabLabel = lang.tab_label || config.tab_label || "Events";
  const title    = lang.title     || config.title     || "";
  const subtitle = lang.subtitle  || config.subtitle  || "";
  const ctaLabel = lang.cta_label || config.cta_label || "View Details";
  const dateStr  = formatDate(config.event_date);
  const imgUrl   = config.image_url || "";

  if (!title && !imgUrl) return null;

  return (
    <>
      <style>{`
        @keyframes promoTabGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(155,16,48,0); }
          50%       { box-shadow: 0 0 0 10px rgba(155,16,48,0.25); }
        }
        @keyframes promoDotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.35; transform: scale(0.65); }
        }
        @keyframes promoSlideIn {
          from { opacity: 0; transform: translateX(80px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes promoExpand {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .event-promo-root    { animation: promoSlideIn 0.55s cubic-bezier(0.34,1.3,0.64,1) 0.8s both; }
        .event-promo-trigger { animation: promoTabGlow 2.2s ease-in-out infinite; }
        .event-promo-dot     { animation: promoDotPulse 1.1s ease-in-out infinite; }
        .event-promo-panel   { animation: promoExpand 0.28s ease-out; }
        .event-promo-cta:hover { background: #720B23 !important; }
      `}</style>

      <div
        className="event-promo-root"
        style={{
          position: "fixed", right: 0, top: "50%", transform: "translateY(-50%)",
          zIndex: 9990, display: "flex", alignItems: "stretch",
          filter: "drop-shadow(-6px 4px 22px rgba(0,0,0,0.25))",
        }}
      >
        {expanded && (
          <div
            className="event-promo-panel"
            style={{
              background: "linear-gradient(155deg,#0f2454 0%,#1B3A76 55%,#6b0e20 130%)",
              borderRadius: "16px 0 0 16px",
              padding: "20px 18px 20px 20px",
              display: "flex", flexDirection: "column", gap: 10,
              width: 272, overflow: "hidden", position: "relative",
            }}
          >
            <button onClick={collapse} aria-label="Collapse" style={{
              position: "absolute", top: 10, right: 10, width: 24, height: 24,
              borderRadius: "50%", background: "rgba(255,255,255,0.14)", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
            }}>
              <X size={13} />
            </button>

            {imgUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={imgUrl} alt={title} style={{ width: "100%", height: 108, objectFit: "cover", borderRadius: 10, display: "block" }} />
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="event-promo-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#f5a623", flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
                Upcoming Event
              </span>
            </div>

            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {title}
            </p>

            {subtitle && (
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{subtitle}</p>
            )}

            {dateStr && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#f5a623", fontSize: 11, fontWeight: 600 }}>
                <CalendarDays size={12} /> {dateStr}
              </div>
            )}

            <button className="event-promo-cta" onClick={navigate} style={{
              marginTop: 2, background: "#9B1030", border: "none", borderRadius: 8,
              padding: "9px 14px", color: "#fff", fontSize: 12, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, transition: "background 0.15s",
            }}>
              {ctaLabel} <ChevronRight size={14} />
            </button>
          </div>
        )}

        <button className="event-promo-trigger" onClick={() => setExpanded(v => !v)} aria-label="Toggle event promotion" style={{
          background: "linear-gradient(180deg,#9B1030 0%,#1B3A76 100%)",
          border: "none", cursor: "pointer", width: 36,
          borderRadius: expanded ? "0" : "10px 0 0 10px",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 8, padding: "18px 0", position: "relative",
        }}>
          <span className="event-promo-dot" style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: "50%", background: "#f5a623" }} />
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fff", writingMode: "vertical-rl", transform: "rotate(180deg)", userSelect: "none" }}>
            {tabLabel}
          </span>
          <CalendarDays size={15} color="#fff" style={{ flexShrink: 0 }} />
        </button>
      </div>
    </>
  );
}

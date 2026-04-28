"use client";
import { useState, useEffect } from "react";

interface VideoItem { url?: string; title?: string; thumbnail?: string; }

interface Props {
  videos: VideoItem[];
  heading?: string;
  subtitle?: string;
  bgLight?: boolean;
}

export default function VideoGridClient({ videos, heading, subtitle, bgLight = true }: Props) {
  const [active, setActive] = useState<VideoItem | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);

  const filtered = videos.filter(v => v.url);

  return (
    <section style={{ padding: "80px 24px", backgroundColor: bgLight ? "#f8f9fa" : "#0a1523" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {(heading || subtitle) && (
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            {heading && (
              <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)", fontWeight: 700, color: bgLight ? "#2070B8" : "#fff", marginBottom: 12 }}>
                {heading}
              </h2>
            )}
            <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
            {subtitle && (
              <p style={{ color: bgLight ? "#6c757d" : "rgba(255,255,255,0.7)", maxWidth: 600, margin: "16px auto 0", lineHeight: 1.8 }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,340px),1fr))", gap: "2rem" }}>
          {filtered.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(v)}
              style={{
                all: "unset",
                cursor: "pointer",
                borderRadius: 12,
                overflow: "hidden",
                display: "block",
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 36px rgba(0,0,0,0.22)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.15)"; }}
            >
              <div style={{ position: "relative", aspectRatio: "16/9", backgroundColor: "#0a1523", overflow: "hidden" }}>
                {v.thumbnail
                  ? <img src={v.thumbnail} alt={v.title || "Video"} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#0a1523 0%,#1e3a5f 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 48, opacity: 0.25 }}>🎬</span>
                    </div>
                }
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.28)" }}>
                  <div style={{ width: 68, height: 68, borderRadius: "50%", backgroundColor: "#C0185A", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(192,24,90,0.55)" }}>
                    <span style={{ color: "#fff", fontSize: 26, marginLeft: 5, lineHeight: 1 }}>▶</span>
                  </div>
                </div>
              </div>
              {v.title && (
                <div style={{ padding: "12px 16px", backgroundColor: bgLight ? "#fff" : "#0f1e32" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: bgLight ? "#2070B8" : "#e2e8f0", margin: 0, textAlign: "left" }}>{v.title}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      {active && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setActive(null)}
        >
          <div style={{ width: "100%", maxWidth: 960, position: "relative" }} onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActive(null)}
              style={{
                position: "absolute", top: -48, right: 0,
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff", fontSize: 18, cursor: "pointer", borderRadius: "50%",
                width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
                lineHeight: 1, fontWeight: 700,
              }}
            >
              ✕
            </button>
            <video
              key={active.url}
              controls
              autoPlay
              style={{ width: "100%", borderRadius: 10, display: "block", maxHeight: "80vh", backgroundColor: "#000", boxShadow: "0 20px 60px rgba(0,0,0,0.7)" }}
            >
              <source src={active.url} type="video/mp4" />
            </video>
            {active.title && (
              <p style={{ color: "rgba(255,255,255,0.85)", textAlign: "center", marginTop: 14, fontSize: 15, fontWeight: 600 }}>
                {active.title}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

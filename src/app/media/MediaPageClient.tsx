"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "@/components/HomeMediaSection";
import { MediaCard } from "@/components/HomeMediaSection";
import { translateBatch } from "@/lib/translate-client";

const PAGE_SIZE = 9;

/* ── Lightbox ─────────────────────────────────────────────────────────────── */
function MediaModal({ embedUrl, title, onClose }: { embedUrl: string; title: string; onClose: () => void }) {
  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 900 }}>
        <button onClick={onClose}
          style={{ position: "absolute", top: -40, right: 0, background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
          <X size={18} /> Close
        </button>
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 8, overflow: "hidden", background: "#000" }}>
          <iframe src={embedUrl} title={title} frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        </div>
        {title && <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 12, textAlign: "center" }}>{title}</p>}
      </div>
    </div>
  );
}

function detectType(url: string) {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/instagram\.com/.test(url)) return "instagram";
  return "other";
}

function getEmbedUrl(url: string): string | null {
  if (detectType(url) === "youtube") {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0`;
  }
  return null;
}

/* ── Pagination component ─────────────────────────────────────────────────── */
function Pagination({ page, total, pageSize, onChange, labelPrev = "Prev", labelNext = "Next" }: { page: number; total: number; pageSize: number; onChange: (p: number) => void; labelPrev?: string; labelNext?: string }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const btn: React.CSSProperties = {
    minWidth: 38, height: 38, border: "1.5px solid #e2e8f0", borderRadius: 8,
    background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    color: "#374151", transition: "all 0.12s",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 48, flexWrap: "wrap" }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ ...btn, opacity: page === 1 ? 0.35 : 1, padding: "0 12px", gap: 4 }}>
        <ChevronLeft size={15} /> {labelPrev}
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} style={{ minWidth: 38, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>…</span>
        ) : (
          <button key={p} onClick={() => onChange(p as number)}
            style={{ ...btn, background: p === page ? "#C0185A" : "#fff", color: p === page ? "#fff" : "#374151", borderColor: p === page ? "#C0185A" : "#e2e8f0", boxShadow: p === page ? "0 2px 8px rgba(192,24,90,0.25)" : "none" }}>
            {p}
          </button>
        )
      )}

      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        style={{ ...btn, opacity: page === totalPages ? 0.35 : 1, padding: "0 12px", gap: 4 }}>
        {labelNext} <ChevronRight size={15} />
      </button>

      <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </span>
    </div>
  );
}

/* ── Filter tabs ──────────────────────────────────────────────────────────── */
const FILTERS = ["All", "YouTube", "Instagram", "Other"] as const;
type Filter = typeof FILTERS[number];

function filterItems(items: MediaItem[], filter: Filter) {
  if (filter === "All") return items;
  return items.filter(i => {
    const t = detectType(i.url);
    if (filter === "YouTube")   return t === "youtube";
    if (filter === "Instagram") return t === "instagram";
    return t === "other";
  });
}

const RAW_DESC = "Sermons, Gospel festivals, ministry highlights and more from Dr. Wesley Paul International Ministries.";
const RAW_UI   = ["All", "No media yet", "Videos will appear here once they're added.", "No videos found.", "View All", "Prev", "Next"] as const;

/* ── Main ─────────────────────────────────────────────────────────────────── */
interface Props {
  items: MediaItem[];
  heading: string;
  eyebrow: string;
  savedTranslations?: Record<string, { heading?: string; eyebrow?: string; cta_label?: string; items?: Record<string, string> }>;
}

export default function MediaPageClient({ items, heading, eyebrow, savedTranslations = {} }: Props) {
  const [activeEmbed, setActiveEmbed]   = useState<{ url: string; title: string } | null>(null);
  const [filter, setFilter]             = useState<Filter>("All");
  const [page, setPage]                 = useState(1);

  const searchParams = useSearchParams();
  const [lang, setLang] = useState("en");
  useEffect(() => { setLang(searchParams.get("lang") ?? "en"); }, [searchParams]);

  const [trHeading, setTrHeading] = useState(heading);
  const [trEyebrow, setTrEyebrow] = useState(eyebrow);
  const [trDesc,    setTrDesc]    = useState(RAW_DESC);
  const [trAll,     setTrAll]     = useState("All");
  const [trNoMedia, setTrNoMedia] = useState("No media yet");
  const [trNoItems, setTrNoItems] = useState("Videos will appear here once they're added.");
  const [trNone,    setTrNone]    = useState("No videos found.");
  const [trViewAll, setTrViewAll] = useState("View All");
  const [trPrev,    setTrPrev]    = useState("Prev");
  const [trNext,    setTrNext]    = useState("Next");

  useEffect(() => {
    if (lang === "en") {
      setTrHeading(heading); setTrEyebrow(eyebrow); setTrDesc(RAW_DESC);
      setTrAll("All"); setTrNoMedia("No media yet"); setTrNoItems("Videos will appear here once they're added.");
      setTrNone("No videos found."); setTrViewAll("View All"); setTrPrev("Prev"); setTrNext("Next");
      return;
    }
    const cacheKey = `media_page_tr_v1_${lang}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const c = JSON.parse(cached) as string[];
        setTrHeading(c[0]); setTrEyebrow(c[1]); setTrDesc(c[2]);
        setTrAll(c[3]); setTrNoMedia(c[4]); setTrNoItems(c[5]); setTrNone(c[6]); setTrViewAll(c[7]); setTrPrev(c[8]); setTrNext(c[9]);
        return;
      }
    } catch { /* ignore */ }
    translateBatch([heading, eyebrow, RAW_DESC, ...RAW_UI], lang)
      .then(r => {
        const vals = [r[0]??heading, r[1]??eyebrow, r[2]??RAW_DESC, r[3]??"All", r[4]??"No media yet", r[5]??RAW_UI[2], r[6]??"No videos found.", r[7]??"View All", r[8]??"Prev", r[9]??"Next"];
        setTrHeading(vals[0]); setTrEyebrow(vals[1]); setTrDesc(vals[2]);
        setTrAll(vals[3]); setTrNoMedia(vals[4]); setTrNoItems(vals[5]); setTrNone(vals[6]); setTrViewAll(vals[7]); setTrPrev(vals[8]); setTrNext(vals[9]);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(vals)); } catch { /* ignore */ }
      }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Translate item titles — prefer admin-saved translations
  const [trTitles, setTrTitles] = useState<string[]>(items.map(i => i.title));
  useEffect(() => {
    if (lang === "en" || items.length === 0) { setTrTitles(items.map(i => i.title)); return; }
    const savedItems = savedTranslations[lang]?.items ?? {};
    const allSaved = items.every(i => savedItems[i.id ?? ""]);
    if (allSaved) { setTrTitles(items.map(i => savedItems[i.id ?? ""] ?? i.title)); return; }
    const titles = items.map(i => i.title);
    const cacheKey = `media_page_titles_tr_v1_${lang}_${titles.map(t => t.slice(0,8)).join("|")}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const c = JSON.parse(cached) as string[];
        setTrTitles(items.map((item, i) => savedItems[item.id ?? ""] ?? c[i] ?? item.title));
        return;
      }
    } catch { /* ignore */ }
    const needTranslate = items.map(i => savedItems[i.id ?? ""] ? "" : i.title);
    translateBatch(needTranslate.filter(Boolean), lang)
      .then(results => {
        let ri = 0;
        const tr = items.map(item => {
          if (savedItems[item.id ?? ""]) return savedItems[item.id ?? ""];
          return results[ri++] ?? item.title;
        });
        setTrTitles(tr);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(tr)); } catch { /* ignore */ }
      }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const handlePlay = useCallback((item: MediaItem) => {
    const type = detectType(item.url);
    if (item.play_mode === "external" || type === "instagram") {
      window.open(item.url, "_blank", "noopener,noreferrer");
      return;
    }
    const embedUrl = getEmbedUrl(item.url);
    if (embedUrl) setActiveEmbed({ url: embedUrl, title: item.title });
    else window.open(item.url, "_blank", "noopener,noreferrer");
  }, []);

  const changeFilter = (f: Filter) => { setFilter(f); setPage(1); };

  const displayItems = items.map((item, i) => ({ ...item, title: trTitles[i] ?? item.title }));
  const filtered = filterItems(displayItems, filter);
  const paged    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const countFor = (f: Exclude<Filter, "All">) => filterItems(items, f).length;

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(135deg,#0a1628 0%,#0f2040 55%,#1a0f38 100%)", padding: "80px 24px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 350, background: "radial-gradient(ellipse,rgba(192,24,90,0.13) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <span style={{ display: "inline-block", padding: "5px 16px", borderRadius: 20, background: "rgba(245,166,35,0.15)", color: "#f5a623", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
            {trEyebrow}
          </span>
          <h1 style={{ fontSize: "clamp(1.9rem,4.5vw,3rem)", fontWeight: 800, color: "#fff", marginBottom: 18, lineHeight: 1.15 }}>
            {trHeading}
          </h1>
          <div style={{ width: 48, height: 3, background: "#C0185A", borderRadius: 2, margin: "0 auto 22px" }} />
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto" }}>
            {trDesc}
          </p>
        </div>
      </section>

      {/* ── Video listing (white bg) ─────────────────────────────────────── */}
      <section style={{ background: "#fff", padding: "56px 24px 80px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>

          {/* Filter tabs */}
          {items.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
              <button onClick={() => changeFilter("All")}
                style={{ padding: "8px 22px", borderRadius: 20, border: `1.5px solid ${filter === "All" ? "#C0185A" : "#e2e8f0"}`, cursor: "pointer", fontSize: 13, fontWeight: 700, background: filter === "All" ? "#C0185A" : "#fff", color: filter === "All" ? "#fff" : "#374151", transition: "all 0.12s" }}>
                {trAll} ({items.length})
              </button>
              {(["YouTube", "Instagram", "Other"] as const).map(f => {
                const c = countFor(f);
                if (c === 0) return null;
                return (
                  <button key={f} onClick={() => changeFilter(f)}
                    style={{ padding: "8px 22px", borderRadius: 20, border: `1.5px solid ${filter === f ? "#C0185A" : "#e2e8f0"}`, cursor: "pointer", fontSize: 13, fontWeight: 700, background: filter === f ? "#C0185A" : "#fff", color: filter === f ? "#fff" : "#374151", transition: "all 0.12s" }}>
                    {f} ({c})
                  </button>
                );
              })}
            </div>
          )}

          {/* Grid */}
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>🎬</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 10 }}>{trNoMedia}</h3>
              <p style={{ color: "#94a3b8", fontSize: 15 }}>{trNoItems}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "#94a3b8", fontSize: 15 }}>{trNone}</p>
              <button onClick={() => changeFilter("All")} style={{ marginTop: 14, padding: "8px 20px", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 13, background: "#fff", color: "#374151" }}>
                {trViewAll}
              </button>
            </div>
          ) : (
            <>
              {/* Media grid — dark cards on white bg */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 28 }}>
                {paged.map((item, i) => (
                  <div key={item.id ?? i} style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.10)", border: "1px solid #f1f5f9" }}>
                    <MediaCard item={item} onPlay={handlePlay} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                page={page}
                total={filtered.length}
                pageSize={PAGE_SIZE}
                onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                labelPrev={trPrev}
                labelNext={trNext}
              />
            </>
          )}
        </div>
      </section>

      {activeEmbed && (
        <MediaModal embedUrl={activeEmbed.url} title={activeEmbed.title} onClose={() => setActiveEmbed(null)} />
      )}
    </>
  );
}

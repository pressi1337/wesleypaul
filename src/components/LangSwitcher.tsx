"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import { LANG_OPTIONS, REGIONS } from "@/lib/languages";

export { REGIONS, LANG_OPTIONS };

interface ActiveLang { code: string; label: string; nativeLabel: string; flag: string; }

const STORAGE_KEY = "preferred_lang";

const DEFAULT_LANGS: ActiveLang[] = LANG_OPTIONS.filter(l => !l.isDefault).map(l => ({
  code: l.code, label: l.label, nativeLabel: l.nativeLabel, flag: l.flag,
}));

const EN: ActiveLang = { code: "en", label: "English", nativeLabel: "English", flag: "🇺🇸" };

function getUrlLang(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("lang") ?? "";
}

export default function LangSwitcher({ dark = true }: { dark?: boolean }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [open, setOpen]   = useState(false);
  const [lang, setLang]   = useState("en");
  const [langs, setLangs] = useState<ActiveLang[]>(DEFAULT_LANGS);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch active languages from DB
  useEffect(() => {
    fetch("/api/languages")
      .then(r => r.json())
      .then((d: { languages?: ActiveLang[] }) => {
        if (Array.isArray(d.languages) && d.languages.length > 0) setLangs(d.languages);
      })
      .catch(() => {});
  }, []);

  // On every navigation: sync lang from URL → localStorage → state
  // If URL has no ?lang= but storage has a preference, silently restore it
  useEffect(() => {
    const fromUrl = getUrlLang();
    if (fromUrl) {
      setLang(fromUrl);
      localStorage.setItem(STORAGE_KEY, fromUrl);
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== "en") {
        // Restore without adding to browser history
        const params = new URLSearchParams(window.location.search);
        params.set("lang", saved);
        router.replace(`${pathname}?${params.toString()}`);
        setLang(saved);
      } else {
        setLang("en");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const switchLang = (code: string) => {
    setLang(code);
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, code);
    const params = new URLSearchParams(window.location.search);
    if (code === "en") params.delete("lang");
    else params.set("lang", code);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const allLangs = [EN, ...langs];
  const activeLang = allLangs.find(l => l.code === lang) ?? EN;

  const btnBg    = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const btnBdr   = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const chevronColor = dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.4)";

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 9999 }}>
      {/* ── Trigger — flag + tiny chevron only ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Select language"
        style={{
          display: "flex", alignItems: "center", gap: 3,
          padding: "4px 7px",
          background: open ? (dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.09)") : btnBg,
          border: `1px solid ${btnBdr}`,
          borderRadius: 6, cursor: "pointer",
          transition: "background 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1, display: "block" }}>{activeLang.flag}</span>
        <ChevronDown
          size={10}
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s",
            color: chevronColor,
            flexShrink: 0,
          }}
        />
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)",
          background: "#fff", borderRadius: 10,
          boxShadow: "0 8px 28px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.07)",
          minWidth: 170, maxHeight: 300, overflowY: "auto",
          zIndex: 9999,
        }}>
          {allLangs.map(l => (
            <button
              key={l.code}
              onClick={() => switchLang(l.code)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 14px",
                background: lang === l.code ? "#eff6ff" : "#fff",
                border: "none", cursor: "pointer", textAlign: "left",
                borderBottom: "1px solid #f8fafc",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (lang !== l.code) e.currentTarget.style.background = "#f8fafc"; }}
              onMouseLeave={e => { if (lang !== l.code) e.currentTarget.style.background = "#fff"; }}
            >
              <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>{l.flag}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: lang === l.code ? "#2070B8" : "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {l.nativeLabel}
                </div>
                <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{l.label}</div>
              </div>
              {lang === l.code && <Check size={13} style={{ color: "#2070B8", flexShrink: 0 }} />}
            </button>
          ))}
          <div style={{ padding: "7px 14px", fontSize: 10, color: "#94a3b8", background: "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
            Pages are machine-translated
          </div>
        </div>
      )}
    </div>
  );
}

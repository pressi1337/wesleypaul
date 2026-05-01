"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { X, Globe } from "lucide-react";

interface Lang { code: string; label: string; nativeLabel: string; flag: string; }

const STORAGE_KEY = "preferred_lang";
const ASKED_KEY   = "lang_pref_asked";

export default function LangPreferenceModal() {
  const router     = useRouter();
  const pathname   = usePathname();
  const [langs, setLangs] = useState<Lang[]>([]);
  const [show, setShow]   = useState(false);
  const checked = useRef(false); // fire the check only once per mount

  useEffect(() => {
    // Only run once per session mount
    if (checked.current) return;
    // Only show on public pages
    if (pathname.startsWith("/admin")) return;
    // Already answered
    if (localStorage.getItem(ASKED_KEY)) return;
    // Already have a lang in URL — LangSwitcher will restore it
    if (new URLSearchParams(window.location.search).get("lang")) return;

    checked.current = true;

    fetch("/api/languages?modal=1")
      .then(r => r.json())
      .then((d: { languages?: Lang[] }) => {
        if (Array.isArray(d.languages) && d.languages.length > 0) {
          // Always include English as first option in the grid
          const withEn: Lang[] = [
            { code: "en", label: "English", nativeLabel: "English", flag: "🇺🇸" },
            ...d.languages,
          ];
          setLangs(withEn);
          setTimeout(() => setShow(true), 900);
        } else {
          localStorage.setItem(ASKED_KEY, "1");
        }
      })
      .catch(() => { localStorage.setItem(ASKED_KEY, "1"); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (code: string) => {
    localStorage.setItem(ASKED_KEY, "1");
    localStorage.setItem(STORAGE_KEY, code);
    setShow(false);
    if (code !== "en") {
      const params = new URLSearchParams(window.location.search);
      params.set("lang", code);
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  const dismiss = () => {
    localStorage.setItem(ASKED_KEY, "1");
    setShow(false);
  };

  if (!show || langs.length === 0) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(15,23,42,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "100%", maxWidth: 460,
        boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
        overflow: "hidden",
        animation: "fadeSlideUp 0.3s ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid #f1f5f9",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "50%",
              background: "linear-gradient(135deg,#2070B8,#C0185A)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Globe size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Choose your language</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 1 }}>Select your preferred language for this site</div>
            </div>
          </div>
          <button onClick={dismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Language grid */}
        <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {langs.map(l => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", borderRadius: 10,
                border: "2px solid #e8ecf0", background: "#fafbfc",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#2070B8";
                e.currentTarget.style.background  = "#eff6ff";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#e8ecf0";
                e.currentTarget.style.background  = "#fafbfc";
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{l.flag}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{l.nativeLabel}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{l.label}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Bottom padding */}
        <div style={{ height: 6 }} />
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

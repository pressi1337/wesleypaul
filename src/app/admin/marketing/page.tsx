"use client";

import { useEffect, useState } from "react";
import { Save, BarChart2, CheckCircle } from "lucide-react";

const inp = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13.5, outline: "none", background: "#fff", boxSizing: "border-box" as const, fontFamily: "inherit" };
const lbl = { display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 5 } as const;

const PLATFORMS = [
  { key: "ga_tracking_id", label: "Google Analytics 4", placeholder: "G-XXXXXXXXXX", color: "#e37400", icon: "G", desc: "Measure traffic and user behaviour" },
  { key: "fb_pixel_id", label: "Facebook / Meta Pixel", placeholder: "1234567890", color: "#1877f2", icon: "f", desc: "Track conversions from Facebook ads" },
  { key: "gtm_id", label: "Google Tag Manager", placeholder: "GTM-XXXXXXX", color: "#4285f4", icon: "T", desc: "Manage all tags from one place" },
];

export default function MarketingPage() {
  const [config, setConfig] = useState({ ga_tracking_id: "", fb_pixel_id: "", gtm_id: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/analytics").then(r => r.json()).then(d => { if (d.config) setConfig(d.config); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/analytics", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: 740 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Marketing & Analytics</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Connect analytics and ad tracking platforms to your site.</p>
      </div>

      {saved && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "11px 16px", marginBottom: 16, color: "#16a34a", fontSize: 13.5, fontWeight: 500 }}>
          <CheckCircle size={15} /> Settings saved successfully.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        {PLATFORMS.map(p => (
          <div key={p.key} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                {p.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{p.label}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{p.desc}</div>
              </div>
              {config[p.key as keyof typeof config] && (
                <span style={{ marginLeft: "auto", fontSize: 11.5, padding: "3px 9px", background: "#dcfce7", color: "#15803d", borderRadius: 20, fontWeight: 600 }}>Connected</span>
              )}
            </div>
            <div>
              <label style={lbl}>Tracking ID</label>
              <input style={inp} value={config[p.key as keyof typeof config]}
                onChange={e => setConfig(c => ({ ...c, [p.key]: e.target.value }))}
                placeholder={p.placeholder} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSave} disabled={saving}
        style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(32,112,184,0.3)", marginBottom: 24 }}>
        <Save size={14} /> {saving ? "Saving…" : "Save Settings"}
      </button>

      {/* Implementation guide */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <BarChart2 size={16} style={{ color: "#2070B8" }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Implementation Guide</span>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>To activate these tracking IDs, add the following to <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>src/app/layout.tsx</code> inside the <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>&lt;head&gt;</code>:</p>
        <div style={{ background: "#0f172a", borderRadius: 8, padding: "14px 16px", overflowX: "auto" }}>
          <pre style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{`{/* Google Analytics */}
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX" />
<script dangerouslySetInnerHTML={{ __html: \`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
\`}} />

{/* Google Tag Manager */}
<script dangerouslySetInnerHTML={{ __html: \`
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-XXXXXXX');
\`}} />`}</pre>
        </div>
      </div>
    </div>
  );
}

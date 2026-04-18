"use client";

import { useEffect, useState } from "react";
import { Save, Mail, CheckCircle } from "lucide-react";

const inp = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13.5, outline: "none", background: "#fff", boxSizing: "border-box" as const, fontFamily: "inherit" };
const lbl = { display: "block", fontSize: 12.5, fontWeight: 600, color: "#374151", marginBottom: 5 } as const;

export default function EmailConfigPage() {
  const [config, setConfig] = useState({ smtp_host: "", smtp_port: 587, smtp_user: "", smtp_password: "", from_email: "", from_name: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/email").then(r => r.json()).then(d => { if (d.config) setConfig(d.config); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/email", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Email Configuration</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Configure SMTP settings for sending notification emails.</p>
      </div>

      {saved && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "11px 16px", marginBottom: 16, color: "#16a34a", fontSize: 13.5, fontWeight: 500 }}>
          <CheckCircle size={15} /> Settings saved successfully.
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Mail size={16} style={{ color: "#d97706" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>SMTP Settings</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Used for sending booking and notification emails</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>SMTP Host</label>
            <input style={inp} value={config.smtp_host} onChange={e => setConfig(c => ({ ...c, smtp_host: e.target.value }))} placeholder="smtp.gmail.com" />
          </div>
          <div>
            <label style={lbl}>Port</label>
            <input type="number" style={inp} value={config.smtp_port} onChange={e => setConfig(c => ({ ...c, smtp_port: +e.target.value }))} placeholder="587" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Username</label>
            <input style={inp} value={config.smtp_user} onChange={e => setConfig(c => ({ ...c, smtp_user: e.target.value }))} placeholder="your@gmail.com" autoComplete="off" />
          </div>
          <div>
            <label style={lbl}>Password / App Password</label>
            <input type="password" style={inp} value={config.smtp_password} onChange={e => setConfig(c => ({ ...c, smtp_password: e.target.value }))} placeholder="••••••••••••" autoComplete="new-password" />
          </div>
        </div>

        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>From Address</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={lbl}>From Email</label>
              <input style={inp} value={config.from_email} onChange={e => setConfig(c => ({ ...c, from_email: e.target.value }))} placeholder="info@wesleypaul.org" />
            </div>
            <div>
              <label style={lbl}>From Name</label>
              <input style={inp} value={config.from_name} onChange={e => setConfig(c => ({ ...c, from_name: e.target.value }))} placeholder="Wesley Paul Ministries" />
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 8, fontSize: 13.5, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(32,112,184,0.3)" }}>
          <Save size={14} /> {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 18px", marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Gmail Quick Setup</div>
        <ol style={{ fontSize: 13, color: "#64748b", lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
          <li>Enable 2-Step Verification in your Google Account</li>
          <li>Go to Google Account &rsaquo; Security &rsaquo; App Passwords</li>
          <li>Generate an app password for &ldquo;Mail&rdquo;</li>
          <li>Use <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>smtp.gmail.com</code> port <code style={{ background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>587</code> with TLS</li>
        </ol>
      </div>
    </div>
  );
}

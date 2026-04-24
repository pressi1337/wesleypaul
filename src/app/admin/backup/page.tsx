"use client";

import { useState, useRef } from "react";
import { Database, Image as ImgIcon, Download, Upload, CheckCircle, AlertCircle, TriangleAlert, X, Eye, EyeOff } from "lucide-react";

type Status = "idle" | "loading" | "done" | "error";

// ── Download / Backup card ────────────────────────────────────────────────────
function BackupCard({
  icon: Icon, title, description, endpoint, filename, color,
}: {
  icon: React.ElementType; title: string; description: string;
  endpoint: string; filename: string; color: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error,  setError]  = useState("");

  const download = async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = filename.replace("TIMESTAMP", new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19));
      a.click();
      URL.revokeObjectURL(url);
      setStatus("done");
      setTimeout(() => setStatus("idle"), 4000);
    } catch (e) {
      setError(String(e));
      setStatus("error");
    }
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 28, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={24} style={{ color }} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{description}</p>
        </div>
      </div>

      {status === "error" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
          <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#991b1b" }}>{error}</span>
        </div>
      )}
      {status === "done" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
          <CheckCircle size={14} style={{ color: "#059669" }} />
          <span style={{ fontSize: 12, color: "#065f46" }}>Backup downloaded successfully</span>
        </div>
      )}

      <button onClick={download} disabled={status === "loading"}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 20px", borderRadius: 8, border: "none", background: status === "loading" ? "#94a3b8" : color, color: "#fff", fontSize: 14, fontWeight: 700, cursor: status === "loading" ? "not-allowed" : "pointer" }}>
        <Download size={15} />
        {status === "loading" ? "Preparing backup…" : `Download ${title}`}
      </button>
    </div>
  );
}

// ── Password confirmation modal ───────────────────────────────────────────────
function PasswordModal({
  title, warningText, onConfirm, onClose, loading,
}: {
  title: string; warningText: string;
  onConfirm: (password: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [pw,      setPw]      = useState("");
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Confirm Restore</h3>
          <button onClick={onClose} disabled={loading} style={{ border: "none", background: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "#fff7ed", borderRadius: 10, border: "1px solid #fed7aa", marginBottom: 20 }}>
          <TriangleAlert size={16} style={{ color: "#ea580c", flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#9a3412" }}>{title}</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#c2410c", lineHeight: 1.5 }}>{warningText}</p>
          </div>
        </div>

        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
          Admin Password
        </label>
        <div style={{ position: "relative", marginBottom: 20 }}>
          <input
            type={visible ? "text" : "password"}
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && pw) onConfirm(pw); }}
            placeholder="Enter your admin password"
            autoFocus
            style={{ width: "100%", padding: "10px 40px 10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14, boxSizing: "border-box", outline: "none" }}
          />
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#9ca3af", padding: 2 }}>
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={loading}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", fontSize: 14, fontWeight: 600, color: "#374151", cursor: loading ? "not-allowed" : "pointer" }}>
            Cancel
          </button>
          <button onClick={() => { if (pw) onConfirm(pw); }} disabled={!pw || loading}
            style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: !pw || loading ? "#94a3b8" : "#ef4444", color: "#fff", fontSize: 14, fontWeight: 700, cursor: !pw || loading ? "not-allowed" : "pointer" }}>
            {loading ? "Restoring…" : "Restore"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Upload / Restore card ─────────────────────────────────────────────────────
function RestoreCard({
  icon: Icon, title, description, endpoint, accept, acceptLabel, color, warningText,
}: {
  icon: React.ElementType; title: string; description: string;
  endpoint: string; accept: string; acceptLabel: string;
  color: string; warningText: string;
}) {
  const [file,       setFile]       = useState<File | null>(null);
  const [showModal,  setShowModal]  = useState(false);
  const [status,     setStatus]     = useState<Status>("idle");
  const [error,      setError]      = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRestore = async (password: string) => {
    if (!file) return;
    setStatus("loading");
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("password", password);
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const json = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setStatus("done");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setTimeout(() => setStatus("idle"), 5000);
    } catch (e) {
      setError(String(e));
      setStatus("error");
    } finally {
      setShowModal(false);
    }
  };

  return (
    <>
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={24} style={{ color }} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{description}</p>
          </div>
        </div>

        {/* File picker */}
        <div
          onClick={() => inputRef.current?.click()}
          style={{ border: "2px dashed #e2e8f0", borderRadius: 10, padding: "16px 14px", cursor: "pointer", textAlign: "center", background: file ? "#f0fdf4" : "#f8fafc", transition: "border-color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
        >
          <input ref={inputRef} type="file" accept={accept} style={{ display: "none" }} onChange={e => { setFile(e.target.files?.[0] ?? null); setStatus("idle"); setError(""); }} />
          {file ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <CheckCircle size={14} style={{ color: "#059669" }} />
              <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>{file.name}</span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>({(file.size / 1024).toFixed(0)} KB)</span>
            </div>
          ) : (
            <div>
              <Upload size={20} style={{ color: "#94a3b8", margin: "0 auto 6px" }} />
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Click to select a <strong>{acceptLabel}</strong> file</p>
            </div>
          )}
        </div>

        {status === "error" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
            <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#991b1b" }}>{error}</span>
          </div>
        )}
        {status === "done" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
            <CheckCircle size={14} style={{ color: "#059669" }} />
            <span style={{ fontSize: 12, color: "#065f46" }}>Restore completed successfully</span>
          </div>
        )}

        <button onClick={() => { if (file) setShowModal(true); }} disabled={!file || status === "loading"}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 20px", borderRadius: 8, border: "none", background: !file || status === "loading" ? "#94a3b8" : color, color: "#fff", fontSize: 14, fontWeight: 700, cursor: !file || status === "loading" ? "not-allowed" : "pointer" }}>
          <Upload size={15} />
          {status === "loading" ? "Restoring…" : `Restore ${title}`}
        </button>
      </div>

      {showModal && (
        <PasswordModal
          title={`Restore ${title}`}
          warningText={warningText}
          onConfirm={handleRestore}
          onClose={() => setShowModal(false)}
          loading={status === "loading"}
        />
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BackupPage() {
  return (
    <div style={{ fontFamily: "system-ui,sans-serif", maxWidth: 800, margin: "0 auto" }}>
      {/* Backup section */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Backup & Restore</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>
          Download backups or restore your database and media gallery. Store backup copies in a safe location regularly.
        </p>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#374151", margin: "0 0 14px" }}>Download Backups</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20, marginBottom: 36 }}>
        <BackupCard
          icon={Database}
          title="MySQL Database"
          description="Full SQL dump of all tables, data, and structure. Includes all CMS content, settings, and users."
          endpoint="/api/admin/backup/mysql"
          filename="wesleypaul_cms_backup_TIMESTAMP.sql"
          color="#2070B8"
        />
        <BackupCard
          icon={ImgIcon}
          title="Media Gallery"
          description="ZIP archive of all uploaded images and files in the media library (/public/uploads)."
          endpoint="/api/admin/backup/gallery"
          filename="gallery_backup_TIMESTAMP.zip"
          color="#7c3aed"
        />
      </div>

      {/* Restore section */}
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "#374151", margin: "0 0 14px" }}>Restore from Backup</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20, marginBottom: 28 }}>
        <RestoreCard
          icon={Database}
          title="MySQL Database"
          description="Upload a .sql backup file to restore the database. Existing data will be overwritten."
          endpoint="/api/admin/restore/mysql"
          accept=".sql"
          acceptLabel=".sql"
          color="#2070B8"
          warningText="This will overwrite all existing database content with the uploaded backup. This action cannot be undone."
        />
        <RestoreCard
          icon={ImgIcon}
          title="Media Gallery"
          description="Upload a .zip backup to restore media files. Existing files with the same name will be overwritten."
          endpoint="/api/admin/restore/gallery"
          accept=".zip"
          acceptLabel=".zip"
          color="#7c3aed"
          warningText="This will extract the ZIP into the uploads folder. Files with matching names will be overwritten. This action cannot be undone."
        />
      </div>

      <div style={{ padding: "16px 20px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
          <strong>Tip:</strong> Schedule regular backups — weekly at minimum. Store copies off-server (cloud storage, local drive).
          The MySQL backup can be restored with: <code style={{ background: "#fef3c7", padding: "1px 5px", borderRadius: 3 }}>mysql -u root -p wesleypaul_cms &lt; backup.sql</code>
        </p>
      </div>
    </div>
  );
}

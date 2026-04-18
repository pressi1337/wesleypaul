"use client";

import { useState } from "react";
import { Database, Image as ImgIcon, Download, CheckCircle, AlertCircle } from "lucide-react";

type Status = "idle" | "loading" | "done" | "error";

function BackupCard({
  icon: Icon, title, description, endpoint, filename, color,
}: {
  icon: React.ElementType; title: string; description: string;
  endpoint: string; filename: string; color: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError]   = useState("");

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
      a.href = url;
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
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "11px 20px", borderRadius: 8, border: "none",
          background: status === "loading" ? "#94a3b8" : color,
          color: "#fff", fontSize: 14, fontWeight: 700, cursor: status === "loading" ? "not-allowed" : "pointer",
          transition: "opacity 0.15s",
        }}>
        <Download size={15} />
        {status === "loading" ? "Preparing backup…" : `Download ${title}`}
      </button>
    </div>
  );
}

export default function BackupPage() {
  return (
    <div style={{ fontFamily: "system-ui,sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Backup</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>
          Download a full backup of your database or media gallery. Store copies in a safe location regularly.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20 }}>
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

      <div style={{ marginTop: 28, padding: "16px 20px", background: "#fffbeb", borderRadius: 10, border: "1px solid #fde68a" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
          <strong>Tip:</strong> Schedule regular backups — weekly at minimum. Store copies off-server (cloud storage, local drive).
          The MySQL backup can be restored with: <code style={{ background: "#fef3c7", padding: "1px 5px", borderRadius: 3 }}>mysql -u root -p wesleypaul_cms &lt; backup.sql</code>
        </p>
      </div>
    </div>
  );
}

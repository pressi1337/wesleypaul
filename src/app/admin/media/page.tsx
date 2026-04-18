"use client";

import { useEffect, useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { Upload, Trash2, Copy, Check, X } from "lucide-react";

interface MediaItem {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  alt_text: string;
  created_at: string;
}

interface CropState {
  file: File;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [crop, setCrop] = useState<CropState | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editAlt, setEditAlt] = useState<{ id: number; value: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropPreviewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadMedia = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/media");
      const data = await res.json() as { media: MediaItem[] };
      setMedia(data.media || []);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-sync public/images on first load so static assets appear in library
  const hasAutoImported = useRef(false);
  useEffect(() => { loadMedia(); }, [loadMedia]);
  useEffect(() => {
    if (!loading && !hasAutoImported.current) {
      hasAutoImported.current = true;
      fetch("/api/admin/media/import", { method: "POST" })
        .then(() => loadMedia())
        .catch(() => {});
    }
  }, [loading, loadMedia]);

  // Draw crop preview on canvas
  useEffect(() => {
    if (!crop || !cropPreviewRef.current) return;
    const canvas = cropPreviewRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.clearRect(0, 0, 200, 200);
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, 200, 200);
    };
    img.src = crop.dataUrl;
  }, [crop]);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        setCrop({
          file,
          dataUrl,
          x: 0,
          y: 0,
          width: img.naturalWidth,
          height: img.naturalHeight,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const uploadFile = async (blob: Blob, filename: string) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", blob, filename);
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      showToast("Uploaded successfully!");
      setCrop(null);
      await loadMedia();
    } catch {
      showToast("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const uploadCropped = () => {
    if (!crop) return;
    const canvas = document.createElement("canvas");
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      canvas.toBlob((blob) => {
        if (blob) uploadFile(blob, crop.file.name);
      }, crop.file.type || "image/jpeg", 0.92);
    };
    img.src = crop.dataUrl;
  };

  const uploadOriginal = () => {
    if (!crop) return;
    uploadFile(crop.file, crop.file.name);
  };

  const deleteMedia = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.original_name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setMedia(prev => prev.filter(m => m.id !== item.id));
      showToast("Deleted.");
    } catch {
      showToast("Delete failed.");
    }
  };

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.file_path).catch(() => {});
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveAltText = async () => {
    if (!editAlt) return;
    await fetch(`/api/admin/media/${editAlt.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alt_text: editAlt.value }),
    });
    setMedia(m => m.map(x => x.id === editAlt.id ? { ...x, alt_text: editAlt.value } : x));
    setEditAlt(null);
  };

  const card = {
    background: "#fff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  } as const;

  return (
    <div style={{ maxWidth: 1200 }}>
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 20, zIndex: 9999, background: "#16a34a", color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
          <Check size={15} /> {toast}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Media Library</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", margin: "4px 0 0" }}>{media.length} file{media.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={async () => {
            showToast("Syncing…");
            await fetch("/api/admin/media/import", { method: "POST" });
            await loadMedia();
            showToast("Sync complete!");
          }}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#2070B8" }}>
          🔄 Sync from /images/
        </button>
      </div>

      {/* Upload Area */}
      {!crop && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          style={{
            ...card,
            padding: "40px 24px",
            textAlign: "center",
            cursor: "pointer",
            marginBottom: 24,
            border: `2px dashed ${dragOver ? "#2070B8" : "#e2e8f0"}`,
            background: dragOver ? "#eff6ff" : "#fff",
            transition: "all 0.15s",
          }}
        >
          <Upload size={36} style={{ color: dragOver ? "#2070B8" : "#cbd5e1", margin: "0 auto 12px", display: "block" }} />
          <p style={{ fontWeight: 700, fontSize: 15, color: "#374151", margin: "0 0 4px" }}>
            Drag & drop an image here
          </p>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>or click to select a file (images only)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* Crop Interface */}
      {crop && (
        <div style={{ ...card, padding: "24px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Crop Image — {crop.file.name}</h2>
            <button onClick={() => setCrop(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* Image preview */}
            <div style={{ flex: "1 1 380px", maxWidth: 420 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={crop.dataUrl}
                alt="crop preview"
                style={{ width: "100%", borderRadius: 8, border: "1px solid #e2e8f0", display: "block" }}
              />
              <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
                Original: {crop.naturalWidth} × {crop.naturalHeight}px
              </p>
            </div>

            {/* Crop controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 240 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(["x", "y", "width", "height"] as const).map(field => (
                  <div key={field}>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 4, textTransform: "uppercase" }}>{field}</label>
                    <input
                      type="number"
                      min={0}
                      max={field === "x" || field === "width" ? crop.naturalWidth : crop.naturalHeight}
                      value={crop[field]}
                      onChange={e => setCrop(c => c ? { ...c, [field]: parseInt(e.target.value) || 0 } : c)}
                      style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
              </div>

              {/* Crop preview canvas */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Crop Preview (200×200)</p>
                <canvas
                  ref={cropPreviewRef}
                  width={200}
                  height={200}
                  style={{ borderRadius: 8, border: "1px solid #e2e8f0", display: "block" }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={uploadCropped}
                  disabled={uploading}
                  style={{ padding: "10px 16px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13.5, cursor: uploading ? "not-allowed" : "pointer" }}
                >
                  {uploading ? "Uploading…" : "Upload Cropped"}
                </button>
                <button
                  onClick={uploadOriginal}
                  disabled={uploading}
                  style={{ padding: "10px 16px", background: "#f8fafc", color: "#374151", border: "1px solid #e2e8f0", borderRadius: 8, fontWeight: 600, fontSize: 13.5, cursor: uploading ? "not-allowed" : "pointer" }}
                >
                  Upload Original
                </button>
                <button
                  onClick={() => setCrop(null)}
                  style={{ padding: "10px 16px", background: "transparent", color: "#94a3b8", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>Loading media…</div>
      ) : media.length === 0 ? (
        <div style={{ ...card, padding: "60px 24px", textAlign: "center" }}>
          <p style={{ color: "#64748b", fontWeight: 600 }}>No media yet</p>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>Upload images to get started.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {media.map(item => (
            <div key={item.id} style={card}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.file_path}
                alt={item.alt_text || item.original_name}
                style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
              />
              <div style={{ padding: "12px 14px" }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.original_name}
                </p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 10px" }}>{formatBytes(item.file_size)}</p>

                {/* Alt text editing */}
                {editAlt?.id === item.id ? (
                  <input
                    autoFocus
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #2070B8", borderRadius: 6, fontSize: 12.5, fontFamily: "inherit", marginBottom: 10, boxSizing: "border-box" }}
                    value={editAlt.value}
                    onChange={e => setEditAlt({ id: item.id, value: e.target.value })}
                    onBlur={saveAltText}
                    onKeyDown={e => { if (e.key === "Enter") saveAltText(); }}
                    placeholder="Alt text…"
                  />
                ) : (
                  <div
                    onClick={() => setEditAlt({ id: item.id, value: item.alt_text || "" })}
                    style={{ fontSize: 12, color: item.alt_text ? "#374151" : "#cbd5e1", marginBottom: 10, cursor: "pointer", padding: "5px 8px", borderRadius: 5, border: "1px dashed #e2e8f0", minHeight: 28, lineHeight: 1.5 }}
                    title="Click to edit alt text"
                  >
                    {item.alt_text || "Click to add alt text…"}
                  </div>
                )}

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => copyUrl(item)}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#64748b", fontWeight: 600 }}
                  >
                    {copiedId === item.id ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy URL</>}
                  </button>
                  <button
                    onClick={() => deleteMedia(item)}
                    style={{ padding: "6px 10px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", color: "#C0185A" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

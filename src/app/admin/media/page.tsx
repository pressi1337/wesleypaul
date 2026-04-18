"use client";

import { useEffect, useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { Upload, Trash2, Copy, Check, X, Play, Pencil, Search, Film } from "lucide-react";

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
  file: File; dataUrl: string;
  x: number; y: number; width: number; height: number;
  naturalWidth: number; naturalHeight: number;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

const isVideo = (m: MediaItem) => m.mime_type.startsWith("video/");
const isImage = (m: MediaItem) => m.mime_type.startsWith("image/");

/* ── Video preview modal ──────────────────────────────────────────────── */
function VideoModal({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(4px)" }}
    >
      <div style={{ position: "relative", width: "100%", maxWidth: 860 }}>
        <button onClick={onClose} style={{ position: "absolute", top: -40, right: 0, background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
          <X size={16} /> Close
        </button>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>{item.original_name}</div>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={item.file_path}
          controls
          autoPlay
          style={{ width: "100%", borderRadius: 10, background: "#000", display: "block", maxHeight: "75vh" }}
        />
      </div>
    </div>
  );
}

export default function MediaPage() {
  const [media, setMedia]         = useState<MediaItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [crop, setCrop]           = useState<CropState | null>(null);
  const [dragOver, setDragOver]   = useState(false);
  const [copiedId, setCopiedId]   = useState<number | null>(null);
  const [editAlt, setEditAlt]     = useState<{ id: number; value: string } | null>(null);
  const [editName, setEditName]   = useState<{ id: number; value: string } | null>(null);
  const [videoPreview, setVideoPreview] = useState<MediaItem | null>(null);
  const [search, setSearch]       = useState("");
  const [toast, setToast]         = useState<string | null>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cropPreviewRef = useRef<HTMLCanvasElement>(null);
  const imgRef         = useRef<HTMLImageElement>(null);

  const showToast = (msg: string, error = false) => {
    setToast(error ? `⚠ ${msg}` : msg);
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

  const hasAutoImported = useRef(false);
  useEffect(() => { loadMedia(); }, [loadMedia]);
  useEffect(() => {
    if (!loading && !hasAutoImported.current) {
      hasAutoImported.current = true;
      fetch("/api/admin/media/import", { method: "POST" }).then(() => loadMedia()).catch(() => {});
    }
  }, [loading, loadMedia]);

  useEffect(() => {
    if (!crop || !cropPreviewRef.current) return;
    const canvas = cropPreviewRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => { ctx.clearRect(0, 0, 200, 200); ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, 200, 200); };
    img.src = crop.dataUrl;
  }, [crop]);

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith("video/")) {
      // Videos: upload directly without crop
      uploadFile(file, file.name);
      return;
    }
    if (!file.type.startsWith("image/")) { showToast("Unsupported file type.", true); return; }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => setCrop({ file, dataUrl, x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const uploadFile = async (blob: Blob | File, filename: string) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", blob, filename);
      const res = await fetch("/api/admin/media", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      showToast("Uploaded successfully!");
      setCrop(null);
      await loadMedia();
    } catch { showToast("Upload failed.", true); }
    finally { setUploading(false); }
  };

  const uploadCropped = () => {
    if (!crop) return;
    const canvas = document.createElement("canvas");
    canvas.width = crop.width; canvas.height = crop.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      canvas.toBlob(blob => { if (blob) uploadFile(blob, crop.file.name); }, crop.file.type || "image/jpeg", 0.92);
    };
    img.src = crop.dataUrl;
  };

  const deleteMedia = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.original_name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMedia(p => p.filter(m => m.id !== item.id));
      showToast("Deleted.");
    } catch { showToast("Delete failed.", true); }
  };

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.file_path).catch(() => {});
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const saveAltText = async () => {
    if (!editAlt) return;
    await fetch(`/api/admin/media/${editAlt.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alt_text: editAlt.value }) });
    setMedia(m => m.map(x => x.id === editAlt.id ? { ...x, alt_text: editAlt.value } : x));
    setEditAlt(null);
  };

  const saveRename = async () => {
    if (!editName) return;
    const val = editName.value.trim() || "untitled";
    await fetch(`/api/admin/media/${editName.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ original_name: val }) });
    setMedia(m => m.map(x => x.id === editName.id ? { ...x, original_name: val } : x));
    setEditName(null);
    showToast("Renamed.");
  };

  const card = { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" } as const;

  const filtered = media.filter(m =>
    !search || m.original_name.toLowerCase().includes(search.toLowerCase()) || m.alt_text?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1200 }}>
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 20, zIndex: 9999, background: toast.startsWith("⚠") ? "#dc2626" : "#16a34a", color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
          <Check size={15} /> {toast}
        </div>
      )}

      {videoPreview && <VideoModal item={videoPreview} onClose={() => setVideoPreview(null)} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Media Library</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", margin: "4px 0 0" }}>{filtered.length} of {media.length} file{media.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search files…"
              style={{ padding: "7px 10px 7px 32px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, width: 200, outline: "none" }}
            />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}><X size={12} /></button>}
          </div>
          <button
            onClick={async () => { showToast("Syncing…"); await fetch("/api/admin/media/import", { method: "POST" }); await loadMedia(); showToast("Sync complete!"); }}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#2070B8" }}>
            🔄 Sync
          </button>
        </div>
      </div>

      {/* Upload area */}
      {!crop && (
        <div
          onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          style={{ ...card, padding: "32px 24px", textAlign: "center", cursor: "pointer", marginBottom: 20, border: `2px dashed ${dragOver ? "#2070B8" : "#e2e8f0"}`, background: dragOver ? "#eff6ff" : "#fff", transition: "all 0.15s" }}
        >
          <Upload size={32} style={{ color: dragOver ? "#2070B8" : "#cbd5e1", margin: "0 auto 10px", display: "block" }} />
          <p style={{ fontWeight: 700, fontSize: 14, color: "#374151", margin: "0 0 3px" }}>Drag & drop images or videos here</p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>or click to select files</p>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: "none" }}
            onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />
        </div>
      )}

      {/* Crop interface */}
      {crop && (
        <div style={{ ...card, padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Crop — {crop.file.name}</h2>
            <button onClick={() => setCrop(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 360px", maxWidth: 420 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} src={crop.dataUrl} alt="crop preview" style={{ width: "100%", borderRadius: 8, border: "1px solid #e2e8f0", display: "block" }} />
              <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 5 }}>Original: {crop.naturalWidth}×{crop.naturalHeight}px</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 240 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(["x","y","width","height"] as const).map(f => (
                  <div key={f}>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 3, textTransform: "uppercase" }}>{f}</label>
                    <input type="number" min={0} max={f==="x"||f==="width"?crop.naturalWidth:crop.naturalHeight} value={crop[f]}
                      onChange={e => setCrop(c => c ? { ...c, [f]: parseInt(e.target.value)||0 } : c)}
                      style={{ width: "100%", padding: "5px 7px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#374151", margin: "0 0 6px" }}>Preview</p>
                <canvas ref={cropPreviewRef} width={200} height={200} style={{ borderRadius: 8, border: "1px solid #e2e8f0", display: "block" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <button onClick={uploadCropped} disabled={uploading} style={{ padding: "9px 14px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: uploading?"not-allowed":"pointer" }}>{uploading ? "Uploading…" : "Upload Cropped"}</button>
                <button onClick={() => uploadFile(crop.file, crop.file.name)} disabled={uploading} style={{ padding: "9px 14px", background: "#f8fafc", color: "#374151", border: "1px solid #e2e8f0", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: uploading?"not-allowed":"pointer" }}>Upload Original</button>
                <button onClick={() => setCrop(null)} style={{ padding: "9px 14px", background: "transparent", color: "#94a3b8", border: "none", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>Loading media…</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, padding: "60px 24px", textAlign: "center" }}>
          <p style={{ color: "#64748b", fontWeight: 600 }}>{search ? "No files match your search." : "No media yet"}</p>
          <p style={{ color: "#94a3b8", fontSize: 13 }}>{search ? "" : "Upload images or videos to get started."}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {filtered.map(item => (
            <div key={item.id} style={card}>
              {/* Thumbnail / preview */}
              <div style={{ position: "relative", height: 160, background: "#0d1523", overflow: "hidden" }}>
                {isImage(item) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.file_path} alt={item.alt_text || item.original_name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : isVideo(item) ? (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                    <video src={item.file_path} preload="metadata" muted
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.7 }} />
                    {/* Play overlay */}
                    <button
                      onClick={() => setVideoPreview(item)}
                      style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", gap: 6 }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
                        <Play size={20} style={{ color: "#2070B8", marginLeft: 2 }} fill="#2070B8" />
                      </div>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {item.mime_type.split("/")[1]?.toUpperCase() ?? "VIDEO"}
                      </span>
                    </button>
                  </>
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Film size={36} style={{ color: "rgba(255,255,255,0.3)" }} />
                  </div>
                )}
              </div>

              <div style={{ padding: "11px 13px" }}>
                {/* Filename — inline rename */}
                {editName?.id === item.id ? (
                  <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                    <input autoFocus value={editName.value} onChange={e => setEditName({ id: item.id, value: e.target.value })}
                      onBlur={saveRename} onKeyDown={e => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setEditName(null); }}
                      style={{ flex: 1, padding: "4px 7px", border: "1px solid #2070B8", borderRadius: 5, fontSize: 12, fontFamily: "inherit", outline: "none" }} />
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.original_name}
                    </p>
                    <button onClick={() => setEditName({ id: item.id, value: item.original_name })}
                      title="Rename" style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "2px", flexShrink: 0 }}>
                      <Pencil size={12} />
                    </button>
                  </div>
                )}

                <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 9px" }}>{formatBytes(item.file_size)} · {item.mime_type.split("/")[1]?.toUpperCase()}</p>

                {/* Alt text (images only) */}
                {isImage(item) && (
                  editAlt?.id === item.id ? (
                    <input autoFocus style={{ width: "100%", padding: "5px 7px", border: "1px solid #2070B8", borderRadius: 5, fontSize: 12, fontFamily: "inherit", marginBottom: 9, boxSizing: "border-box" }}
                      value={editAlt.value} onChange={e => setEditAlt({ id: item.id, value: e.target.value })}
                      onBlur={saveAltText} onKeyDown={e => { if (e.key === "Enter") saveAltText(); }}
                      placeholder="Alt text…" />
                  ) : (
                    <div onClick={() => setEditAlt({ id: item.id, value: item.alt_text || "" })}
                      style={{ fontSize: 11.5, color: item.alt_text ? "#374151" : "#cbd5e1", marginBottom: 9, cursor: "pointer", padding: "4px 7px", borderRadius: 5, border: "1px dashed #e2e8f0", minHeight: 26, lineHeight: 1.5 }}
                      title="Click to edit alt text">
                      {item.alt_text || "Add alt text…"}
                    </div>
                  )
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 5 }}>
                  {isVideo(item) && (
                    <button onClick={() => setVideoPreview(item)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#2070B8", fontWeight: 600 }}>
                      <Play size={11} fill="#2070B8" /> Preview
                    </button>
                  )}
                  <button onClick={() => copyUrl(item)}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                    {copiedId === item.id ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy URL</>}
                  </button>
                  <button onClick={() => deleteMedia(item)}
                    style={{ padding: "6px 9px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", color: "#C0185A" }}>
                    <Trash2 size={12} />
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

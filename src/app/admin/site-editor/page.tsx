"use client";

import { useEffect, useState, useCallback, useRef, createContext, useContext } from "react";
import {
  ChevronDown, Save, Globe, CheckCircle, Plus, Trash2,
  ChevronUp, Image as ImageIcon, ExternalLink, Layers, FolderOpen, X, Upload,
  Monitor, Smartphone, RefreshCw, ExternalLink as OpenIcon, ArrowLeft, Eye,
} from "lucide-react";
import type React from "react";

// ─── Shared styles ────────────────────────────────────────────────────────────
const inp = {
  width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6,
  fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff",
  boxSizing: "border-box" as const,
};
const ta = { ...inp, resize: "vertical" as const, minHeight: 72 };
const lbl = { display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 3 } as const;
const row2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 } as const;
const row3 = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 10 } as const;

// ─── Shared media types ───────────────────────────────────────────────────────
interface MediaItem { id: number; file_path: string; original_name: string; alt_text: string; mime_type?: string; }

// ─── Image Picker Modal (with upload tab) ────────────────────────────────────

function ImagePickerModal({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/media").then(r => r.json()).then(d => {
      const all: MediaItem[] = d.media || [];
      setItems(all.filter(m => !m.mime_type?.startsWith("video/") && !/\.(mp4|webm|mov|ogv)$/i.test(m.file_path)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const importExisting = useCallback(async () => {
    setImporting(true);
    await fetch("/api/admin/media/import", { method: "POST" });
    setImporting(false);
    loadMedia();
  }, [loadMedia]);

  // Auto-import on first open so /images/* files always appear
  const hasAutoImported = useRef(false);
  useEffect(() => {
    loadMedia();
  }, [loadMedia]);
  useEffect(() => {
    if (!loading && !hasAutoImported.current) {
      hasAutoImported.current = true;
      // Run import silently in background on first load
      fetch("/api/admin/media/import", { method: "POST" }).then(() => loadMedia()).catch(() => {});
    }
  }, [loading, loadMedia]);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError("File too large — max 10 MB."); return; }
    setUploading(true); setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/admin/media", { method: "POST", body: fd });
      const d = await r.json() as { success?: boolean; media?: MediaItem; error?: string };
      if (d.success && d.media) { onPick(d.media.file_path); onClose(); }
      else setUploadError(d.error || "Upload failed");
    } catch { setUploadError("Upload failed — check your connection"); }
    setUploading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 780, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Pick Image</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={importExisting} disabled={importing}
              title="Sync all images from /public/images/ into the library"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: importing ? "wait" : "pointer", fontSize: 11, fontWeight: 700, color: "#2070B8" }}>
              🔄 {importing ? "Syncing…" : "Sync files"}
            </button>
            <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}><X size={18} /></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 14px", background: "#f8fafc" }}>
          {(["library", "upload"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "9px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: tab === t ? "#2070B8" : "#94a3b8", borderBottom: tab === t ? "2px solid #2070B8" : "2px solid transparent", marginBottom: -1 }}>
              {t === "library" ? `📚 Library (${items.length})` : "⬆ Upload New"}
            </button>
          ))}
        </div>

        {/* Library */}
        {tab === "library" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "2.5rem 1rem" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📂</div>
                <p style={{ marginBottom: 12, fontSize: 13 }}>No images yet.</p>
                <button onClick={() => setTab("upload")} style={{ padding: "7px 16px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Upload First Image</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                {items.map(item => (
                  <div key={item.id} style={{ position: "relative" }}>
                    <button onClick={() => { onPick(item.file_path); onClose(); }}
                      style={{ width: "100%", border: "2px solid #e2e8f0", borderRadius: 8, overflow: "hidden", cursor: "pointer", background: "#f8fafc", padding: 0, transition: "border-color 0.15s", display: "block" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "#2070B8")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.file_path} alt={item.alt_text || item.original_name} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                      <div style={{ padding: "5px 7px", fontSize: 10, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.original_name}</div>
                    </button>
                    {/* Delete button */}
                    <button
                      onClick={async e => {
                        e.stopPropagation();
                        if (!confirm(`Delete "${item.original_name}"?`)) return;
                        await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
                        setItems(prev => prev.filter(x => x.id !== item.id));
                      }}
                      title="Delete"
                      style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, border: "none", borderRadius: "50%", background: "rgba(220,38,38,0.85)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: 10, fontWeight: 900, lineHeight: 1 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload */}
        {tab === "upload" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) void uploadFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? "#2070B8" : "#c9d5e8"}`, borderRadius: 10, padding: "48px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "#eff6ff" : "#f8fafc", marginBottom: 16 }}>
              <Upload size={32} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 6 }}>
                {uploading ? "Uploading…" : "Drag & drop or click to choose"}
              </p>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 16px" }}>JPG, PNG, WebP · Max 10 MB</p>
              {!uploading && (
                <button type="button" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                  style={{ padding: "8px 20px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Choose File
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) void uploadFile(f); e.target.value = ""; }} />
            </div>
            {uploadError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "9px 13px", fontSize: 12.5, color: "#dc2626", marginBottom: 16 }}>⚠ {uploadError}</div>
            )}
            <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#92400e", lineHeight: 1.7 }}>
              <strong>Recommended sizes for hero slides:</strong><br />
              Background image: <strong>1920 × 900 px</strong> (JPG/WebP)<br />
              Video poster frame: <strong>1920 × 900 px</strong><br />
              Compress to under 500 KB for fast page load
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Image URL input with picker button ──────────────────────────────────────
function ImageInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <>
      <div style={{ display: "flex", gap: 6 }}>
        <input style={{ ...inp, flex: 1 }} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "/images/..."} />
        <button type="button" onClick={() => setShowPicker(true)}
          title="Pick from Media Library"
          style={{ padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", color: "#64748b", flexShrink: 0, display: "flex", alignItems: "center" }}>
          <FolderOpen size={14} />
        </button>
      </div>
      {showPicker && <ImagePickerModal onPick={onChange} onClose={() => setShowPicker(false)} />}
    </>
  );
}

// ─── Video Picker Modal ───────────────────────────────────────────────────────
function VideoPickerModal({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadMedia = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/media").then(r => r.json()).then(d => {
      const all: MediaItem[] = d.media || [];
      setItems(all.filter(m => m.mime_type?.startsWith("video/") || /\.(mp4|webm|mov|ogv)$/i.test(m.file_path)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const importExisting = useCallback(async () => {
    setImporting(true);
    await fetch("/api/admin/media/import", { method: "POST" });
    setImporting(false);
    loadMedia();
  }, [loadMedia]);

  const hasAutoImported = useRef(false);
  useEffect(() => { loadMedia(); }, [loadMedia]);
  useEffect(() => {
    if (!loading && !hasAutoImported.current) {
      hasAutoImported.current = true;
      fetch("/api/admin/media/import", { method: "POST" }).then(() => loadMedia()).catch(() => {});
    }
  }, [loading, loadMedia]);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("video/")) { setUploadError("Please select a video file (MP4, WebM, MOV)."); return; }
    if (file.size > 200 * 1024 * 1024) { setUploadError("File too large — max 200 MB."); return; }
    setUploading(true); setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/admin/media", { method: "POST", body: fd });
      const d = await r.json() as { success?: boolean; media?: MediaItem; error?: string };
      if (d.success && d.media) { onPick(d.media.file_path); onClose(); }
      else setUploadError(d.error || "Upload failed");
    } catch { setUploadError("Upload failed — check your connection"); }
    setUploading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 780, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Pick Video</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={importExisting} disabled={importing}
              title="Sync all videos from /public/images/ into the library"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: importing ? "wait" : "pointer", fontSize: 11, fontWeight: 700, color: "#C0185A" }}>
              🔄 {importing ? "Syncing…" : "Sync files"}
            </button>
            <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}><X size={18} /></button>
          </div>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 14px", background: "#f8fafc" }}>
          {(["library", "upload"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "9px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: tab === t ? "#C0185A" : "#94a3b8", borderBottom: tab === t ? "2px solid #C0185A" : "2px solid transparent", marginBottom: -1 }}>
              {t === "library" ? `🎬 Videos (${items.length})` : "⬆ Upload New"}
            </button>
          ))}
        </div>
        {tab === "library" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={{ textAlign: "center", color: "#94a3b8", padding: "2.5rem 1rem" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🎬</div>
                <p style={{ marginBottom: 12, fontSize: 13 }}>No videos uploaded yet.</p>
                <button onClick={() => setTab("upload")} style={{ padding: "7px 16px", background: "#C0185A", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Upload First Video</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {items.map(item => (
                  <div key={item.id} style={{ position: "relative" }}>
                    <button onClick={() => { onPick(item.file_path); onClose(); }}
                      style={{ width: "100%", border: "2px solid #e2e8f0", borderRadius: 8, overflow: "hidden", cursor: "pointer", background: "#0d1b2e", padding: 0, transition: "border-color 0.15s", textAlign: "left", display: "block" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "#C0185A")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <video src={item.file_path} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} preload="metadata" />
                      <div style={{ padding: "6px 8px", fontSize: 10, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", background: "#fff" }}>{item.original_name}</div>
                    </button>
                    <button
                      onClick={async e => {
                        e.stopPropagation();
                        if (!confirm(`Delete "${item.original_name}"?`)) return;
                        await fetch(`/api/admin/media/${item.id}`, { method: "DELETE" });
                        setItems(prev => prev.filter(x => x.id !== item.id));
                      }}
                      title="Delete"
                      style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, border: "none", borderRadius: "50%", background: "rgba(220,38,38,0.85)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, fontSize: 11, fontWeight: 900, lineHeight: 1 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "upload" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) void uploadFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? "#C0185A" : "#c9d5e8"}`, borderRadius: 10, padding: "48px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "#fff1f5" : "#f8fafc", marginBottom: 16 }}>
              <Upload size={32} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 6 }}>
                {uploading ? "Uploading…" : "Drag & drop or click to choose"}
              </p>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 16px" }}>MP4, WebM, MOV · Max 200 MB</p>
              {!uploading && (
                <button type="button" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                  style={{ padding: "8px 20px", background: "#C0185A", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Choose Video
                </button>
              )}
              <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) void uploadFile(f); e.target.value = ""; }} />
            </div>
            {uploadError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "9px 13px", fontSize: 12.5, color: "#dc2626", marginBottom: 16 }}>⚠ {uploadError}</div>
            )}
            <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#92400e", lineHeight: 1.7 }}>
              <strong>Recommended video settings:</strong><br />
              Format: <strong>MP4 (H.264)</strong> — widest browser support<br />
              Resolution: <strong>1920 × 1080 px</strong> (or 1920 × 900 for hero)<br />
              Keep under <strong>10 MB</strong> for fast page load — compress with HandBrake or ffmpeg
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Video URL input with picker button ──────────────────────────────────────
function VideoInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", gap: 6 }}>
          <input style={{ ...inp, flex: 1 }} value={value} onChange={e => onChange(e.target.value)} placeholder="/uploads/hero.mp4" />
          <button type="button" onClick={() => setShowPicker(true)}
            title="Pick from Media Library"
            style={{ padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", color: "#64748b", flexShrink: 0, display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700 }}>
            🎬 Pick
          </button>
        </div>
        {value && (
          /* eslint-disable-next-line jsx-a11y/media-has-caption */
          <video src={value} muted preload="metadata"
            style={{ width: "100%", maxHeight: 90, borderRadius: 6, objectFit: "cover", border: "1px solid #e2e8f0", background: "#0d1b2e" }} />
        )}
      </div>
      {showPicker && <VideoPickerModal onPick={onChange} onClose={() => setShowPicker(false)} />}
    </>
  );
}

// ─── Image Control Panel (URL + zoom + 3×3 focal point picker) ───────────────
const FOCAL_POINTS = [
  ["top left",    "top",    "top right"],
  ["left",        "center", "right"],
  ["bottom left", "bottom", "bottom right"],
] as const;

function ImageControlPanel({
  imageUrl, zoom, position,
  onImageChange, onZoomChange, onPositionChange,
}: {
  imageUrl: string;
  zoom?: number;
  position?: string;
  onImageChange: (v: string) => void;
  onZoomChange: (v: number) => void;
  onPositionChange: (v: string) => void;
}) {
  const z = zoom ?? 100;
  const pos = position || "center";
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <ImageInput value={imageUrl} onChange={onImageChange} />
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Thumbnail preview */}
        <div style={{
          width: 108, height: 76, borderRadius: 6, overflow: "hidden",
          border: "1px solid #e2e8f0", background: "#f1f5f9", flexShrink: 0,
        }}>
          {imageUrl
            ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" style={{
                width: "100%", height: "100%",
                objectFit: "cover", objectPosition: pos,
                transform: z > 100 ? `scale(${z / 100})` : undefined,
                transformOrigin: pos,
              }} />
            )
            : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#cbd5e1" }}>
                <ImageIcon size={24} />
              </div>
            )}
        </div>
        {/* Controls */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ ...lbl, marginBottom: 3 }}>Zoom — {z}%</label>
            <input type="range" min={100} max={200} step={5} value={z}
              onChange={e => onZoomChange(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#2070B8" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}>
              <span>100%</span><span>200%</span>
            </div>
          </div>
          <div>
            <label style={{ ...lbl, marginBottom: 4 }}>Focal Point</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 28px)", gap: 3 }}>
              {FOCAL_POINTS.flat().map(p => (
                <button key={p} title={p} onClick={() => onPositionChange(p)} style={{
                  width: 28, height: 28, padding: 0,
                  border: `2px solid ${pos === p ? "#2070B8" : "#e2e8f0"}`,
                  borderRadius: 5, cursor: "pointer",
                  background: pos === p ? "#2070B8" : "#f8fafc",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: pos === p ? "#fff" : "#94a3b8", display: "block" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SectionCard wrapper ──────────────────────────────────────────────────────
function SectionCard({
  title, icon, description, hasDraft, unpublished, accentColor = "#2070B8",
  open, onToggle, children, dimmed = false,
}: {
  title: string; icon: React.ReactNode; description: string;
  hasDraft: boolean; unpublished: boolean; accentColor?: string;
  open: boolean; onToggle: () => void; children: React.ReactNode;
  dimmed?: boolean;
}) {
  const eff = dimmed ? "#64748b" : accentColor;
  return (
    <div style={{
      borderRadius: 10, overflow: "hidden", marginBottom: 6,
      background: dimmed ? "#f8fafc" : "#fff",
      boxShadow: open ? "0 4px 20px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.05)",
      border: `1px solid ${open ? eff + "44" : "#e8ecf0"}`,
      transition: "box-shadow 0.2s, border-color 0.2s",
      opacity: dimmed ? 0.65 : 1,
    }}>
      <div onClick={onToggle}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", paddingRight: 38, cursor: "pointer", background: open ? "#fff" : "#fcfcfd", borderLeft: `3px solid ${hasDraft ? "#f97316" : unpublished ? "#eab308" : open ? eff : dimmed ? "#94a3b8" : "#e2e8f0"}`, transition: "all 0.2s", userSelect: "none" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: open ? eff : "#f1f5f9", color: open ? "#fff" : "#64748b", transition: "all 0.2s" }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: open ? "#0f172a" : "#334155" }}>{title}</span>
            {dimmed && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", background: "#f1f5f9", border: "1px solid #cbd5e1", color: "#64748b", borderRadius: 20, padding: "1px 6px" }}>HIDDEN</span>}
            {!dimmed && hasDraft && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", background: "#fff7ed", border: "1px solid #fdba74", color: "#c2410c", borderRadius: 20, padding: "1px 6px" }}>DRAFT</span>}
            {!dimmed && unpublished && <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", background: "#fef9c3", border: "1px solid #fde047", color: "#854d0e", borderRadius: 20, padding: "1px 6px" }}>UNPUBLISHED</span>}
          </div>
          <div style={{ fontSize: 11, color: dimmed ? "#94a3b8" : "#94a3b8", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{description}</div>
        </div>
        <ChevronDown size={14} style={{ color: "#cbd5e1", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.25s", flexShrink: 0 }} />
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${eff}22`, background: "#fafbfc", padding: "14px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Array helpers ────────────────────────────────────────────────────────────
function moveArr<T>(arr: T[], idx: number, dir: -1 | 1): T[] {
  const n = [...arr];
  const swap = idx + dir;
  if (swap < 0 || swap >= n.length) return n;
  [n[idx], n[swap]] = [n[swap], n[idx]];
  return n;
}

// ─── Section editors ──────────────────────────────────────────────────────────

type SlideTranslation = { eyebrow?: string; title?: string; cta_label?: string };
type Slide = { type: string; src: string; poster: string; eyebrow: string; title: string; cta_label: string; cta_href: string; cta_external: boolean; show_platforms: boolean; overlay_opacity?: number; img_zoom?: number; img_position?: string; translations?: Record<string, SlideTranslation> };

// Default fallback — replaced at runtime by active languages fetched from DB
const TRANS_LANGS_DEFAULT = [
  { code: "hi", label: "Hindi", flag: "🇮🇳" },
  { code: "ta", label: "Tamil", flag: "🇮🇳" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

type TransLang = { code: string; label: string; flag: string };
const TransLangsContext = createContext<TransLang[]>(TRANS_LANGS_DEFAULT);

function SlideTranslationPanel({ slide, slideIdx, onChange }: {
  slide: Slide;
  slideIdx: number;
  onChange: (t: Record<string, SlideTranslation>) => void;
}) {
  const transLangs = useContext(TransLangsContext);
  const [activeLang, setActiveLang] = useState(transLangs[0]?.code ?? "hi");
  const [translating, setTranslating] = useState<string | null>(null);

  const translations = slide.translations ?? {};
  const draft = translations[activeLang] ?? {};

  const setField = (field: keyof SlideTranslation, val: string) => {
    onChange({ ...translations, [activeLang]: { ...draft, [field]: val } });
  };

  const autoTranslate = async () => {
    setTranslating(activeLang);
    const fields: (keyof SlideTranslation)[] = ["eyebrow", "title", "cta_label"];
    const updated = { ...draft };
    for (const field of fields) {
      const src = slide[field] || "";
      if (!src) continue;
      try {
        const r = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: src, target: activeLang }),
        });
        const d = await r.json() as { translated?: string };
        if (d.translated) updated[field] = d.translated;
      } catch { /* skip */ }
    }
    onChange({ ...translations, [activeLang]: updated });
    setTranslating(null);
  };

  return (
    <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 8, paddingTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Translations</p>
        <button
          onClick={autoTranslate}
          disabled={!!translating}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: translating ? "#f8fafc" : "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, cursor: "pointer", fontSize: 11, color: "#2070B8", fontWeight: 700 }}>
          {translating ? "⟳ Translating…" : "⚡ Auto-Translate"}
        </button>
      </div>

      {/* Lang tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
        {transLangs.map(l => {
          const filled = !!(translations[l.code]?.title || translations[l.code]?.eyebrow);
          return (
            <button key={l.code} onClick={() => setActiveLang(l.code)}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", border: `1px solid ${activeLang === l.code ? "#2070B8" : "#e2e8f0"}`, borderRadius: 5, background: activeLang === l.code ? "#eff6ff" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: activeLang === l.code ? "#2070B8" : "#64748b" }}>
              <span>{l.flag}</span> {l.label}
              {filled && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />}
            </button>
          );
        })}
      </div>

      {/* Fields for active lang */}
      <div style={row2}>
        <div>
          <label style={lbl}>Eyebrow ({activeLang})</label>
          <input style={inp} value={draft.eyebrow ?? ""} onChange={e => setField("eyebrow", e.target.value)} placeholder={slide.eyebrow || "e.g. Evangelism"} />
        </div>
        <div>
          <label style={lbl}>CTA Label ({activeLang})</label>
          <input style={inp} value={draft.cta_label ?? ""} onChange={e => setField("cta_label", e.target.value)} placeholder={slide.cta_label || "Learn More"} />
        </div>
      </div>
      <div>
        <label style={lbl}>Title ({activeLang}) — press Enter for new line</label>
        <textarea style={{ ...ta, minHeight: 60 }} value={draft.title ?? ""} onChange={e => setField("title", e.target.value)} placeholder={slide.title || "Slide title…"} />
      </div>
    </div>
  );
}

// ─── Generic translation panel for site-content sections ─────────────────────
type TranslField = { key: string; label: string; multiline?: boolean; value: string };

function SectionTranslationPanel({
  fields,
  translations,
  onChange,
}: {
  fields: TranslField[];
  translations: Record<string, Record<string, string>>;
  onChange: (t: Record<string, Record<string, string>>) => void;
}) {
  const transLangs = useContext(TransLangsContext);
  const [activeLang, setActiveLang] = useState(transLangs[0]?.code ?? "hi");
  const [translating, setTranslating] = useState(false);

  // Sync activeLang when transLangs updates (e.g. new language added in Settings)
  useEffect(() => {
    if (transLangs.length > 0 && !transLangs.find(l => l.code === activeLang)) {
      setActiveLang(transLangs[0].code);
    }
  }, [transLangs, activeLang]);

  const draft = translations[activeLang] ?? {};

  const setField = (fieldKey: string, val: string) => {
    onChange({ ...translations, [activeLang]: { ...draft, [fieldKey]: val } });
  };

  const autoTranslate = async () => {
    setTranslating(true);
    const updated = { ...draft };
    for (const field of fields) {
      if (!field.value) continue;
      try {
        const r = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: field.value, target: activeLang }),
        });
        const d = await r.json() as { translated?: string };
        if (d.translated) updated[field.key] = d.translated;
      } catch { /* skip */ }
    }
    onChange({ ...translations, [activeLang]: updated });
    setTranslating(false);
  };

  return (
    <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 12, paddingTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>🌐 Translations</p>
        <button onClick={() => void autoTranslate()} disabled={translating}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: translating ? "#f8fafc" : "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 5, cursor: translating ? "wait" : "pointer", fontSize: 11, color: "#2070B8", fontWeight: 700 }}>
          {translating ? "⟳ Translating…" : "⚡ Auto-Translate"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
        {transLangs.map(l => {
          const filled = fields.some(f => !!(translations[l.code]?.[f.key]));
          return (
            <button key={l.code} onClick={() => setActiveLang(l.code)}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", border: `1px solid ${activeLang === l.code ? "#2070B8" : "#e2e8f0"}`, borderRadius: 5, background: activeLang === l.code ? "#eff6ff" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: activeLang === l.code ? "#2070B8" : "#64748b" }}>
              {l.flag} {l.label}
              {filled && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />}
            </button>
          );
        })}
      </div>
      {fields.map(field => (
        <div key={field.key} style={{ marginBottom: 8 }}>
          <label style={lbl}>{field.label} ({activeLang})</label>
          {field.multiline ? (
            <textarea style={{ ...ta, minHeight: 60 }} value={draft[field.key] ?? ""} onChange={e => setField(field.key, e.target.value)} placeholder={field.value || `${field.label}…`} />
          ) : (
            <input style={inp} value={draft[field.key] ?? ""} onChange={e => setField(field.key, e.target.value)} placeholder={field.value || `${field.label}…`} />
          )}
        </div>
      ))}
    </div>
  );
}

function HeroEditor({
  data, onChange, onFocusSlide,
}: {
  data: Slide[];
  onChange: (v: Slide[]) => void;
  onFocusSlide?: (idx: number | null) => void;
}) {
  const add = () => onChange([...data, { type: "image", src: "", poster: "", eyebrow: "", title: "", cta_label: "Learn More", cta_href: "/", cta_external: false, show_platforms: false, overlay_opacity: 60, img_zoom: 100, img_position: "center" }]);
  return (
    <div>
      {data.map((s, i) => (
        <div
          key={i}
          style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 10, background: "#fff" }}
          onMouseEnter={() => onFocusSlide?.(i)}
          onMouseLeave={() => onFocusSlide?.(null)}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Slide {i + 1}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {i > 0 && <button onClick={() => onChange(moveArr(data, i, -1))} style={{ padding: "3px 6px", border: "1px solid #e2e8f0", borderRadius: 4, background: "#fff", cursor: "pointer" }}><ChevronUp size={11} /></button>}
              {i < data.length - 1 && <button onClick={() => onChange(moveArr(data, i, 1))} style={{ padding: "3px 6px", border: "1px solid #e2e8f0", borderRadius: 4, background: "#fff", cursor: "pointer" }}><ChevronDown size={11} /></button>}
              <button onClick={() => onChange(data.filter((_, j) => j !== i))} style={{ padding: "3px 6px", border: "1px solid #fecaca", borderRadius: 4, background: "#fef2f2", cursor: "pointer", color: "#C0185A" }}><Trash2 size={11} /></button>
            </div>
          </div>

          <div style={row2}>
            <div>
              <label style={lbl}>Type</label>
              <select style={inp} value={s.type} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Eyebrow text</label>
              <input style={inp} value={s.eyebrow} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, eyebrow: e.target.value } : x))} placeholder="e.g. Evangelism" />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Title — press Enter for new line</label>
            <textarea style={{ ...ta, minHeight: 64 }} value={s.title} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="GOSPEL FESTIVALS&#10;ACROSS THE NATIONS" />
          </div>

          {/* Background media — ImageControlPanel for image slides, plain input + poster panel for video */}
          {s.type === "image" ? (
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Background Image — zoom & focal point</label>
              <ImageControlPanel
                imageUrl={s.src}
                zoom={s.img_zoom}
                position={s.img_position}
                onImageChange={v => onChange(data.map((x, j) => j === i ? { ...x, src: v } : x))}
                onZoomChange={v => onChange(data.map((x, j) => j === i ? { ...x, img_zoom: v } : x))}
                onPositionChange={v => onChange(data.map((x, j) => j === i ? { ...x, img_position: v } : x))}
              />
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Video File</label>
                <VideoInput value={s.src} onChange={v => onChange(data.map((x, j) => j === i ? { ...x, src: v } : x))} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Poster / Thumbnail — zoom & focal point</label>
                <ImageControlPanel
                  imageUrl={s.poster}
                  zoom={s.img_zoom}
                  position={s.img_position}
                  onImageChange={v => onChange(data.map((x, j) => j === i ? { ...x, poster: v } : x))}
                  onZoomChange={v => onChange(data.map((x, j) => j === i ? { ...x, img_zoom: v } : x))}
                  onPositionChange={v => onChange(data.map((x, j) => j === i ? { ...x, img_position: v } : x))}
                />
              </div>
            </>
          )}

          {/* Overlay opacity */}
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Overlay Opacity — {s.overlay_opacity ?? 60}%</label>
            <input type="range" min={0} max={90} step={5}
              value={s.overlay_opacity ?? 60}
              onChange={e => onChange(data.map((x, j) => j === i ? { ...x, overlay_opacity: Number(e.target.value) } : x))}
              style={{ width: "100%", accentColor: "#2070B8" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}>
              <span>Light</span><span>Dark</span>
            </div>
          </div>

          <div style={row3}>
            <div>
              <label style={lbl}>CTA Label</label>
              <input style={inp} value={s.cta_label} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, cta_label: e.target.value } : x))} />
            </div>
            <div>
              <label style={lbl}>CTA URL</label>
              <input style={inp} value={s.cta_href} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, cta_href: e.target.value } : x))} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 18 }}>
              <label style={{ display: "flex", gap: 6, fontSize: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={s.cta_external} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, cta_external: e.target.checked } : x))} />
                External link
              </label>
              <label style={{ display: "flex", gap: 6, fontSize: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={s.show_platforms} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, show_platforms: e.target.checked } : x))} />
                Show platforms
              </label>
            </div>
          </div>

          {/* Translations */}
          <SlideTranslationPanel
            slide={s}
            slideIdx={i}
            onChange={t => onChange(data.map((x, j) => j === i ? { ...x, translations: t } : x))}
          />
        </div>
      ))}
      <button onClick={add} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "transparent", border: "1px dashed #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#2070B8", fontWeight: 600 }}>
        <Plus size={12} /> Add Slide
      </button>
    </div>
  );
}

type StatsSocial = { facebook: string; youtube: string; instagram: string };
type StatsData = { count: string; tagline: string; social: StatsSocial; translations?: Record<string, Record<string, string>> };

function StatsEditor({ data, onChange }: { data: StatsData; onChange: (v: StatsData) => void }) {
  return (
    <div>
      <div style={row2}>
        <div>
          <label style={lbl}>Count / Number</label>
          <input style={inp} value={data.count} onChange={e => onChange({ ...data, count: e.target.value })} placeholder="30+" />
        </div>
        <div>
          <label style={lbl}>Tagline</label>
          <input style={inp} value={data.tagline} onChange={e => onChange({ ...data, tagline: e.target.value })} placeholder="Nations Served…" />
        </div>
      </div>
      <div style={row3}>
        <div>
          <label style={lbl}>Facebook URL</label>
          <input style={inp} value={data.social?.facebook || ""} onChange={e => onChange({ ...data, social: { ...data.social, facebook: e.target.value } })} />
        </div>
        <div>
          <label style={lbl}>YouTube URL</label>
          <input style={inp} value={data.social?.youtube || ""} onChange={e => onChange({ ...data, social: { ...data.social, youtube: e.target.value } })} />
        </div>
        <div>
          <label style={lbl}>Instagram URL</label>
          <input style={inp} value={data.social?.instagram || ""} onChange={e => onChange({ ...data, social: { ...data.social, instagram: e.target.value } })} />
        </div>
      </div>
      <SectionTranslationPanel
        fields={[{ key: "tagline", label: "Tagline", value: data.tagline }]}
        translations={data.translations ?? {}}
        onChange={t => onChange({ ...data, translations: t })}
      />
    </div>
  );
}

type WelcomeData = { image: string; image_zoom?: number; image_position?: string; heading: string; body1: string; body2: string; cta_label: string; cta_href: string; translations?: Record<string, Record<string, string>> };

function WelcomeEditor({ data, onChange }: { data: WelcomeData; onChange: (v: WelcomeData) => void }) {
  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>Section Image</label>
        <ImageControlPanel
          imageUrl={data.image}
          zoom={data.image_zoom}
          position={data.image_position}
          onImageChange={v => onChange({ ...data, image: v })}
          onZoomChange={v => onChange({ ...data, image_zoom: v })}
          onPositionChange={v => onChange({ ...data, image_position: v })}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>Heading</label>
        <input style={inp} value={data.heading} onChange={e => onChange({ ...data, heading: e.target.value })} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>Body paragraph 1</label>
        <textarea style={ta} value={data.body1} onChange={e => onChange({ ...data, body1: e.target.value })} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>Body paragraph 2</label>
        <textarea style={ta} value={data.body2} onChange={e => onChange({ ...data, body2: e.target.value })} />
      </div>
      <div style={row2}>
        <div>
          <label style={lbl}>CTA Label</label>
          <input style={inp} value={data.cta_label} onChange={e => onChange({ ...data, cta_label: e.target.value })} />
        </div>
        <div>
          <label style={lbl}>CTA URL</label>
          <input style={inp} value={data.cta_href} onChange={e => onChange({ ...data, cta_href: e.target.value })} />
        </div>
      </div>
      <SectionTranslationPanel
        fields={[
          { key: "heading",   label: "Heading",       value: data.heading },
          { key: "body1",     label: "Body 1",        value: data.body1, multiline: true },
          { key: "body2",     label: "Body 2",        value: data.body2, multiline: true },
          { key: "cta_label", label: "CTA Label",     value: data.cta_label },
        ]}
        translations={data.translations ?? {}}
        onChange={t => onChange({ ...data, translations: t })}
      />
    </div>
  );
}

type ImpactItem = { value: string; label: string; translations?: Record<string, Record<string, string>> };

function ImpactEditor({ data, onChange }: { data: ImpactItem[]; onChange: (v: ImpactItem[]) => void }) {
  return (
    <div>
      {data.map((item, i) => (
        <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 7, padding: "10px 12px", marginBottom: 8, background: "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 10, marginBottom: 8, alignItems: "end" }}>
            <div>
              <label style={lbl}>Value</label>
              <input style={inp} value={item.value} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="30+" />
            </div>
            <div>
              <label style={lbl}>Label</label>
              <input style={inp} value={item.label} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Nations Served" />
            </div>
            <button onClick={() => onChange(data.filter((_, j) => j !== i))} style={{ padding: "7px 10px", border: "1px solid #fecaca", borderRadius: 6, background: "#fef2f2", cursor: "pointer", color: "#C0185A" }}><Trash2 size={12} /></button>
          </div>
          <SectionTranslationPanel
            fields={[{ key: "label", label: "Label", value: item.label }]}
            translations={item.translations ?? {}}
            onChange={t => onChange(data.map((x, j) => j === i ? { ...x, translations: t } : x))}
          />
        </div>
      ))}
      <button onClick={() => onChange([...data, { value: "", label: "" }])} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "transparent", border: "1px dashed #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#2070B8", fontWeight: 600 }}>
        <Plus size={12} /> Add Stat
      </button>
    </div>
  );
}

type Ministry = { image: string; image_zoom?: number; image_position?: string; category: string; title: string; excerpt: string; href: string; translations?: Record<string, Record<string, string>> };

function MinistriesEditor({ data, onChange }: { data: Ministry[]; onChange: (v: Ministry[]) => void }) {
  return (
    <div>
      {data.map((m, i) => (
        <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 10, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Program {i + 1}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {i > 0 && <button onClick={() => onChange(moveArr(data, i, -1))} style={{ padding: "3px 6px", border: "1px solid #e2e8f0", borderRadius: 4, background: "#fff", cursor: "pointer" }}><ChevronUp size={11} /></button>}
              {i < data.length - 1 && <button onClick={() => onChange(moveArr(data, i, 1))} style={{ padding: "3px 6px", border: "1px solid #e2e8f0", borderRadius: 4, background: "#fff", cursor: "pointer" }}><ChevronDown size={11} /></button>}
              <button onClick={() => onChange(data.filter((_, j) => j !== i))} style={{ padding: "3px 6px", border: "1px solid #fecaca", borderRadius: 4, background: "#fef2f2", cursor: "pointer", color: "#C0185A" }}><Trash2 size={11} /></button>
            </div>
          </div>
          <div style={row3}>
            <div>
              <label style={lbl}>Category</label>
              <input style={inp} value={m.category} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, category: e.target.value } : x))} />
            </div>
            <div>
              <label style={lbl}>Title</label>
              <input style={inp} value={m.title} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
            </div>
            <div>
              <label style={lbl}>Link URL</label>
              <input style={inp} value={m.href} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, href: e.target.value } : x))} />
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={lbl}>Image</label>
            <ImageControlPanel
              imageUrl={m.image}
              zoom={m.image_zoom}
              position={m.image_position}
              onImageChange={v => onChange(data.map((x, j) => j === i ? { ...x, image: v } : x))}
              onZoomChange={v => onChange(data.map((x, j) => j === i ? { ...x, image_zoom: v } : x))}
              onPositionChange={v => onChange(data.map((x, j) => j === i ? { ...x, image_position: v } : x))}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={lbl}>Excerpt</label>
            <textarea style={ta} value={m.excerpt} onChange={e => onChange(data.map((x, j) => j === i ? { ...x, excerpt: e.target.value } : x))} />
          </div>
          <SectionTranslationPanel
            fields={[
              { key: "category", label: "Category",  value: m.category },
              { key: "title",    label: "Title",      value: m.title },
              { key: "excerpt",  label: "Excerpt",    value: m.excerpt, multiline: true },
            ]}
            translations={m.translations ?? {}}
            onChange={t => onChange(data.map((x, j) => j === i ? { ...x, translations: t } : x))}
          />
        </div>
      ))}
      <button onClick={() => onChange([...data, { image: "", category: "", title: "", excerpt: "", href: "/" }])} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "transparent", border: "1px dashed #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#2070B8", fontWeight: 600 }}>
        <Plus size={12} /> Add Program
      </button>
    </div>
  );
}

type Sermon = { image: string; image_zoom?: number; image_position?: string; title: string; date: string; href: string; translations?: Record<string, Record<string, string>> };
type SermonsSectionData = { heading?: string; desc?: string; watch_btn?: string; watch_url?: string; items: Sermon[]; translations?: Record<string, Record<string, string>> };
function normSermons(raw: unknown): SermonsSectionData {
  if (Array.isArray(raw)) return { items: raw as Sermon[] };
  const d = (raw ?? {}) as Partial<SermonsSectionData>;
  return { ...d, items: Array.isArray(d.items) ? d.items : [] };
}

function SermonsEditor({ data, onChange }: { data: SermonsSectionData; onChange: (v: SermonsSectionData) => void }) {
  return (
    <div>
      {/* Section header & CTA */}
      <div style={{ border: "1px solid #bfdbfe", borderRadius: 8, padding: 12, marginBottom: 14, background: "#f0f7ff" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#2070B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Section Header &amp; Watch CTA</div>
        <div style={{ marginBottom: 8 }}>
          <label style={lbl}>Section Heading</label>
          <input style={inp} value={data.heading ?? ""} placeholder="Watch and Listen to Dr. Wesley" onChange={e => onChange({ ...data, heading: e.target.value })} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={lbl}>Description</label>
          <textarea style={{ ...ta, minHeight: 56 }} value={data.desc ?? ""} placeholder="Subscribe to our YouTube channel for sermons, crusade highlights, and ministry updates from Dr. Wesley Paul." onChange={e => onChange({ ...data, desc: e.target.value })} />
        </div>
        <div style={row2}>
          <div>
            <label style={lbl}>Watch Button Label</label>
            <input style={inp} value={data.watch_btn ?? ""} placeholder="Watch on YouTube" onChange={e => onChange({ ...data, watch_btn: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Watch Button URL</label>
            <input style={inp} value={data.watch_url ?? ""} placeholder="https://www.youtube.com/@DrWesleyPaul" onChange={e => onChange({ ...data, watch_url: e.target.value })} />
          </div>
        </div>
        <SectionTranslationPanel
          fields={[
            { key: "heading", label: "Heading", value: data.heading || "Watch and Listen to Dr. Wesley" },
            { key: "watch_btn", label: "Watch Button Label", value: data.watch_btn || "Watch on YouTube" },
          ]}
          translations={data.translations ?? {}}
          onChange={t => onChange({ ...data, translations: t })}
        />
      </div>

      {/* Individual sermon cards */}
      {data.items.map((s, i) => (
        <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, marginBottom: 10, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Sermon {i + 1}</span>
            <button onClick={() => onChange({ ...data, items: data.items.filter((_, j) => j !== i) })} style={{ padding: "3px 6px", border: "1px solid #fecaca", borderRadius: 4, background: "#fef2f2", cursor: "pointer", color: "#C0185A" }}><Trash2 size={11} /></button>
          </div>
          <div style={row2}>
            <div>
              <label style={lbl}>Title</label>
              <input style={inp} value={s.title} onChange={e => onChange({ ...data, items: data.items.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} />
            </div>
            <div>
              <label style={lbl}>Date</label>
              <input style={inp} value={s.date} onChange={e => onChange({ ...data, items: data.items.map((x, j) => j === i ? { ...x, date: e.target.value } : x) })} placeholder="Jan 13, 2024" />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Thumbnail Image</label>
            <ImageControlPanel
              imageUrl={s.image}
              zoom={s.image_zoom}
              position={s.image_position}
              onImageChange={v => onChange({ ...data, items: data.items.map((x, j) => j === i ? { ...x, image: v } : x) })}
              onZoomChange={v => onChange({ ...data, items: data.items.map((x, j) => j === i ? { ...x, image_zoom: v } : x) })}
              onPositionChange={v => onChange({ ...data, items: data.items.map((x, j) => j === i ? { ...x, image_position: v } : x) })}
            />
          </div>
          <div style={{ ...row2, marginBottom: 8 }}>
            <div>
              <label style={lbl}>Link (YouTube or page)</label>
              <input style={inp} value={s.href} onChange={e => onChange({ ...data, items: data.items.map((x, j) => j === i ? { ...x, href: e.target.value } : x) })} />
            </div>
          </div>
          <SectionTranslationPanel
            fields={[{ key: "title", label: "Title", value: s.title }]}
            translations={s.translations ?? {}}
            onChange={t => onChange({ ...data, items: data.items.map((x, j) => j === i ? { ...x, translations: t } : x) })}
          />
        </div>
      ))}
      <button onClick={() => onChange({ ...data, items: [...data.items, { image: "", title: "", date: "", href: "" }] })} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "transparent", border: "1px dashed #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#2070B8", fontWeight: 600 }}>
        <Plus size={12} /> Add Sermon
      </button>
    </div>
  );
}

// ─── Posts section editor (shared for News / Blog / Events) ────────────────
type PostsSectionConfig = { show?: boolean; heading?: string; eyebrow?: string; limit?: number; view_all_label?: string; view_all_href?: string; translations?: Record<string, Record<string, string>> };

function PostsSectionEditor({
  data, onChange,
  defaults,
}: {
  data: PostsSectionConfig;
  onChange: (v: PostsSectionConfig) => void;
  defaults: { heading: string; eyebrow: string; viewAllHref: string };
}) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, background: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Section Visibility</span>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={data.show !== false} onChange={e => onChange({ ...data, show: e.target.checked })} />
          <span style={{ fontSize: 12, fontWeight: 600, color: data.show !== false ? "#16a34a" : "#94a3b8" }}>
            {data.show !== false ? "Shown on homepage" : "Hidden from homepage"}
          </span>
        </label>
      </div>
      <div style={row2}>
        <div>
          <label style={lbl}>Section Heading</label>
          <input style={inp} value={data.heading ?? ""} placeholder={defaults.heading} onChange={e => onChange({ ...data, heading: e.target.value })} />
        </div>
        <div>
          <label style={lbl}>Eyebrow Label</label>
          <input style={inp} value={data.eyebrow ?? ""} placeholder={defaults.eyebrow} onChange={e => onChange({ ...data, eyebrow: e.target.value })} />
        </div>
      </div>
      <div style={row2}>
        <div>
          <label style={lbl}>View All Label</label>
          <input style={inp} value={data.view_all_label ?? ""} placeholder="View All" onChange={e => onChange({ ...data, view_all_label: e.target.value })} />
        </div>
        <div>
          <label style={lbl}>View All URL</label>
          <input style={inp} value={data.view_all_href ?? ""} placeholder={defaults.viewAllHref} onChange={e => onChange({ ...data, view_all_href: e.target.value })} />
        </div>
      </div>
      <div>
        <label style={lbl}>Items to show — {data.limit ?? 3}</label>
        <input type="range" min={1} max={9} step={1} value={data.limit ?? 3}
          onChange={e => onChange({ ...data, limit: Number(e.target.value) })}
          style={{ width: "100%", accentColor: "#2070B8" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}><span>1</span><span>9</span></div>
      </div>
      {data.show === false && (
        <div style={{ marginTop: 12, padding: "8px 12px", background: "#fffbeb", borderRadius: 6, fontSize: 11.5, color: "#d97706", border: "1px solid #fde68a" }}>
          ℹ️ This section is hidden. Enable it above to show on the homepage.
        </div>
      )}
      <SectionTranslationPanel
        fields={[
          { key: "heading",        label: "Section Heading", value: data.heading ?? defaults.heading },
          { key: "eyebrow",        label: "Eyebrow Label",   value: data.eyebrow ?? defaults.eyebrow },
          { key: "view_all_label", label: "View All Button", value: data.view_all_label ?? "View All" },
        ]}
        translations={data.translations ?? {}}
        onChange={t => onChange({ ...data, translations: t })}
      />
    </div>
  );
}

// ─── Ministry in Action editor (kept for any legacy use) ────────────────────
type MinistryActionConfig = { show?: boolean; heading?: string; eyebrow?: string; limit?: number; sources?: string[]; view_all_label?: string; view_all_href?: string };

function MinistryActionEditor({ data, onChange }: { data: MinistryActionConfig; onChange: (v: MinistryActionConfig) => void }) {
  const sources = data.sources ?? ["gallery", "blog", "news"];
  const toggle = (s: string) => {
    const next = sources.includes(s) ? sources.filter(x => x !== s) : [...sources, s];
    onChange({ ...data, sources: next });
  };
  return (
    <div>
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, marginBottom: 10, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Visibility</span>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={data.show !== false} onChange={e => onChange({ ...data, show: e.target.checked })} />
            <span style={{ fontSize: 12, fontWeight: 600, color: data.show !== false ? "#16a34a" : "#94a3b8" }}>
              {data.show !== false ? "Shown on homepage" : "Hidden"}
            </span>
          </label>
        </div>
        <div style={row2}>
          <div>
            <label style={lbl}>Section Heading</label>
            <input style={inp} value={data.heading ?? ""} placeholder="Ministry in Action" onChange={e => onChange({ ...data, heading: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Eyebrow Label</label>
            <input style={inp} value={data.eyebrow ?? ""} placeholder="Latest Updates" onChange={e => onChange({ ...data, eyebrow: e.target.value })} />
          </div>
        </div>
        <div style={row2}>
          <div>
            <label style={lbl}>View All Label</label>
            <input style={inp} value={data.view_all_label ?? ""} placeholder="View All" onChange={e => onChange({ ...data, view_all_label: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>View All URL</label>
            <input style={inp} value={data.view_all_href ?? ""} placeholder="/gallery" onChange={e => onChange({ ...data, view_all_href: e.target.value })} />
          </div>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={lbl}>Items to show — {data.limit ?? 4}</label>
          <input type="range" min={2} max={8} step={1} value={data.limit ?? 4}
            onChange={e => onChange({ ...data, limit: Number(e.target.value) })}
            style={{ width: "100%", accentColor: "#0891b2" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}><span>2</span><span>8</span></div>
        </div>
        <div>
          <label style={lbl}>Content Sources</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(["gallery", "blog", "news"] as const).map(s => (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", border: `1px solid ${sources.includes(s) ? "#0891b2" : "#e2e8f0"}`, borderRadius: 6, cursor: "pointer", background: sources.includes(s) ? "#e0f2fe" : "#fff", fontSize: 12, fontWeight: 600, color: sources.includes(s) ? "#0891b2" : "#64748b" }}>
                <input type="checkbox" checked={sources.includes(s)} onChange={() => toggle(s)} style={{ accentColor: "#0891b2" }} />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </label>
            ))}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: "#94a3b8" }}>
            Pulls the latest published content from selected sources automatically.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Media section editor ───────────────────────────────────────────────────
type SiteMediaItem = { id?: string; url: string; title: string; thumbnail?: string; play_mode: "inline" | "external" };
type SiteMediaSectionData = {
  show?: boolean; heading?: string; eyebrow?: string; items: SiteMediaItem[];
  limit?: number; show_cta?: boolean; cta_label?: string; cta_href?: string;
  translations?: Record<string, Record<string, string>>;
};

function MediaSectionEditor({ data, onChange }: { data: SiteMediaSectionData; onChange: (v: SiteMediaSectionData) => void }) {
  const upd = (patch: Partial<SiteMediaSectionData>) => onChange({ ...data, ...patch });
  const itemCount = (data.items ?? []).length;
  const limit = typeof data.limit === "number" ? data.limit : 3;

  return (
    <div>
      {/* Info banner — videos managed elsewhere */}
      <div style={{ background: "#eff6ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#0369a1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span>🎬 {itemCount} video{itemCount !== 1 ? "s" : ""} in library — add or edit videos in the Media Section Manager.</span>
        <a href="/admin/media-section" target="_blank" rel="noopener noreferrer"
          style={{ fontWeight: 700, color: "#2070B8", textDecoration: "none", whiteSpace: "nowrap", fontSize: 11 }}>
          Open Manager ↗
        </a>
      </div>

      {/* Visibility + heading */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, marginBottom: 12, background: "#f8fafc" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Section Settings</span>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={data.show !== false} onChange={e => upd({ show: e.target.checked })} />
            <span style={{ fontSize: 12, fontWeight: 600, color: data.show !== false ? "#16a34a" : "#94a3b8" }}>
              {data.show !== false ? "Visible" : "Hidden"}
            </span>
          </label>
        </div>
        <div style={row2}>
          <div>
            <label style={lbl}>Section Heading</label>
            <input style={inp} value={data.heading ?? ""} placeholder="Watch & Listen to Dr. Wesley" onChange={e => upd({ heading: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Eyebrow Label</label>
            <input style={inp} value={data.eyebrow ?? ""} placeholder="Media" onChange={e => upd({ eyebrow: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Limit */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, marginBottom: 12, background: "#fff" }}>
        <label style={lbl}>Videos to show on homepage (1 – {Math.max(itemCount, 9)})</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="range" min={1} max={Math.max(itemCount, 9)} value={limit}
            onChange={e => upd({ limit: Number(e.target.value) })}
            style={{ flex: 1, accentColor: "#7c3aed" }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", minWidth: 20, textAlign: "center" }}>{limit}</span>
        </div>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
          Showing {Math.min(limit, itemCount)} of {itemCount} video{itemCount !== 1 ? "s" : ""}
        </p>
      </div>

      {/* View All CTA */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>View All CTA</span>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={data.show_cta !== false} onChange={e => upd({ show_cta: e.target.checked })} />
            <span style={{ fontSize: 12, fontWeight: 600, color: data.show_cta !== false ? "#16a34a" : "#94a3b8" }}>
              {data.show_cta !== false ? "Show" : "Hide"}
            </span>
          </label>
        </div>
        <div style={row2}>
          <div>
            <label style={lbl}>Button Label</label>
            <input style={inp} value={data.cta_label ?? ""} placeholder="View All Media" onChange={e => upd({ cta_label: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Button Link</label>
            <input style={inp} value={data.cta_href ?? ""} placeholder="/media" onChange={e => upd({ cta_href: e.target.value })} />
          </div>
        </div>
      </div>

      <SectionTranslationPanel
        fields={[
          { key: "heading",   label: "Heading",          value: data.heading   ?? "Watch & Listen to Dr. Wesley" },
          { key: "eyebrow",   label: "Eyebrow",          value: data.eyebrow   ?? "Media" },
          { key: "cta_label", label: "View All Button",  value: data.cta_label ?? "View All Media" },
        ]}
        translations={data.translations ?? {}}
        onChange={t => upd({ translations: t })}
      />
    </div>
  );
}

type Endorsement = { quote: string; name: string; title: string; initials: string; color: string; translations?: Record<string, Record<string, string>> };

function EndorsementsEditor({ data, onChange }: { data: Endorsement[]; onChange: (v: Endorsement[]) => void }) {
  return (
    <div>
      {data.map((e, i) => (
        <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 10, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Endorsement {i + 1}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {i > 0 && <button onClick={() => onChange(moveArr(data, i, -1))} style={{ padding: "3px 6px", border: "1px solid #e2e8f0", borderRadius: 4, background: "#fff", cursor: "pointer" }}><ChevronUp size={11} /></button>}
              {i < data.length - 1 && <button onClick={() => onChange(moveArr(data, i, 1))} style={{ padding: "3px 6px", border: "1px solid #e2e8f0", borderRadius: 4, background: "#fff", cursor: "pointer" }}><ChevronDown size={11} /></button>}
              <button onClick={() => onChange(data.filter((_, j) => j !== i))} style={{ padding: "3px 6px", border: "1px solid #fecaca", borderRadius: 4, background: "#fef2f2", cursor: "pointer", color: "#C0185A" }}><Trash2 size={11} /></button>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={lbl}>Quote</label>
            <textarea style={{ ...ta, minHeight: 80 }} value={e.quote} onChange={ev => onChange(data.map((x, j) => j === i ? { ...x, quote: ev.target.value } : x))} />
          </div>
          <div style={row3}>
            <div>
              <label style={lbl}>Name</label>
              <input style={inp} value={e.name} onChange={ev => onChange(data.map((x, j) => j === i ? { ...x, name: ev.target.value } : x))} />
            </div>
            <div>
              <label style={lbl}>Initials</label>
              <input style={inp} value={e.initials} onChange={ev => onChange(data.map((x, j) => j === i ? { ...x, initials: ev.target.value } : x))} maxLength={3} />
            </div>
            <div>
              <label style={lbl}>Avatar Color</label>
              <input type="color" style={{ ...inp, height: 34 }} value={e.color} onChange={ev => onChange(data.map((x, j) => j === i ? { ...x, color: ev.target.value } : x))} />
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={lbl}>Title / Organisation</label>
            <input style={inp} value={e.title} onChange={ev => onChange(data.map((x, j) => j === i ? { ...x, title: ev.target.value } : x))} />
          </div>
          <SectionTranslationPanel
            fields={[
              { key: "quote", label: "Quote", value: e.quote, multiline: true },
              { key: "title", label: "Title / Org", value: e.title },
            ]}
            translations={e.translations ?? {}}
            onChange={t => onChange(data.map((x, j) => j === i ? { ...x, translations: t } : x))}
          />
        </div>
      ))}
      <button onClick={() => onChange([...data, { quote: "", name: "", title: "", initials: "", color: "#2070B8" }])} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "transparent", border: "1px dashed #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#2070B8", fontWeight: 600 }}>
        <Plus size={12} /> Add Endorsement
      </button>
    </div>
  );
}

type GallerySettings = { images: string[]; show?: boolean; heading?: string; eyebrow?: string; limit?: number; show_cta?: boolean; cta_label?: string; cta_href?: string; translations?: Record<string, Record<string, string>> };
function normGallery(raw: unknown): GallerySettings {
  if (Array.isArray(raw)) return { images: raw as string[], show: true, heading: "Ministry in Action", eyebrow: "Gallery", limit: 10, show_cta: true, cta_label: "View All Photos", cta_href: "/gallery" };
  const g = raw as GallerySettings;
  return { images: g?.images ?? [], show: g?.show !== false, heading: g?.heading ?? "Ministry in Action", eyebrow: g?.eyebrow ?? "Gallery", limit: g?.limit ?? 10, show_cta: g?.show_cta !== false, cta_label: g?.cta_label ?? "View All Photos", cta_href: g?.cta_href ?? "/gallery", translations: g?.translations };
}

function GalleryEditor({ data, onChange }: { data: GallerySettings; onChange: (v: GallerySettings) => void }) {
  const imageCount = data.images?.length ?? 0;
  const upd = (patch: Partial<GallerySettings>) => onChange({ ...data, ...patch });
  const limit = data.limit ?? 10;
  const maxLimit = Math.max(imageCount, 12);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Info banner */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>
          📸 {imageCount} photo{imageCount !== 1 ? "s" : ""} in the gallery
        </span>
        <a href="/admin/gallery" target="_blank" style={{ fontSize: 11.5, color: "#2070B8", fontWeight: 700, textDecoration: "none" }}>Open Gallery Manager ↗</a>
      </div>

      {/* Show / Hide */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Section Visibility</span>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={data.show !== false} onChange={e => upd({ show: e.target.checked })} />
          <span style={{ fontSize: 12, fontWeight: 600, color: data.show !== false ? "#16a34a" : "#94a3b8" }}>{data.show !== false ? "Visible" : "Hidden"}</span>
        </label>
      </div>

      {/* Heading + Eyebrow */}
      <div style={row2}>
        <div>
          <label style={lbl}>Heading</label>
          <input style={inp} value={data.heading ?? ""} placeholder="Ministry in Action" onChange={e => upd({ heading: e.target.value })} />
        </div>
        <div>
          <label style={lbl}>Eyebrow</label>
          <input style={inp} value={data.eyebrow ?? ""} placeholder="Gallery" onChange={e => upd({ eyebrow: e.target.value })} />
        </div>
      </div>

      {/* Limit slider */}
      <div>
        <label style={{ ...lbl, marginBottom: 6 }}>Photos to Show: <strong>{limit}</strong></label>
        <input type="range" min={1} max={maxLimit} value={limit} onChange={e => upd({ limit: Number(e.target.value) })} style={{ width: "100%", accentColor: "#16a34a" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 2 }}><span>1</span><span>{maxLimit}</span></div>
      </div>

      {/* CTA card */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, background: "#f8fafc" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>View All CTA</span>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={data.show_cta !== false} onChange={e => upd({ show_cta: e.target.checked })} />
            <span style={{ fontSize: 12, fontWeight: 600, color: data.show_cta !== false ? "#16a34a" : "#94a3b8" }}>{data.show_cta !== false ? "Show" : "Hide"}</span>
          </label>
        </div>
        <div style={row2}>
          <div>
            <label style={lbl}>Button Label</label>
            <input style={inp} value={data.cta_label ?? ""} placeholder="View All Photos" onChange={e => upd({ cta_label: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Button Link</label>
            <input style={inp} value={data.cta_href ?? ""} placeholder="/gallery" onChange={e => upd({ cta_href: e.target.value })} />
          </div>
        </div>
      </div>

      <SectionTranslationPanel
        fields={[
          { key: "heading",   label: "Heading",          value: data.heading   ?? "Ministry in Action" },
          { key: "eyebrow",   label: "Eyebrow",          value: data.eyebrow   ?? "Gallery" },
          { key: "cta_label", label: "View All Button",  value: data.cta_label ?? "View All Photos" },
        ]}
        translations={data.translations ?? {}}
        onChange={t => upd({ translations: t })}
      />
    </div>
  );
}

type GiveCTA = { label: string; heading: string; body: string; primary_label: string; primary_href: string; secondary_label: string; secondary_href: string; translations?: Record<string, Record<string, string>> };

function GiveCTAEditor({ data, onChange }: { data: GiveCTA; onChange: (v: GiveCTA) => void }) {
  return (
    <div>
      <div style={row2}>
        <div>
          <label style={lbl}>Eyebrow Label</label>
          <input style={inp} value={data.label} onChange={e => onChange({ ...data, label: e.target.value })} placeholder="Partner With Us" />
        </div>
        <div />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>Heading</label>
        <input style={inp} value={data.heading} onChange={e => onChange({ ...data, heading: e.target.value })} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={lbl}>Body Text</label>
        <textarea style={ta} value={data.body} onChange={e => onChange({ ...data, body: e.target.value })} />
      </div>
      <div style={row2}>
        <div>
          <label style={lbl}>Primary Button Label</label>
          <input style={inp} value={data.primary_label} onChange={e => onChange({ ...data, primary_label: e.target.value })} />
        </div>
        <div>
          <label style={lbl}>Primary Button URL</label>
          <input style={inp} value={data.primary_href} onChange={e => onChange({ ...data, primary_href: e.target.value })} />
        </div>
      </div>
      <div style={row2}>
        <div>
          <label style={lbl}>Secondary Button Label</label>
          <input style={inp} value={data.secondary_label} onChange={e => onChange({ ...data, secondary_label: e.target.value })} />
        </div>
        <div>
          <label style={lbl}>Secondary Button URL</label>
          <input style={inp} value={data.secondary_href} onChange={e => onChange({ ...data, secondary_href: e.target.value })} />
        </div>
      </div>
      <SectionTranslationPanel
        fields={[
          { key: "label",           label: "Eyebrow",          value: data.label },
          { key: "heading",         label: "Heading",          value: data.heading },
          { key: "body",            label: "Body",             value: data.body, multiline: true },
          { key: "primary_label",   label: "Primary Button",   value: data.primary_label },
          { key: "secondary_label", label: "Secondary Button", value: data.secondary_label },
        ]}
        translations={data.translations ?? {}}
        onChange={t => onChange({ ...data, translations: t })}
      />
    </div>
  );
}

type Link = { label: string; href: string };
type FooterSocial = { facebook: string; youtube: string; instagram: string; twitter: string; tiktok: string };
type FooterData = { tagline: string; address: string; email: string; phone: string; hours: string; social: FooterSocial; quick_links: Link[]; ministry_links: Link[]; translations?: Record<string, Record<string, string>> };

function LinksEditor({ items, onChange }: { items: Link[]; onChange: (v: Link[]) => void }) {
  return (
    <div>
      {items.map((l, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 8 }}>
          <input style={inp} value={l.label} onChange={e => onChange(items.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Label" />
          <input style={inp} value={l.href} onChange={e => onChange(items.map((x, j) => j === i ? { ...x, href: e.target.value } : x))} placeholder="/page or https://..." />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} style={{ padding: "7px 10px", border: "1px solid #fecaca", borderRadius: 6, background: "#fef2f2", cursor: "pointer", color: "#C0185A" }}><Trash2 size={12} /></button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { label: "", href: "/" }])} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "transparent", border: "1px dashed #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#2070B8", fontWeight: 600, marginTop: 4 }}>
        <Plus size={12} /> Add Link
      </button>
    </div>
  );
}

function FooterEditor({ data, onChange }: { data: FooterData; onChange: (v: FooterData) => void }) {
  return (
    <div>

      {/* Brand tagline */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#2070B8", marginBottom: 10 }}>Brand & Tagline</div>
        <div>
          <label style={lbl}>Tagline / About blurb</label>
          <textarea style={ta} value={data.tagline} onChange={e => onChange({ ...data, tagline: e.target.value })} />
        </div>
      </div>

      {/* Contact details */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#2070B8", marginBottom: 10 }}>Contact Details</div>
        <div style={row2}>
          <div>
            <label style={lbl}>Address</label>
            <input style={inp} value={data.address} onChange={e => onChange({ ...data, address: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Email</label>
            <input style={inp} value={data.email} onChange={e => onChange({ ...data, email: e.target.value })} />
          </div>
        </div>
        <div style={row2}>
          <div>
            <label style={lbl}>Phone</label>
            <input style={inp} value={data.phone} onChange={e => onChange({ ...data, phone: e.target.value })} />
          </div>
          <div>
            <label style={lbl}>Office Hours</label>
            <input style={inp} value={data.hours} onChange={e => onChange({ ...data, hours: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Social links */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#2070B8", marginBottom: 10 }}>Social Media URLs</div>
        <div style={row3}>
          <div>
            <label style={lbl}>Facebook</label>
            <input style={inp} value={data.social?.facebook || ""} onChange={e => onChange({ ...data, social: { ...data.social, facebook: e.target.value } })} />
          </div>
          <div>
            <label style={lbl}>YouTube</label>
            <input style={inp} value={data.social?.youtube || ""} onChange={e => onChange({ ...data, social: { ...data.social, youtube: e.target.value } })} />
          </div>
          <div>
            <label style={lbl}>Instagram</label>
            <input style={inp} value={data.social?.instagram || ""} onChange={e => onChange({ ...data, social: { ...data.social, instagram: e.target.value } })} />
          </div>
        </div>
        <div style={row2}>
          <div>
            <label style={lbl}>Twitter / X</label>
            <input style={inp} value={data.social?.twitter || ""} onChange={e => onChange({ ...data, social: { ...data.social, twitter: e.target.value } })} />
          </div>
          <div>
            <label style={lbl}>TikTok</label>
            <input style={inp} value={data.social?.tiktok || ""} onChange={e => onChange({ ...data, social: { ...data.social, tiktok: e.target.value } })} />
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#2070B8", marginBottom: 10 }}>Quick Links</div>
        <LinksEditor items={data.quick_links || []} onChange={v => onChange({ ...data, quick_links: v })} />
      </div>

      {/* Ministry links */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#2070B8", marginBottom: 10 }}>Ministry Links</div>
        <LinksEditor items={data.ministry_links || []} onChange={v => onChange({ ...data, ministry_links: v })} />
      </div>

      {/* Translations */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
        <SectionTranslationPanel
          fields={[
            { key: "tagline", label: "Tagline / About blurb", value: data.tagline, multiline: true },
          ]}
          translations={data.translations ?? {}}
          onChange={t => onChange({ ...data, translations: t })}
        />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
type ContentStore = Record<string, unknown>;

const KEYS = [
  "home_hero_slides", "home_stats_bar", "home_welcome", "home_impact",
  "home_ministries", "home_endorsements", "home_gallery",
  "home_news_section", "home_blog_section", "home_events_section",
  "home_media_section",
  "home_give_cta", "footer_settings",
];

type Viewport = "desktop" | "tablet" | "mobile";

// Section definitions with accent colors
const SECTIONS = [
  { key: "home_hero_slides",   label: "Hero Carousel",    icon: <Layers size={14} />,      color: "#C0185A" },
  { key: "home_stats_bar",     label: "Stats Bar",        icon: <Globe size={14} />,        color: "#0891b2" },
  { key: "home_welcome",       label: "Welcome / About",  icon: <ImageIcon size={14} />,    color: "#7c3aed" },
  { key: "home_impact",        label: "Impact Numbers",   icon: <Globe size={14} />,        color: "#2070B8" },
  { key: "home_ministries",    label: "Ministries",       icon: <Layers size={14} />,       color: "#C0185A" },
  { key: "home_endorsements",  label: "Endorsements",     icon: <Globe size={14} />,        color: "#475569" },
  { key: "home_gallery",        label: "Gallery",              icon: <ImageIcon size={14} />,    color: "#16a34a" },
  { key: "home_news_section",   label: "News",                 icon: <Layers size={14} />,       color: "#C0185A" },
  { key: "home_blog_section",   label: "Blog",                 icon: <Layers size={14} />,       color: "#2070B8" },
  { key: "home_events_section", label: "Events",               icon: <Layers size={14} />,       color: "#0891b2" },
  { key: "home_media_section",  label: "Media (YouTube/IG)",   icon: <ExternalLink size={14} />, color: "#7c3aed" },
  { key: "home_give_cta",         label: "Give / Donate",       icon: <Layers size={14} />,       color: "#b45309" },
  { key: "footer_settings",       label: "Footer",              icon: <Globe size={14} />,        color: "#0f172a" },
] as const;

export default function SiteEditorPage() {
  const [content, setContent]       = useState<ContentStore>({});
  const [published, setPublished]   = useState<ContentStore>({});
  const [drafts, setDrafts]         = useState<ContentStore>({});
  const [loading, setLoading]       = useState(true);
  const [savingDraft, setSavingDraft]       = useState(false);
  const [savingPublish, setSavingPublish]   = useState(false);
  const [translatingAll, setTranslatingAll] = useState(false);
  const [transProgress, setTransProgress]   = useState<{ done: number; total: number } | null>(null);
  const [toast, setToast]           = useState<string | null>(null);
  const [viewport, setViewport]     = useState<Viewport>("desktop");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [openSection, setOpenSection]       = useState<string | null>(null);
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [panelWidth, setPanelWidth] = useState(400);
  const [transLangs, setTransLangs] = useState<TransLang[]>(TRANS_LANGS_DEFAULT);
  const [previewLang, setPreviewLang] = useState<string>("en");
  const [previewLangOpen, setPreviewLangOpen] = useState(false);
  const previewLangRef = useRef<HTMLDivElement>(null);
  const iframeRef      = useRef<HTMLIFrameElement>(null);
  const sectionRefs    = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragging       = useRef(false);
  const dragStartX     = useRef(0);
  const dragStartW     = useRef(0);
  // Cache live media items so broadcasts always include them (items managed by /admin/media-section)
  const liveMediaItemsRef = useRef<SiteMediaItem[]>([]);
  // Cache live gallery images so broadcasts/saves don't wipe them
  const liveGalleryImagesRef = useRef<string[]>([]);

  // ── Drag-to-resize divider ───────────────────────────────────────────────
  const onDividerDown = (e: React.MouseEvent) => {
    dragging.current  = true;
    dragStartX.current = e.clientX;
    dragStartW.current = panelWidth;
    document.body.style.cursor     = "col-resize";
    document.body.style.userSelect = "none";
  };
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const w = Math.max(320, Math.min(640, dragStartW.current + e.clientX - dragStartX.current));
      setPanelWidth(w);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor     = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  // Listen for messages from the preview iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msg = e.data as any;
      if (msg?.type === "SECTION_FOCUS" && msg.key) {
        setOpenSection(msg.key as string);
      }
      if (msg?.type === "TOGGLE_SECTION" && msg.key) {
        setHiddenSections(prev =>
          prev.includes(msg.key) ? prev.filter((k: string) => k !== msg.key) : [...prev, msg.key]
        );
      }
      // Iframe signals it's hydrated and ready — broadcast all current content
      if (msg?.type === "PREVIEW_READY") {
        setContent(latestContent => {
          KEYS.forEach(key => {
            if (latestContent[key] === undefined) return;
            let data = latestContent[key];
            if (key === "home_media_section" && liveMediaItemsRef.current.length > 0)
              data = { ...(latestContent[key] as SiteMediaSectionData), items: liveMediaItemsRef.current };
            if (key === "home_gallery" && liveGalleryImagesRef.current.length > 0)
              data = { ...normGallery(latestContent[key]), images: liveGalleryImagesRef.current };
            try { iframeRef.current?.contentWindow?.postMessage({ type: "PREVIEW_DRAFT", key, data }, "*"); } catch { /* noop */ }
          });
          try { iframeRef.current?.contentWindow?.postMessage({ type: "SECTION_VISIBILITY", hidden: hiddenSections }, "*"); } catch { /* noop */ }
          try { iframeRef.current?.contentWindow?.postMessage({ type: "PREVIEW_PAUSE" }, "*"); } catch { /* noop */ }
          return latestContent; // no state change — just reading
        });
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hiddenSections]);

  const load = useCallback(async () => {
    // Fetch both live keys and draft keys in parallel
    const [liveResults, draftResults] = await Promise.all([
      Promise.all(KEYS.map(key => fetch(`/api/admin/site-content?key=${key}`).then(r => r.json()))),
      Promise.all(KEYS.map(key => fetch(`/api/admin/site-content?key=${key}__draft`).then(r => r.json()))),
    ]);
    const liveStore: ContentStore = {};
    const draftStore: ContentStore = {};
    KEYS.forEach((key, i) => {
      const liveRaw = liveResults[i]?.data?.content_json;
      const draftRaw = draftResults[i]?.data?.content_json;
      if (liveRaw) { try { liveStore[key] = JSON.parse(liveRaw); } catch { liveStore[key] = liveRaw; } }
      if (draftRaw) { try { draftStore[key] = JSON.parse(draftRaw); } catch { draftStore[key] = draftRaw; } }
    });
    setPublished(liveStore);
    setDrafts(draftStore);
    // Editor starts from draft if available, otherwise from live
    const initial: ContentStore = {};
    KEYS.forEach(key => { initial[key] = draftStore[key] ?? liveStore[key]; });
    setContent(initial);
    // Cache live media items — always use these for preview broadcasts
    const liveMediaData = liveStore["home_media_section"] as SiteMediaSectionData | undefined;
    if (Array.isArray(liveMediaData?.items)) liveMediaItemsRef.current = liveMediaData.items;
    // Cache live gallery images
    const liveGalleryRaw = liveStore["home_gallery"];
    const liveGallery = normGallery(liveGalleryRaw);
    if (liveGallery.images.length > 0) liveGalleryImagesRef.current = liveGallery.images;
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  // Fetch active languages from DB (reflects admin settings)
  const fetchLangs = useCallback(() => {
    fetch("/api/languages")
      .then(r => r.json())
      .then((data: { languages?: { code: string; label: string; nativeLabel: string; flag: string }[] }) => {
        if (Array.isArray(data.languages) && data.languages.length > 0) {
          setTransLangs(data.languages.map(l => ({ code: l.code, label: l.label, flag: l.flag })));
        }
      })
      .catch(() => { /* keep defaults */ });
  }, []);
  useEffect(() => { fetchLangs(); }, [fetchLangs]);
  // Re-fetch when user returns from another tab (e.g. added a language in Settings)
  useEffect(() => {
    window.addEventListener("focus", fetchLangs);
    return () => window.removeEventListener("focus", fetchLangs);
  }, [fetchLangs]);

  // Close preview lang dropdown on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (previewLangRef.current && !previewLangRef.current.contains(e.target as Node)) {
        setPreviewLangOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const refreshPreview = useCallback(() => {
    if (!iframeRef.current) return;
    setPreviewLoading(true);
    iframeRef.current.src = iframeRef.current.src;
  }, []);

  // Always fetch the latest items from DB before saving home_media_section
  // so that items added via /admin/media-section are never overwritten.
  const getMediaItemsFromDB = async (): Promise<SiteMediaItem[]> => {
    try {
      const r = await fetch("/api/admin/site-content?key=home_media_section");
      const d = await r.json() as { data?: { content_json: string } | null };
      if (d.data?.content_json) {
        const parsed = JSON.parse(d.data.content_json) as SiteMediaSectionData;
        if (Array.isArray(parsed.items)) return parsed.items;
      }
    } catch { /* ignore */ }
    return [];
  };

  const getGalleryImagesFromDB = async (): Promise<string[]> => {
    try {
      const r = await fetch("/api/admin/site-content?key=home_gallery");
      const d = await r.json() as { data?: { content_json: string } | null };
      if (d.data?.content_json) {
        const parsed = normGallery(JSON.parse(d.data.content_json));
        if (parsed.images.length > 0) return parsed.images;
      }
    } catch { /* ignore */ }
    return liveGalleryImagesRef.current;
  };

  const buildContentToSave = async (): Promise<ContentStore> => {
    const [liveItems, liveImages] = await Promise.all([getMediaItemsFromDB(), getGalleryImagesFromDB()]);
    const result: ContentStore = { ...content };
    const existingMedia = (content["home_media_section"] as SiteMediaSectionData) ?? { show: true, items: [] };
    result["home_media_section"] = { ...existingMedia, items: liveItems };
    const existingGallery = normGallery(content["home_gallery"]);
    if (liveImages.length > 0) result["home_gallery"] = { ...existingGallery, images: liveImages };
    return result;
  };

  const saveDraftFn = useCallback(async () => {
    setSavingDraft(true);
    const contentToSave = await buildContentToSave();
    await Promise.all(KEYS.map(key =>
      fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_key: `${key}__draft`, content_json: JSON.stringify(contentToSave[key]) }),
      })
    ));
    const newDrafts: ContentStore = {};
    KEYS.forEach(k => { newDrafts[k] = contentToSave[k]; });
    setDrafts(newDrafts);
    // Sync back so editor state matches what was actually saved
    setContent(prev => ({
      ...prev,
      "home_media_section": contentToSave["home_media_section"],
      "home_gallery": contentToSave["home_gallery"],
    }));
    if (contentToSave["home_gallery"]) {
      const g = normGallery(contentToSave["home_gallery"]);
      if (g.images.length > 0) liveGalleryImagesRef.current = g.images;
    }
    setSavingDraft(false);
    showToast("Draft saved — changes not yet live");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const publishFn = useCallback(async () => {
    setSavingPublish(true);
    const contentToSave = await buildContentToSave();
    // Save to live keys
    await Promise.all(KEYS.map(key =>
      fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_key: key, content_json: JSON.stringify(contentToSave[key]) }),
      })
    ));
    // Also sync drafts to match (no more "unpublished draft")
    await Promise.all(KEYS.map(key =>
      fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_key: `${key}__draft`, content_json: JSON.stringify(contentToSave[key]) }),
      })
    ));
    const snap: ContentStore = {};
    KEYS.forEach(k => { snap[k] = contentToSave[k]; });
    setPublished(snap);
    setDrafts(snap);
    // Sync back so editor state matches what was actually published
    setContent(prev => ({
      ...prev,
      "home_media_section": contentToSave["home_media_section"],
      "home_gallery": contentToSave["home_gallery"],
    }));
    if (contentToSave["home_gallery"]) {
      const g = normGallery(contentToSave["home_gallery"]);
      if (g.images.length > 0) liveGalleryImagesRef.current = g.images;
    }
    setSavingPublish(false);
    showToast("Published! Site is now live.");
    refreshPreview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, refreshPreview]);

  const translateAllSiteContent = useCallback(async () => {
    setTranslatingAll(true);
    setTransProgress(null);

    const tr = async (text: string, target: string): Promise<string> => {
      if (!text?.trim()) return text || "";
      try {
        const r = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, target }),
        });
        const d = await r.json() as { translated?: string };
        return d.translated || text;
      } catch { return text; }
    };

    // Snapshot current content
    const statsSnap      = (content["home_stats_bar"]      as StatsData)          || {} as StatsData;
    const welcomeSnap    = (content["home_welcome"]          as WelcomeData)        || {} as WelcomeData;
    const impactSnap     = (content["home_impact"]           as ImpactItem[])       || [];
    const minsSnap       = (content["home_ministries"]       as Ministry[])         || [];
    const sermonsSnap    = normSermons(content["home_sermons"]);
    const endoSnap       = (content["home_endorsements"]     as Endorsement[])      || [];
    const giveSnap       = (content["home_give_cta"]         as GiveCTA)            || {} as GiveCTA;
    const footerSnap     = (content["footer_settings"]       as FooterData)         || {} as FooterData;
    const heroSnap       = (content["home_hero_slides"]      as Slide[])            || [];
    const gallerySnap    = normGallery(content["home_gallery"]);
    const newsCfgSnap    = (content["home_news_section"]     as PostsSectionConfig) || {} as PostsSectionConfig;
    const blogCfgSnap    = (content["home_blog_section"]     as PostsSectionConfig) || {} as PostsSectionConfig;
    const eventsCfgSnap  = (content["home_events_section"]   as PostsSectionConfig) || {} as PostsSectionConfig;

    // Count total API calls
    const perLang =
      1 +                   // stats: tagline
      4 +                   // welcome: heading, body1, body2, cta_label
      impactSnap.length * 1 +
      minsSnap.length * 3 +
      sermonsSnap.items.length * 1 + 2 +  // items titles + section heading + watch_btn
      endoSnap.length * 2 +
      5 +                   // giveCTA: label, heading, body, primary_label, secondary_label
      1 +                   // footer: tagline
      heroSnap.length * 3 +  // slides: eyebrow, title, cta_label
      3 +                   // gallery: heading, eyebrow, cta_label
      3 + 3 + 3;            // news + blog + events: heading, eyebrow, view_all_label
    const total = transLangs.length * perLang;
    let done = 0;

    // Build local deep copies to avoid stale-closure issues
    const newStats      = JSON.parse(JSON.stringify(statsSnap))      as StatsData;
    const newWelcome    = JSON.parse(JSON.stringify(welcomeSnap))    as WelcomeData;
    const newImpact     = JSON.parse(JSON.stringify(impactSnap))     as ImpactItem[];
    const newMins       = JSON.parse(JSON.stringify(minsSnap))       as Ministry[];
    const newSermons    = JSON.parse(JSON.stringify(sermonsSnap))    as SermonsSectionData;
    const newEndo       = JSON.parse(JSON.stringify(endoSnap))       as Endorsement[];
    const newGive       = JSON.parse(JSON.stringify(giveSnap))       as GiveCTA;
    const newFooter     = JSON.parse(JSON.stringify(footerSnap))     as FooterData;
    const newHero       = JSON.parse(JSON.stringify(heroSnap))       as Slide[];
    const newGallery    = JSON.parse(JSON.stringify(gallerySnap))    as GallerySettings;
    const newNewsCfg    = JSON.parse(JSON.stringify(newsCfgSnap))    as PostsSectionConfig;
    const newBlogCfg    = JSON.parse(JSON.stringify(blogCfgSnap))    as PostsSectionConfig;
    const newEventsCfg  = JSON.parse(JSON.stringify(eventsCfgSnap))  as PostsSectionConfig;

    for (const lang of transLangs) {
      const lc = lang.code;

      // Stats bar — tagline
      {
        const ex = (newStats.translations?.[lc] ?? {}) as Record<string, string>;
        const tagline = await tr(newStats.tagline || "", lc);
        done++; setTransProgress({ done, total });
        if (!newStats.translations) newStats.translations = {};
        newStats.translations[lc] = { ...ex, tagline };
      }

      // Welcome
      {
        const ex = (newWelcome.translations?.[lc] ?? {}) as Record<string, string>;
        const heading   = await tr(newWelcome.heading   || "", lc); done++; setTransProgress({ done, total });
        const body1     = await tr(newWelcome.body1     || "", lc); done++; setTransProgress({ done, total });
        const body2     = await tr(newWelcome.body2     || "", lc); done++; setTransProgress({ done, total });
        const cta_label = await tr(newWelcome.cta_label || "", lc); done++; setTransProgress({ done, total });
        if (!newWelcome.translations) newWelcome.translations = {};
        newWelcome.translations[lc] = { ...ex, heading, body1, body2, cta_label };
      }

      // Impact items
      for (let i = 0; i < newImpact.length; i++) {
        const item = newImpact[i];
        const ex = (item.translations?.[lc] ?? {}) as Record<string, string>;
        const label = await tr(item.label || "", lc); done++; setTransProgress({ done, total });
        if (!item.translations) item.translations = {};
        item.translations[lc] = { ...ex, label };
      }

      // Ministries
      for (let i = 0; i < newMins.length; i++) {
        const m = newMins[i];
        const ex = (m.translations?.[lc] ?? {}) as Record<string, string>;
        const category = await tr(m.category || "", lc); done++; setTransProgress({ done, total });
        const title    = await tr(m.title    || "", lc); done++; setTransProgress({ done, total });
        const excerpt  = await tr(m.excerpt  || "", lc); done++; setTransProgress({ done, total });
        if (!m.translations) m.translations = {};
        m.translations[lc] = { ...ex, category, title, excerpt };
      }

      // Sermons section header
      {
        const ex = (newSermons.translations?.[lc] ?? {}) as Record<string, string>;
        const heading  = await tr(newSermons.heading  || "Watch and Listen to Dr. Wesley", lc); done++; setTransProgress({ done, total });
        const watch_btn = await tr(newSermons.watch_btn || "Watch on YouTube", lc); done++; setTransProgress({ done, total });
        if (!newSermons.translations) newSermons.translations = {};
        newSermons.translations[lc] = { ...ex, heading, watch_btn };
      }
      for (let i = 0; i < newSermons.items.length; i++) {
        const s = newSermons.items[i];
        const ex = (s.translations?.[lc] ?? {}) as Record<string, string>;
        const title = await tr(s.title || "", lc); done++; setTransProgress({ done, total });
        if (!s.translations) s.translations = {};
        s.translations[lc] = { ...ex, title };
      }

      // Endorsements
      for (let i = 0; i < newEndo.length; i++) {
        const e = newEndo[i];
        const ex = (e.translations?.[lc] ?? {}) as Record<string, string>;
        const quote = await tr(e.quote || "", lc); done++; setTransProgress({ done, total });
        const title = await tr(e.title || "", lc); done++; setTransProgress({ done, total });
        if (!e.translations) e.translations = {};
        e.translations[lc] = { ...ex, quote, title };
      }

      // Give CTA
      {
        const ex = (newGive.translations?.[lc] ?? {}) as Record<string, string>;
        const label           = await tr(newGive.label           || "", lc); done++; setTransProgress({ done, total });
        const heading         = await tr(newGive.heading         || "", lc); done++; setTransProgress({ done, total });
        const body            = await tr(newGive.body            || "", lc); done++; setTransProgress({ done, total });
        const primary_label   = await tr(newGive.primary_label   || "", lc); done++; setTransProgress({ done, total });
        const secondary_label = await tr(newGive.secondary_label || "", lc); done++; setTransProgress({ done, total });
        if (!newGive.translations) newGive.translations = {};
        newGive.translations[lc] = { ...ex, label, heading, body, primary_label, secondary_label };
      }

      // Footer
      {
        const ex = (newFooter.translations?.[lc] ?? {}) as Record<string, string>;
        const tagline = await tr(newFooter.tagline || "", lc); done++; setTransProgress({ done, total });
        if (!newFooter.translations) newFooter.translations = {};
        newFooter.translations[lc] = { ...ex, tagline };
      }

      // Hero slides
      for (let i = 0; i < newHero.length; i++) {
        const slide = newHero[i];
        const ex = (slide.translations?.[lc] ?? {}) as SlideTranslation;
        const eyebrow   = await tr(slide.eyebrow   || "", lc); done++; setTransProgress({ done, total });
        const title     = await tr(slide.title     || "", lc); done++; setTransProgress({ done, total });
        const cta_label = await tr(slide.cta_label || "", lc); done++; setTransProgress({ done, total });
        if (!slide.translations) slide.translations = {};
        slide.translations[lc] = { ...ex, eyebrow, title, cta_label };
      }

      // Gallery
      {
        const ex = (newGallery.translations?.[lc] ?? {}) as Record<string, string>;
        const heading   = await tr(newGallery.heading   || "Ministry in Action", lc); done++; setTransProgress({ done, total });
        const eyebrow   = await tr(newGallery.eyebrow   || "Gallery",            lc); done++; setTransProgress({ done, total });
        const cta_label = await tr(newGallery.cta_label || "View All Photos",    lc); done++; setTransProgress({ done, total });
        if (!newGallery.translations) newGallery.translations = {};
        newGallery.translations[lc] = { ...ex, heading, eyebrow, cta_label };
      }

      // Posts sections — news / blog / events
      for (const [cfg, defaults2] of [
        [newNewsCfg,   { heading: "Latest News",      eyebrow: "News",   view_all_label: "All News"   }],
        [newBlogCfg,   { heading: "From the Blog",    eyebrow: "Blog",   view_all_label: "All Posts"  }],
        [newEventsCfg, { heading: "Upcoming Events",  eyebrow: "Events", view_all_label: "All Events" }],
      ] as [PostsSectionConfig, { heading: string; eyebrow: string; view_all_label: string }][]) {
        const ex = (cfg.translations?.[lc] ?? {}) as Record<string, string>;
        const heading        = await tr(cfg.heading        || defaults2.heading,        lc); done++; setTransProgress({ done, total });
        const eyebrow        = await tr(cfg.eyebrow        || defaults2.eyebrow,        lc); done++; setTransProgress({ done, total });
        const view_all_label = await tr(cfg.view_all_label || defaults2.view_all_label, lc); done++; setTransProgress({ done, total });
        if (!cfg.translations) cfg.translations = {};
        cfg.translations[lc] = { ...ex, heading, eyebrow, view_all_label };
      }
    }

    // Apply all updates at once
    setContent(c => ({
      ...c,
      home_stats_bar:      newStats,
      home_welcome:        newWelcome,
      home_impact:         newImpact,
      home_ministries:     newMins,
      home_sermons:        newSermons,
      home_endorsements:   newEndo,
      home_give_cta:       newGive,
      footer_settings:     newFooter,
      home_hero_slides:    newHero,
      home_gallery:        newGallery,
      home_news_section:   newNewsCfg,
      home_blog_section:   newBlogCfg,
      home_events_section: newEventsCfg,
    }));

    setTranslatingAll(false);
    setTransProgress(null);
    showToast(`Translated all content into ${transLangs.length} languages!`);
  }, [content, transLangs]);

  // Broadcast any raw message to the preview iframe
  const broadcastRaw = useCallback((msg: unknown) => {
    try { iframeRef.current?.contentWindow?.postMessage(msg, "*"); } catch { /* noop */ }
  }, []);

  // Broadcast live draft data to the preview iframe on every edit.
  // For home_media_section, always inject the live items so the preview
  // section mounts and stays visible regardless of what's in editor state.
  const broadcastToPreview = useCallback((key: string, val: unknown) => {
    let data = val;
    if (key === "home_media_section" && liveMediaItemsRef.current.length > 0) {
      data = { ...(val as SiteMediaSectionData), items: liveMediaItemsRef.current };
    }
    if (key === "home_gallery" && liveGalleryImagesRef.current.length > 0) {
      data = { ...(val as GallerySettings), images: liveGalleryImagesRef.current };
    }
    broadcastRaw({ type: "PREVIEW_DRAFT", key, data });
  }, [broadcastRaw]);

  // Auto-scroll left panel to the opened section and ensure it's visible
  useEffect(() => {
    if (!openSection) return;
    const el = sectionRefs.current.get(openSection);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [openSection]);

  // Always keep the carousel paused in the editor — it auto-plays on the live site
  useEffect(() => {
    broadcastRaw({ type: "PREVIEW_PAUSE" });
  }, [broadcastRaw]);

  // When a specific slide is focused in the hero editor, jump to it
  useEffect(() => {
    if (openSection === "home_hero_slides") {
      broadcastRaw({ type: "PREVIEW_PAUSE" });
    }
  }, [openSection, broadcastRaw]);

  // Broadcast visibility state to preview whenever it changes
  useEffect(() => {
    broadcastRaw({ type: "SECTION_VISIBILITY", hidden: hiddenSections });
  }, [hiddenSections, broadcastRaw]);

  const setKey = (key: string, val: unknown) => {
    setContent(c => ({ ...c, [key]: val }));
    broadcastToPreview(key, val);
  };
  // hasDraft: local changes not yet saved to draft
  const hasDraft = (key: string) => JSON.stringify(content[key]) !== JSON.stringify(drafts[key]);
  // unpublished: draft differs from live
  const isUnpublished = (key: string) => JSON.stringify(drafts[key] ?? content[key]) !== JSON.stringify(published[key]);
  const draftCount = KEYS.filter(hasDraft).length;
  const unpublishedCount = KEYS.filter(isUnpublished).length;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #C0185A", borderTopColor: "transparent", margin: "0 auto 12px", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: 14, color: "#64748b" }}>Loading Site Editor…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  const hero         = (content["home_hero_slides"]  as Slide[])      || [];
  const stats        = (content["home_stats_bar"]     as StatsData)    || { count: "", tagline: "", social: { facebook: "", youtube: "", instagram: "" } };
  const welcome      = (content["home_welcome"]       as WelcomeData)  || { image: "", heading: "", body1: "", body2: "", cta_label: "", cta_href: "" };
  const impact       = (content["home_impact"]        as ImpactItem[]) || [];
  const ministries   = (content["home_ministries"]    as Ministry[])   || [];
  const sermons           = normSermons(content["home_sermons"]);
  const endorsements      = (content["home_endorsements"]   as Endorsement[])       || [];
  const gallery           = normGallery(content["home_gallery"]);
  const newsSection    = (content["home_news_section"]   as PostsSectionConfig)    || { show: false };
  const blogSection    = (content["home_blog_section"]   as PostsSectionConfig)    || { show: false };
  const eventsSection  = (content["home_events_section"] as PostsSectionConfig)    || { show: false };
  const mediaSection   = (content["home_media_section"]  as SiteMediaSectionData)  || { show: false, items: [] };
  const giveCTA      = (content["home_give_cta"]      as GiveCTA)      || { label: "", heading: "", body: "", primary_label: "", primary_href: "", secondary_label: "", secondary_href: "" };
  const footer       = (content["footer_settings"]    as FooterData)   || { tagline: "", address: "", email: "", phone: "", hours: "", social: { facebook: "", youtube: "", instagram: "", twitter: "", tiktok: "" }, quick_links: [], ministry_links: [] };

  const editorMap: Record<string, React.ReactNode> = {
    home_hero_slides: <HeroEditor
      data={hero}
      onChange={v => setKey("home_hero_slides", v)}
      onFocusSlide={idx => {
        if (idx !== null) broadcastRaw({ type: "PREVIEW_PAUSE", slideIdx: idx });
        else broadcastRaw({ type: "PREVIEW_RESUME" });
      }}
    />,
    home_stats_bar:    <StatsEditor        data={stats}        onChange={v => setKey("home_stats_bar", v)} />,
    home_welcome:      <WelcomeEditor      data={welcome}      onChange={v => setKey("home_welcome", v)} />,
    home_impact:       <ImpactEditor       data={impact}       onChange={v => setKey("home_impact", v)} />,
    home_ministries:   <MinistriesEditor   data={ministries}   onChange={v => setKey("home_ministries", v)} />,
    home_endorsements: <EndorsementsEditor data={endorsements} onChange={v => setKey("home_endorsements", v)} />,
    home_gallery:         <GalleryEditor data={gallery} onChange={v => setKey("home_gallery", v)} />,  // eslint-disable-line @typescript-eslint/no-explicit-any
    home_news_section:    <PostsSectionEditor data={newsSection}   onChange={v => setKey("home_news_section", v)}   defaults={{ heading: "Latest News",      eyebrow: "News",   viewAllHref: "/news" }} />,
    home_blog_section:    <PostsSectionEditor data={blogSection}   onChange={v => setKey("home_blog_section", v)}   defaults={{ heading: "From the Blog",     eyebrow: "Blog",   viewAllHref: "/blog" }} />,
    home_events_section:  <PostsSectionEditor data={eventsSection} onChange={v => setKey("home_events_section", v)} defaults={{ heading: "Upcoming Events",   eyebrow: "Events", viewAllHref: "/events" }} />,
    home_media_section:   <MediaSectionEditor data={mediaSection}  onChange={v => setKey("home_media_section", v)} />,
    home_give_cta:     <GiveCTAEditor      data={giveCTA}      onChange={v => setKey("home_give_cta", v)} />,
    footer_settings:   <FooterEditor       data={footer}       onChange={v => setKey("footer_settings", v)} />,
  };

  const viewportWidth = { desktop: "100%", tablet: "768px", mobile: "390px" } as const;
  const viewportHeight = { desktop: "100%", tablet: "1024px", mobile: "844px" } as const;

  const iframeSrc = previewLang && previewLang !== "en" ? `/?lang=${previewLang}` : "/";

  const switchPreviewLang = (code: string) => {
    setPreviewLang(code);
    setPreviewLangOpen(false);
    // Reload iframe with new lang
    if (iframeRef.current) {
      setPreviewLoading(true);
      iframeRef.current.src = code !== "en" ? `/?lang=${code}` : "/";
    }
  };

  const allPreviewLangs = [
    { code: "en", label: "English", flag: "🇺🇸" },
    ...transLangs,
  ];

  return (
    <TransLangsContext.Provider value={transLangs}>
    <div style={{ width: "100vw", height: "100vh", display: "flex", overflow: "hidden", fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#0f172a", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", border: "1px solid rgba(255,255,255,0.08)" }}>
          <CheckCircle size={14} style={{ color: "#4ade80" }} /> {toast}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          LEFT PANEL — dark page-builder sidebar
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ width: panelWidth, flexShrink: 0, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f1f5f9" }}>

        {/* ── Sidebar top bar (dark) ────────────────────────────────────── */}
        <div style={{ background: "#0f172a", padding: "0 14px", flexShrink: 0 }}>
          {/* Back + Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 12, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <a href="/admin" style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 9px", borderRadius: 6,
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600,
              textDecoration: "none", flexShrink: 0, transition: "all 0.15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
            >
              <ArrowLeft size={12} /> Back
            </a>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>Site Editor</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>Home page · Footer</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {draftCount > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.4)", color: "#fb923c", borderRadius: 20, padding: "2px 7px" }}>
                  {draftCount} unsaved
                </span>
              )}
              {unpublishedCount > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(234,179,8,0.2)", border: "1px solid rgba(234,179,8,0.4)", color: "#fbbf24", borderRadius: 20, padding: "2px 7px" }}>
                  {unpublishedCount} unpublished
                </span>
              )}
            </div>
          </div>
          {/* Draft + Publish buttons */}
          <div style={{ paddingTop: 10, paddingBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            <button
              onClick={() => void translateAllSiteContent()}
              disabled={translatingAll}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "8px", borderRadius: 7, border: "1px solid rgba(167,139,250,0.35)",
                background: "rgba(124,58,237,0.15)",
                color: translatingAll ? "rgba(167,139,250,0.5)" : "#a78bfa",
                fontSize: 12, fontWeight: 700, cursor: translatingAll ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              <Globe size={12} />
              {translatingAll
                ? transProgress
                  ? `Translating ${transProgress.done}/${transProgress.total}…`
                  : "Translating…"
                : `Translate All (${transLangs.length} langs)`}
            </button>
            <button
              onClick={() => void saveDraftFn()}
              disabled={savingDraft || draftCount === 0}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "8px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)",
                background: draftCount > 0 ? "rgba(234,179,8,0.15)" : "rgba(255,255,255,0.05)",
                color: draftCount > 0 ? "#fbbf24" : "rgba(255,255,255,0.2)",
                fontSize: 12, fontWeight: 700, cursor: draftCount > 0 ? "pointer" : "not-allowed",
                transition: "all 0.2s",
              }}
            >
              <Save size={12} />
              {savingDraft ? "Saving…" : draftCount > 0 ? `Save Draft (${draftCount})` : "Draft up to date"}
            </button>
            <button
              onClick={() => void publishFn()}
              disabled={savingPublish || unpublishedCount === 0}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "9px", borderRadius: 7, border: "none",
                background: unpublishedCount > 0 ? "#C0185A" : "rgba(255,255,255,0.06)",
                color: unpublishedCount > 0 ? "#fff" : "rgba(255,255,255,0.2)",
                fontSize: 12.5, fontWeight: 700, cursor: unpublishedCount > 0 ? "pointer" : "not-allowed",
                boxShadow: unpublishedCount > 0 ? "0 2px 12px rgba(192,24,90,0.4)" : "none",
                transition: "all 0.2s",
              }}
            >
              <Globe size={13} />
              {savingPublish ? "Publishing…" : unpublishedCount > 0 ? `Publish (${unpublishedCount} sections)` : "All sections live"}
            </button>
          </div>
        </div>

        {/* ── Section list (scrollable) ─────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px 24px" }}>

          {/* Section order label */}
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 4px 8px" }}>
            Page Sections — Top to Bottom
          </div>

          {SECTIONS.map(sec => {
            const isOpen   = openSection === sec.key;
            const secHidden = hiddenSections.includes(sec.key);
            // Compute dynamic description
            let desc = "";
            if (sec.key === "home_hero_slides") desc = `${hero.length} slide${hero.length !== 1 ? "s" : ""} · full-screen banner`;
            else if (sec.key === "home_impact") desc = `${impact.length} stat${impact.length !== 1 ? "s" : ""} · counter bar`;
            else if (sec.key === "home_ministries") desc = `${ministries.length} program${ministries.length !== 1 ? "s" : ""} · card grid`;
            else if (sec.key === "home_endorsements") desc = `${endorsements.length} quote${endorsements.length !== 1 ? "s" : ""} · carousel`;
            else if (sec.key === "home_gallery") desc = `${gallery.images.length} photo${gallery.images.length !== 1 ? "s" : ""} · Show ${gallery.limit ?? 10} · ${gallery.show_cta !== false ? `CTA: ${gallery.cta_label ?? "View All Photos"}` : "CTA hidden"}`;
            else if (sec.key === "home_news_section")   desc = newsSection.show   === false ? "Hidden · latest news posts" : `Showing ${newsSection.limit ?? 3} news items`;
            else if (sec.key === "home_blog_section")   desc = blogSection.show   === false ? "Hidden · latest blog posts" : `Showing ${blogSection.limit ?? 3} blog posts`;
            else if (sec.key === "home_events_section") desc = eventsSection.show === false ? "Hidden · upcoming events"   : `Showing ${eventsSection.limit ?? 3} events`;
            else if (sec.key === "home_media_section")  desc = mediaSection.show  === false ? "Hidden · YouTube/Instagram media" : `Showing ${mediaSection.limit ?? 3} of ${(mediaSection.items ?? []).length} video${(mediaSection.items ?? []).length !== 1 ? "s" : ""} · ${mediaSection.show_cta !== false ? "View All CTA on" : "CTA off"}`;
            else desc = sec.key === "home_stats_bar" ? "Nations count · tagline · social"
              : sec.key === "home_welcome" ? "Two-column image + intro text"
              : sec.key === "home_give_cta" ? "Dark donate call-to-action"
              : "CTA strip · contact · social · links";

            return (
              <div
                key={sec.key}
                ref={el => { if (el) sectionRefs.current.set(sec.key, el); else sectionRefs.current.delete(sec.key); }}
                style={{ position: "relative" }}
              >
                {/* Eye / visibility toggle button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setHiddenSections(prev =>
                      prev.includes(sec.key) ? prev.filter(k => k !== sec.key) : [...prev, sec.key]
                    );
                  }}
                  title={secHidden ? "Show section" : "Hide section"}
                  style={{
                    position: "absolute", top: 8, right: 8, zIndex: 10,
                    width: 22, height: 22, border: "none", borderRadius: 4, cursor: "pointer",
                    background: secHidden ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)",
                    color: secHidden ? "#f87171" : "rgba(255,255,255,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget.style.background = secHidden ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.15)"); (e.currentTarget.style.color = "#fff"); }}
                  onMouseLeave={e => { (e.currentTarget.style.background = secHidden ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"); (e.currentTarget.style.color = secHidden ? "#f87171" : "rgba(255,255,255,0.3)"); }}
                >
                  {secHidden ? "🚫" : "👁"}
                </button>

                <SectionCard
                  title={sec.label}
                  icon={sec.icon}
                  description={secHidden ? "Hidden from site" : desc}
                  accentColor={secHidden ? "#475569" : sec.color}
                  hasDraft={hasDraft(sec.key)}
                  unpublished={isUnpublished(sec.key)}
                  open={isOpen}
                  onToggle={() => setOpenSection(isOpen ? null : sec.key)}
                  dimmed={secHidden}
                >
                  {editorMap[sec.key]}
                </SectionCard>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Drag handle ───────────────────────────────────────────────────── */}
      <div
        onMouseDown={onDividerDown}
        style={{ width: 5, flexShrink: 0, cursor: "col-resize", background: "#e2e8f0", transition: "background 0.15s", position: "relative", zIndex: 10 }}
        onMouseEnter={e => (e.currentTarget.style.background = "#C0185A")}
        onMouseLeave={e => (e.currentTarget.style.background = "#e2e8f0")}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT PANEL — live preview
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#1e293b" }}>

        {/* ── Browser chrome toolbar ────────────────────────────────────── */}
        <div style={{ height: 48, background: "#0f172a", display: "flex", alignItems: "center", gap: 8, padding: "0 14px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>

          {/* Traffic lights */}
          <div style={{ display: "flex", gap: 6, marginRight: 4 }}>
            {["#ef4444","#f59e0b","#22c55e"].map(c => (
              <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
          </div>

          {/* Viewport toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.07)", borderRadius: 7, padding: 2, gap: 1 }}>
            {(["desktop","tablet","mobile"] as Viewport[]).map(v => {
              const icons = { desktop: <Monitor size={12} />, tablet: <Monitor size={12} />, mobile: <Smartphone size={12} /> };
              const labels = { desktop: "Desktop", tablet: "Tablet", mobile: "Mobile" };
              return (
                <button key={v} onClick={() => setViewport(v)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 600, background: viewport === v ? "rgba(255,255,255,0.14)" : "transparent", color: viewport === v ? "#fff" : "rgba(255,255,255,0.35)", transition: "all 0.15s" }}>
                  {icons[v]} {labels[v]}
                </button>
              );
            })}
          </div>

          {/* URL bar */}
          <div style={{ flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 7, padding: "5px 12px", fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
              wesleypaul.com — Home Page
            </span>
            {previewLoading && (
              <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #C0185A", borderTopColor: "transparent", animation: "spin 0.7s linear infinite", flexShrink: 0, display: "inline-block" }} />
            )}
          </div>

          {/* ── Preview language selector ─────────────── */}
          <div ref={previewLangRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => setPreviewLangOpen(o => !o)}
              title="Preview site in a different language"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 11px", borderRadius: 6, cursor: "pointer",
                fontSize: 12, fontWeight: 700, transition: "all 0.15s", whiteSpace: "nowrap",
                border: previewLang !== "en" ? "1px solid rgba(192,24,90,0.6)" : "1px solid rgba(255,255,255,0.15)",
                background: previewLang !== "en" ? "rgba(192,24,90,0.25)" : "rgba(255,255,255,0.08)",
                color: previewLang !== "en" ? "#fda4af" : "rgba(255,255,255,0.75)",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = previewLang !== "en" ? "rgba(192,24,90,0.6)" : "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = previewLang !== "en" ? "#fda4af" : "rgba(255,255,255,0.75)";
              }}
            >
              <Globe size={13} />
              <span style={{ fontSize: 15 }}>{allPreviewLangs.find(l => l.code === previewLang)?.flag ?? "🇺🇸"}</span>
              <span>{allPreviewLangs.find(l => l.code === previewLang)?.label ?? "English"}</span>
              <ChevronDown size={11} style={{ opacity: 0.6, transform: previewLangOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
            </button>
            {previewLangOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 6px)",
                background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10, minWidth: 170, zIndex: 9999,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                overflow: "hidden",
              }}>
                <div style={{ padding: "8px 12px 4px", fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Preview Language
                </div>
                {allPreviewLangs.map(l => (
                  <button key={l.code} onClick={() => switchPreviewLang(l.code)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "9px 14px",
                      background: previewLang === l.code ? "rgba(192,24,90,0.25)" : "transparent",
                      border: "none", cursor: "pointer",
                      color: previewLang === l.code ? "#fda4af" : "rgba(255,255,255,0.75)",
                      fontSize: 13, fontWeight: previewLang === l.code ? 700 : 500, textAlign: "left",
                      transition: "background 0.1s",
                      borderLeft: previewLang === l.code ? "3px solid #C0185A" : "3px solid transparent",
                    }}
                    onMouseEnter={e => { if (previewLang !== l.code) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={e => { if (previewLang !== l.code) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: 18 }}>{l.flag}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: previewLang === l.code ? 700 : 500 }}>{l.label}</div>
                      {l.code !== "en" && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{l.code.toUpperCase()}</div>}
                    </div>
                    {previewLang === l.code && <span style={{ marginLeft: "auto", color: "#C0185A", fontSize: 14 }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <button onClick={refreshPreview}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, background: "rgba(255,255,255,0.06)", cursor: "pointer", fontSize: 11.5, color: "rgba(255,255,255,0.5)", fontWeight: 500, transition: "all 0.15s", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
            <RefreshCw size={12} /> Refresh
          </button>
          <a href={iframeSrc} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, background: "rgba(255,255,255,0.06)", cursor: "pointer", fontSize: 11.5, color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 500, transition: "all 0.15s", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
            <OpenIcon size={12} /> Open
          </a>
        </div>

        {/* ── Iframe container ─────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", alignItems: viewport === "desktop" ? "stretch" : "flex-start", justifyContent: "center", overflow: "auto", padding: viewport !== "desktop" ? "24px" : "0", background: viewport !== "desktop" ? "#1e293b" : "transparent" }}>
          {viewport !== "desktop" && (
            /* Device frame notch strip */
            <div style={{ position: "absolute", width: viewport === "mobile" ? "390px" : "768px", height: 28, background: "#0f172a", borderRadius: "16px 16px 0 0", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 24 }}>
              <div style={{ width: 60, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.15)" }} />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            onLoad={() => {
              setPreviewLoading(false);
              // Wait for the iframe's JS to hydrate and register message listeners
              setTimeout(() => {
                KEYS.forEach(key => {
                  if (content[key] === undefined) return;
                  // For media section inject live items so the section mounts in preview
                  let data = content[key];
                  if (key === "home_media_section" && liveMediaItemsRef.current.length > 0)
                    data = { ...(content[key] as SiteMediaSectionData), items: liveMediaItemsRef.current };
                  if (key === "home_gallery" && liveGalleryImagesRef.current.length > 0)
                    data = { ...normGallery(content[key]), images: liveGalleryImagesRef.current };
                  broadcastRaw({ type: "PREVIEW_DRAFT", key, data });
                });
                broadcastRaw({ type: "SECTION_VISIBILITY", hidden: hiddenSections });
                broadcastRaw({ type: "PREVIEW_PAUSE" });
              }, 600);
            }}
            style={{
              border: "none",
              background: "#fff",
              width: viewportWidth[viewport],
              height: viewport === "desktop" ? "100%" : viewportHeight[viewport],
              boxShadow: viewport !== "desktop" ? "0 20px 60px rgba(0,0,0,0.5)" : "none",
              borderRadius: viewport !== "desktop" ? 16 : 0,
              marginTop: viewport !== "desktop" ? 28 : 0,
              display: "block",
              flexShrink: 0,
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>
    </div>
    </TransLangsContext.Provider>
  );
}

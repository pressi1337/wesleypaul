"use client";

import { useEffect, useState, useRef } from "react";
import { X, Plus, GripVertical, Trash2, Upload, Image as ImageIcon, RefreshCw } from "lucide-react";

interface MediaItem { id: number; filename: string; file_path: string; original_name: string; alt_text: string; mime_type?: string; }

function MediaPickerModal({ onSelect, onClose }: { onSelect: (path: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoImported = useRef(false);

  const loadMedia = async () => {
    const r = await fetch("/api/admin/media");
    const d = await r.json() as { media: MediaItem[] };
    setMedia((d.media || []).filter(m => !m.mime_type || m.mime_type.startsWith("image/")));
  };

  const importExisting = async () => {
    setImporting(true);
    await fetch("/api/admin/media/import", { method: "POST" });
    await loadMedia();
    setImporting(false);
  };

  useEffect(() => {
    void loadMedia();
    if (!hasAutoImported.current) {
      hasAutoImported.current = true;
      void importExisting();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError("File too large (max 10 MB)."); return; }
    setUploading(true); setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/admin/media", { method: "POST", body: fd });
      const d = await r.json() as { success?: boolean; media?: MediaItem; error?: string };
      if (d.success && d.media) { onSelect(d.media.file_path); }
      else setUploadError(d.error || "Upload failed");
    } catch { setUploadError("Upload failed — check your connection"); }
    setUploading(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0]; if (f) void uploadFile(f);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 12, width: 720, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Add Images</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => void importExisting()} disabled={importing}
              style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#f8fafc", cursor: "pointer", fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
              <RefreshCw size={11} /> {importing ? "Syncing…" : "Sync files"}
            </button>
            <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}><X size={16} /></button>
          </div>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 14px", background: "#f8fafc" }}>
          {(["library", "upload"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "9px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: tab === t ? "#2070B8" : "#94a3b8", borderBottom: tab === t ? "2px solid #2070B8" : "2px solid transparent", marginBottom: -1 }}>
              {t === "library" ? `📚 Library (${media.length})` : "⬆ Upload New"}
            </button>
          ))}
        </div>
        {tab === "library" && (
          <div style={{ overflowY: "auto", padding: 14, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 8 }}>
            {media.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "32px 0", color: "#94a3b8" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
                <p style={{ fontSize: 13, margin: "0 0 10px" }}>No images yet</p>
                <button onClick={() => setTab("upload")} style={{ padding: "6px 14px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Upload First Image</button>
              </div>
            )}
            {media.map(m => (
              <button key={m.id} onClick={() => onSelect(m.file_path)}
                style={{ border: "2px solid #e2e8f0", borderRadius: 8, overflow: "hidden", cursor: "pointer", background: "none", padding: 0, width: "100%", textAlign: "left" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#2070B8")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.file_path} alt={m.alt_text || m.original_name} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                <div style={{ padding: "4px 6px", fontSize: 10, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.original_name}</div>
              </button>
            ))}
          </div>
        )}
        {tab === "upload" && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? "#2070B8" : "#c9d5e8"}`, borderRadius: 10, padding: "48px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? "#eff6ff" : "#f8fafc" }}>
              <div style={{ fontSize: 38, marginBottom: 10 }}>{uploading ? "⏳" : "🖼"}</div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 6 }}>{uploading ? "Uploading…" : "Drag & drop an image here"}</p>
              <p style={{ fontSize: 12, color: "#94a3b8" }}>JPG, PNG, WebP, GIF · Max 10 MB</p>
            </div>
            {uploadError && <p style={{ color: "#ef4444", fontSize: 13 }}>{uploadError}</p>}
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) void uploadFile(f); e.target.value = ""; }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function GalleryAdminPage() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Load gallery from site_content — handles both string[] and {images,show_cta,...} formats
  useEffect(() => {
    fetch("/api/admin/site-content?key=home_gallery")
      .then(r => r.json())
      .then((d: { data?: { content_json: string } | null }) => {
        if (d.data?.content_json) {
          try {
            const parsed = JSON.parse(d.data.content_json) as string[] | { images: string[] };
            setImages(Array.isArray(parsed) ? parsed : (parsed.images ?? []));
          } catch { /* ignore */ }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async (imgs = images) => {
    setSaving(true); setError(""); setSaved(false);
    try {
      // Fetch current settings to preserve CTA config when saving images
      let existing: { show_cta?: boolean; cta_label?: string; cta_href?: string } = {};
      try {
        const r = await fetch("/api/admin/site-content?key=home_gallery");
        const d = await r.json() as { data?: { content_json: string } | null };
        if (d.data?.content_json) {
          const p = JSON.parse(d.data.content_json) as unknown;
          if (p && !Array.isArray(p)) existing = p as typeof existing;
        }
      } catch { /* use defaults */ }
      const payload = { ...existing, images: imgs };
      const res = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_key: "home_gallery", content_json: JSON.stringify(payload) }),
      });
      const d = await res.json() as { success?: boolean; error?: string };
      if (!d.success) setError(d.error || "Save failed");
      else setSaved(true);
    } catch { setError("Network error"); }
    setSaving(false);
  };

  const addImage = (path: string) => {
    setPickerOpen(false);
    const next = [...images, path];
    setImages(next);
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setSaved(false);
  };

  // Drag-to-reorder
  const onDragStart = (idx: number) => setDragIdx(idx);
  const onDragEnter = (idx: number) => setDragOverIdx(idx);
  const onDragEnd = () => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      const next = [...images];
      const [item] = next.splice(dragIdx, 1);
      next.splice(dragOverIdx, 0, item);
      setImages(next);
      setSaved(false);
    }
    setDragIdx(null); setDragOverIdx(null);
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>Loading gallery…</div>;
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>Gallery Manager</h1>
          <p style={{ fontSize: 13, color: "#64748b" }}>Manage photos shown on the public gallery page. Drag to reorder.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 600 }}>✓ Saved</span>}
          {error && <span style={{ fontSize: 12, color: "#dc2626" }}>{error}</span>}
          <button
            onClick={() => setPickerOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#0369a1" }}>
            <Plus size={14} /> Add Images
          </button>
          <button
            onClick={() => void save()}
            disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: saving ? "#94a3b8" : "#2070B8", color: "#fff", border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
        <ImageIcon size={16} style={{ color: "#64748b" }} />
        <span style={{ fontSize: 13, color: "#374151" }}><strong>{images.length}</strong> photo{images.length !== 1 ? "s" : ""} in gallery</span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>· Drag cards to reorder · Changes are saved when you click "Save Changes"</span>
      </div>

      {/* Empty state */}
      {images.length === 0 && (
        <div style={{ background: "#fff", border: "2px dashed #e2e8f0", borderRadius: 12, padding: "60px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>No photos yet</h3>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Click "Add Images" to pick photos from your media library or upload new ones.</p>
          <button onClick={() => setPickerOpen(true)}
            style={{ padding: "10px 24px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Upload size={14} /> Upload Photos
          </button>
        </div>
      )}

      {/* Grid */}
      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {images.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragEnter={() => onDragEnter(idx)}
              onDragEnd={onDragEnd}
              onDragOver={e => e.preventDefault()}
              style={{
                background: "#fff",
                border: `2px solid ${dragOverIdx === idx && dragIdx !== idx ? "#2070B8" : "#e2e8f0"}`,
                borderRadius: 10,
                overflow: "hidden",
                opacity: dragIdx === idx ? 0.5 : 1,
                transition: "border-color 0.15s, opacity 0.15s",
                cursor: "grab",
              }}>
              <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", background: "#f1f5f9" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }} />
                {/* Drag handle */}
                <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.45)", borderRadius: 5, padding: "3px 5px", display: "flex", alignItems: "center" }}>
                  <GripVertical size={12} color="#fff" />
                </div>
                {/* Index badge */}
                <div style={{ position: "absolute", top: 6, right: 32, background: "rgba(0,0,0,0.45)", borderRadius: 5, padding: "2px 6px", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                  #{idx + 1}
                </div>
                {/* Remove */}
                <button onClick={() => removeImage(idx)}
                  style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={11} />
                </button>
              </div>
              <div style={{ padding: "6px 8px" }}>
                <p style={{ fontSize: 10, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                  {src.split("/").pop()}
                </p>
              </div>
            </div>
          ))}
          {/* Add more card */}
          <button onClick={() => setPickerOpen(true)}
            style={{ border: "2px dashed #c9d5e8", borderRadius: 10, background: "#f8fafc", cursor: "pointer", aspectRatio: "1/1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#94a3b8", padding: 16 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#2070B8"; e.currentTarget.style.color = "#2070B8"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#c9d5e8"; e.currentTarget.style.color = "#94a3b8"; }}>
            <Plus size={24} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Add Photo</span>
          </button>
        </div>
      )}

      {/* Bottom save bar */}
      {images.length > 0 && (
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center" }}>
          {saved && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ Changes saved</span>}
          {error && <span style={{ fontSize: 13, color: "#dc2626" }}>{error}</span>}
          <button onClick={() => void save()} disabled={saving}
            style={{ padding: "10px 28px", background: saving ? "#94a3b8" : "#2070B8", color: "#fff", border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 700 }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      {pickerOpen && <MediaPickerModal onSelect={addImage} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}

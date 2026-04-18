"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { X, Upload, Search, Image as ImageIcon, Film, Check } from "lucide-react";

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

interface Props {
  /** "image" = show images only, "video" = show videos only, "any" = show all */
  accept?: "image" | "video" | "any";
  onPick: (url: string) => void;
  onClose: () => void;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPickerModal({ accept = "any", onPick, onClose }: Props) {
  const [items, setItems]         = useState<MediaItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<MediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/media");
      const d = await r.json() as { media?: MediaItem[] };
      setItems(d.media || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const filter = (item: MediaItem) => {
    if (accept === "image" && !item.mime_type.startsWith("image/")) return false;
    if (accept === "video" && !item.mime_type.startsWith("video/")) return false;
    if (search && !item.original_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  };

  const visible = items.filter(filter);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      await fetch("/api/admin/media", { method: "POST", body: fd }).catch(() => {});
    }
    await load();
    setUploading(false);
  };

  const confirmPick = () => {
    if (selected) {
      onPick(selected.file_path);
      onClose();
    }
  };

  const isImage = (m: MediaItem) => m.mime_type.startsWith("image/");
  const isVideo = (m: MediaItem) => m.mime_type.startsWith("video/");

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(10,15,30,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(4px)",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 14, width: "100%", maxWidth: 860,
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
        overflow: "hidden",
        animation: "mpIn 0.2s ease",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "1px solid #f1f5f9",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {accept === "video"
              ? <Film size={18} style={{ color: "#7c3aed" }} />
              : <ImageIcon size={18} style={{ color: "#2070B8" }} />}
            <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
              {accept === "video" ? "Pick a Video" : accept === "image" ? "Pick an Image" : "Media Library"}
            </span>
            <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>
              {visible.length} file{visible.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Upload */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={accept === "video" ? "video/*" : accept === "image" ? "image/*" : "image/*,video/*"}
              style={{ display: "none" }}
              onChange={e => handleUpload(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 7,
                background: uploading ? "#f1f5f9" : "#2070B8",
                color: uploading ? "#94a3b8" : "#fff",
                border: "none", cursor: uploading ? "default" : "pointer",
                fontSize: 12, fontWeight: 700,
              }}
            >
              <Upload size={13} /> {uploading ? "Uploading…" : "Upload"}
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 20px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search files…"
              style={{
                width: "100%", padding: "7px 10px 7px 32px",
                border: "1px solid #e2e8f0", borderRadius: 7,
                fontSize: 13, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 0", color: "#94a3b8" }}>Loading media…</div>
          ) : visible.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <ImageIcon size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px", display: "block" }} />
              <p style={{ color: "#94a3b8", fontSize: 13 }}>
                {search ? "No files match your search." : "No files uploaded yet."}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  marginTop: 12, padding: "8px 18px", borderRadius: 7,
                  background: "#2070B8", color: "#fff", border: "none",
                  cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}
              >
                Upload first file
              </button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 10,
            }}>
              {visible.map(item => {
                const sel = selected?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelected(sel ? null : item)}
                    onDoubleClick={() => { onPick(item.file_path); onClose(); }}
                    style={{
                      border: `2px solid ${sel ? "#2070B8" : "#e8ecf0"}`,
                      borderRadius: 10, overflow: "hidden",
                      cursor: "pointer", position: "relative",
                      background: "#f8fafc",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      boxShadow: sel ? "0 0 0 3px rgba(32,112,184,0.2)" : "none",
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: "100%", aspectRatio: "1 / 1", overflow: "hidden", background: "#f1f5f9", position: "relative" }}>
                      {isImage(item) ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.file_path}
                          alt={item.alt_text || item.original_name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : isVideo(item) ? (
                        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          <Film size={28} style={{ color: "#7c3aed" }} />
                          <span style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", padding: "0 6px" }}>
                            {item.mime_type.split("/")[1]?.toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ImageIcon size={28} style={{ color: "#cbd5e1" }} />
                        </div>
                      )}

                      {/* Selected tick */}
                      {sel && (
                        <div style={{
                          position: "absolute", top: 6, right: 6,
                          width: 22, height: 22, borderRadius: "50%",
                          background: "#2070B8",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                        }}>
                          <Check size={12} color="#fff" />
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <div style={{ padding: "6px 8px 7px" }}>
                      <div style={{
                        fontSize: 11, fontWeight: 600, color: "#0f172a",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {item.original_name}
                      </div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
                        {formatBytes(item.file_size)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 20px", borderTop: "1px solid #f1f5f9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, background: "#f8fafc",
        }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {selected
              ? <span>Selected: <strong>{selected.original_name}</strong> · {formatBytes(selected.file_size)}</span>
              : "Click to select · Double-click to insert instantly"}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px", borderRadius: 7, border: "1px solid #e2e8f0",
                background: "#fff", color: "#64748b", cursor: "pointer",
                fontSize: 13, fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmPick}
              disabled={!selected}
              style={{
                padding: "8px 20px", borderRadius: 7, border: "none",
                background: selected ? "#2070B8" : "#e2e8f0",
                color: selected ? "#fff" : "#94a3b8",
                cursor: selected ? "pointer" : "default",
                fontSize: 13, fontWeight: 700,
                transition: "background 0.15s",
              }}
            >
              Insert
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mpIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Globe, X, FolderOpen, Upload, Check } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

// ── Types ────────────────────────────────────────────────────────────────────
interface Post {
  id: number;
  title: string;
  slug: string;
  post_type: string;
  excerpt: string;
  content: string;
  featured_image: string;
  status: string;
  event_date: string | null;
  tags: string;
  author: string;
  translations_json: string | null;
}

interface LangTranslation { title?: string; excerpt?: string; content?: string; }
type Translations = Record<string, LangTranslation>;

// ── Helpers ──────────────────────────────────────────────────────────────────
function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

// ── Media picker modal ───────────────────────────────────────────────────────
interface MediaItem { id: number; file_path: string; original_name: string; alt_text: string; }

function MediaPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/media").then(r => r.json()).then(d => { setItems(d.media || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setErr("Please select an image file."); return; }
    setUploading(true); setErr("");
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/admin/media", { method: "POST", body: fd });
    const d = await r.json() as { success?: boolean; media?: MediaItem; error?: string };
    if (d.success && d.media) { onPick(d.media.file_path); onClose(); }
    else setErr(d.error || "Upload failed");
    setUploading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 760, maxHeight: "82vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Pick Image</span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "#94a3b8" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "0 14px", background: "#f8fafc" }}>
          {(["library", "upload"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "9px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 700, color: tab === t ? "#2070B8" : "#94a3b8", borderBottom: tab === t ? "2px solid #2070B8" : "2px solid transparent", marginBottom: -1 }}>
              {t === "library" ? `📚 Library (${items.length})` : "⬆ Upload"}
            </button>
          ))}
        </div>
        {tab === "library" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
            {loading ? <p style={{ color: "#94a3b8", textAlign: "center", padding: 20 }}>Loading…</p> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 8 }}>
                {items.map(m => (
                  <button key={m.id} onClick={() => { onPick(m.file_path); onClose(); }}
                    style={{ border: "2px solid transparent", borderRadius: 8, overflow: "hidden", cursor: "pointer", padding: 0, background: "#f8fafc", aspectRatio: "1/1", position: "relative" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#2070B8")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.file_path} alt={m.alt_text} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, padding: 20 }}>
            {err && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{err}</div>}
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border: "2px dashed #bfdbfe", borderRadius: 10, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: "#f8fafc" }}>
              <Upload size={28} style={{ color: "#93c5fd", margin: "0 auto 10px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>{uploading ? "Uploading…" : "Click to upload"}</p>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>JPG, PNG, WebP — max 10 MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Translations panel ───────────────────────────────────────────────────────
function TranslationsPanel({ post, translations, onChange }: {
  post: Partial<Post>;
  translations: Translations;
  onChange: (t: Translations) => void;
}) {
  const [open, setOpen] = useState(false);
  const [langs, setLangs] = useState<{ code: string; label: string; flag: string }[]>([
    { code: "hi", label: "Hindi", flag: "🇮🇳" },
    { code: "ta", label: "Tamil", flag: "🇮🇳" },
    { code: "es", label: "Español", flag: "🇪🇸" },
  ]);
  const [activeLang, setActiveLang] = useState("hi");
  const [translating, setTranslating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/languages")
      .then(r => r.json())
      .then((d: { languages?: { code: string; label: string; flag: string }[] }) => {
        if (Array.isArray(d.languages) && d.languages.length > 0) {
          setLangs(d.languages);
          setActiveLang(prev => d.languages!.find(l => l.code === prev) ? prev : d.languages![0].code);
        }
      })
      .catch(() => {});
  }, []);

  const draft = translations[activeLang] ?? {};
  const setField = (field: keyof LangTranslation, val: string) => {
    onChange({ ...translations, [activeLang]: { ...draft, [field]: val } });
  };

  const autoTranslate = async () => {
    setTranslating(activeLang);
    const fields: (keyof LangTranslation)[] = ["title", "excerpt"];
    const updated: LangTranslation = { ...draft };
    for (const field of fields) {
      const src = (post[field] as string) || "";
      if (!src) continue;
      try {
        const r = await fetch("/api/admin/translate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: src, target: activeLang }),
        });
        const d = await r.json() as { translated?: string };
        if (d.translated) updated[field] = d.translated;
      } catch { /* skip */ }
    }
    // Also translate a plain-text version of the content
    if (post.content) {
      const plainText = post.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);
      try {
        const r = await fetch("/api/admin/translate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: plainText, target: activeLang }),
        });
        const d = await r.json() as { translated?: string };
        if (d.translated) updated.content = d.translated;
      } catch { /* skip */ }
    }
    onChange({ ...translations, [activeLang]: updated });
    setTranslating(null);
  };

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "14px 18px", border: "none", background: open ? "#eff6ff" : "#fff", cursor: "pointer", borderBottom: open ? "1px solid #bfdbfe" : "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Globe size={16} style={{ color: "#2070B8" }} />
          <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>Translations</span>
          {Object.keys(translations).length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 20, padding: "1px 7px" }}>
              {Object.keys(translations).length} language{Object.keys(translations).length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>{open ? "▲ Collapse" : "▼ Expand"}</span>
      </button>

      {open && (
        <div style={{ padding: "16px 18px" }}>
          {/* Lang tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {langs.map(l => {
              const filled = !!(translations[l.code]?.title || translations[l.code]?.content);
              return (
                <button key={l.code} onClick={() => setActiveLang(l.code)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", border: `1px solid ${activeLang === l.code ? "#2070B8" : "#e2e8f0"}`, borderRadius: 7, background: activeLang === l.code ? "#eff6ff" : "#f8fafc", cursor: "pointer", fontSize: 13, fontWeight: 600, color: activeLang === l.code ? "#2070B8" : "#64748b" }}>
                  {l.flag} {l.label}
                  {filled && <Check size={11} style={{ color: "#16a34a" }} />}
                </button>
              );
            })}
            <button onClick={autoTranslate} disabled={!!translating}
              style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: translating ? "#f8fafc" : "#2070B8", color: translating ? "#94a3b8" : "#fff", border: "1px solid #bfdbfe", borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}>
              ⚡ {translating ? "Translating…" : "Auto-Translate All"}
            </button>
          </div>

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Title ({activeLang})
              </label>
              <input
                value={draft.title ?? ""}
                onChange={e => setField("title", e.target.value)}
                placeholder={post.title || "Translated title…"}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 14, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Excerpt ({activeLang})
              </label>
              <textarea
                value={draft.excerpt ?? ""}
                onChange={e => setField("excerpt", e.target.value)}
                placeholder={post.excerpt || "Translated excerpt…"}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const, resize: "vertical", minHeight: 70 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Content ({activeLang}) — plain text or HTML
              </label>
              <textarea
                value={draft.content ?? ""}
                onChange={e => setField("content", e.target.value)}
                placeholder="Translated content…"
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const, resize: "vertical", minHeight: 160 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main editor page ─────────────────────────────────────────────────────────
export default function PostEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [post, setPost] = useState<Partial<Post>>({
    title: "", slug: "", post_type: "blog", excerpt: "", content: "",
    featured_image: "", status: "draft", event_date: null, tags: "",
    author: "Wesley Paul Ministries", translations_json: null,
  });
  const [translations, setTranslations] = useState<Translations>({});
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [mediaPicker, setMediaPicker] = useState<"featured" | "content" | null>(null);
  const editorRef = useRef<HTMLDivElement & { insertImage?: (u: string) => void }>(null);

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/posts/${id}`)
        .then(r => r.json())
        .then(d => {
          const p = (d as { post?: Post }).post;
          if (p) {
            setPost(p);
            setSlugManual(true);
            if (p.translations_json) {
              try { setTranslations(JSON.parse(p.translations_json) as Translations); } catch { /* ignore */ }
            }
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id, isNew]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const handleTitleChange = (val: string) => {
    setPost(p => ({ ...p, title: val, slug: slugManual ? p.slug : slugify(val) }));
  };

  const handleSave = useCallback(async () => {
    if (!post.title || !post.slug) { showToast("Title and slug are required", "error"); return; }
    setSaving(true);
    try {
      const payload = { ...post, translations_json: JSON.stringify(translations) };
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/admin/posts" : `/api/admin/posts/${id}`;
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json() as { post?: Post; error?: string };
      if (data.post) {
        showToast("Saved successfully!");
        if (isNew) setTimeout(() => router.push(`/admin/posts/${data.post!.id}`), 600);
      } else {
        showToast(data.error || "Save failed", "error");
      }
    } catch { showToast("Save failed", "error"); }
    finally { setSaving(false); }
  }, [post, translations, isNew, id, router]);

  const handleDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    router.push("/admin/posts");
  };

  const fs: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fff" };
  const lb: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading…</div>;

  const postTypeLabel = post.post_type === "event" ? "Event" : post.post_type === "news" ? "News" : "Blog";

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", fontFamily: "system-ui,sans-serif" }}>

      {/* Media picker */}
      {mediaPicker && (
        <MediaPicker
          onPick={url => {
            if (mediaPicker === "featured") {
              setPost(p => ({ ...p, featured_image: url }));
            } else if (mediaPicker === "content") {
              // inject into rich editor via DOM ref
              if (editorRef.current?.insertImage) editorRef.current.insertImage(url);
            }
          }}
          onClose={() => setMediaPicker(null)}
        />
      )}

      {/* ── Top bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button onClick={() => router.push("/admin/posts")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 7, background: "#fff", fontSize: 13, color: "#64748b", cursor: "pointer", fontWeight: 500 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            {isNew ? `New ${postTypeLabel}` : `Edit ${postTypeLabel}`}
          </h1>
          {!isNew && <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>/{post.slug}</p>}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {!isNew && (
            <button onClick={handleDelete}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 7, color: "#C0185A", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Trash2 size={14} /> Delete
            </button>
          )}
          <button onClick={handleSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 22px", background: saving ? "#94a3b8" : "#2070B8", color: "#fff", border: "none", borderRadius: 7, fontSize: 13.5, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 2px 8px rgba(32,112,184,0.3)" }}>
            <Save size={14} /> {saving ? "Saving…" : "Save Post"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 8, background: toast.type === "success" ? "#dcfce7" : "#fef2f2", color: toast.type === "success" ? "#15803d" : "#C0185A", fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", gap: 8 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

        {/* ── Main content column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Title + Slug */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 22 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={lb}>Title</label>
              <input style={{ ...fs, fontSize: 18, fontWeight: 700 }} value={post.title || ""} onChange={e => handleTitleChange(e.target.value)} placeholder="Post title…" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "end" }}>
              <div>
                <label style={lb}>Slug</label>
                <input style={{ ...fs, fontFamily: "monospace", fontSize: 13 }} value={post.slug || ""}
                  onChange={e => { setSlugManual(true); setPost(p => ({ ...p, slug: e.target.value })); }}
                  placeholder="post-slug" />
              </div>
              <button onClick={() => setPost(p => ({ ...p, slug: slugify(p.title || "") })) }
                style={{ padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, background: "#f8fafc", fontSize: 12, color: "#64748b", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" }}>
                Auto-generate
              </button>
            </div>
          </div>

          {/* Excerpt */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 22 }}>
            <label style={lb}>Excerpt / Summary</label>
            <textarea style={{ ...fs, minHeight: 80, resize: "vertical" }} value={post.excerpt || ""} onChange={e => setPost(p => ({ ...p, excerpt: e.target.value }))} placeholder="Brief description shown on cards and search results…" />
          </div>

          {/* Rich text content */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px 0", borderBottom: "1px solid #f1f5f9" }}>
              <label style={lb}>Content</label>
            </div>
            <div ref={editorRef as React.RefObject<HTMLDivElement>}>
              <RichTextEditor
                value={post.content || ""}
                onChange={v => setPost(p => ({ ...p, content: v }))}
                onImagePick={() => setMediaPicker("content")}
                minHeight={380}
                placeholder="Write your post content here…"
              />
            </div>
          </div>

          {/* Translations */}
          <TranslationsPanel
            post={post}
            translations={translations}
            onChange={setTranslations}
          />
        </div>

        {/* ── Sidebar ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Settings */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 18 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>Settings</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={lb}>Status</label>
              <select style={fs} value={post.status || "draft"} onChange={e => setPost(p => ({ ...p, status: e.target.value }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lb}>Post Type</label>
              <select style={fs} value={post.post_type || "blog"} onChange={e => setPost(p => ({ ...p, post_type: e.target.value }))}>
                <option value="blog">Blog</option>
                <option value="news">News</option>
                <option value="event">Event</option>
              </select>
            </div>
            {post.post_type === "event" && (
              <div style={{ marginBottom: 12 }}>
                <label style={lb}>Event Date</label>
                <input type="datetime-local" style={fs} value={post.event_date ? post.event_date.replace(" ", "T").slice(0, 16) : ""} onChange={e => setPost(p => ({ ...p, event_date: e.target.value }))} />
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={lb}>Author</label>
              <input style={fs} value={post.author || ""} onChange={e => setPost(p => ({ ...p, author: e.target.value }))} />
            </div>
            <div>
              <label style={lb}>Tags (comma separated)</label>
              <input style={fs} value={post.tags || ""} onChange={e => setPost(p => ({ ...p, tags: e.target.value }))} placeholder="tag1, tag2" />
            </div>
          </div>

          {/* Featured Image */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 18 }}>
            <h3 style={{ fontSize: 12, fontWeight: 800, color: "#475569", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Featured Image</h3>
            {post.featured_image ? (
              <div style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={post.featured_image} alt="" style={{ width: "100%", borderRadius: 8, border: "1px solid #e2e8f0", objectFit: "cover", maxHeight: 160, display: "block" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <button onClick={() => setPost(p => ({ ...p, featured_image: "" }))}
                  style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div style={{ border: "2px dashed #e2e8f0", borderRadius: 8, padding: "24px 12px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                No image selected
              </div>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <button onClick={() => setMediaPicker("featured")}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", border: "1px solid #e2e8f0", borderRadius: 7, background: "#f8fafc", cursor: "pointer", fontSize: 12, color: "#374151", fontWeight: 600 }}>
                <FolderOpen size={13} /> Library
              </button>
              <input
                type="text"
                value={post.featured_image || ""}
                onChange={e => setPost(p => ({ ...p, featured_image: e.target.value }))}
                placeholder="or paste URL"
                style={{ flex: 2, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, fontFamily: "inherit", outline: "none" }}
              />
            </div>
          </div>

          {/* Publish */}
          <button onClick={handleSave} disabled={saving}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: saving ? "#94a3b8" : "#2070B8", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", boxShadow: "0 2px 10px rgba(32,112,184,0.3)" }}>
            <Save size={15} /> {saving ? "Saving…" : post.status === "published" ? "Update Post" : "Save as Draft"}
          </button>
          {post.status === "draft" && (
            <button onClick={() => { setPost(p => ({ ...p, status: "published" })); setTimeout(handleSave, 50); }}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 10px rgba(22,163,74,0.3)" }}>
              🚀 Publish Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

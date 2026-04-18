"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, BookOpen, Globe } from "lucide-react";

interface Post {
  id: number;
  title: string;
  slug: string;
  post_type: "blog" | "news" | "event";
  status: "draft" | "published";
  author: string;
  event_date: string | null;
  updated_at: string;
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  blog:  { bg: "#eff6ff", color: "#2070B8" },
  news:  { bg: "#dcfce7", color: "#15803d" },
  event: { bg: "#f3e8ff", color: "#7c3aed" },
};

export default function PostsListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "blog" | "news" | "event">("all");
  const [translatingAll, setTranslatingAll] = useState(false);
  const [transProgress, setTransProgress] = useState<{ done: number; total: number } | null>(null);
  const [transToast, setTransToast] = useState<string | null>(null);

  const load = (type?: string) => {
    setLoading(true);
    const url = type && type !== "all" ? `/api/admin/posts?type=${type}` : "/api/admin/posts";
    fetch(url)
      .then(r => r.json())
      .then(d => { setPosts((d as { posts: Post[] }).posts || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(activeTab); }, [activeTab]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
    setDeleting(null);
    load(activeTab);
  };

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.slug.toLowerCase().includes(query.toLowerCase())
  );

  const translateAllPosts = async () => {
    if (!confirm("Translate all published posts into all active languages? This may take a while.")) return;
    setTranslatingAll(true);

    // 1. Fetch active languages
    const langsRes = await fetch("/api/languages").then(r => r.json()) as { languages?: { code: string }[] };
    const langs = langsRes.languages ?? [];
    if (langs.length === 0) { setTranslatingAll(false); return; }

    // 2. Fetch all published posts with translations_json
    const allRes = await fetch("/api/admin/posts?limit=1000").then(r => r.json()) as { posts?: (Post & { translations_json?: string | null })[] };
    const allPosts = allRes.posts ?? [];
    const total = allPosts.length * langs.length;
    let done = 0;
    setTransProgress({ done, total });

    for (const post of allPosts) {
      let translations: Record<string, { title?: string; excerpt?: string; content?: string }> = {};
      try { if (post.translations_json) translations = JSON.parse(post.translations_json); } catch { /* ignore */ }

      let changed = false;
      for (const lang of langs) {
        const existing = translations[lang.code] ?? {};
        const updated = { ...existing };

        const tr = async (text: string) => {
          if (!text) return "";
          try {
            const r = await fetch("/api/admin/translate", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text, target: lang.code }),
            });
            const d = await r.json() as { translated?: string };
            return d.translated ?? text;
          } catch { return text; }
        };

        if (!existing.title) { updated.title = await tr(post.title); changed = true; }
        const postWithExcerpt = post as Post & { excerpt?: string };
        if (!existing.excerpt && postWithExcerpt.excerpt) { updated.excerpt = await tr(postWithExcerpt.excerpt); changed = true; }

        done++;
        setTransProgress({ done, total });
        translations[lang.code] = updated;
      }

      if (changed) {
        await fetch(`/api/admin/posts/${post.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...post, translations_json: JSON.stringify(translations) }),
        });
      }
    }

    setTranslatingAll(false);
    setTransProgress(null);
    setTransToast(`Translated ${allPosts.length} posts into ${langs.length} language${langs.length > 1 ? "s" : ""}!`);
    setTimeout(() => setTransToast(null), 4000);
  };

  const tabs: Array<{ key: "all" | "blog" | "news" | "event"; label: string }> = [
    { key: "all",   label: "All" },
    { key: "blog",  label: "Blog" },
    { key: "news",  label: "News" },
    { key: "event", label: "Events" },
  ];

  return (
    <div>
      {/* Toast */}
      {transToast && (
        <div style={{ position: "fixed", top: 16, right: 20, zIndex: 9999, background: "#16a34a", color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}>
          ✅ {transToast}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Posts</h1>
          <p style={{ color: "#64748b", fontSize: 14 }}>{posts.length} post{posts.length !== 1 ? "s" : ""} total</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => void translateAllPosts()}
            disabled={translatingAll}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: translatingAll ? "#f1f5f9" : "#7c3aed", color: translatingAll ? "#94a3b8" : "#fff", borderRadius: 8, border: "none", fontSize: 13.5, fontWeight: 600, cursor: translatingAll ? "wait" : "pointer" }}>
            <Globe size={15} />
            {transProgress ? `Translating… ${transProgress.done}/${transProgress.total}` : "Translate All Posts"}
          </button>
          <button
            onClick={() => router.push("/admin/posts/new")}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "#2070B8", color: "#fff", borderRadius: 8, border: "none", fontSize: 13.5, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(32,112,184,0.3)" }}>
            <Plus size={15} /> New Post
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, background: "#f1f5f9", borderRadius: 8, padding: 4, width: "fit-content" }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ padding: "6px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: activeTab === tab.key ? "#fff" : "transparent", color: activeTab === tab.key ? "#0f172a" : "#64748b", boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 360 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search posts…"
          style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13.5, outline: "none", background: "#fff", boxSizing: "border-box" as const }} />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <BookOpen size={48} style={{ color: "#cbd5e1", margin: "0 auto 14px", display: "block" }} />
            <p style={{ color: "#64748b", fontWeight: 600, marginBottom: 6 }}>{query ? "No posts match your search" : "No posts yet"}</p>
            {!query && (
              <button onClick={() => router.push("/admin/posts/new")}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "9px 18px", background: "#2070B8", color: "#fff", borderRadius: 7, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={13} /> Create your first post
              </button>
            )}
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Title", "Type", "Status", "Date", ""].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "11px 20px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(post => {
                  const tc = TYPE_COLORS[post.post_type] || TYPE_COLORS.blog;
                  return (
                    <tr key={post.id} style={{ borderTop: "1px solid #f1f5f9" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{post.title}</div>
                        <code style={{ fontSize: 11.5, color: "#94a3b8", background: "#f1f5f9", padding: "1px 6px", borderRadius: 3 }}>/{post.slug}</code>
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: tc.bg, color: tc.color, textTransform: "capitalize" as const }}>
                          {post.post_type}
                        </span>
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: post.status === "published" ? "#dcfce7" : "#fef9c3", color: post.status === "published" ? "#15803d" : "#92400e" }}>
                          {post.status}
                        </span>
                      </td>
                      <td style={{ padding: "13px 20px", fontSize: 12.5, color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {post.event_date
                          ? new Date(post.event_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : new Date(post.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td style={{ padding: "13px 20px" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button onClick={() => router.push(`/admin/posts/${post.id}`)}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, background: "#eff6ff", color: "#2070B8", border: "1px solid #bfdbfe", cursor: "pointer" }}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(post.id, post.title)} disabled={deleting === post.id}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 6, background: "#fef2f2", color: "#C0185A", border: "1px solid #fecaca", cursor: deleting === post.id ? "not-allowed" : "pointer" }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ padding: "10px 20px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#94a3b8" }}>
              Showing {filtered.length} of {posts.length} posts
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Save,
  Globe, ExternalLink, ChevronRight, Eye, EyeOff, CheckCircle,
} from "lucide-react";

interface NavItem {
  id: number;
  label: string;
  href: string;
  parent_id: number | null;
  sort_order: number;
  is_active: number;
  open_new_tab: number;
}

const inp = {
  width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6,
  fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff", boxSizing: "border-box" as const,
};
const lbl = { display: "block", fontSize: 11.5, fontWeight: 600, color: "#374151", marginBottom: 3 } as const;

function ItemRow({
  item,
  isChild,
  isFirst,
  isLast,
  onChange,
  onDelete,
  onMove,
}: {
  item: NavItem;
  isChild: boolean;
  isFirst: boolean;
  isLast: boolean;
  onChange: (item: NavItem) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden",
      marginLeft: isChild ? 28 : 0,
      borderLeft: isChild ? "3px solid #2070B8" : "1px solid #e2e8f0",
      opacity: item.is_active ? 1 : 0.5,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: expanded ? "#f8fafc" : "#fff", cursor: "pointer" }}
        onClick={() => setExpanded(e => !e)}>
        {isChild && <ChevronRight size={12} style={{ color: "#2070B8", flexShrink: 0 }} />}
        <span style={{ fontWeight: 600, fontSize: 13.5, color: "#0f172a", flex: 1 }}>{item.label || <em style={{ color: "#94a3b8" }}>Unnamed</em>}</span>
        <code style={{ fontSize: 11, color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>{item.href}</code>
        {item.open_new_tab ? <ExternalLink size={12} style={{ color: "#94a3b8" }} /> : null}
        {item.is_active ? <Eye size={13} style={{ color: "#16a34a" }} /> : <EyeOff size={13} style={{ color: "#dc2626" }} />}
        <div style={{ display: "flex", gap: 3 }} onClick={e => e.stopPropagation()}>
          {!isFirst && <button onClick={() => onMove(-1)} style={{ padding: "3px 5px", border: "1px solid #e2e8f0", borderRadius: 4, background: "#fff", cursor: "pointer", color: "#64748b" }}><ChevronUp size={12} /></button>}
          {!isLast && <button onClick={() => onMove(1)} style={{ padding: "3px 5px", border: "1px solid #e2e8f0", borderRadius: 4, background: "#fff", cursor: "pointer", color: "#64748b" }}><ChevronDown size={12} /></button>}
          <button onClick={onDelete} style={{ padding: "3px 6px", border: "1px solid #fecaca", borderRadius: 4, background: "#fef2f2", cursor: "pointer", color: "#C0185A" }}><Trash2 size={12} /></button>
        </div>
        <ChevronDown size={14} style={{ color: "#94a3b8", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </div>

      {/* Edit form */}
      {expanded && (
        <div style={{ padding: "14px 16px", borderTop: "1px solid #f1f5f9", background: "#fafafa" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
            <div>
              <label style={lbl}>Label</label>
              <input style={inp} value={item.label} onChange={e => onChange({ ...item, label: e.target.value })} placeholder="Nav label" />
            </div>
            <div>
              <label style={lbl}>URL / Path</label>
              <input style={inp} value={item.href} onChange={e => onChange({ ...item, href: e.target.value })} placeholder="/page-slug or https://..." />
            </div>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={!!item.is_active} onChange={e => onChange({ ...item, is_active: e.target.checked ? 1 : 0 })} style={{ accentColor: "#2070B8" }} />
              <span style={{ color: "#374151", fontWeight: 500 }}>Visible</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={!!item.open_new_tab} onChange={e => onChange({ ...item, open_new_tab: e.target.checked ? 1 : 0 })} style={{ accentColor: "#2070B8" }} />
              <span style={{ color: "#374151", fontWeight: 500 }}>Open in new tab</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuEditor() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<number | null>(null); // parent_id for new child, -1 for top-level

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/nav");
    const d = await res.json() as { nav_items: NavItem[] };
    setItems(d.nav_items || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const topLevel = items.filter(i => i.parent_id === null).sort((a, b) => a.sort_order - b.sort_order);
  const childrenOf = (parentId: number) => items.filter(i => i.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);

  const updateItem = (updated: NavItem) => setItems(prev => prev.map(i => i.id === updated.id ? updated : i));

  const moveItem = (list: NavItem[], idx: number, dir: -1 | 1) => {
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const newOrder = list[idx].sort_order;
    const swapOrder = list[swapIdx].sort_order;
    setItems(prev => prev.map(i => {
      if (i.id === list[idx].id) return { ...i, sort_order: swapOrder };
      if (i.id === list[swapIdx].id) return { ...i, sort_order: newOrder };
      return i;
    }));
  };

  const deleteItem = async (id: number) => {
    if (!confirm("Delete this item? Children will also be removed.")) return;
    await fetch(`/api/admin/nav?id=${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== id && i.parent_id !== id));
  };

  const addItem = async (parentId: number | null) => {
    const maxOrder = items.filter(i => i.parent_id === parentId).reduce((m, i) => Math.max(m, i.sort_order), -1);
    const res = await fetch("/api/admin/nav", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "New Item", href: "/", parent_id: parentId, sort_order: maxOrder + 1 }),
    });
    const d = await res.json() as { id: number };
    setItems(prev => [...prev, { id: d.id, label: "New Item", href: "/", parent_id: parentId, sort_order: maxOrder + 1, is_active: 1, open_new_tab: 0 }]);
    setAddingTo(null);
  };

  const save = async () => {
    setSaving(true);
    await fetch("/api/admin/nav", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setSaving(false);
    showToast("Menu saved successfully");
  };

  if (loading) return <div style={{ padding: "2rem", color: "#94a3b8" }}>Loading menu…</div>;

  return (
    <div style={{ maxWidth: 820 }}>
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 20, zIndex: 9999, background: "#16a34a", color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={15} /> {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Menu Editor</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", margin: "4px 0 0" }}>Manage navigation items, dropdowns, and links. Changes go live when saved.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, textDecoration: "none", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
            <Globe size={14} /> View Site
          </a>
          <button onClick={save} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 20px", background: "#2070B8", color: "#fff", border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(32,112,184,0.3)" }}>
            <Save size={14} /> {saving ? "Saving…" : "Save Menu"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "11px 16px", marginBottom: 20, fontSize: 13, color: "#1d4ed8" }}>
        Click any item to expand and edit. Items with dropdowns show their children indented below.
      </div>

      {/* Menu tree */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {topLevel.map((item, idx) => {
          const children = childrenOf(item.id);
          return (
            <div key={item.id}>
              <ItemRow
                item={item} isChild={false}
                isFirst={idx === 0} isLast={idx === topLevel.length - 1}
                onChange={updateItem}
                onDelete={() => deleteItem(item.id)}
                onMove={dir => moveItem(topLevel, idx, dir)}
              />
              {/* Children */}
              {children.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                  {children.map((child, cidx) => (
                    <ItemRow
                      key={child.id} item={child} isChild
                      isFirst={cidx === 0} isLast={cidx === children.length - 1}
                      onChange={updateItem}
                      onDelete={() => deleteItem(child.id)}
                      onMove={dir => moveItem(children, cidx, dir)}
                    />
                  ))}
                </div>
              )}
              {/* Add sub-item */}
              <button onClick={() => addItem(item.id)}
                style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 28, marginTop: 6, padding: "5px 12px", background: "transparent", border: "1px dashed #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#2070B8", fontWeight: 600 }}>
                <Plus size={11} /> Add sub-item under &ldquo;{item.label}&rdquo;
              </button>
            </div>
          );
        })}
      </div>

      {/* Add top-level */}
      <button onClick={() => addItem(null)}
        style={{ display: "flex", alignItems: "center", gap: 7, width: "100%", marginTop: 16, padding: "11px 16px", background: "transparent", border: "2px dashed #e2e8f0", borderRadius: 10, cursor: "pointer", fontSize: 13.5, color: "#64748b", fontWeight: 600, justifyContent: "center" }}>
        <Plus size={15} /> Add Top-Level Nav Item
      </button>

      {/* Live preview */}
      <div style={{ marginTop: 32, background: "#0d1523", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "8px 16px", background: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Preview — Desktop Navigation
        </div>
        <div style={{ padding: "0 24px", height: 56, display: "flex", alignItems: "center", gap: 4, overflowX: "auto" }}>
          {topLevel.filter(i => i.is_active).map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ padding: "6px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: "rgba(255,255,255,0.8)", borderRadius: 4, background: "transparent", whiteSpace: "nowrap" }}>
                {item.label}
                {childrenOf(item.id).length > 0 && <span style={{ marginLeft: 3, fontSize: 9, color: "rgba(255,255,255,0.4)" }}>▾</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

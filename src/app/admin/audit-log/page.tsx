"use client";

import { useState, useEffect, useCallback } from "react";
import { Shield, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

interface LogEntry {
  id: number; admin_username: string; action: string;
  resource_type: string; resource_id: string; details: string;
  ip_address: string; created_at: string;
}

const ACTION_COLOR: Record<string, string> = {
  login:    "#059669", logout:   "#64748b",
  create:   "#2070B8", update:   "#f59e0b",
  delete:   "#ef4444", backup_mysql:  "#7c3aed",
  backup_gallery: "#7c3aed",
};

const CARD = { background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" };

export default function AuditLogPage() {
  const [logs, setLogs]     = useState<LogEntry[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoad]  = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [filterUser, setFilterUser]     = useState("");
  const limit = 50;

  const load = useCallback(async () => {
    setLoad(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filterAction) params.set("action", filterAction);
    if (filterUser)   params.set("user", filterUser);
    try {
      const res  = await fetch(`/api/admin/audit-log?${params}`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch { /* ignore */ }
    setLoad(false);
  }, [page, filterAction, filterUser]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={22} style={{ color: "#2070B8" }} />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Audit Log</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>{total.toLocaleString()} total entries</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }}
            style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 13, background: "#fff", color: "#374151" }}>
            <option value="">All actions</option>
            {["login","logout","create","update","delete","backup_mysql","backup_gallery"].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <input value={filterUser} onChange={e => { setFilterUser(e.target.value); setPage(1); }}
            placeholder="Filter by user…"
            style={{ padding: "6px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 13, width: 160 }} />
          <button onClick={load} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", cursor:"pointer", fontSize:13 }}>
            <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div style={CARD}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Time", "User", "Action", "Resource", "Details", "IP"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#374151", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                  <td style={{ padding: "9px 14px", color: "#94a3b8", fontSize: 11, whiteSpace: "nowrap" }}>
                    {new Date(log.created_at).toLocaleString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit" })}
                  </td>
                  <td style={{ padding: "9px 14px", color: "#0f172a", fontWeight: 600 }}>{log.admin_username}</td>
                  <td style={{ padding: "9px 14px" }}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: `${ACTION_COLOR[log.action] ?? "#64748b"}18`, color: ACTION_COLOR[log.action] ?? "#64748b" }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "9px 14px", color: "#64748b" }}>
                    {log.resource_type}{log.resource_id ? ` #${log.resource_id}` : ""}
                  </td>
                  <td style={{ padding: "9px 14px", color: "#64748b", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.details || "—"}
                  </td>
                  <td style={{ padding: "9px 14px", fontFamily: "monospace", fontSize: 11, color: "#94a3b8" }}>{log.ip_address || "—"}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No audit entries yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 16, borderTop: "1px solid #f1f5f9", marginTop: 12 }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: page===1?"not-allowed":"pointer", display:"flex", alignItems:"center" }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, color: "#64748b" }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
              style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: page===totalPages?"not-allowed":"pointer", display:"flex", alignItems:"center" }}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 0.8s linear infinite}`}</style>
    </div>
  );
}

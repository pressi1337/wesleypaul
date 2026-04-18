"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Calendar, Trash2, CheckCircle, RefreshCw, Eye, ClipboardList, Download, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";

interface ContactSub {
  id: number; name: string; email: string; subject: string; message: string;
  status: "new" | "read" | "replied"; created_at: string;
}
interface BookingSub {
  id: number; name: string; email: string; phone: string; organization: string;
  event_type: string; location: string; preferred_dates: string; message: string;
  status: "new" | "in_review" | "confirmed" | "declined"; created_at: string;
}
interface FormSub {
  id: number; form_id: number; form_name: string;
  data_json: Record<string, string> | string;
  status: "new" | "read"; created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: "#dc2626", read: "#d97706", replied: "#16a34a",
  in_review: "#d97706", confirmed: "#16a34a", declined: "#64748b",
};
const STATUS_BG: Record<string, string> = {
  new: "#fef2f2", read: "#fffbeb", replied: "#f0fdf4",
  in_review: "#fffbeb", confirmed: "#f0fdf4", declined: "#f8fafc",
};

const PAGE_SIZE = 15;

function parseDataJson(raw: Record<string, string> | string): Record<string, string> {
  if (typeof raw === "string") { try { return JSON.parse(raw) as Record<string, string>; } catch { return {}; } }
  return raw ?? {};
}

/* ── Excel export ─────────────────────────────────────────────────────────── */
function downloadExcel(filename: string, rows: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  // Auto-width columns
  const colWidths = rows[0].map((_, ci) =>
    Math.min(60, Math.max(10, ...rows.map(r => String(r[ci] ?? "").length)))
  );
  ws["!cols"] = colWidths.map(w => ({ wch: w }));
  // Style header row bold
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[cell]) ws[cell].s = { font: { bold: true } };
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Submissions");
  XLSX.writeFile(wb, filename);
}

function exportContact(subs: ContactSub[]) {
  const header = ["ID", "Name", "Email", "Subject", "Message", "Status", "Received"];
  const rows = subs.map(s => [s.id, s.name, s.email, s.subject, s.message, s.status, new Date(s.created_at).toLocaleString()]);
  downloadExcel("contact-submissions.xlsx", [header, ...rows]);
}
function exportBooking(subs: BookingSub[]) {
  const header = ["ID", "Name", "Email", "Phone", "Organization", "Event Type", "Location", "Preferred Dates", "Message", "Status", "Received"];
  const rows = subs.map(s => [s.id, s.name, s.email, s.phone, s.organization, s.event_type, s.location, s.preferred_dates, s.message, s.status, new Date(s.created_at).toLocaleString()]);
  downloadExcel("booking-submissions.xlsx", [header, ...rows]);
}
function exportCustom(subs: FormSub[]) {
  const allKeys = new Set<string>();
  subs.forEach(s => Object.keys(parseDataJson(s.data_json)).forEach(k => allKeys.add(k)));
  const dataKeys = Array.from(allKeys);
  const header = ["ID", "Form", "Status", "Received", ...dataKeys];
  const rows = subs.map(s => {
    const data = parseDataJson(s.data_json);
    return [s.id, s.form_name, s.status, new Date(s.created_at).toLocaleString(), ...dataKeys.map(k => data[k] ?? "")];
  });
  downloadExcel("custom-form-submissions.xlsx", [header, ...rows]);
}

/* ── Modal ──────────────────────────────────────────────────────────────────── */
function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 620, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.3)" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

/* ── Pagination controls ─────────────────────────────────────────────────── */
function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderTop: "1px solid #f1f5f9", background: "#fafbfc" }}>
      <span style={{ fontSize: 12, color: "#94a3b8" }}>
        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
      </span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#cbd5e1" : "#64748b", display: "flex", alignItems: "center" }}>
          <ChevronLeft size={13} />
        </button>
        {pages.map((p, i) => (
          <button key={i} onClick={() => typeof p === "number" && onChange(p)} disabled={p === "…"}
            style={{ minWidth: 30, height: 30, border: `1px solid ${p === page ? "#2070B8" : "#e2e8f0"}`, borderRadius: 6, background: p === page ? "#2070B8" : "#fff", color: p === page ? "#fff" : "#64748b", fontSize: 12.5, fontWeight: p === page ? 700 : 500, cursor: p === "…" ? "default" : "pointer" }}>
            {p}
          </button>
        ))}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          style={{ padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#cbd5e1" : "#64748b", display: "flex", alignItems: "center" }}>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────────── */
export default function SubmissionsPage() {
  const [tab, setTab] = useState<"contact" | "booking" | "custom">("contact");
  const [contactSubs, setContactSubs] = useState<ContactSub[]>([]);
  const [bookingSubs, setBookingSubs] = useState<BookingSub[]>([]);
  const [formSubs, setFormSubs] = useState<FormSub[]>([]);
  const [formsCount, setFormsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ContactSub | BookingSub | FormSub | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Search state per tab
  const [contactSearch, setContactSearch] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [customSearch, setCustomSearch] = useState("");

  // Pagination per tab
  const [contactPage, setContactPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const [customPage, setCustomPage] = useState(1);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [cr, br, fr, fc] = await Promise.all([
      fetch("/api/admin/submissions?type=contact").then(r => r.json()),
      fetch("/api/admin/submissions?type=booking").then(r => r.json()),
      fetch("/api/admin/form-submissions").then(r => r.json()),
      fetch("/api/admin/forms").then(r => r.json()),
    ]);
    setContactSubs(cr.submissions || []);
    setBookingSubs(br.submissions || []);
    setFormSubs(fr.submissions || []);
    setFormsCount((fc as { forms?: unknown[] }).forms?.length ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: number, status: string, type: string) => {
    if (type === "custom") {
      await fetch("/api/admin/form-submissions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      setFormSubs(p => p.map(s => s.id === id ? { ...s, status: status as FormSub["status"] } : s));
      if (modal && "form_id" in modal && modal.id === id) setModal(prev => prev ? { ...prev, status: status as never } : null);
    } else {
      await fetch("/api/admin/submissions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, type }) });
      if (type === "contact") setContactSubs(p => p.map(s => s.id === id ? { ...s, status: status as ContactSub["status"] } : s));
      else setBookingSubs(p => p.map(s => s.id === id ? { ...s, status: status as BookingSub["status"] } : s));
      if (modal && !("form_id" in modal) && modal.id === id) setModal(prev => prev ? { ...prev, status: status as never } : null);
    }
    showToast("Status updated");
  };

  const deleteItem = async (id: number, type: string) => {
    if (!confirm("Delete this submission? This cannot be undone.")) return;
    if (type === "custom") {
      await fetch("/api/admin/form-submissions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      setFormSubs(p => p.filter(s => s.id !== id));
    } else {
      await fetch(`/api/admin/submissions?id=${id}&type=${type}`, { method: "DELETE" });
      if (type === "contact") setContactSubs(p => p.filter(s => s.id !== id));
      else setBookingSubs(p => p.filter(s => s.id !== id));
    }
    if (modal?.id === id) setModal(null);
    showToast("Deleted");
  };

  const openModal = (item: ContactSub | BookingSub | FormSub, type: string) => {
    setModal(item);
    if (item.status === "new") updateStatus(item.id, type === "contact" ? "read" : type === "booking" ? "in_review" : "read", type);
  };

  const newCount = (arr: { status: string }[]) => arr.filter(s => s.status === "new").length;

  // Filtered lists
  const q = (s: string) => s.toLowerCase();
  const filteredContact = contactSubs.filter(s => {
    const t = q(contactSearch);
    return !t || q(s.name).includes(t) || q(s.email).includes(t) || q(s.subject).includes(t) || q(s.message).includes(t) || q(s.status).includes(t);
  });
  const filteredBooking = bookingSubs.filter(s => {
    const t = q(bookingSearch);
    return !t || q(s.name).includes(t) || q(s.email).includes(t) || q(s.event_type).includes(t) || q(s.organization).includes(t) || q(s.status).includes(t);
  });
  const filteredCustom = formSubs.filter(s => {
    const t = q(customSearch);
    if (!t) return true;
    const data = parseDataJson(s.data_json);
    return q(s.form_name).includes(t) || q(s.status).includes(t) || Object.values(data).some(v => q(String(v)).includes(t));
  });

  // Paginated slices
  const pagedContact = filteredContact.slice((contactPage - 1) * PAGE_SIZE, contactPage * PAGE_SIZE);
  const pagedBooking = filteredBooking.slice((bookingPage - 1) * PAGE_SIZE, bookingPage * PAGE_SIZE);
  const pagedCustom  = filteredCustom.slice((customPage - 1) * PAGE_SIZE, customPage * PAGE_SIZE);

  // Reset page when search changes
  const setContactSearchR = (v: string) => { setContactSearch(v); setContactPage(1); };
  const setBookingSearchR  = (v: string) => { setBookingSearch(v); setBookingPage(1); };
  const setCustomSearchR   = (v: string) => { setCustomSearch(v); setCustomPage(1); };

  const th: React.CSSProperties = { textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" };

  const search = tab === "contact" ? contactSearch : tab === "booking" ? bookingSearch : customSearch;
  const setSearch = tab === "contact" ? setContactSearchR : tab === "booking" ? setBookingSearchR : setCustomSearchR;

  return (
    <div style={{ maxWidth: 1100 }}>
      {toast && (
        <div style={{ position: "fixed", top: 16, right: 20, zIndex: 9999, background: "#16a34a", color: "#fff", padding: "10px 18px", borderRadius: 9, fontSize: 13.5, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={15} /> {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Submissions</h1>
          <p style={{ fontSize: 13.5, color: "#64748b", margin: "4px 0 0" }}>Contact messages, booking inquiries, and custom form responses.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              if (tab === "contact") exportContact(filteredContact);
              else if (tab === "booking") exportBooking(filteredBooking);
              else exportCustom(filteredCustom);
            }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#0a7c52", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <Download size={13} /> Export Excel
          </button>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 500 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {(["contact", "booking", "custom"] as const).map(t => {
          const isActive = tab === t;
          const badge = t === "contact" ? newCount(contactSubs) : t === "booking" ? newCount(bookingSubs) : newCount(formSubs);
          return (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 8,
                background: isActive ? "#2070B8" : "#fff", color: isActive ? "#fff" : "#64748b",
                boxShadow: isActive ? "0 2px 8px rgba(32,112,184,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
                border: isActive ? "none" : "1px solid #e2e8f0" }}>
              {t === "contact" ? <Mail size={14} /> : t === "booking" ? <Calendar size={14} /> : <ClipboardList size={14} />}
              {t === "contact" ? "Contact Messages" : t === "booking" ? "Booking Inquiries" : "Custom Forms"}
              {t === "custom" && (
                <span style={{ background: isActive ? "rgba(255,255,255,0.25)" : "#eff6ff", color: isActive ? "#fff" : "#2070B8", borderRadius: 20, fontSize: 11, fontWeight: 800, padding: "1px 7px" }}>
                  {formsCount}
                </span>
              )}
              {badge > 0 && (
                <span style={{ background: "#dc2626", color: "#fff", borderRadius: 20, fontSize: 11, fontWeight: 800, padding: "1px 7px" }}>{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${tab === "contact" ? "contact" : tab === "booking" ? "booking" : "custom form"} submissions…`}
          style={{ width: "100%", padding: "9px 12px 9px 34px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13.5, color: "#0f172a", outline: "none", boxSizing: "border-box", background: "#fff" }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ color: "#94a3b8", padding: "2rem 0" }}>Loading…</div>

      ) : tab === "custom" ? (
        filteredCustom.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "60px 24px", textAlign: "center" }}>
            <ClipboardList size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px", display: "block" }} />
            <p style={{ color: "#94a3b8", fontSize: 14 }}>{customSearch ? "No submissions match your search." : "No custom form submissions yet."}</p>
            <p style={{ color: "#cbd5e1", fontSize: 12 }}>{formsCount} form{formsCount !== 1 ? "s" : ""} created</p>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 12, color: "#64748b" }}>
              {formsCount} form{formsCount !== 1 ? "s" : ""} created &nbsp;·&nbsp; {filteredCustom.length} submission{filteredCustom.length !== 1 ? "s" : ""}
              {customSearch && ` matching "${customSearch}"`}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={th}>Form</th>
                  <th style={th}>Preview</th>
                  <th style={th}>Status</th>
                  <th style={th}>Date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pagedCustom.map(item => {
                  const data = parseDataJson(item.data_json);
                  const previewVal = Object.values(data)[0] ?? "—";
                  const previewKey = Object.keys(data)[0] ?? "";
                  return (
                    <tr key={item.id} onClick={() => openModal(item, "custom")}
                      style={{ borderTop: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0f172a" }}>{item.form_name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>#{item.form_id}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151", maxWidth: 220 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {previewKey && <span style={{ color: "#94a3b8", marginRight: 4 }}>{previewKey}:</span>}
                          {String(previewVal)}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: STATUS_BG[item.status] || "#f8fafc", color: STATUS_COLORS[item.status] || "#64748b" }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => deleteItem(item.id, "custom")}
                          style={{ padding: "4px 7px", border: "1px solid #fecaca", borderRadius: 5, background: "#fef2f2", cursor: "pointer", color: "#C0185A" }}>
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={customPage} total={filteredCustom.length} pageSize={PAGE_SIZE} onChange={setCustomPage} />
          </div>
        )

      ) : (tab === "contact" ? filteredContact : filteredBooking).length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "60px 24px", textAlign: "center" }}>
          {tab === "contact" ? <Mail size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} /> : <Calendar size={40} style={{ color: "#cbd5e1", margin: "0 auto 12px" }} />}
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            {(tab === "contact" ? contactSearch : bookingSearch) ? "No submissions match your search." : `No ${tab === "contact" ? "contact messages" : "booking inquiries"} yet.`}
          </p>
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 12, color: "#64748b" }}>
            {(tab === "contact" ? filteredContact : filteredBooking).length} result{(tab === "contact" ? filteredContact : filteredBooking).length !== 1 ? "s" : ""}
            {search && ` matching "${search}"`}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={th}>From</th>
                {tab === "booking" && <th style={th}>Event</th>}
                {tab === "contact" && <th style={th}>Subject</th>}
                <th style={th}>Status</th>
                <th style={th}>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(tab === "contact" ? pagedContact : pagedBooking).map(item => (
                <tr key={item.id} onClick={() => openModal(item, tab)}
                  style={{ borderTop: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: "#0f172a" }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>{item.email}</div>
                  </td>
                  {tab === "booking" && (
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>
                      <div style={{ fontWeight: 500 }}>{(item as BookingSub).event_type || "—"}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{(item as BookingSub).organization}</div>
                    </td>
                  )}
                  {tab === "contact" && (
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151", maxWidth: 200 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(item as ContactSub).subject || "—"}</div>
                    </td>
                  )}
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ padding: "3px 9px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: STATUS_BG[item.status] || "#f8fafc", color: STATUS_COLORS[item.status] || "#64748b" }}>
                      {item.status.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => deleteItem(item.id, tab)}
                      style={{ padding: "4px 7px", border: "1px solid #fecaca", borderRadius: 5, background: "#fef2f2", cursor: "pointer", color: "#C0185A" }}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={tab === "contact" ? contactPage : bookingPage}
            total={tab === "contact" ? filteredContact.length : filteredBooking.length}
            pageSize={PAGE_SIZE}
            onChange={tab === "contact" ? setContactPage : setBookingPage}
          />
        </div>
      )}

      {/* ── Detail Modal ── */}
      {modal && (
        <ModalOverlay onClose={() => setModal(null)}>
          {"form_id" in modal ? (
            <CustomFormModal sub={modal as FormSub} onClose={() => setModal(null)}
              onStatus={s => updateStatus(modal.id, s, "custom")}
              onDelete={() => { deleteItem(modal.id, "custom"); }} />
          ) : "event_type" in modal ? (
            <BookingModal sub={modal as BookingSub} onClose={() => setModal(null)}
              onStatus={s => updateStatus(modal.id, s, "booking")}
              onDelete={() => { deleteItem(modal.id, "booking"); }} />
          ) : (
            <ContactModal sub={modal as ContactSub} onClose={() => setModal(null)}
              onStatus={s => updateStatus(modal.id, s, "contact")}
              onDelete={() => { deleteItem(modal.id, "contact"); }} />
          )}
        </ModalOverlay>
      )}
    </div>
  );
}

/* ── Modal header ─────────────────────────────────────────────────────────── */
function ModalHeader({ title, subtitle, status, onClose }: { title: string; subtitle?: string; status: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: "#64748b" }}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: STATUS_BG[status] || "#f8fafc", color: STATUS_COLORS[status] || "#64748b" }}>
          {status.replace("_", " ")}
        </span>
        <button onClick={onClose} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", cursor: "pointer", color: "#64748b" }}>
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

/* ── Status + action footer ─────────────────────────────────────────────────── */
function ModalFooter({ statuses, current, onStatus, email, onDelete, onClose }: {
  statuses: string[]; current: string;
  onStatus: (s: string) => void; email?: string; onDelete: () => void; onClose: () => void;
}) {
  return (
    <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", borderRadius: "0 0 16px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Update Status</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {statuses.map(s => (
          <button key={s} onClick={() => onStatus(s)}
            style={{ padding: "5px 14px", borderRadius: 6, border: `1px solid ${STATUS_COLORS[s] ?? "#e2e8f0"}30`, background: current === s ? STATUS_BG[s] : "#fff", color: STATUS_COLORS[s] ?? "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {email && (
          <a href={`mailto:${email}`}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px", background: "#2070B8", color: "#fff", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
            <Eye size={13} /> Reply via Email
          </a>
        )}
        <button onClick={() => { onDelete(); onClose(); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#fef2f2", color: "#C0185A", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}

/* ── Contact modal ─────────────────────────────────────────────────────────── */
function ContactModal({ sub, onClose, onStatus, onDelete }: { sub: ContactSub; onClose: () => void; onStatus: (s: string) => void; onDelete: () => void }) {
  return (
    <>
      <ModalHeader title={sub.name} subtitle={sub.email} status={sub.status} onClose={onClose} />
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Field label="Email" value={sub.email} />
        <Field label="Subject" value={sub.subject} />
        <Field label="Message" value={sub.message} />
        <Field label="Received" value={new Date(sub.created_at).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })} />
      </div>
      <ModalFooter statuses={["new", "read", "replied"]} current={sub.status}
        onStatus={onStatus} email={sub.email} onDelete={onDelete} onClose={onClose} />
    </>
  );
}

/* ── Booking modal ─────────────────────────────────────────────────────────── */
function BookingModal({ sub, onClose, onStatus, onDelete }: { sub: BookingSub; onClose: () => void; onStatus: (s: string) => void; onDelete: () => void }) {
  return (
    <>
      <ModalHeader title={sub.name} subtitle={sub.email} status={sub.status} onClose={onClose} />
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Email" value={sub.email} />
          <Field label="Phone" value={sub.phone} />
          <Field label="Organization" value={sub.organization} />
          <Field label="Event Type" value={sub.event_type} />
          <Field label="Location" value={sub.location} />
          <Field label="Preferred Dates" value={sub.preferred_dates} />
        </div>
        <Field label="Message" value={sub.message} />
        <Field label="Received" value={new Date(sub.created_at).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })} />
      </div>
      <ModalFooter statuses={["new", "in_review", "confirmed", "declined"]} current={sub.status}
        onStatus={onStatus} email={sub.email} onDelete={onDelete} onClose={onClose} />
    </>
  );
}

/* ── Custom form modal ─────────────────────────────────────────────────────── */
function CustomFormModal({ sub, onClose, onStatus, onDelete }: { sub: FormSub; onClose: () => void; onStatus: (s: string) => void; onDelete: () => void }) {
  const data = parseDataJson(sub.data_json);
  return (
    <>
      <ModalHeader title={sub.form_name} subtitle={`Submitted ${new Date(sub.created_at).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`} status={sub.status} onClose={onClose} />
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
        {Object.entries(data).length === 0 ? (
          <div style={{ color: "#94a3b8", fontSize: 13 }}>No data recorded.</div>
        ) : Object.entries(data).map(([key, val]) => (
          <Field key={key} label={key} value={String(val)} />
        ))}
      </div>
      <ModalFooter statuses={["new", "read"]} current={sub.status}
        onStatus={onStatus} onDelete={onDelete} onClose={onClose} />
    </>
  );
}

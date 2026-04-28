"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, Globe, Church, Heart, BookOpen, Users, ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const EVENT_TYPES = [
  "Gospel Festival / Crusade",
  "Renewal & Revival Meeting",
  "Marriage & Family Seminar",
  "Evangelism Training Seminar",
  "Youth / School / University Outreach",
  "Conference / Speaking Engagement",
  "Other",
];

const MINISTRY_ICONS = [
  { icon: Globe, label: "Gospel Festivals" },
  { icon: Church, label: "Revivals" },
  { icon: Heart, label: "Marriage Seminars" },
  { icon: BookOpen, label: "Evangelism Training" },
  { icon: Users, label: "Youth Outreach" },
];

function DatePicker({ selectedDates, onChange }: { selectedDates: string[]; onChange: (d: string[]) => void }) {
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString("default", { month: "long" });
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const toISO = (day: number) => `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const toggleDate = (iso: string) => onChange(selectedDates.includes(iso) ? selectedDates.filter(d => d !== iso) : [...selectedDates, iso].sort());
  const formatDisplay = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
  const cells = Array.from({ length: firstDayOfWeek + daysInMonth }, (_, i) => i < firstDayOfWeek ? null : i - firstDayOfWeek + 1);

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden", backgroundColor: "#fff" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", backgroundColor: "#2070B8" }}>
        <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}><ChevronLeft size={18} /></button>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{monthLabel} {viewYear}</span>
        <button type="button" onClick={nextMonth} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center" }}><ChevronRight size={18} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", backgroundColor: "#f8f9fa", borderBottom: "1px solid #e2e8f0" }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: "center", padding: "6px 0", fontSize: 11, fontWeight: 700, color: "#6c757d" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "8px", gap: "3px" }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const iso = toISO(day);
          const selected = selectedDates.includes(iso);
          const isToday = iso === todayISO;
          const past = iso < todayISO;
          return (
            <button key={iso} type="button" disabled={past} onClick={() => toggleDate(iso)}
              style={{ width: "100%", aspectRatio: "1", borderRadius: "50%", border: isToday && !selected ? "2px solid #2070B8" : "none", fontSize: 13, fontWeight: selected || isToday ? 700 : 400, cursor: past ? "not-allowed" : "pointer", backgroundColor: selected ? "#C0185A" : "transparent", color: selected ? "#fff" : past ? "#ccc" : isToday ? "#2070B8" : "#2d3748" }}>
              {day}
            </button>
          );
        })}
      </div>
      {selectedDates.length > 0 && (
        <div style={{ padding: "10px 12px 14px", borderTop: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {selectedDates.map(iso => (
            <span key={iso} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", backgroundColor: "#C0185A", color: "#fff", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
              {formatDisplay(iso)}
              <button type="button" onClick={() => toggleDate(iso)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 15 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BookingFormClient() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitted) successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [submitted]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", organization: "", eventType: "", location: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dates: selectedDates }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const d = await res.json() as { error?: string };
        setError(d.error || "Submission failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Ministry event types */}
      <section style={{ padding: "64px 24px", backgroundColor: "#f8f9fa" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2070B8" }}>Available Ministry Events</h2>
            <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "12px auto 0" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: "1.25rem" }}>
            {MINISTRY_ICONS.map(({ icon: Icon, label }) => (
              <div key={label} style={{ padding: 24, textAlign: "center", background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", backgroundColor: "#2070B8" }}>
                  <Icon size={22} style={{ color: "#fff" }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#2070B8" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking form */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "3rem" }}>
            {/* Info panel */}
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2070B8", marginBottom: 16 }}>What to Expect</h2>
              <div style={{ width: 40, height: 4, backgroundColor: "#C0185A", borderRadius: 2, marginBottom: 24 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 20, fontSize: 14, color: "#6c757d" }}>
                {["Your inquiry goes directly to our ministry team — we'll respond as soon as possible.", "A team member will personally reach out to discuss your event vision in detail.", "We partner with you to plan and prepare every aspect of the event.", "No event is too small. We joyfully serve churches of all sizes and denominations."].map((text, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 1, color: "#C0185A" }} />
                    <p>{text}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 32, padding: 20, borderRadius: 8, backgroundColor: "#f8f9fa" }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: "#2070B8" }}>Have a question first?</p>
                <p style={{ fontSize: 14, color: "#6c757d" }}>Email us at <a href="mailto:info@wesleypaul.org" style={{ fontWeight: 600, color: "#C0185A", textDecoration: "none" }}>info@wesleypaul.org</a></p>
              </div>
            </div>

            {/* Form */}
            <div>
              {submitted ? (
                <div ref={successRef} style={{ borderRadius: 12, padding: 48, textAlign: "center", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <CheckCircle size={56} style={{ color: "#16a34a", margin: "0 auto 16px" }} />
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Inquiry Received!</h3>
                  <p style={{ color: "#374151", fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
                    Thank you for reaching out about your event! Our ministry team has received your inquiry and will contact you <strong>as soon as possible</strong> to discuss how we can serve you.
                  </p>
                  <p style={{ color: "#64748b", fontSize: 13 }}>
                    We are excited about the opportunity to partner with your ministry. God bless you! 🙏
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "1.25rem" }}>
                    <div><label>Full Name <span style={{ color: "#C0185A" }}>*</span></label><input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Your full name" /></div>
                    <div><label>Email Address <span style={{ color: "#C0185A" }}>*</span></label><input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="your@email.com" /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "1.25rem" }}>
                    <div><label>Phone Number</label><input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" /></div>
                    <div><label>Church / Organization <span style={{ color: "#C0185A" }}>*</span></label><input type="text" name="organization" required value={form.organization} onChange={handleChange} placeholder="Your church or organization" /></div>
                  </div>
                  <div>
                    <label>Type of Event <span style={{ color: "#C0185A" }}>*</span></label>
                    <select name="eventType" required value={form.eventType} onChange={handleChange}>
                      <option value="">Select event type...</option>
                      {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "1.25rem" }}>
                    <div><label>Event Location</label><input type="text" name="location" value={form.location} onChange={handleChange} placeholder="City, State / Country" /></div>
                    <div><label>Preferred Date(s)</label><DatePicker selectedDates={selectedDates} onChange={setSelectedDates} /></div>
                  </div>
                  <div>
                    <label>Tell Us More About Your Event</label>
                    <textarea name="message" rows={5} value={form.message} onChange={handleChange} placeholder="Share any details about your vision, congregation size, venue, or specific needs..." />
                  </div>
                  {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}
                  <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: "0.875rem", width: "100%", opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? "Submitting…" : "Submit Booking Inquiry"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

"use client";

import { useState } from "react";
import { CheckCircle, Globe, Church, Heart, BookOpen, Users } from "lucide-react";

const eventTypes = [
  "Gospel Festival / Crusade",
  "Renewal & Revival Meeting",
  "Marriage & Family Seminar",
  "Evangelism Training Seminar",
  "Youth / School / University Outreach",
  "Conference / Speaking Engagement",
  "Other",
];

export default function BookPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    eventType: "",
    location: "",
    date: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      {/* Page Header */}
      <section
        style={{
          padding: "80px 24px",
          background: "linear-gradient(135deg, #0a1523 0%, #2070B8 100%)",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", color: "#fff" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, color: "#f5a623" }}>
            Partner With Us
          </p>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 16 }}>Book Dr. Wesley</h1>
          <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
          <p style={{ marginTop: 24, fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", maxWidth: 560, margin: "24px auto 0" }}>
            Invite Dr. Wesley Paul to your church, campus, or community for a Gospel Festival,
            revival, seminar, or speaking event.
          </p>
        </div>
      </section>

      {/* Ministry Types */}
      <section style={{ padding: "64px 24px", backgroundColor: "#f8f9fa" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2070B8" }}>
              Available Ministry Events
            </h2>
            <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "12px auto 0" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))", gap: "1.25rem" }}>
            {[
              { icon: Globe, label: "Gospel Festivals" },
              { icon: Church, label: "Revivals" },
              { icon: Heart, label: "Marriage Seminars" },
              { icon: BookOpen, label: "Evangelism Training" },
              { icon: Users, label: "Youth Outreach" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="card" style={{ padding: 24, textAlign: "center" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    backgroundColor: "#2070B8",
                  }}
                >
                  <Icon size={22} style={{ color: "#fff" }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#2070B8" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "3rem" }}>
            {/* Info */}
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2070B8", marginBottom: 16 }}>
                What to Expect
              </h2>
              <div style={{ width: 40, height: 4, backgroundColor: "#C0185A", borderRadius: 2, marginBottom: 24 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 20, fontSize: 14, color: "#6c757d" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 1, color: "#C0185A" }} />
                  <p>We will review your inquiry within 3–5 business days.</p>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 1, color: "#C0185A" }} />
                  <p>A team member will reach out to discuss your event needs in detail.</p>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 1, color: "#C0185A" }} />
                  <p>We work with you to plan and prepare every aspect of the event.</p>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 1, color: "#C0185A" }} />
                  <p>No event is too small. We serve churches of all sizes and denominations.</p>
                </div>
              </div>

              <div style={{ marginTop: 32, padding: 20, borderRadius: 8, backgroundColor: "#f8f9fa" }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: "#2070B8" }}>
                  Have a question first?
                </p>
                <p style={{ fontSize: 14, color: "#6c757d" }}>
                  Email us at{" "}
                  <a href="mailto:info@wesleypaul.org" style={{ fontWeight: 600, color: "#C0185A", textDecoration: "none" }}>
                    info@wesleypaul.org
                  </a>
                </p>
              </div>
            </div>

            {/* Form */}
            <div>
              {submitted ? (
                <div style={{ borderRadius: 12, padding: 48, textAlign: "center", backgroundColor: "#f8f9fa" }}>
                  <CheckCircle size={56} style={{ color: "#C0185A", margin: "0 auto 16px" }} />
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2070B8", marginBottom: 12 }}>
                    Thank You!
                  </h3>
                  <p style={{ color: "#6c757d" }}>
                    Your booking inquiry has been received. We will be in touch within 3–5 business
                    days to discuss your event.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "1.25rem" }}>
                    <div>
                      <label>Full Name <span style={{ color: "#C0185A" }}>*</span></label>
                      <input type="text" name="name" required value={form.name} onChange={handleChange} placeholder="Your full name" />
                    </div>
                    <div>
                      <label>Email Address <span style={{ color: "#C0185A" }}>*</span></label>
                      <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="your@email.com" />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "1.25rem" }}>
                    <div>
                      <label>Phone Number</label>
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
                    </div>
                    <div>
                      <label>Church / Organization <span style={{ color: "#C0185A" }}>*</span></label>
                      <input type="text" name="organization" required value={form.organization} onChange={handleChange} placeholder="Your church or organization" />
                    </div>
                  </div>

                  <div>
                    <label>Type of Event <span style={{ color: "#C0185A" }}>*</span></label>
                    <select name="eventType" required value={form.eventType} onChange={handleChange}>
                      <option value="">Select event type...</option>
                      {eventTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: "1.25rem" }}>
                    <div>
                      <label>Event Location</label>
                      <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="City, State / Country" />
                    </div>
                    <div>
                      <label>Preferred Date(s)</label>
                      <input type="text" name="date" value={form.date} onChange={handleChange} placeholder="e.g. June 2026 or flexible" />
                    </div>
                  </div>

                  <div>
                    <label>Tell Us More About Your Event</label>
                    <textarea
                      name="message"
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Share any details about your vision, congregation size, venue, or specific needs..."
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ padding: "0.875rem", width: "100%" }}>
                    Submit Booking Inquiry
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

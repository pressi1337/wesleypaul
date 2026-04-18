"use client";

import { useState } from "react";
import { MapPin, Mail, Phone, Clock, CheckCircle } from "lucide-react";
import { FacebookIcon, YoutubeIcon, InstagramIcon, TwitterXIcon } from "@/components/SocialIcons";

export interface ContactContent {
  address?: string;
  office_address?: string;
  email?: string;
  phone?: string;
  hours?: string;
  facebook_url?: string;
  youtube_url?: string;
  instagram_url?: string;
  twitter_url?: string;
}

export default function ContactFormClient({ content = {} }: { content?: ContactContent }) {
  const {
    address = "P.O. Box 88, Springfield, KY 40069",
    office_address = "Rosemead, CA 91770",
    email = "info@wesleypaul.org",
    phone = "+1 (859) 806-6424",
    hours = "Monday – Friday, 9:00 AM – 6:00 PM EST",
    facebook_url = "https://www.facebook.com/wesleypaul.org/",
    youtube_url = "https://www.youtube.com/@WesleyPaulInternationalMinistries",
    instagram_url = "https://www.instagram.com/wesleypaul511/",
    twitter_url = "https://twitter.com/wesleypaul511",
  } = content;

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
    <section style={{ padding: "80px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "3rem" }}>
          {/* Contact Info */}
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2070B8", marginBottom: 24 }}>Contact Information</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                  <MapPin size={18} style={{ color: "#fff" }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "#2070B8", marginBottom: 4 }}>Mailing Address</p>
                  <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.7 }}>{address}</p>
                </div>
              </div>
              {office_address && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                    <MapPin size={18} style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: "#2070B8", marginBottom: 4 }}>Office Location</p>
                    <p style={{ color: "#6c757d", fontSize: 14 }}>{office_address}</p>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                  <Mail size={18} style={{ color: "#fff" }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "#2070B8", marginBottom: 4 }}>Email</p>
                  <a href={`mailto:${email}`} style={{ fontSize: 14, fontWeight: 600, color: "#C0185A", textDecoration: "none" }}>{email}</a>
                </div>
              </div>
              {phone && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                    <Phone size={18} style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: "#2070B8", marginBottom: 4 }}>Phone</p>
                    <a href={`tel:${phone}`} style={{ fontSize: 14, fontWeight: 600, color: "#C0185A", textDecoration: "none" }}>{phone}</a>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                  <Clock size={18} style={{ color: "#fff" }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: "#2070B8", marginBottom: 4 }}>Office Hours</p>
                  <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.7 }}>{hours}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 13, color: "#2070B8", marginBottom: 16 }}>Follow Us</h3>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { icon: FacebookIcon, href: facebook_url, label: "Facebook" },
                  { icon: YoutubeIcon, href: youtube_url, label: "YouTube" },
                  { icon: InstagramIcon, href: instagram_url, label: "Instagram" },
                  { icon: TwitterXIcon, href: twitter_url, label: "Twitter" },
                ].map(({ icon: Icon, href, label }) => href ? (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                    style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#2070B8", color: "#fff", textDecoration: "none" }}>
                    <Icon size={16} />
                  </a>
                ) : null)}
              </div>
            </div>
          </div>

          {/* Form */}
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2070B8", marginBottom: 24 }}>Send Us a Message</h2>
            {submitted ? (
              <div style={{ borderRadius: 12, padding: 48, textAlign: "center", backgroundColor: "#f8f9fa" }}>
                <CheckCircle size={56} style={{ color: "#C0185A", margin: "0 auto 16px" }} />
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2070B8", marginBottom: 12 }}>Message Received!</h3>
                <p style={{ color: "#6c757d" }}>Thank you for reaching out. A member of our team will be in touch within 3–5 business days.</p>
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
                <div>
                  <label>Subject <span style={{ color: "#C0185A" }}>*</span></label>
                  <select name="subject" required value={form.subject} onChange={handleChange}>
                    <option value="">Select a subject...</option>
                    <option>Booking / Event Inquiry</option>
                    <option>Partnership / Support</option>
                    <option>Donation Question</option>
                    <option>Prayer Request</option>
                    <option>Media / Press Inquiry</option>
                    <option>General Question</option>
                  </select>
                </div>
                <div>
                  <label>Message <span style={{ color: "#C0185A" }}>*</span></label>
                  <textarea name="message" rows={6} required value={form.message} onChange={handleChange} placeholder="How can we help you?" />
                </div>
                {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: "0.875rem 2rem", alignSelf: "flex-start", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

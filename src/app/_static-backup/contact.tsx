"use client";

import { useState } from "react";
import { MapPin, Mail, Clock, CheckCircle } from "lucide-react";
import { FacebookIcon, YoutubeIcon, InstagramIcon, TwitterXIcon } from "@/components/SocialIcons";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
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
            Get in Touch
          </p>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 16 }}>Contact Us</h1>
          <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
          <p style={{ marginTop: 24, fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", maxWidth: 560, margin: "24px auto 0" }}>
            We would love to hear from you. Whether you have a question, want to partner, or need
            prayer — reach out and our team will respond promptly.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "3rem" }}>
            {/* Contact Info */}
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2070B8", marginBottom: 24 }}>
                Contact Information
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                    <MapPin size={18} style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: "#2070B8", marginBottom: 4 }}>Mailing Address</p>
                    <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.7 }}>
                      P.O. Box 88<br />
                      Springfield, KY 40069
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                    <MapPin size={18} style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: "#2070B8", marginBottom: 4 }}>Office Location</p>
                    <p style={{ color: "#6c757d", fontSize: 14 }}>Rosemead, CA 91770</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                    <Mail size={18} style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: "#2070B8", marginBottom: 4 }}>Email</p>
                    <a
                      href="mailto:info@wesleypaul.org"
                      style={{ fontSize: 14, fontWeight: 600, color: "#C0185A", textDecoration: "none" }}
                    >
                      info@wesleypaul.org
                    </a>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                    <Clock size={18} style={{ color: "#fff" }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 13, color: "#2070B8", marginBottom: 4 }}>Office Hours</p>
                    <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.7 }}>
                      Monday – Friday<br />
                      9:00 AM – 6:00 PM EST
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 13, color: "#2070B8", marginBottom: 16 }}>Follow Us</h3>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { icon: FacebookIcon, href: "https://www.facebook.com/wesleypaul.org/", label: "Facebook" },
                    { icon: YoutubeIcon, href: "https://www.youtube.com/@WesleyPaulInternationalMinistries", label: "YouTube" },
                    { icon: InstagramIcon, href: "https://www.instagram.com/wesleypaul511/", label: "Instagram" },
                    { icon: TwitterXIcon, href: "https://twitter.com/wesleypaul511", label: "Twitter" },
                  ].map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#2070B8",
                        color: "#fff",
                        textDecoration: "none",
                      }}
                    >
                      <Icon size={16} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2070B8", marginBottom: 24 }}>
                Send Us a Message
              </h2>

              {submitted ? (
                <div style={{ borderRadius: 12, padding: 48, textAlign: "center", backgroundColor: "#f8f9fa" }}>
                  <CheckCircle size={56} style={{ color: "#C0185A", margin: "0 auto 16px" }} />
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2070B8", marginBottom: 12 }}>
                    Message Received!
                  </h3>
                  <p style={{ color: "#6c757d" }}>
                    Thank you for reaching out. A member of our team will be in touch with you
                    within 3–5 business days.
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
                    <textarea
                      name="message"
                      rows={6}
                      required
                      value={form.message}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                    />
                  </div>

                  <button type="submit" className="btn-primary" style={{ padding: "0.875rem 2rem", alignSelf: "flex-start" }}>
                    Send Message
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

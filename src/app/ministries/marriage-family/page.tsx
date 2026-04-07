import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Shield, Users, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Marriage & Family Seminars",
  description:
    "Spirit-led seminars combining Biblical wisdom with therapeutic tools to strengthen marriages and families, led by Dr. Wesley and Debbie Paul.",
};

const topics = [
  "Building a marriage that lasts",
  "Communication and conflict resolution",
  "Intimacy — emotional, spiritual, and physical",
  "Parenting with purpose and grace",
  "Healing from past wounds and trauma",
  "Creating a God-centered family culture",
  "Understanding and fulfilling your spouse&apos;s needs",
  "Rebuilding trust after betrayal",
];

const pillars = [
  { icon: BookOpen, title: "Biblical Foundation", desc: "Every principle is rooted in the timeless wisdom of God's Word — the ultimate guide to love and family." },
  { icon: Heart, title: "Therapeutic Tools", desc: "Drawing from Dr. Wesley's training as a licensed marriage and family therapist for practical, research-backed tools." },
  { icon: Shield, title: "Safe Environment", desc: "A non-judgmental space where couples can be honest about their struggles and find hope." },
  { icon: Users, title: "Community Support", desc: "Couples encourage one another, knowing they are not alone in their journey." },
];

export default function MarriageFamilyPage() {
  return (
    <>
      <section
        style={{
          padding: "80px 24px",
          background: "linear-gradient(135deg, #0a1523 0%, #2070B8 100%)",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", color: "#fff" }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, color: "#f5a623" }}>
            Ministry Programs
          </p>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 16 }}>Marriage &amp; Family Seminars</h1>
          <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
          <p style={{ marginTop: 24, fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", maxWidth: 560, margin: "24px auto 0" }}>
            Spirit-led seminars that blend Biblical wisdom with therapeutic insight to strengthen
            marriages and restore families.
          </p>
        </div>
      </section>

      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: "3.5rem", alignItems: "center", marginBottom: 80 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, color: "#C0185A" }}>
                About the Seminar
              </p>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#2070B8", marginBottom: 20 }}>
                Strengthening the Foundation of the Family
              </h2>
              <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, marginBottom: 24 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, color: "#6c757d", lineHeight: 1.8 }}>
                <p>
                  Led by Dr. Wesley Paul and his wife Debbie, the Marriage and Family Seminar is a
                  unique ministry that blends spiritual wisdom with practical, therapeutic tools to
                  help couples and families thrive.
                </p>
                <p>
                  Dr. Wesley brings a rare combination of pastoral depth and clinical expertise —
                  holding a Master&apos;s degree in Marriage and Family Therapy and training as a
                  psychotherapist. This allows the seminars to address not just the spiritual
                  dimensions of marriage, but also the emotional, psychological, and relational ones.
                </p>
                <p>
                  Debbie Paul brings warmth, authenticity, and pastoral care to every session.
                  Together, they model the very principles they teach — offering couples a living
                  example of a God-centered marriage.
                </p>
              </div>
            </div>
            <div style={{ borderRadius: 16, padding: 40, color: "#fff", backgroundColor: "#2070B8" }}>
              <Heart size={48} style={{ marginBottom: 20, opacity: 0.9, color: "#f5a623" }} />
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 16 }}>Topics Covered</h3>
              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topics.map((t) => (
                  <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
                    <span style={{ color: "#f87171", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#2070B8" }}>The Four Pillars of Our Approach</h2>
            <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "16px auto 0" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: "1.75rem", marginBottom: 64 }}>
            {pillars.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card" style={{ padding: 32, display: "flex", gap: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                  <Icon size={22} style={{ color: "#fff" }} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: "#2070B8", marginBottom: 8 }}>{title}</h3>
                  <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Formats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: "2rem" }}>
            {[
              {
                title: "One-Day Intensive",
                desc: "A full-day seminar experience covering core marriage and family principles in a concentrated format. Ideal for busy couples or as a church-wide event.",
              },
              {
                title: "Weekend Retreat",
                desc: "A Friday evening through Sunday afternoon experience allowing for deeper engagement, reflection, and renewal. Includes structured teaching, Q&A, and couple activities.",
              },
            ].map(({ title, desc }) => (
              <div key={title} className="card" style={{ padding: 32, borderTop: "4px solid #C0185A" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2070B8", marginBottom: 12 }}>{title}</h3>
                <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.8 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "64px 24px", textAlign: "center", backgroundColor: "#2070B8" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Host a Marriage Seminar at Your Church
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 32, lineHeight: 1.8 }}>
            Invest in the marriages and families of your congregation. Contact us today to discuss
            hosting a seminar in your church or community.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
            <Link href="/book" className="btn-primary">Book an Event</Link>
            <Link href="/contact" className="btn-secondary">Contact Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}

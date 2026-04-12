import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Heart, BookOpen, Users, Target, Eye } from "lucide-react";

export const metadata: Metadata = {
  title: "Who We Are",
  description:
    "Learn about Wesley Paul International Ministries — our mission, vision, beliefs, and global impact for the Kingdom of God.",
};

const values = [
  {
    icon: Globe,
    title: "Global Reach",
    desc: "We believe every person on earth deserves to hear the Gospel of Jesus Christ. We are committed to reaching the unreached across all nations.",
  },
  {
    icon: Heart,
    title: "Family Foundation",
    desc: "Strong families build strong communities. We invest in marriages and families as foundational pillars of a healthy society and church.",
  },
  {
    icon: BookOpen,
    title: "Biblical Truth",
    desc: "All our ministry is grounded firmly in the authority and sufficiency of Scripture. God's Word is our guide in every area of life and ministry.",
  },
  {
    icon: Users,
    title: "Church Partnership",
    desc: "We work alongside local churches — not in place of them. Every crusade, revival, and seminar is designed to strengthen the local body.",
  },
];

export default function WhoWeArePage() {
  return (
    <>
      {/* Page Header */}
      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "96px 24px",
          minHeight: 280,
          background: `linear-gradient(rgba(13,27,46,0.8), rgba(13,27,46,0.85)), url(/images/bg_3.jpg) center/cover no-repeat`,
        }}
      >
        <div style={{ color: "#fff" }}>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 12 }}>Who We Are</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Home</Link>
            {" "}&rsaquo;{" "}
            <span>About</span>
            {" "}&rsaquo;{" "}
            <span style={{ color: "#C0185A" }}>Who We Are</span>
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section style={{ padding: "80px 24px", backgroundColor: "#f8f9fa" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="section-label">About WPIM</span>
            <h2 className="section-title" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)" }}>
              Proclaiming Christ. Strengthening Families. Reviving the Church.
            </h2>
            <div className="section-divider" />
            <p style={{ color: "#6c757d", maxWidth: 720, margin: "0 auto", lineHeight: 1.8 }}>
              Wesley Paul International Ministries is a global evangelistic ministry committed to proclaiming
              the life-transforming message of Jesus Christ and strengthening the foundation of marriages and
              families across the world.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "2rem" }}>
            <div
              style={{
                padding: 40,
                borderRadius: 8,
                backgroundColor: "#fff",
                borderTop: "4px solid #2070B8",
                boxShadow: "0 2px 15px rgba(0,0,0,0.07)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#2070B8", flexShrink: 0 }}>
                  <Target size={18} style={{ color: "#fff" }} />
                </div>
                <span className="section-label" style={{ marginBottom: 0, color: "#2070B8" }}>Our Mission</span>
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2070B8", marginBottom: 16 }}>Evangelizing. Reviving. Restoring.</h3>
              <div className="section-divider-left" />
              <p style={{ color: "#6c757d", lineHeight: 1.8, marginBottom: 16 }}>
                We want to help you reach those far from God — <strong>evangelize</strong>. Inspire your people
                to walk closer to God — experience <strong>revival</strong>.
              </p>
              <p style={{ color: "#6c757d", lineHeight: 1.8 }}>
                We partner with local churches, denominations, and Christian organizations to conduct Gospel
                Festivals, revival meetings, marriage seminars, evangelism training, and youth outreach events
                around the globe.
              </p>
            </div>
            <div
              style={{
                padding: 40,
                borderRadius: 8,
                backgroundColor: "#fff",
                borderTop: "4px solid #C0185A",
                boxShadow: "0 2px 15px rgba(0,0,0,0.07)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#C0185A", flexShrink: 0 }}>
                  <Eye size={18} style={{ color: "#fff" }} />
                </div>
                <span className="section-label" style={{ marginBottom: 0 }}>Our Vision</span>
              </div>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#2070B8", marginBottom: 16 }}>A World Transformed by the Gospel</h3>
              <div className="section-divider-left" />
              <p style={{ color: "#6c757d", lineHeight: 1.8, marginBottom: 16 }}>
                We envision communities, families, and individuals across every nation experiencing the
                transforming power of Jesus Christ — saved, healed, and walking in wholeness.
              </p>
              <p style={{ color: "#6c757d", lineHeight: 1.8 }}>
                Our vision drives every event, every seminar, and every partnership — because we believe that
                with God, no community is beyond the reach of the Gospel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="section-label">What Drives Us</span>
            <h2 className="section-title" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)" }}>Our Core Values</h2>
            <div className="section-divider" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "2rem" }}>
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover" style={{ display: "flex", gap: 24, padding: 32 }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                  <Icon size={24} style={{ color: "#fff" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#2070B8", marginBottom: 8 }}>{title}</h3>
                  <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.8 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statement of Faith */}
      <section style={{ padding: "80px 24px", backgroundColor: "#f8f9fa" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span className="section-label">What We Believe</span>
            <h2 className="section-title" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)" }}>Our Statement of Faith</h2>
            <div className="section-divider" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { title: "The Bible", text: "The inspired, inerrant, and authoritative Word of God — the complete revelation of God's will for salvation and the ultimate guide for Christian living." },
              { title: "God", text: "One eternal God who exists in three persons: Father, Son, and Holy Spirit — equal in nature, distinct in relationship, and unified in purpose." },
              { title: "Jesus Christ", text: "The deity of Jesus Christ, His virgin birth, His sinless life, His atoning death, His bodily resurrection, and His coming again in power and glory." },
              { title: "Salvation", text: "Salvation is by grace through faith in Jesus Christ alone. Repentance from sin and trust in Christ as Savior and Lord is the only way to eternal life." },
              { title: "The Holy Spirit", text: "The present ministry of the Holy Spirit who indwells, seals, and empowers believers for holy living and fruitful service." },
              { title: "The Church", text: "The local church is God's primary instrument for evangelism, discipleship, and worship. We are committed to serving the Church in all our ministry." },
            ].map(({ title, text }) => (
              <div key={title} style={{ display: "flex", gap: 16, padding: 24, borderRadius: 8, backgroundColor: "#fff", borderLeft: "4px solid #C0185A", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: "#2070B8", marginBottom: 6 }}>{title}</h3>
                  <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.8 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "80px 24px",
          textAlign: "center",
          background: `linear-gradient(rgba(13,27,46,0.9), rgba(13,27,46,0.92)), url(/images/bg_1.jpg) center/cover no-repeat`,
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>Ready to Partner With Us?</h2>
          <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: 32 }}>Whether you want to host an event, give, or simply connect — we would love to hear from you.</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
            <Link href="/contact" className="btn-primary">Get in Touch</Link>
            <Link href="/give" className="btn-outline">Support the Ministry</Link>
          </div>
        </div>
      </section>
    </>
  );
}

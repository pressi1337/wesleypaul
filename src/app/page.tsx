import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import HeroCarousel from "@/components/HeroCarousel";
import StatsBar from "@/components/StatsBar";
import SafeImage from "@/components/SafeImage";
import EndorsementsSection from "@/components/EndorsementsSection";

export const metadata: Metadata = {
  title: "Home | Wesley Paul International Ministries",
  description:
    "Surrendered Lives, Eternal Purpose. From villages to cities, lives are being transformed through the power of the Gospel.",
};

const ministries = [
  {
    image: "/images/event-1.jpg",
    category: "Evangelism",
    title: "Gospel Festivals",
    excerpt:
      "Large-scale evangelistic crusades mobilizing entire cities through local church partnerships, worship, and powerful Gospel preaching.",
    href: "/ministries/gospel-festivals",
  },
  {
    image: "/images/event-2.jpg",
    category: "Revival",
    title: "Renewals & Revivals",
    excerpt:
      "Weekend and multi-day revival gatherings igniting fresh passion and bringing spiritual transformation to local congregations.",
    href: "/ministries/renewals-revivals",
  },
  {
    image: "/images/event-3.jpg",
    category: "Family",
    title: "Marriage & Family Seminars",
    excerpt:
      "Spirit-led seminars combining Biblical wisdom and therapeutic tools — led by Dr. Wesley and Debbie Paul — to strengthen families.",
    href: "/ministries/marriage-family",
  },
  {
    image: "/images/sermon-1.jpg",
    category: "Training",
    title: "Evangelism Seminars",
    excerpt:
      "Equipping believers to understand and communicate the Gospel clearly and confidently in their everyday relationships.",
    href: "/ministries/evangelism",
  },
  {
    image: "/images/sermon-2.jpg",
    category: "Youth",
    title: "Youth Outreach",
    excerpt:
      "Dynamic speaking sessions for schools, colleges and universities — engaging today's youth with Biblical truth and purpose.",
    href: "/ministries/youth-outreach",
  },
  {
    image: "/images/sermon-3.jpg",
    category: "Training",
    title: "Evangelism Training",
    excerpt:
      "Pre-festival intensive training workshops that prepare church members to lead their friends and community to Christ.",
    href: "/ministries/evangelism",
  },
];


const gallery = [
  "/images/image_11.jpeg",
  "/images/image_13.jpeg",
  "/images/image_16.jpeg",
  "/images/image_17.jpeg",
];

export default function HomePage() {
  return (
    <>
      {/* ── HERO CAROUSEL ────────────────────────────── */}
      <HeroCarousel />

      {/* ── STATS BAR (cfan-style) ───────────────────── */}
      <StatsBar />

      {/* ── 3 PILLARS ─────────────────────────────────── */}
      <section style={{ backgroundColor: "#fff", padding: "64px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              border: "1px solid #e9ecef",
            }}
          >
            {[
              {
                icon: "🙏",
                title: "Worship",
                desc: "Christ-centered worship and Gospel preaching that draws people into the presence of God.",
              },
              {
                icon: "🤝",
                title: "Connect",
                desc: "Bringing people together in faith and purpose through strategic church partnerships worldwide.",
              },
              {
                icon: "❤️",
                title: "God's Love",
                desc: "Sharing the love of Jesus and strengthening families through the Word of God and prayer.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                style={{
                  padding: "40px",
                  textAlign: "center",
                  borderRight: i < 2 ? "1px solid #e9ecef" : "none",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>{item.icon}</div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "12px", color: "#2070B8" }}>
                  {item.title}
                </h3>
                <div className="section-divider" />
                <p style={{ fontSize: "14px", color: "#6c757d", lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WELCOME / ABOUT ───────────────────────────── */}
      <section style={{ backgroundColor: "#f8f9fa" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 500px), 1fr))",
            }}
          >
            {/* Image column */}
            <div style={{ position: "relative", minHeight: "420px", backgroundColor: "#1a2a3a" }}>
              <SafeImage
                src="/images/image_16.jpeg"
                alt=""
                fill
                style={{ objectFit: "cover" }}
                fallbackLabel="Wesley Paul Ministry"
                fallbackBg="linear-gradient(135deg, #0d1b2e 0%, #2070B8 100%)"
              />
            </div>
            {/* Text column */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "64px 48px",
              }}
            >
              <div>
                <span className="section-label">Welcome</span>
                <h2 className="section-title" style={{ fontSize: "1.875rem", marginBottom: "16px" }}>
                  Proclaiming Christ &amp;<br />Strengthening Families
                </h2>
                <div className="section-divider-left" />
                <p style={{ color: "#6c757d", lineHeight: 1.7, marginBottom: "16px" }}>
                  Wesley Paul International Ministries is a global evangelistic ministry committed to proclaiming
                  the life-transforming message of Jesus Christ and strengthening the foundation of marriages
                  and families across the world.
                </p>
                <p style={{ color: "#6c757d", lineHeight: 1.7, marginBottom: "24px" }}>
                  We partner with local churches to conduct Gospel Festivals, revival meetings, marriage and
                  family seminars, and evangelism training across more than 30 nations. Dr. Wesley and Debbie
                  Paul bring a unique blend of spiritual depth and practical wisdom to every ministry setting.
                </p>
                <Link
                  href="/meet-wesley"
                  className="btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  Know More <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── IMPACT COUNTER ───────────────────────────── */}
      <section style={{ backgroundColor: "#2070B8", padding: "64px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "32px",
              textAlign: "center",
            }}
          >
            {[
              { value: "30+", label: "Nations Served" },
              { value: "20+", label: "Years of Ministry" },
              { value: "1000s", label: "Lives Changed" },
              { value: "100s", label: "Churches Partnered" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: "3rem", fontWeight: 800, color: "#f5a623", lineHeight: 1, marginBottom: "8px" }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MINISTRY PROGRAMS ─────────────────────────── */}
      <section style={{ backgroundColor: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label">What We Do</span>
            <h2 className="section-title" style={{ fontSize: "2rem" }}>Our Ministry Programs</h2>
            <div className="section-divider" />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "32px",
            }}
          >
            {ministries.map((m) => (
              <Link key={m.title} href={m.href} className="card-hover" style={{ display: "block", textDecoration: "none" }}>
                {/* Image */}
                <div style={{ position: "relative", height: "208px", overflow: "hidden", backgroundColor: "#1a2a3a" }}>
                  <SafeImage
                    src={m.image}
                    alt=""
                    fill
                    style={{ objectFit: "cover" }}
                    fallbackLabel={m.category}
                    fallbackBg="linear-gradient(135deg, #0d1b2e 0%, #1a2a3a 100%)"
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      left: "16px",
                      padding: "4px 10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "#fff",
                      backgroundColor: "#C0185A",
                      borderRadius: "3px",
                    }}
                  >
                    {m.category}
                  </div>
                </div>
                {/* Content */}
                <div style={{ padding: "24px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px", color: "#2070B8" }}>
                    {m.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#6c757d", lineHeight: 1.7, marginBottom: "16px" }}>{m.excerpt}</p>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "#C0185A" }}>
                    Read More <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERMONS / WATCH ──────────────────────────── */}
      <section style={{ backgroundColor: "#f8f9fa", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-label">Media</span>
            <h2 className="section-title" style={{ fontSize: "2rem" }}>Watch and Listen to Dr. Wesley</h2>
            <div className="section-divider" />
            <p style={{ color: "#6c757d", maxWidth: "480px", margin: "16px auto 0" }}>
              Subscribe to our YouTube channel for sermons, crusade highlights, and ministry updates from Dr. Wesley Paul.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "32px",
              marginBottom: "40px",
            }}
          >
            {[
              { image: "/images/sermon-1.jpg", title: "God Wants To Do A New Thing In Your Life", date: "Jan 13, 2024", href: "https://www.youtube.com/@DrWesleyPaul" },
              { image: "/images/sermon-2.jpg", title: "The Power of the Gospel to Save Every Soul", date: "Feb 4, 2024", href: "https://www.youtube.com/@DrWesleyPaul" },
              { image: "/images/sermon-3.jpg", title: "Reviving the Church for the Great Commission", date: "Mar 18, 2024", href: "https://www.youtube.com/@DrWesleyPaul" },
            ].map((s) => (
              <a key={s.title} href={s.href} target="_blank" rel="noopener noreferrer" className="card-hover" style={{ display: "block", textDecoration: "none" }}>
                <div style={{ position: "relative", height: "192px", overflow: "hidden", backgroundColor: "#1a2a3a" }}>
                  <SafeImage src={s.image} alt="" fill style={{ objectFit: "cover" }} fallbackBg="linear-gradient(135deg, #0d1b2e 0%, #1a2a3a 100%)" />
                  {/* Play overlay */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.35)" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#C0185A" }}>
                      <Play size={22} fill="white" color="white" style={{ marginLeft: "3px" }} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: "20px" }}>
                  <p style={{ fontSize: "12px", color: "#adb5bd", marginBottom: "8px" }}>{s.date}</p>
                  <h4 style={{ fontWeight: 700, fontSize: "14px", lineHeight: 1.4, color: "#2070B8" }}>{s.title}</h4>
                </div>
              </a>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <a
              href="https://www.youtube.com/@DrWesleyPaul"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <Play size={16} /> Watch on YouTube
            </a>
          </div>
        </div>
      </section>

      {/* ── ENDORSEMENTS ─────────────────────────────── */}
      <EndorsementsSection />

      {/* ── GALLERY ──────────────────────────────────── */}
      <section style={{ backgroundColor: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="section-label">Gallery</span>
            <h2 className="section-title" style={{ fontSize: "2rem" }}>Ministry in Action</h2>
            <div className="section-divider" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
            {gallery.map((src, i) => (
              <div
                key={i}
                style={{
                  position: "relative",
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                  borderRadius: "4px",
                  backgroundColor: "#1a2a3a",
                }}
              >
                <SafeImage
                  src={src}
                  alt=""
                  fill
                  style={{ objectFit: "cover" }}
                  fallbackBg={`linear-gradient(135deg, #0d1b2e ${i * 10}%, #2070B8 100%)`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GIVE CTA ─────────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px",
          textAlign: "center",
          background: "linear-gradient(rgba(13,27,46,0.9), rgba(13,27,46,0.95)), #0d1b2e",
        }}
      >
        <div style={{ maxWidth: "768px", margin: "0 auto" }}>
          <span className="section-label" style={{ color: "#f5a623" }}>Partner With Us</span>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "20px", marginTop: "8px" }}>
            Reaching Nations. Restoring Homes. Reviving Hearts.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: "40px", lineHeight: 1.7, fontSize: "1.1rem" }}>
            Your generous support enables us to carry the Gospel to unreached communities, revive
            churches, and strengthen families across the world. Every gift makes an eternal difference.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
            <Link href="/give" className="btn-primary">Give / Donate</Link>
            <Link href="/book" className="btn-outline">Book Dr. Wesley</Link>
          </div>
        </div>
      </section>
    </>
  );
}

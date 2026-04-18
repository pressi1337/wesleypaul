import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Heart, BookOpen, Music } from "lucide-react";

export const metadata: Metadata = {
  title: "Renewals & Revivals",
  description:
    "Weekend and multi-day revival meetings designed to bring fresh spiritual fire, deep worship, and transformation to local churches.",
};

const elements = [
  { icon: Music, title: "Passionate Worship", desc: "Worship that opens hearts and creates space for a genuine encounter with God." },
  { icon: BookOpen, title: "Deep Biblical Teaching", desc: "Expository preaching that convicts, encourages, and calls the church to action." },
  { icon: Heart, title: "Personal Ministry", desc: "Opportunities for prayer, healing, and personal encounter at the altar." },
  { icon: Flame, title: "Holy Spirit Movement", desc: "An atmosphere expectant for the fresh outpouring of God's Holy Spirit." },
];

export default function RenewalsRevivalsPage() {
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
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 16 }}>Renewals &amp; Revivals</h1>
          <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
          <p style={{ marginTop: 24, fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", maxWidth: 560, margin: "24px auto 0" }}>
            Weekend events and extended revival series that ignite fresh passion and bring spiritual
            transformation to local congregations.
          </p>
        </div>
      </section>

      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: "3.5rem", alignItems: "center", marginBottom: 80 }}>
            <div style={{ borderRadius: 16, padding: 48, textAlign: "center", color: "#fff", backgroundColor: "#C0185A" }}>
              <Flame size={64} style={{ margin: "0 auto 24px", opacity: 0.9 }} />
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>Fresh Fire for the Church</h3>
              <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>
                Every church needs regular seasons of renewal — times when the people of God are
                stirred afresh, refocused on Jesus, and empowered by His Spirit for mission.
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, color: "#C0185A" }}>
                About This Ministry
              </p>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#2070B8", marginBottom: 20 }}>
                Reviving the Local Church
              </h2>
              <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, marginBottom: 24 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, color: "#6c757d", lineHeight: 1.8 }}>
                <p>
                  Renewal and revival meetings are designed to bring a fresh outpouring of the Holy
                  Spirit to local congregations. These are not merely emotional events — they are
                  carefully crafted encounters with the living God through worship, the Word, and
                  prayer.
                </p>
                <p>
                  Dr. Wesley Paul brings a unique combination of evangelistic fire and pastoral
                  depth to revival meetings. His preaching is rooted in Scripture, sensitive to the
                  Spirit, and consistently calls people into deeper relationship with Jesus Christ.
                </p>
                <p>
                  Revival meetings are available in weekend formats (Friday–Sunday) or as extended
                  series running multiple evenings throughout the week. Each event is tailored to the
                  specific context and needs of the host church.
                </p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#2070B8" }}>
              Elements of a Revival Meeting
            </h2>
            <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "16px auto 0" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: "1.75rem", marginBottom: 64 }}>
            {elements.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card" style={{ padding: 28, display: "flex", gap: 20, alignItems: "flex-start" }}>
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
                title: "Weekend Revival",
                desc: "A focused Friday–Sunday series featuring multiple sessions of worship, preaching, and ministry. Ideal for churches looking to create an intensive season of renewal.",
                details: ["Friday evening kickoff", "Saturday morning and evening sessions", "Sunday morning culmination service"],
              },
              {
                title: "Extended Revival Series",
                desc: "Multiple consecutive evenings of revival meetings spread over a week or more. Ideal for churches seeking a deeper, more sustained move of God.",
                details: ["4–7 consecutive evening sessions", "Growing momentum through the week", "Community-wide invitation and outreach"],
              },
            ].map(({ title, desc, details }) => (
              <div key={title} className="card" style={{ padding: 32 }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2070B8", marginBottom: 12 }}>{title}</h3>
                <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>{desc}</p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {details.map((d) => (
                    <li key={d} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "#4a4e69" }}>
                      <span style={{ color: "#C0185A", fontWeight: 700, marginTop: 1 }}>›</span> {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "64px 24px", textAlign: "center", backgroundColor: "#2070B8" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Invite Revival to Your Church
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 32, lineHeight: 1.8 }}>
            Is your church in need of spiritual renewal? We would love to partner with you for a
            revival or renewal event.
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

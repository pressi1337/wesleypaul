import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Users, Music, BookOpen, Heart, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Gospel Festivals",
  description:
    "Large-scale evangelistic crusades reaching entire communities with the message of Jesus Christ through worship, preaching, and altar calls.",
};

const features = [
  { icon: Users, title: "Community Mobilization", desc: "Partnering with local churches to mobilize volunteers and create citywide impact." },
  { icon: Music, title: "Worship & Praise", desc: "Powerful worship that creates an atmosphere of encounter with the living God." },
  { icon: BookOpen, title: "Gospel Preaching", desc: "Clear, compelling proclamation of the life-changing message of Jesus Christ." },
  { icon: Heart, title: "Altar Calls", desc: "Personal invitations for people to receive Jesus, be healed, or rededicate their lives." },
  { icon: Globe, title: "Follow-up Discipleship", desc: "Connecting new believers with local churches for ongoing discipleship and community." },
  { icon: ArrowRight, title: "Pre-event Training", desc: "Evangelism seminars prepare church members to lead friends and family to Christ." },
];

export default function GospelFestivalsPage() {
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
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 16 }}>Gospel Festivals</h1>
          <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
          <p style={{ marginTop: 24, fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", maxWidth: 560, margin: "24px auto 0" }}>
            Large-scale evangelistic events that bring churches together to reach entire
            communities with the transforming message of Jesus Christ.
          </p>
        </div>
      </section>

      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: "3.5rem", alignItems: "center", marginBottom: 80 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, color: "#C0185A" }}>
                What is a Gospel Festival?
              </p>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#2070B8", marginBottom: 20 }}>
                Reaching Cities for Christ
              </h2>
              <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, marginBottom: 24 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, color: "#6c757d", lineHeight: 1.8 }}>
                <p>
                  A Gospel Festival is a large-scale evangelistic crusade conducted through strategic
                  partnerships with local churches, denominations, and Christian organizations. These
                  events are designed to create a united, citywide platform for the proclamation of
                  the Gospel of Jesus Christ.
                </p>
                <p>
                  Unlike traditional church services, Gospel Festivals are intentionally designed to
                  be accessible and inviting to people who have never attended church or who have
                  drifted away from the faith. The atmosphere is welcoming, the worship is vibrant,
                  and the message is clear and compelling.
                </p>
                <p>
                  Dr. Wesley Paul has conducted Gospel Festivals across multiple continents, always
                  partnering deeply with local churches to ensure that the harvest is sustained
                  through discipleship, follow-up, and integration into the local body of Christ.
                </p>
              </div>
            </div>
            <div style={{ borderRadius: 16, padding: 48, textAlign: "center", color: "#fff", backgroundColor: "#2070B8" }}>
              <Globe size={64} style={{ margin: "0 auto 24px", opacity: 0.9 }} />
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>Global Impact</h3>
              <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>
                Gospel Festivals have been conducted across Africa, Asia, Europe, North America, and
                beyond — reaching thousands of people with the Good News of Jesus Christ.
              </p>
            </div>
          </div>

          {/* Features */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#2070B8" }}>What to Expect</h2>
            <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "16px auto 0" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "1.75rem" }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card" style={{ padding: 28, display: "flex", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                  <Icon size={20} style={{ color: "#fff" }} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 14, color: "#2070B8", marginBottom: 6 }}>{title}</h3>
                  <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "64px 24px", textAlign: "center", backgroundColor: "#2070B8" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Host a Gospel Festival in Your City
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 32, lineHeight: 1.8 }}>
            If you are a church leader or network of churches looking to conduct a Gospel Festival,
            we would love to partner with you. Contact us to begin the conversation.
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

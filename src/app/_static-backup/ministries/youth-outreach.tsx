import type { Metadata } from "next";
import Link from "next/link";
import { Users, Lightbulb, Star, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Youth Outreach",
  description:
    "Dynamic outreach sessions for high schools, colleges, and universities — engaging the next generation with Biblical truth and the message of Jesus Christ.",
};

const themes = [
  { icon: Star, title: "Identity & Purpose", desc: "Helping young people discover who they are and why they exist beyond social media narratives." },
  { icon: Heart, title: "Relationships & Love", desc: "A Biblical framework for healthy relationships, dating, and boundaries in a confusing world." },
  { icon: Lightbulb, title: "Faith & Doubt", desc: "Creating space for honest questions and providing grounded, thoughtful answers about Christianity." },
  { icon: Users, title: "Community & Belonging", desc: "Addressing loneliness, belonging, and the deep human need for authentic community." },
];

export default function YouthOutreachPage() {
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
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 16 }}>Youth Outreach</h1>
          <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
          <p style={{ marginTop: 24, fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", maxWidth: 560, margin: "24px auto 0" }}>
            Engaging the next generation with the truth of Jesus Christ through relevant,
            authentic, and compelling speaking sessions in schools and universities.
          </p>
        </div>
      </section>

      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: "3.5rem", alignItems: "center", marginBottom: 80 }}>
            <div style={{ borderRadius: 16, padding: 48, textAlign: "center", color: "#fff", backgroundColor: "#2070B8" }}>
              <Users size={64} style={{ margin: "0 auto 24px", opacity: 0.9 }} />
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>Reaching the Next Generation</h3>
              <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>
                Today&apos;s youth face unprecedented pressure, identity confusion, and spiritual
                emptiness. The Gospel of Jesus Christ offers the truth, hope, and purpose they are
                searching for.
              </p>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, color: "#C0185A" }}>
                About Youth Outreach
              </p>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#2070B8", marginBottom: 20 }}>
                Connecting Young People to Jesus
              </h2>
              <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, marginBottom: 24 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, color: "#6c757d", lineHeight: 1.8 }}>
                <p>
                  Dr. Wesley Paul has a heart for the next generation. His youth outreach sessions
                  are designed to engage students at high schools, colleges, and universities with
                  the message of Jesus Christ in a way that is culturally relevant, intellectually
                  honest, and personally compelling.
                </p>
                <p>
                  These are not traditional church services — they are dynamic, engaging
                  presentations that meet young people where they are, address the questions they
                  are actually asking, and invite them into a relationship with Jesus.
                </p>
                <p>
                  Sessions can be integrated into existing school assemblies, university events,
                  youth group meetings, or special outreach events organized by local churches and
                  campus ministries.
                </p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#2070B8" }}>Key Themes Addressed</h2>
            <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "16px auto 0" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: "1.75rem", marginBottom: 64 }}>
            {themes.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card" style={{ padding: 32, display: "flex", gap: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#C0185A" }}>
                  <Icon size={22} style={{ color: "#fff" }} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: "#2070B8", marginBottom: 8 }}>{title}</h3>
                  <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Venues */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#2070B8" }}>Where We Minister</h2>
            <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "12px auto 0" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))", gap: "1.5rem" }}>
            {[
              { title: "High Schools", desc: "Assembly sessions, classroom visits, and after-school programs for secondary school students." },
              { title: "Colleges & Universities", desc: "Chapel sessions, campus events, and outreach evenings for university students." },
              { title: "Church Youth Groups", desc: "Youth nights and weekend events for church-based youth ministries looking for a dynamic guest speaker." },
            ].map(({ title, desc }) => (
              <div
                key={title}
                style={{ textAlign: "center", padding: 32, borderRadius: 12, backgroundColor: "#f8f9fa" }}
              >
                <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#2070B8", marginBottom: 12 }}>{title}</h3>
                <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "64px 24px", textAlign: "center", backgroundColor: "#2070B8" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Book Dr. Wesley for Your School or Youth Event
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 32, lineHeight: 1.8 }}>
            Invest in the next generation. Contact us to arrange a speaking session at your school,
            campus, or youth event.
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

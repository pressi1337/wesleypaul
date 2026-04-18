import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, MessageCircle, Target, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Evangelism Seminars",
  description:
    "Training seminars that equip churches and individuals to share the Gospel clearly and confidently in everyday life.",
};

const modules = [
  { icon: BookOpen, title: "The Core of the Gospel", desc: "Understanding the essential message of Jesus Christ and why it matters for every person." },
  { icon: MessageCircle, title: "Sharing Your Faith Naturally", desc: "Practical tools and conversational approaches to share the Gospel without fear or awkwardness." },
  { icon: Target, title: "Overcoming Objections", desc: "Thoughtful, respectful responses to common questions and objections people raise about Christianity." },
  { icon: Zap, title: "Building an Evangelistic Culture", desc: "How to cultivate a church culture where every member sees themselves as a witness for Christ." },
];

export default function EvangelismPage() {
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
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 16 }}>Evangelism Seminars</h1>
          <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
          <p style={{ marginTop: 24, fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", maxWidth: 560, margin: "24px auto 0" }}>
            Equipping believers to share their faith with clarity, confidence, and compassion.
          </p>
        </div>
      </section>

      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))", gap: "3.5rem", alignItems: "center", marginBottom: 80 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12, color: "#C0185A" }}>
                Why Evangelism Training?
              </p>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#2070B8", marginBottom: 20 }}>
                Equipping Every Believer to Reach the Lost
              </h2>
              <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, marginBottom: 24 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, color: "#6c757d", lineHeight: 1.8 }}>
                <p>
                  Many Christians genuinely want to share their faith but feel ill-equipped or
                  intimidated. Our Evangelism Seminars exist to change that — to take the fear out of
                  faith-sharing and replace it with confidence, compassion, and clarity.
                </p>
                <p>
                  These training sessions are often held in the days leading up to a major Gospel
                  Festival, preparing local church members to be effective witnesses before, during,
                  and after the event. However, they are also offered as stand-alone seminars for
                  churches wanting to build a culture of evangelism year-round.
                </p>
                <p>
                  Dr. Wesley brings decades of experience in personal evangelism and mass crusades
                  to these training sessions — offering both theological depth and practical,
                  field-tested tools.
                </p>
              </div>
            </div>
            <div style={{ borderRadius: 16, padding: 48, textAlign: "center", color: "#fff", backgroundColor: "#C0185A" }}>
              <BookOpen size={64} style={{ margin: "0 auto 24px", opacity: 0.9 }} />
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>Every Believer Is a Witness</h3>
              <p style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.8 }}>
                &ldquo;You will receive power when the Holy Spirit comes on you; and you will be my
                witnesses...&rdquo; — Acts 1:8
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#2070B8" }}>What the Training Covers</h2>
            <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "16px auto 0" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: "1.75rem" }}>
            {modules.map(({ icon: Icon, title, desc }) => (
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
        </div>
      </section>

      <section style={{ padding: "64px 24px", textAlign: "center", backgroundColor: "#2070B8" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>
            Book an Evangelism Seminar
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 32, lineHeight: 1.8 }}>
            Ready to equip your church for the harvest? Let us bring this training to your congregation.
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

import type { Metadata } from "next";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { BookOpen, Award, Globe, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Meet Dr. Wesley Paul",
  description:
    "Learn about Dr. Wesley Paul — evangelist, counselor, revivalist, and founder of Wesley Paul International Ministries.",
};

const credentials = [
  { degree: "Master of Divinity (MDiv)", institution: "New Orleans Baptist Theological Seminary" },
  { degree: "Master of Science in Marriage & Family Therapy", institution: "Campbellsville University" },
  { degree: "Doctor of Ministry (DMin) — Pastoral Care & Counseling", institution: "Lutheran School of Theology, Chicago" },
];

const highlights = [
  { icon: Globe, label: "30+ Nations Served", desc: "Over two decades of global gospel ministry" },
  { icon: Heart, label: "Marriage & Family Expert", desc: "Licensed therapist and seminar leader with wife Debbie" },
  { icon: Award, label: "Billy Graham Network", desc: "Member, Proclamation Evangelism Network (BGEA)" },
  { icon: BookOpen, label: "Mentored by Legacy", desc: "Mentored by Dr. Don Wilton, pastor to the late Dr. Billy Graham" },
];

export default function MeetWesleyPage() {
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
          background: `linear-gradient(rgba(13,27,46,0.8), rgba(13,27,46,0.85)), url(https://wesleypaul.org/assets/images/bg_3.jpg) center/cover no-repeat`,
        }}
      >
        <div style={{ color: "#fff" }}>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 12 }}>Meet Dr. Wesley Paul</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Home</Link>
            {" "}&rsaquo;{" "}
            <span>About</span>
            {" "}&rsaquo;{" "}
            <span style={{ color: "#C0185A" }}>Dr. Wesley Paul&apos;s Bio</span>
          </p>
        </div>
      </section>

      {/* Bio */}
      <section style={{ padding: "80px 24px", backgroundColor: "#f8f9fa" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "3rem" }}>
            {/* Sidebar */}
            <div style={{ maxWidth: 360 }}>
              <div style={{ borderRadius: 8, overflow: "hidden", marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
                <div style={{ position: "relative", height: 288, width: "100%" }}>
                  <SafeImage
                    src="https://wesleypaul.org/assets/images/image_16.jpeg"
                    alt=""
                    fill
                    style={{ objectFit: "cover", objectPosition: "top" }}
                    fallbackLabel="Dr. Wesley Paul"
                    fallbackBg="linear-gradient(180deg, #0a1523 0%, #2070B8 100%)"
                  />
                </div>
                <div style={{ padding: "20px 24px", textAlign: "center", backgroundColor: "#2070B8" }}>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>Dr. Wesley Paul</h3>
                  <p style={{ fontSize: 13, marginTop: 4, color: "#f5a623" }}>Founder &amp; President</p>
                  <p style={{ fontSize: 11, marginTop: 2, color: "rgba(255,255,255,0.65)" }}>Wesley Paul International Ministries</p>
                </div>
              </div>

              {/* Credentials */}
              <div style={{ backgroundColor: "#fff", borderRadius: 8, padding: 24, marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                <h4 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: "#2070B8" }}>Academic Credentials</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {credentials.map(({ degree, institution }) => (
                    <div key={degree} style={{ borderLeft: "2px solid #C0185A", paddingLeft: 12 }}>
                      <p style={{ fontWeight: 600, fontSize: 13, color: "#2070B8" }}>{degree}</p>
                      <p style={{ fontSize: 12, color: "#6c757d", marginTop: 2 }}>{institution}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Link href="/book" className="btn-primary" style={{ textAlign: "center" }}>Book Dr. Wesley</Link>
                <Link href="/contact" className="btn-outline-accent" style={{ textAlign: "center" }}>Contact the Ministry</Link>
              </div>
            </div>

            {/* Main Content */}
            <div style={{ backgroundColor: "#fff", borderRadius: 8, padding: "40px", boxShadow: "0 2px 15px rgba(0,0,0,0.07)" }}>
              <span className="section-label">Biography</span>
              <h2 className="section-title" style={{ fontSize: "1.8rem", marginBottom: 16 }}>A Life Devoted to the Gospel</h2>
              <div className="section-divider-left" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16, color: "#6c757d", lineHeight: 1.8 }}>
                <p>
                  Dr. Wesley Paul is the Founder and President of Wesley Paul International Ministries. Born in
                  India, he moved to Kentucky in 1984 and has spent over two decades serving as a passionate
                  preacher, counselor, and revivalist across more than 30 nations.
                </p>
                <p>
                  His journey into ministry was shaped by a deep encounter with the transforming power of Jesus
                  Christ — a power he has spent his life communicating to others. From large-scale Gospel
                  Festivals in open fields to intimate revival gatherings in local churches, Dr. Wesley brings the
                  same fire and sincerity to every setting.
                </p>
                <p>
                  Dr. Wesley holds a Master of Divinity from New Orleans Baptist Theological Seminary, a Master of
                  Science in Marriage and Family Therapy from Campbellsville University, and a Doctor of Ministry
                  in Pastoral Care and Counseling from the Lutheran School of Theology in Chicago. He is also
                  trained as a psychotherapist.
                </p>
                <p>
                  He has had the privilege of being mentored by Dr. Don Wilton, the long-time pastor to the late
                  Dr. Billy Graham, and by the late Dr. Lon Allison, former director of the Billy Graham Center at
                  Wheaton College. These relationships have profoundly shaped his approach to evangelism and
                  pastoral ministry.
                </p>
                <p>
                  Dr. Wesley is a member of the Proclamation Evangelism Network (PEN), hosted by the Billy Graham
                  Evangelistic Association — a community of evangelists committed to proclaiming the Gospel with
                  integrity and excellence.
                </p>
                <p>
                  He is married to <strong>Debbie Paul</strong>, his partner in life and ministry. Together, they
                  lead the Marriage and Family Seminar ministry, combining Dr. Wesley&apos;s theological depth with
                  Debbie&apos;s warmth and pastoral gift. They have two children, Ashley and Jonathan, and make their
                  home in Springfield, Kentucky.
                </p>
              </div>

              {/* Highlights */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "1.25rem", marginTop: 40 }}>
                {highlights.map(({ icon: Icon, label, desc }) => (
                  <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: 20, borderRadius: 8, backgroundColor: "#f8f9fa" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: "#2070B8" }}>
                      <Icon size={18} style={{ color: "#fff" }} />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 13, color: "#2070B8" }}>{label}</p>
                      <p style={{ fontSize: 12, color: "#6c757d", marginTop: 2, lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "80px 24px",
          textAlign: "center",
          background: `linear-gradient(rgba(13,27,46,0.9), rgba(13,27,46,0.92)), url(https://wesleypaul.org/assets/images/bg_1.jpg) center/cover no-repeat`,
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 700, color: "#fff", marginBottom: 16 }}>Invite Dr. Wesley to Your Church</h2>
          <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: 32, lineHeight: 1.8 }}>
            Whether for a Gospel Festival, revival, marriage seminar, or speaking engagement, Dr. Wesley brings
            a powerful and authentic ministry experience to every invitation.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
            <Link href="/book" className="btn-primary">Book an Event</Link>
            <Link href="/what-we-do" className="btn-outline">View Ministry Programs</Link>
          </div>
        </div>
      </section>
    </>
  );
}

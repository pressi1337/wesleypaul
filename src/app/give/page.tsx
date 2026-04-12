import type { Metadata } from "next";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { Globe, Church, Heart, Users, Shield, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Give / Donate",
  description:
    "Partner with Wesley Paul International Ministries through your generous financial support. Every gift carries the Gospel further.",
};

const impacts = [
  { icon: Globe, title: "Fund Gospel Events", desc: "Fund Gospel events in unreached areas" },
  { icon: Church, title: "Church Revival", desc: "Support church planting and revival initiatives" },
  { icon: Heart, title: "Family Counseling", desc: "Empower families through counseling and support programs" },
  { icon: Users, title: "Evangelism Training", desc: "Provide resources for evangelism training" },
];

export default function GivePage() {
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
          background: `linear-gradient(rgba(13,27,46,0.8), rgba(13,27,46,0.85)), url(/images/bg_1.jpg) center/cover no-repeat`,
        }}
      >
        <div style={{ color: "#fff" }}>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 12 }}>Give / Donate</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Home</Link>
            {" "}&rsaquo;{" "}
            <span style={{ color: "#C0185A" }}>Give / Donate</span>
          </p>
        </div>
      </section>

      {/* Main Give Section */}
      <section style={{ padding: "80px 24px", backgroundColor: "#f8f9fa" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: "3.5rem", alignItems: "start" }}>
            {/* Image */}
            <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", height: 540, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}>
              <SafeImage
                src="/images/donate_wesley.jpg"
                alt=""
                fill
                style={{ objectFit: "cover" }}
                fallbackLabel="Wesley Paul Ministry"
                fallbackBg="linear-gradient(135deg, #0a1523 0%, #2070B8 100%)"
              />
            </div>

            {/* Content */}
            <div style={{ backgroundColor: "#fff", borderRadius: 8, padding: 40, boxShadow: "0 2px 15px rgba(0,0,0,0.07)" }}>
              <span className="section-label">Give / Donate</span>
              <h2 className="section-title" style={{ fontSize: "1.8rem", marginBottom: 16 }}>Reaching Nations. Restoring Homes. Reviving Hearts.</h2>
              <div className="section-divider-left" />
              <p style={{ color: "#6c757d", lineHeight: 1.8, marginBottom: 24 }}>
                Your support helps us carry the Gospel to the ends of the earth, strengthen families, revive
                churches, and make the name of Jesus known in communities that need it most.
              </p>

              {/* Impact list */}
              <ul style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {impacts.map(({ icon: Icon, title, desc }) => (
                  <li key={title} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircle size={18} style={{ flexShrink: 0, color: "#C0185A" }} />
                    <span style={{ fontSize: 14, color: "#4a4e69" }}>{desc}</span>
                  </li>
                ))}
                <li style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <CheckCircle size={18} style={{ color: "#C0185A" }} />
                  <span style={{ fontSize: 14, color: "#4a4e69" }}>Assist in disaster relief and community development</span>
                </li>
              </ul>

              <p style={{ fontSize: 13, color: "#6c757d", marginBottom: 32, lineHeight: 1.8 }}>
                All donations are <strong>tax-deductible</strong> to the full extent allowed by law. We are committed
                to full transparency and accountability in the use of every gift.
              </p>

              {/* PayPal Donate */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <a
                  href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=364WE28H8TQAJ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.875rem 2rem", fontSize: "1rem" }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
                  </svg>
                  Donate Now via PayPal
                </a>
                <Link href="/contact" className="btn-outline-accent" style={{ textAlign: "center" }}>
                  Contact for Bank Transfer Details
                </Link>
              </div>

              <div style={{ marginTop: 32, padding: 20, borderRadius: 8, backgroundColor: "#f8f9fa" }}>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: "#2070B8" }}>Mailing a check?</p>
                <p style={{ color: "#6c757d", fontSize: 14, lineHeight: 1.8 }}>
                  Make payable to <strong>Wesley Paul International Ministries</strong><br />
                  P.O. Box 88, Springfield, KY 40069
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section style={{ padding: "56px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "2rem", textAlign: "center" }}>
            {[
              { icon: Shield, title: "Tax-Deductible", desc: "All donations are fully tax-deductible to the extent allowed by law." },
              { icon: CheckCircle, title: "Transparent", desc: "We are committed to full accountability and transparency in our finances." },
              { icon: Globe, title: "Global Impact", desc: "100% of designated gifts go directly to ministry operations worldwide." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover" style={{ padding: 32 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", backgroundColor: "#f8f9fa" }}>
                  <Icon size={24} style={{ color: "#C0185A" }} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: "#2070B8", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#6c757d", lineHeight: 1.8 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scripture */}
      <section style={{ padding: "56px 24px", textAlign: "center", backgroundColor: "#2070B8" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: "1.2rem", fontStyle: "italic", color: "rgba(255,255,255,0.85)", lineHeight: 1.8, marginBottom: 16 }}>
            &ldquo;Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.&rdquo;
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#f5a623" }}>2 Corinthians 9:7</p>
        </div>
      </section>

      <p style={{ textAlign: "center", fontSize: 14, color: "#6c757d", padding: "24px" }}>
        Together, we can bring hope and healing to those in need.{" "}
        <Link href="/contact" style={{ color: "#C0185A" }}>Contact us</Link> for any questions.
      </p>
    </>
  );
}

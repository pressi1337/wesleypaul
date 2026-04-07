import type { Metadata } from "next";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { Play } from "lucide-react";

export const metadata: Metadata = {
  title: "Sermons",
  description: "Watch and listen to sermons and messages from Dr. Wesley Paul.",
};

const sermons = [
  { image: "https://wesleypaul.org/assets/images/sermon-1.jpg", title: "God Wants To Do A New Thing In Your Life", date: "January 13, 2024", href: "https://www.youtube.com/@DrWesleyPaul" },
  { image: "https://wesleypaul.org/assets/images/sermon-2.jpg", title: "The Power of the Gospel to Save Every Soul", date: "February 4, 2024", href: "https://www.youtube.com/@DrWesleyPaul" },
  { image: "https://wesleypaul.org/assets/images/sermon-3.jpg", title: "Reviving the Church for the Great Commission", date: "March 18, 2024", href: "https://www.youtube.com/@DrWesleyPaul" },
  { image: "https://wesleypaul.org/assets/images/event-1.jpg", title: "Faith That Moves Mountains", date: "April 7, 2024", href: "https://www.youtube.com/@DrWesleyPaul" },
  { image: "https://wesleypaul.org/assets/images/event-2.jpg", title: "The Great Commission: Our Calling", date: "April 21, 2024", href: "https://www.youtube.com/@DrWesleyPaul" },
  { image: "https://wesleypaul.org/assets/images/event-3.jpg", title: "Building a Marriage That Lasts", date: "May 5, 2024", href: "https://www.youtube.com/@DrWesleyPaul" },
];

export default function SermonsPage() {
  return (
    <>
      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "96px 24px",
          minHeight: 280,
          background: `linear-gradient(rgba(13,27,46,0.8), rgba(13,27,46,0.85)), url(https://wesleypaul.org/assets/images/bg_1.jpg) center/cover no-repeat`,
        }}
      >
        <div style={{ color: "#fff" }}>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 12 }}>Sermons</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>Home</Link>
            {" "}&rsaquo;{" "}
            <span style={{ color: "#C0185A" }}>Sermons</span>
          </p>
        </div>
      </section>

      <section style={{ padding: "80px 24px", backgroundColor: "#f8f9fa" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span className="section-label">Media</span>
            <h2 className="section-title" style={{ fontSize: "clamp(1.6rem,3vw,2.2rem)" }}>Watch and Listen to Dr. Wesley</h2>
            <div className="section-divider" />
            <p style={{ color: "#6c757d", maxWidth: 480, margin: "0 auto", marginTop: 16 }}>
              Subscribe to our YouTube channel for sermons, crusade highlights, and ministry updates.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "2rem" }}>
            {sermons.map((s) => (
              <a key={s.title} href={s.href} target="_blank" rel="noopener noreferrer" className="card-hover" style={{ display: "block", textDecoration: "none" }}>
                <div style={{ position: "relative", height: 208, overflow: "hidden" }}>
                  <SafeImage src={s.image} alt="" fill style={{ objectFit: "cover" }} fallbackBg="linear-gradient(135deg, #0a1523 0%, #1a2a3a 100%)" />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)" }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#C0185A" }}>
                      <Play size={22} fill="white" style={{ color: "#fff", marginLeft: 3 }} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: "24px" }}>
                  <p style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>{s.date}</p>
                  <h3 style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4, color: "#2070B8" }}>{s.title}</h3>
                </div>
              </a>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <a href="https://www.youtube.com/@DrWesleyPaul" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Play size={16} /> View All on YouTube
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Church, Heart, BookOpen, Users, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "What We Do",
  description:
    "Explore the ministry programs of Wesley Paul International Ministries — Gospel Festivals, Revivals, Marriage Seminars, Evangelism Training, and Youth Outreach.",
};

const programs = [
  {
    icon: Globe,
    title: "Gospel Festivals",
    href: "/ministries/gospel-festivals",
    color: "#2070B8",
    description:
      "Large-scale evangelistic crusades conducted through strategic partnerships with local churches. Gospel Festivals are designed to mobilize entire communities and create an environment where people can respond to the message of Jesus Christ.",
    highlights: [
      "Multiday outdoor and indoor crusade events",
      "Local church partnership and mobilization",
      "Pre-festival evangelism training for church members",
      "Live worship, preaching, and altar calls",
      "Follow-up discipleship support for new believers",
    ],
  },
  {
    icon: Church,
    title: "Renewals & Revivals",
    href: "/ministries/renewals-revivals",
    color: "#C0185A",
    description:
      "Weekend events or extended multi-day revival series designed to bring fresh fire and spiritual renewal to local congregations. These meetings feature passionate worship, deep Biblical teaching, and personal encounters with God.",
    highlights: [
      "Weekend revival weekends or week-long series",
      "Passionate expository preaching",
      "Opportunities for personal prayer and ministry",
      "Focus on repentance, renewal, and recommitment",
      "Tailored to the specific needs of the host church",
    ],
  },
  {
    icon: Heart,
    title: "Marriage & Family Seminars",
    href: "/ministries/marriage-family",
    color: "#2070B8",
    description:
      "Led by Dr. Wesley Paul and Debbie Paul, these seminars blend spiritual wisdom with therapeutic tools to help couples and families thrive. Drawing on Dr. Wesley's dual expertise as a minister and licensed marriage therapist.",
    highlights: [
      "One-day or weekend seminar formats",
      "Biblical principles for marriage and family",
      "Practical tools from therapeutic research",
      "Applicable to couples at all stages of marriage",
      "Interactive sessions and Q&A opportunities",
    ],
  },
  {
    icon: BookOpen,
    title: "Evangelism Seminars",
    href: "/ministries/evangelism",
    color: "#C0185A",
    description:
      "Designed to train churches and individuals to understand the Gospel deeply and communicate it clearly. These interactive sessions are often held before major Gospel Festivals to prepare the local church for harvest.",
    highlights: [
      "Understanding the core of the Gospel message",
      "Practical tools for sharing faith naturally",
      "Overcoming fear and objections in evangelism",
      "Hands-on practice and role play",
      "Building a culture of evangelism in the local church",
    ],
  },
  {
    icon: Users,
    title: "Youth Outreach",
    href: "/ministries/youth-outreach",
    color: "#2070B8",
    description:
      "Speaking sessions tailored for high schools, colleges, and universities. Dr. Wesley engages today's youth with Biblical truth, practical wisdom, and a compelling call to follow Jesus Christ.",
    highlights: [
      "Adapted for secondary schools and universities",
      "Relevant, engaging, and culturally connected presentations",
      "Topics include purpose, identity, relationships, and faith",
      "Opportunity for students to respond to the Gospel",
      "Can be integrated into existing school programs or events",
    ],
  },
];

export default function WhatWeDoPage() {
  return (
    <>
      {/* Page Header */}
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
          <h1 style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, marginBottom: 16 }}>What We Do</h1>
          <div style={{ width: 56, height: 4, backgroundColor: "#C0185A", borderRadius: 2, margin: "0 auto" }} />
          <p style={{ marginTop: 24, fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", maxWidth: 560, margin: "24px auto 0" }}>
            From large-scale Gospel crusades to intimate family seminars, every program is designed
            to bring the transforming power of Jesus Christ to people where they are.
          </p>
        </div>
      </section>

      {/* Programs */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 80 }}>
          {programs.map(({ icon: Icon, title, href, color, description, highlights }, index) => (
            <div
              key={title}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
                gap: "3rem",
                alignItems: "center",
              }}
            >
              {/* Icon block — push to right on even rows via CSS order */}
              <div
                style={{
                  borderRadius: 16,
                  padding: 48,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  minHeight: 280,
                  backgroundColor: color,
                  color: "#fff",
                  order: index % 2 === 1 ? 2 : 1,
                }}
              >
                <Icon size={56} style={{ marginBottom: 20, opacity: 0.9 }} />
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{title}</h3>
              </div>
              {/* Content */}
              <div style={{ order: index % 2 === 1 ? 1 : 2 }}>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#2070B8", marginBottom: 16 }}>
                  {title}
                </h2>
                <div style={{ width: 48, height: 4, backgroundColor: "#C0185A", borderRadius: 2, marginBottom: 24 }} />
                <p style={{ color: "#6c757d", lineHeight: 1.8, marginBottom: 28 }}>{description}</p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                  {highlights.map((h) => (
                    <li key={h} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 14, color: "#4a4e69" }}>
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 1,
                          backgroundColor: "#C0185A",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14, color: "#C0185A", textDecoration: "none" }}
                >
                  Learn More About {title} <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Book CTA */}
      <section style={{ padding: "64px 24px", textAlign: "center", backgroundColor: "#f8f9fa" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 700, color: "#2070B8", marginBottom: 16 }}>
            Bring Dr. Wesley to Your Church or Community
          </h2>
          <p style={{ color: "#6c757d", marginBottom: 32 }}>
            Interested in hosting a Gospel Festival, revival, seminar, or youth event? We would love
            to partner with you.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
            <Link href="/book" className="btn-primary">Book Dr. Wesley</Link>
            <Link href="/contact" className="btn-navy">Contact Us</Link>
          </div>
        </div>
      </section>
    </>
  );
}

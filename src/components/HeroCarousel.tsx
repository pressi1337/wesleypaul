"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { YoutubeIcon } from "./SocialIcons";

const slides = [
  {
    type: "video" as const,
    src: "/images/wp_slider1_optimized.mp4",
    poster: "/images/wp_slider1.jpg",
    eyebrow: "Now Streaming",
    title: "WATCH THE LATEST\nMINISTRY UPDATE NOW",
    cta: { label: "Watch Now", href: "https://www.youtube.com/@DrWesleyPaul", external: true },
    showPlatforms: true,
  },
  {
    type: "image" as const,
    src: "/images/image_11.jpeg",
    eyebrow: "Evangelism",
    title: "GOSPEL FESTIVALS\nACROSS THE NATIONS",
    cta: { label: "Learn More", href: "/ministries/gospel-festivals", external: false },
    showPlatforms: false,
  },
  {
    type: "image" as const,
    src: "/images/image_13.jpeg",
    eyebrow: "Family",
    title: "STRENGTHENING\nMARRIAGES & FAMILIES",
    cta: { label: "Find Out More", href: "/ministries/marriage-family", external: false },
    showPlatforms: false,
  },
  {
    type: "image" as const,
    src: "/images/image_16.jpeg",
    eyebrow: "Revival",
    title: "RENEWALS &\nREVIVAL GATHERINGS",
    cta: { label: "Explore Ministries", href: "/what-we-do", external: false },
    showPlatforms: false,
  },
];

const HERO_HEIGHT = "calc(100vh - 70px)";
const HERO_MIN_HEIGHT = "580px";

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrent((c) => (c + dir + slides.length) % slides.length);
      setTimeout(() => setIsAnimating(false), 600);
    },
    [isAnimating]
  );

  useEffect(() => {
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [go]);

  const slide = slides[current];

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        height: HERO_HEIGHT,
        minHeight: HERO_MIN_HEIGHT,
        overflow: "hidden",
        backgroundColor: "#0d1523",
      }}
    >
      {/* ── Slide backgrounds ── */}
      {slides.map((s, i) =>
        s.type === "video" ? (
          <video
            key={i}
            src={s.src}
            poster={s.poster}
            autoPlay
            muted
            loop
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: i === current ? 1 : 0,
              transition: "opacity 0.7s ease",
              zIndex: 0,
            }}
          />
        ) : (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#0d1523",
              opacity: i === current ? 1 : 0,
              transition: "opacity 0.7s ease",
              zIndex: 0,
            }}
          >
            <Image
              src={s.src}
              alt=""
              fill
              style={{ objectFit: "cover", color: "transparent" }}
              unoptimized
            />
          </div>
        )
      )}

      {/* ── Dark overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to right, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.45))",
          zIndex: 1,
        }}
      />

      {/* ── Content ── */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          height: "100%",
          minHeight: HERO_MIN_HEIGHT,
          padding: "0 24px",
        }}
      >
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            fontSize: "11px",
            fontWeight: 700,
            color: "#C0185A",
            marginBottom: "16px",
          }}
        >
          {slide.eyebrow}
        </p>

        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.75rem)",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.15,
            marginBottom: "32px",
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
            whiteSpace: "pre-line",
          }}
        >
          {slide.title}
        </h1>

        {slide.cta.external ? (
          <a
            href={slide.cta.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 32px",
              fontWeight: 600,
              fontSize: "13px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#fff",
              border: "2px solid #fff",
              textDecoration: "none",
              transition: "all 0.2s",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#fff";
              (e.currentTarget as HTMLElement).style.color = "#000";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#fff";
            }}
          >
            <Play size={14} fill="currentColor" />
            {slide.cta.label}
          </a>
        ) : (
          <Link
            href={slide.cta.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 32px",
              fontWeight: 600,
              fontSize: "13px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#fff",
              border: "2px solid #fff",
              textDecoration: "none",
              transition: "all 0.2s",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "#fff";
              (e.currentTarget as HTMLElement).style.color = "#000";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLElement).style.color = "#fff";
            }}
          >
            {slide.cta.label}
          </Link>
        )}

        {/* Platform icons — slide 1 only */}
        {slide.showPlatforms && (
          <div
            style={{
              position: "absolute",
              bottom: "64px",
              right: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <a
              href="https://www.youtube.com/@DrWesleyPaul"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#FF0000",
                textDecoration: "none",
                color: "#fff",
              }}
            >
              <YoutubeIcon size={22} />
            </a>
            <p
              style={{
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                lineHeight: 1.3,
                maxWidth: "70px",
                textAlign: "center",
              }}
            >
              Available on YouTube
            </p>
          </div>
        )}
      </div>

      {/* ── Left arrow ── */}
      <button
        onClick={() => go(-1)}
        aria-label="Previous slide"
        style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff",
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(206,15,61,0.8)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0.4)")}
      >
        <ChevronLeft size={20} />
      </button>

      {/* ── Right arrow ── */}
      <button
        onClick={() => go(1)}
        aria-label="Next slide"
        style={{
          position: "absolute",
          right: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          backgroundColor: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.3)",
          color: "#fff",
          cursor: "pointer",
          transition: "background-color 0.2s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(206,15,61,0.8)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0.4)")}
      >
        <ChevronRight size={20} />
      </button>

      {/* ── Dot pagination ── */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              if (!isAnimating) {
                setIsAnimating(true);
                setCurrent(i);
                setTimeout(() => setIsAnimating(false), 600);
              }
            }}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === current ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              backgroundColor: i === current ? "#C0185A" : "rgba(255,255,255,0.5)",
              border: "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>
    </section>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { YoutubeIcon } from "./SocialIcons";
import { translateBatch } from "@/lib/translate-client";

export interface HeroSlideTranslation {
  eyebrow?: string;
  title?: string;
  cta_label?: string;
}

export interface HeroSlide {
  type: string;
  src: string;
  poster?: string;
  eyebrow: string;
  title: string;
  cta_label: string;
  cta_href: string;
  cta_external: boolean;
  show_platforms: boolean;
  /** 0–90 — overlay darkness percentage (default 60) */
  overlay_opacity?: number;
  /** 100–200 — zoom percentage, 100 = normal cover (default 100) */
  img_zoom?: number;
  /** CSS object-position / background-position value (default "center") */
  img_position?: string;
  /** Per-language text overrides keyed by lang code, e.g. { hi: { title: "…" } } */
  translations?: Record<string, HeroSlideTranslation>;
}

/** Resolve display text for a slide in the current language */
function slideText(s: HeroSlide, lang: string) {
  const t = lang !== "en" ? s.translations?.[lang] : undefined;
  // Replace literal \n (stored from textarea) with real newlines
  const fixNl = (str: string) => str.replace(/\\n/g, "\n");
  return {
    eyebrow:   t?.eyebrow   || s.eyebrow,
    title:     fixNl(t?.title    || s.title),
    cta_label: t?.cta_label || s.cta_label,
  };
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    type: "video",
    src: "/images/wp_slider1_optimized.mp4",
    poster: "/images/wp_slider1.jpg",
    eyebrow: "Now Streaming",
    title: "WATCH THE LATEST\nMINISTRY UPDATE NOW", // actual newline — JS source is fine
    cta_label: "Watch Now",
    cta_href: "https://www.youtube.com/@DrWesleyPaul",
    cta_external: true,
    show_platforms: true,
  },
  {
    type: "image",
    src: "/images/image_11.jpeg",
    eyebrow: "Evangelism",
    title: "GOSPEL FESTIVALS\nACROSS THE NATIONS",
    cta_label: "Learn More",
    cta_href: "/ministries/gospel-festivals",
    cta_external: false,
    show_platforms: false,
  },
  {
    type: "image",
    src: "/images/image_13.jpeg",
    eyebrow: "Family",
    title: "STRENGTHENING\nMARRIAGES & FAMILIES",
    cta_label: "Find Out More",
    cta_href: "/ministries/marriage-family",
    cta_external: false,
    show_platforms: false,
  },
  {
    type: "image",
    src: "/images/image_16.jpeg",
    eyebrow: "Revival",
    title: "RENEWALS &\nREVIVAL GATHERINGS",
    cta_label: "Explore Ministries",
    cta_href: "/what-we-do",
    cta_external: false,
    show_platforms: false,
  },
];

const HERO_HEIGHT = "calc(100vh - 70px)";
const HERO_MIN_HEIGHT = "580px";

export default function HeroCarousel({
  slides: slidesProp,
  paused,
  forcedSlide,
}: {
  slides?: HeroSlide[];
  /** When true the auto-advance timer is suspended (used by live preview while editing) */
  paused?: boolean;
  /** Jump to this slide index (used by live preview to show the slide being edited) */
  forcedSlide?: number;
}) {
  const baseSlides = slidesProp && slidesProp.length > 0 ? slidesProp : DEFAULT_SLIDES;
  const [slides, setSlides] = useState<HeroSlide[]>(baseSlides);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  // lang starts as "en" on the server so SSR output matches client's initial render.
  // The effect below updates it to the real ?lang= value after hydration.
  const [lang, setLang] = useState("en");
  const searchParams = useSearchParams();
  useEffect(() => {
    setLang(searchParams.get("lang") ?? "en");
  }, [searchParams]);

  // Sync prop changes into internal state — required for live preview in Site Editor
  // (useState only uses the initial value once; subsequent prop changes are ignored otherwise)
  useEffect(() => {
    if (slidesProp && slidesProp.length > 0 && lang === "en") {
      setSlides(slidesProp);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slidesProp]);

  // Auto-translate hero slides when language changes
  useEffect(() => {
    if (lang === "en") { setSlides(baseSlides); return; }

    // Check if all slides already have stored translations for this lang
    const allHaveStored = baseSlides.every(s => s.translations?.[lang]);
    if (allHaveStored) { setSlides(baseSlides); return; }

    const cacheKey = `hero_tr_v4_${lang}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) { setSlides(JSON.parse(cached) as HeroSlide[]); return; }
    } catch { /* ignore */ }

    // Flatten: [eyebrow0, title0, cta0, eyebrow1, title1, cta1, ...]
    const texts = baseSlides.flatMap(s => {
      const stored = s.translations?.[lang];
      return [
        stored?.eyebrow ?? s.eyebrow,
        stored?.title ?? s.title.replace(/\n/g, " "),
        stored?.cta_label ?? s.cta_label,
      ];
    });

    if (window.self !== window.top) return; // preview: only show saved translations
    translateBatch(texts, lang)
      .then(results => {
        let idx = 0;
        const trSlides: HeroSlide[] = baseSlides.map(s => {
          const stored = s.translations?.[lang];
          const eyebrow = stored?.eyebrow ?? results[idx++];
          const titleFlat = stored?.title ?? results[idx++];
          const cta_label = stored?.cta_label ?? results[idx++];
          return {
            ...s,
            translations: {
              ...s.translations,
              [lang]: { eyebrow, title: titleFlat, cta_label },
            },
          };
        });
        setSlides(trSlides);
        try { sessionStorage.setItem(cacheKey, JSON.stringify(trSlides)); } catch { /* ignore */ }
      })
      .catch(() => { /* stay English on failure — don't cache */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Jump to a specific slide when the editor focuses it
  useEffect(() => {
    if (typeof forcedSlide === "number" && forcedSlide >= 0 && forcedSlide < slides.length) {
      setCurrent(forcedSlide);
    }
  }, [forcedSlide, slides.length]);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrent((c) => (c + dir + slides.length) % slides.length);
      setTimeout(() => setIsAnimating(false), 600);
    },
    [isAnimating, slides.length]
  );

  // Auto-advance — suspended when editor is hovering a slide
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => go(1), 6000);
    return () => clearInterval(t);
  }, [go, paused]);

  const slide = slides[current];
  const { eyebrow, title, cta_label } = slideText(slide, lang);
  const overlayOpacity = (slide.overlay_opacity ?? 60) / 100;
  const overlayLeft = Math.min(overlayOpacity + 0.15, 0.95);
  const overlayRight = Math.max(overlayOpacity - 0.15, 0);

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
      {slides.map((s, i) => {
        if (!s.src) return null;
        const zoom = s.img_zoom ?? 100;
        const pos  = s.img_position || "center";
        // Normalise: only treat as video when type is explicitly "video"
        const isVideo = String(s.type ?? "").trim() === "video";
        return isVideo ? (
          <video
            key={i}
            src={s.src}
            poster={s.poster || undefined}
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
              objectPosition: pos,
              transform: zoom > 100 ? `scale(${zoom / 100})` : undefined,
              transformOrigin: pos,
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
              overflow: "hidden",
            }}
          >
            <Image
              src={s.src}
              alt=""
              fill
              priority={i === 0}
              style={{
                objectFit: "cover",
                objectPosition: pos,
                transform: zoom > 100 ? `scale(${zoom / 100})` : undefined,
                transformOrigin: pos,
                color: "transparent",
              }}
            />
          </div>
        );
      })}

      {/* ── Per-slide dark overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to right, rgba(0,0,0,${overlayLeft}) 40%, rgba(0,0,0,${overlayRight}))`,
          zIndex: 1,
          transition: "background 0.5s ease",
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
          {eyebrow}
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
          {title}
        </h1>

        {slide.cta_external ? (
          <a
            href={slide.cta_href}
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
            {cta_label}
          </a>
        ) : (
          <Link
            href={slide.cta_href}
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
            {cta_label}
          </Link>
        )}

        {/* Platform icons — slide 1 only */}
        {slide.show_platforms && (
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

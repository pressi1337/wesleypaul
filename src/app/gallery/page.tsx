export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import pool from "@/lib/db";
import GallerySection from "@/components/GallerySection";

export const metadata: Metadata = {
  title: "Gallery | Wesley Paul International Ministries",
  description: "Photos from Gospel Festivals, revivals, marriage seminars, and ministry events around the world.",
};

const DEFAULT_IMAGES = [
  "/images/image_11.jpeg",
  "/images/image_13.jpeg",
  "/images/image_16.jpeg",
  "/images/image_17.jpeg",
];

async function getGalleryImages(): Promise<string[]> {
  try {
    const [rows] = await pool.execute(
      "SELECT content_json FROM site_content WHERE content_key = 'home_gallery' LIMIT 1"
    );
    const arr = rows as { content_json: string }[];
    if (arr.length > 0) {
      const data = JSON.parse(arr[0].content_json) as string[];
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch { /* fall through */ }
  return DEFAULT_IMAGES;
}

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0a1523 0%, #1a3a5c 100%)", padding: "72px 24px 56px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", color: "#C0185A", textTransform: "uppercase", marginBottom: 12 }}>
          Ministry in Action
        </p>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 800, color: "#fff", marginBottom: 16 }}>
          Photo Gallery
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", maxWidth: 560, margin: "0 auto" }}>
          Moments from Gospel Festivals, revival meetings, marriage seminars, and outreach events across the world.
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 14 }}>
          {images.length} photo{images.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Gallery grid with lightbox */}
      <GallerySection
        images={images}
        heading=""
        eyebrow=""
        showViewAll={false}
      />
    </div>
  );
}

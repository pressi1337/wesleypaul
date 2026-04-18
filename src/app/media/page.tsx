export const revalidate = 60;

import { Suspense } from "react";
import type { Metadata } from "next";
import pool from "@/lib/db";
import MediaPageClient from "./MediaPageClient";
import type { MediaSectionData } from "@/components/HomeMediaSection";

export const metadata: Metadata = {
  title: "Media | Wesley Paul International Ministries",
  description: "Watch and listen to Dr. Wesley Paul — sermons, Gospel festivals, ministry highlights, and more.",
};

async function getMediaData(): Promise<MediaSectionData> {
  try {
    const [rows] = await pool.execute(
      "SELECT content_json FROM site_content WHERE content_key = 'home_media_section' LIMIT 1"
    );
    const arr = rows as { content_json: string }[];
    if (arr.length > 0) return JSON.parse(arr[0].content_json) as MediaSectionData;
  } catch { /* fall through */ }
  return { items: [] };
}

export default async function MediaPage() {
  const data = await getMediaData();
  return (
    <Suspense>
      <MediaPageClient
        items={data.items ?? []}
        heading={data.heading || "Watch & Listen to Dr. Wesley"}
        eyebrow={data.eyebrow || "Media"}
        savedTranslations={data.translations ?? {}}
      />
    </Suspense>
  );
}

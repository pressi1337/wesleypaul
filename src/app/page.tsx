export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { HeroSlide } from "@/components/HeroCarousel";
import PreviewOverride from "@/components/PreviewOverride";
import StatsBar, { StatsBarData } from "@/components/StatsBar";
import HomeLiveSections, { WelcomeData, Ministry } from "@/components/HomeLiveSections";
import HomeMediaSection, { MediaSectionData } from "@/components/HomeMediaSection";
import HomeClientSections, { ImpactStat, GiveCTA } from "@/components/HomeClientSections";
import EndorsementsSection, { EndorsementItem } from "@/components/EndorsementsSection";
import GallerySection from "@/components/GallerySection";
import HomePostsSection, { PostsSectionConfig, PostCard } from "@/components/HomePostsSection";
import pool from "@/lib/db";
import { ensureHomePage } from "@/lib/init-db";

export const metadata: Metadata = {
  title: "Home | Wesley Paul International Ministries",
  description:
    "Surrendered Lives, Eternal Purpose. From villages to cities, lives are being transformed through the power of the Gospel.",
};

async function getSiteContent(key: string) {
  try {
    const [rows] = await pool.execute(
      "SELECT content_json FROM site_content WHERE content_key = ? LIMIT 1",
      [key]
    );
    const arr = rows as { content_json: string }[];
    if (arr.length > 0) return JSON.parse(arr[0].content_json);
  } catch { /* fall through */ }
  return null;
}


export default async function HomePage() {
  const [heroSlides, statsData, welcomeData, impactData, ministriesData, endorsementsData, galleryData, giveCTAData, newsCfg, blogCfg, eventsCfg, mediaSectionRaw] = await Promise.all([
    getSiteContent("home_hero_slides"),
    getSiteContent("home_stats_bar"),
    getSiteContent("home_welcome"),
    getSiteContent("home_impact"),
    getSiteContent("home_ministries"),
    getSiteContent("home_endorsements"),
    getSiteContent("home_gallery"),
    getSiteContent("home_give_cta"),
    getSiteContent("home_news_section"),
    getSiteContent("home_blog_section"),
    getSiteContent("home_events_section"),
    getSiteContent("home_media_section"),
  ]);

  const ministries: Ministry[] = ministriesData ?? [
    { image: "/images/event-1.jpg", category: "Evangelism", title: "Gospel Festivals", excerpt: "Large-scale evangelistic crusades mobilizing entire cities through local church partnerships, worship, and powerful Gospel preaching.", href: "/ministries/gospel-festivals" },
    { image: "/images/event-2.jpg", category: "Revival", title: "Renewals & Revivals", excerpt: "Weekend and multi-day revival gatherings igniting fresh passion and bringing spiritual transformation to local congregations.", href: "/ministries/renewals-revivals" },
    { image: "/images/event-3.jpg", category: "Family", title: "Marriage & Family Seminars", excerpt: "Spirit-led seminars combining Biblical wisdom and therapeutic tools — led by Dr. Wesley and Debbie Paul — to strengthen families.", href: "/ministries/marriage-family" },
    { image: "/images/sermon-1.jpg", category: "Training", title: "Evangelism Seminars", excerpt: "Equipping believers to understand and communicate the Gospel clearly and confidently in their everyday relationships.", href: "/ministries/evangelism" },
    { image: "/images/sermon-2.jpg", category: "Youth", title: "Youth Outreach", excerpt: "Dynamic speaking sessions for schools, colleges and universities — engaging today's youth with Biblical truth and purpose.", href: "/ministries/youth-outreach" },
    { image: "/images/sermon-3.jpg", category: "Training", title: "Evangelism Training", excerpt: "Pre-festival intensive training workshops that prepare church members to lead their friends and community to Christ.", href: "/ministries/evangelism" },
  ];

  const mediaSectionConfig: MediaSectionData = (mediaSectionRaw as MediaSectionData) ?? { show: false, items: [] };

  const impact: ImpactStat[] = impactData ?? [
    { value: "30+", label: "Nations Served" },
    { value: "20+", label: "Years of Ministry" },
    { value: "1000s", label: "Lives Changed" },
    { value: "100s", label: "Churches Partnered" },
  ];

  const galleryDefaults = ["/images/image_11.jpeg","/images/image_13.jpeg","/images/image_16.jpeg","/images/image_17.jpeg"];
  type GalleryCfg = { images?: string[]; show?: boolean; heading?: string; eyebrow?: string; limit?: number; show_cta?: boolean; cta_label?: string; cta_href?: string };
  const galleryCfg: GalleryCfg = Array.isArray(galleryData)
    ? { images: galleryData as string[], show: true, show_cta: true, cta_label: "View All Photos", cta_href: "/gallery" }
    : (galleryData as GalleryCfg) ?? {};
  const gallery: string[] = galleryCfg.images?.length ? galleryCfg.images : galleryDefaults;

  const welcome: WelcomeData = welcomeData ?? {
    image: "/images/image_16.jpeg",
    heading: "Proclaiming Christ &amp; Strengthening Families",
    body1: "Wesley Paul International Ministries is a global evangelistic ministry committed to proclaiming the life-transforming message of Jesus Christ and strengthening the foundation of marriages and families across the world.",
    body2: "We partner with local churches to conduct Gospel Festivals, revival meetings, marriage and family seminars, and evangelism training across more than 30 nations. Dr. Wesley and Debbie Paul bring a unique blend of spiritual depth and practical wisdom to every ministry setting.",
    cta_label: "Know More",
    cta_href: "/meet-wesley",
  };

  const giveCTA: GiveCTA = giveCTAData ?? {
    label: "Partner With Us",
    heading: "Reaching Nations. Restoring Homes. Reviving Hearts.",
    body: "Your generous support enables us to carry the Gospel to unreached communities, revive churches, and strengthen families across the world. Every gift makes an eternal difference.",
    primary_label: "Give / Donate",
    primary_href: "/give",
    secondary_label: "Book Dr. Wesley",
    secondary_href: "/book",
  };

  // ── News / Blog / Events post sections ────────────────────────────────
  const newsConfig:   PostsSectionConfig = (newsCfg   as PostsSectionConfig)   ?? { show: false };
  const blogConfig:   PostsSectionConfig = (blogCfg   as PostsSectionConfig)   ?? { show: false };
  const eventsConfig: PostsSectionConfig = (eventsCfg as PostsSectionConfig)   ?? { show: false };

  const [newsPosts, blogPosts, eventsPosts] = await Promise.all([
    fetchPostCards("news",  newsConfig.limit  ?? 3),
    fetchPostCards("blog",  blogConfig.limit  ?? 3),
    fetchPostCards("event", eventsConfig.limit ?? 3),
  ]);

  return (
    <>
      {/* ── HERO CAROUSEL — PreviewOverride enables live preview from Site Editor ── */}
      <div data-site-section="home_hero_slides">
        <PreviewOverride initialHeroSlides={(heroSlides as HeroSlide[]) ?? []} />
      </div>

      {/* ── STATS BAR ───────────────────────────────── */}
      <div data-site-section="home_stats_bar">
        <StatsBar data={statsData as StatsBarData | undefined} />
      </div>

      {/* ── WELCOME / ABOUT + MINISTRIES (live preview via postMessage) ── */}
      <HomeLiveSections
        initialWelcome={welcome}
        initialMinistries={ministries}
      />

      {/* ── IMPACT COUNTER + GIVE CTA (client component for translation) ── */}
      <HomeClientSections impact={impact} giveCTA={giveCTA} />

      {/* ── ENDORSEMENTS ─────────────────────────────── */}
      <div data-site-section="home_endorsements">
        <EndorsementsSection items={endorsementsData as EndorsementItem[] | undefined} />
      </div>

      {/* ── GALLERY ──────────────────────────────────── */}
      {galleryCfg.show !== false && (
        <div data-site-section="home_gallery">
          <GallerySection
            images={gallery}
            limit={galleryCfg.limit ?? 10}
            showViewAll={galleryCfg.show_cta !== false}
            eyebrow={galleryCfg.eyebrow ?? "Gallery"}
            heading={galleryCfg.heading ?? "Ministry in Action"}
            ctaLabel={galleryCfg.cta_label ?? "View All Photos"}
            ctaHref={galleryCfg.cta_href ?? "/gallery"}
          />
        </div>
      )}

      {/* ── NEWS ─────────────────────────────────────── */}
      <HomePostsSection
        contentKey="home_news_section"
        postType="news"
        initialConfig={newsConfig}
        initialPosts={newsPosts}
      />

      {/* ── BLOG ─────────────────────────────────────── */}
      <HomePostsSection
        contentKey="home_blog_section"
        postType="blog"
        initialConfig={blogConfig}
        initialPosts={blogPosts}
      />

      {/* ── EVENTS ───────────────────────────────────── */}
      <HomePostsSection
        contentKey="home_events_section"
        postType="event"
        initialConfig={eventsConfig}
        initialPosts={eventsPosts}
      />

      {/* ── MEDIA SECTION (YouTube / Instagram / other) ── */}
      <HomeMediaSection initialData={mediaSectionConfig} />

      {/* ── CMS SECTIONS (added via Page Editor) ─────── */}
      <HomeCmsSections />
    </>
  );
}

// ── Fetch latest published posts of a given type ──────────────────────────
async function fetchPostCards(postType: string, limit: number): Promise<PostCard[]> {
  try {
    const safeLimit = Math.max(1, Math.min(50, Math.floor(Number(limit)) || 3));
    const orderBy = postType === "event" ? "COALESCE(event_date, created_at) DESC" : "created_at DESC";
    const [rows] = await pool.execute(
      `SELECT id, title, slug, post_type, excerpt, featured_image, tags, created_at, event_date, translations_json
       FROM posts WHERE post_type = ? AND status = 'published'
       ORDER BY ${orderBy} LIMIT ${safeLimit}`,
      [postType]
    );
    return (rows as { id: number; title: string; slug: string; post_type: string; excerpt: string; featured_image: string; tags: string; created_at: string; event_date: string | null; translations_json: string | null }[])
      .map(r => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        post_type: r.post_type,
        excerpt: r.excerpt,
        featured_image: r.featured_image,
        tags: r.tags,
        date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        event_date: r.event_date ?? undefined,
        translations_json: r.translations_json ?? undefined,
      }));
  } catch { return []; }
}

// ── CMS sections from the "home" page entry in the DB ──────────────────────
interface CmsSection { id: number; section_type: string; sort_order: number; content_json: string; }

function parseCms(json: string): Record<string, unknown> {
  try { return JSON.parse(json) as Record<string, unknown>; } catch { return {}; }
}
function getCmsStr(obj: Record<string, unknown>, k: string): string {
  const v = obj[k]; return typeof v === "string" ? v : "";
}

async function HomeCmsSections() {
  try {
    await ensureHomePage();
    const [pageRows] = await pool.execute("SELECT id FROM pages WHERE slug = 'home' LIMIT 1");
    const pages = pageRows as { id: number }[];
    if (!pages.length) return null;
    const [secRows] = await pool.execute(
      "SELECT * FROM page_sections WHERE page_id = ? ORDER BY sort_order ASC",
      [pages[0].id]
    );
    const sections = secRows as CmsSection[];
    if (!sections.length) return null;
    return (
      <>
        {sections.map(sec => {
          const c = parseCms(sec.content_json);
          const bgImg = getCmsStr(c, "bg_image");
          const bgColor = getCmsStr(c, "bg_color") || "#0a1523";
          const overlayOpacity = Number(c.bg_overlay ?? 50) / 100;
          const bgStyle: React.CSSProperties = bgImg
            ? { backgroundImage: `url(${bgImg})`, backgroundSize: "cover", backgroundPosition: getCmsStr(c, "bg_position") || "center", position: "relative" }
            : {};
          const hasBg = !!bgImg;

          if (sec.section_type === "text") {
            const heading = getCmsStr(c, "heading");
            const body = getCmsStr(c, "body");
            const align = getCmsStr(c, "align") || "left";
            return (
              <section key={sec.id} style={{ padding: "60px 24px", background: hasBg ? bgColor : "transparent", textAlign: align === "center" ? "center" : "left", ...bgStyle }}>
                {hasBg && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})`, zIndex: 0 }} />}
                <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
                  {heading && <h2 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 700, color: hasBg ? "#fff" : "#2070B8", marginBottom: 20 }}>{heading}</h2>}
                  {body && <div style={{ color: hasBg ? "rgba(255,255,255,0.85)" : "#4a5568", lineHeight: 1.8, fontSize: 17 }}>
                    {body.split("\n").map((p, i) => p.trim() ? <p key={i} style={{ margin: "0 0 16px" }}>{p}</p> : null)}
                  </div>}
                </div>
              </section>
            );
          }

          if (sec.section_type === "donate_strip") {
            const text = getCmsStr(c, "text") || "Partner with us — every gift reaches another soul with the Gospel.";
            const btnLabel = getCmsStr(c, "button_label") || "Give Now";
            const btnHref = getCmsStr(c, "button_href") || "/give";
            const bgColor = getCmsStr(c, "bg_color") || "#1B3A76";
            const btnColor = getCmsStr(c, "btn_color") || "#9B1030";
            return (
              <div key={sec.id} style={{ backgroundColor: bgColor, padding: "20px 24px" }}>
                <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                  <p style={{ fontWeight: 700, fontSize: "15px", color: "#fff", margin: 0 }}>{text}</p>
                  <Link href={btnHref} style={{ display: "inline-flex", alignItems: "center", padding: "10px 24px", backgroundColor: btnColor, color: "#fff", fontWeight: 700, fontSize: "13px", borderRadius: "3px", textDecoration: "none", whiteSpace: "nowrap" }}>
                    {btnLabel}
                  </Link>
                </div>
              </div>
            );
          }

          if (sec.section_type === "cta") {
            const heading = getCmsStr(c, "heading") || "Take Action Today";
            const body = getCmsStr(c, "body");
            const p1 = getCmsStr(c, "primary_cta_text") || "Get Started";
            const p1link = getCmsStr(c, "primary_cta_link") || "/give";
            const p2 = getCmsStr(c, "secondary_cta_text");
            const p2link = getCmsStr(c, "secondary_cta_link") || "/contact";
            return (
              <section key={sec.id} style={{ padding: "72px 24px", background: hasBg ? bgColor : "#0d1b2e", textAlign: "center", ...bgStyle }}>
                {hasBg && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})`, zIndex: 0 }} />}
                <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
                  <h2 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 800, color: "#fff", marginBottom: 14 }}>{heading}</h2>
                  {body && <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 32, lineHeight: 1.7 }}>{body}</p>}
                  <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                    <Link href={p1link} className="btn-primary">{p1}</Link>
                    {p2 && <Link href={p2link} className="btn-outline">{p2}</Link>}
                  </div>
                </div>
              </section>
            );
          }

          // Generic fallback for other section types — renders heading + body
          const heading = getCmsStr(c, "heading");
          if (!heading) return null;
          return (
            <section key={sec.id} style={{ padding: "56px 24px", background: hasBg ? bgColor : "#fff", ...bgStyle }}>
              {hasBg && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${overlayOpacity})`, zIndex: 0 }} />}
              <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
                <h2 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 700, color: hasBg ? "#fff" : "#2070B8", marginBottom: 12 }}>{heading}</h2>
              </div>
            </section>
          );
        })}
      </>
    );
  } catch { return null; }
}

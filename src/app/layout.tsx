import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import NavbarServer from "@/components/NavbarServer";
import FooterServer from "@/components/FooterServer";
import AnalyticsScripts from "@/components/AnalyticsScripts";
import VisitTracker from "@/components/VisitTracker";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Wesley Paul International Ministries",
    template: "%s | Wesley Paul International Ministries",
  },
  description:
    "A global evangelistic ministry committed to proclaiming the life-transforming message of Jesus Christ and strengthening marriages and families across the world.",
  keywords: [
    "Wesley Paul",
    "evangelism",
    "revival",
    "international ministries",
    "gospel festivals",
    "marriage seminars",
    "Christian ministry",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wesleypaul.org",
    siteName: "Wesley Paul International Ministries",
    title: "Wesley Paul International Ministries",
    description:
      "A global evangelistic ministry committed to proclaiming the life-transforming message of Jesus Christ.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
        <AnalyticsScripts />
        <VisitTracker />
        <SiteShell navbar={<NavbarServer />} footer={<FooterServer />}>{children}</SiteShell>
      </body>
    </html>
  );
}

---
name: Wesley Paul Website Project
description: Next.js rebuild of wesleypaul.org for Wesley Paul International Ministries — design inspired by cfan.org
type: project
---

Complete website rebuild for Wesley Paul International Ministries (wesleypaul.org).

**Why:** Client onboarded with expired SSL cert; requested full rebuild with modern stack inspired by cfan.org UX.

**Stack:** Next.js 16.2.2 (App Router), Tailwind CSS v4, TypeScript, lucide-react

**Color palette:** Navy (#0f2550), Red (#c0392b), Gold (#d4a017) — CSS variables in globals.css via @theme

**Pages built (all 13 compile and prerender as static):**
- / (Home)
- /who-we-are
- /what-we-do
- /meet-wesley
- /ministries/gospel-festivals
- /ministries/renewals-revivals
- /ministries/marriage-family
- /ministries/evangelism
- /ministries/youth-outreach
- /book (booking inquiry form, client component)
- /give
- /contact (contact form, client component)

**Key components:** src/components/Navbar.tsx (client), src/components/Footer.tsx (client), src/components/SocialIcons.tsx (custom SVG social icons — lucide-react v3 doesn't have Facebook/Youtube/Instagram/Twitter)

**How to apply:** Social media icon imports must use custom SocialIcons.tsx, not lucide-react. Footer must be "use client" because of hover event handlers.

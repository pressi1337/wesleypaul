import pool from "@/lib/db";
import Script from "next/script";

interface AnalyticsConfig {
  ga_tracking_id?: string;
  fb_pixel_id?: string;
  gtm_id?: string;
}

export default async function AnalyticsScripts() {
  let config: AnalyticsConfig = {};
  try {
    const [rows] = await pool.execute("SELECT ga_tracking_id, fb_pixel_id, gtm_id FROM analytics_config LIMIT 1");
    const arr = rows as AnalyticsConfig[];
    if (arr.length > 0) config = arr[0];
  } catch {
    return null;
  }

  const { ga_tracking_id, fb_pixel_id, gtm_id } = config;

  return (
    <>
      {/* ── Google Tag Manager ── */}
      {gtm_id && (
        <>
          <Script id="gtm-head" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm_id}');`}
          </Script>
          {/* GTM noscript injected via layout body via dangerouslySetInnerHTML is not possible in RSC —
              the iframe fallback only matters for non-JS environments and is skipped here intentionally */}
        </>
      )}

      {/* ── Google Analytics (GA4) — only when GTM is not also set to avoid double-firing ── */}
      {ga_tracking_id && !gtm_id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga_tracking_id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga_tracking_id}');`}
          </Script>
        </>
      )}

      {/* ── Meta (Facebook) Pixel ── */}
      {fb_pixel_id && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fb_pixel_id}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}

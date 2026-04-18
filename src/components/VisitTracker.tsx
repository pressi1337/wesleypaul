"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function genSessionId(): string {
  const key = "wp_sid";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

export default function VisitTracker() {
  const pathname  = usePathname();
  const startRef  = useRef<number>(Date.now());

  useEffect(() => {
    // Skip admin routes
    if (pathname.startsWith("/admin")) return;

    startRef.current = Date.now();
    const sessionId = genSessionId();

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        page: pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {});

    const sendTime = () => {
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      if (seconds < 1) return;
      navigator.sendBeacon(
        "/api/track",
        new Blob(
          [JSON.stringify({ sessionId, page: pathname, timeSpentS: seconds })],
          { type: "application/json" }
        )
      );
    };

    window.addEventListener("beforeunload", sendTime);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") sendTime();
    });

    return () => {
      sendTime();
      window.removeEventListener("beforeunload", sendTime);
    };
  }, [pathname]);

  return null;
}

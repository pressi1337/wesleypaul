"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToHash() {
  const pathname = usePathname();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    let tries = 0;
    let timerId: ReturnType<typeof setTimeout>;

    const scroll = () => {
      const anchor = document.getElementById(hash);
      if (!anchor) {
        if (tries++ < 8) timerId = setTimeout(scroll, 200);
        return;
      }

      const navbar = document.querySelector("header");
      const navH = navbar ? navbar.offsetHeight : 72;

      // Prefer the first heading inside the anchor so we scroll past the
      // section's top padding and land with the actual content right below
      // the navbar, not 80 px of empty dark background.
      const heading = anchor.querySelector("h1, h2, h3");
      const target = heading ?? anchor;

      const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    };

    timerId = setTimeout(scroll, 300);
    return () => clearTimeout(timerId);
  }, [pathname]);

  return null;
}

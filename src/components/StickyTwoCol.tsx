"use client";

/**
 * StickyTwoCol — dynamic sticky two-column layout.
 *
 * Whichever column is shorter sticks to the top (position: sticky)
 * while the taller column scrolls past it naturally.
 * Measurements are kept live via ResizeObserver so it reacts when
 * content is added, removed, or the window is resized.
 */

import { useRef, useEffect, useCallback, ReactNode } from "react";

interface Props {
  imageSlot: ReactNode;
  textSlot: ReactNode;
  imageSide: "left" | "right";
  stickyTop?: number; // offset from viewport top (accounts for navbar)
}

export default function StickyTwoCol({
  imageSlot,
  textSlot,
  imageSide,
  stickyTop = 88,
}: Props) {
  const imgRef = useRef<HTMLDivElement>(null);
  const txtRef = useRef<HTMLDivElement>(null);

  const applySticky = useCallback(() => {
    const img = imgRef.current;
    const txt = txtRef.current;
    if (!img || !txt) return;

    // Reset both before re-applying
    img.style.position = "";
    img.style.top      = "";
    img.style.alignSelf = "";
    txt.style.position = "";
    txt.style.top      = "";
    txt.style.alignSelf = "";

    const imgH = img.scrollHeight;
    const txtH = txt.scrollHeight;

    if (txtH >= imgH) {
      // Text is taller — stick the image so it stays visible while text scrolls
      img.style.position  = "sticky";
      img.style.top       = `${stickyTop}px`;
      img.style.alignSelf = "flex-start";
    } else {
      // Image is taller — stick the text so it stays visible while image scrolls
      txt.style.position  = "sticky";
      txt.style.top       = `${stickyTop}px`;
      txt.style.alignSelf = "flex-start";
    }
  }, [stickyTop]);

  useEffect(() => {
    applySticky();
    const ro = new ResizeObserver(applySticky);
    if (imgRef.current) ro.observe(imgRef.current);
    if (txtRef.current) ro.observe(txtRef.current);
    return () => ro.disconnect();
  }, [applySticky]);

  const imgCol = <div ref={imgRef}>{imageSlot}</div>;
  const txtCol = <div ref={txtRef}>{textSlot}</div>;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
      gap: "3rem",
      alignItems: "flex-start",
    }}>
      {imageSide === "left" ? <>{imgCol}{txtCol}</> : <>{txtCol}{imgCol}</>}
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  className?: string;
  /** Shown when image fails to load. Defaults to a dark gradient with optional icon. */
  fallbackLabel?: string;
  fallbackBg?: string;
}

/**
 * Next.js Image wrapper that swaps in a styled placeholder when the
 * source URL fails to load (e.g. hotlink protection in development).
 */
export default function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  style,
  className,
  fallbackLabel,
  fallbackBg = "linear-gradient(135deg, #0d1b2e 0%, #1a2a3a 100%)",
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        style={{
          position: fill ? "absolute" : "relative",
          inset: fill ? 0 : undefined,
          width: fill ? "100%" : width,
          height: fill ? "100%" : height,
          background: fallbackBg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        {/* Subtle cross/cross watermark */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity={0.15}>
          <rect x="14" y="4" width="4" height="24" fill="#fff" />
          <rect x="4" y="12" width="24" height="4" fill="#fff" />
        </svg>
        {fallbackLabel && (
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      style={{ color: "transparent", ...style }}
      className={className}
      unoptimized
      onError={() => setErrored(true)}
    />
  );
}

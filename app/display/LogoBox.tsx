"use client";

/**
 * Every logo sits in an identically-sized box and is contained within it, so a
 * wide logo and a square one occupy the same footprint and stay aligned with
 * each other. Sizing the image itself instead makes wide logos read as much
 * larger than tall ones and pushes rows out of alignment.
 */
export function LogoBox({
  src,
  height,
  widthRatio = 2.2,
  className = "",
}: {
  src: string;
  height: number;
  widthRatio?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ height, width: height * widthRatio }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="max-h-full max-w-full object-contain" />
    </span>
  );
}

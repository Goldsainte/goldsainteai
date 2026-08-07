// Goldsainte Verified — the gold seal, v2.
// Lessons taken from the badge that trained the world (IG's): a saturated
// fill, a bold silhouette, and a WHITE check for maximum contrast. Ours is
// minted gold — light catches the top-left, deepens to bronze — so it reads
// as luxury status at 140px and stays crisp at 14px.
import { useId } from "react";

interface VerifiedSealProps {
  size?: number;
  className?: string;
  title?: string;
}

export function VerifiedSeal({ size = 16, className = "", title = "Goldsainte Verified" }: VerifiedSealProps) {
  const gid = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`inline-block align-middle shrink-0 ${className}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gid} x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#EDD494" />
          <stop offset="0.45" stopColor="#C9A14C" />
          <stop offset="1" stopColor="#9A7A2E" />
        </linearGradient>
      </defs>
      {/* 12-point seal */}
      <path
        d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12z"
        fill={`url(#${gid})`}
      />
      {/* bronze keyline for definition on light backgrounds */}
      <path
        d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69l-3.61.82.34 3.69L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12z"
        fill="none"
        stroke="#8A6B28"
        strokeWidth="0.6"
        opacity="0.55"
      />
      {/* the white check — the contrast that sells */}
      <path d="M10.09 16.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48z" fill="#FFFFFF" />
    </svg>
  );
}

export default VerifiedSeal;

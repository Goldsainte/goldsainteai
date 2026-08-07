// Goldsainte Verified — the gold seal.
// Scalloped rosette (instantly readable as "verified") in the house gold,
// deliberately NOT Meta blue. Renders inline beside names at any size.
interface VerifiedSealProps {
  size?: number;
  className?: string;
  title?: string;
}

export function VerifiedSeal({ size = 16, className = "", title = "Goldsainte Verified" }: VerifiedSealProps) {
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
      {/* 12-point scalloped rosette */}
      <path
        d="M12 1.2l2.05 1.7 2.6-.55.98 2.48 2.48.98-.55 2.6L23.26 11l-1.7 2.05.55 2.6-2.48.98-.98 2.48-2.6-.55L12 22.26l-2.05-1.7-2.6.55-.98-2.48-2.48-.98.55-2.6L.74 13.05 2.44 11l-.55-2.6 2.48-.98.98-2.48 2.6.55L12 1.2z"
        fill="#C7A962"
      />
      <path
        d="M12 2.9l1.7 1.41 2.16-.46.81 2.06 2.06.81-.46 2.16L19.68 11l-1.41 1.7.46 2.16-2.06.81-.81 2.06-2.16-.46L12 18.68l-1.7-1.41-2.16.46-.81-2.06-2.06-.81.46-2.16L4.32 11l1.41-1.7-.46-2.16 2.06-.81.81-2.06 2.16.46L12 2.9z"
        fill="#D8BC7A"
        opacity="0.55"
      />
      {/* check */}
      <path
        d="M8.2 12.1l2.4 2.4 5.2-5.2"
        fill="none"
        stroke="#0c4d47"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default VerifiedSeal;

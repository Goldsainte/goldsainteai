export const InstagramVerifiedBadge = () => {
  return (
    <span 
      className="inline-flex items-center ml-1.5 align-middle" 
      aria-hidden="false" 
      role="img" 
      aria-label="Verified account"
    >
      <svg 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        aria-hidden="true"
        className="block"
      >
        <circle cx="12" cy="12" r="11" fill="#0095F6"/>
        <path 
          d="M9.2 12.8l1.7 1.7 4.2-4.8" 
          stroke="#fff" 
          strokeWidth="1.6" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
};

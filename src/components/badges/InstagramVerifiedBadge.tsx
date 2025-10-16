import { useMemo } from 'react';

export const InstagramVerifiedBadge = () => {
  const spikedPath = useMemo(() => {
    const centerX = 12;
    const centerY = 12;
    const outerRadius = 11;
    const innerRadius = 9.5;
    const numPoints = 12;
    
    let path = '';
    for (let i = 0; i < numPoints * 2; i++) {
      const angle = (i * Math.PI) / numPoints;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      path += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
    }
    path += 'Z';
    return path;
  }, []);

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
        <path d={spikedPath} fill="#0095F6"/>
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

'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AnimatedStitchingProps {
  title?: string;
  description?: string;
}

export default function AnimatedStitching({
  title = 'Crafted to Last',
  description = 'Every seam is double-stitched using high-tensile thread, ensuring unparalleled durability without compromising on the elegant silhouette.',
}: AnimatedStitchingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [pathLength, setPathLength] = useState(1200);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto py-24 px-8 flex flex-col md:flex-row items-center gap-12 overflow-hidden"
    >
      <div className="w-full md:w-1/2 relative h-64 md:h-96 flex items-center justify-center">
        <svg 
          viewBox="0 0 400 400" 
          className="w-full h-full max-w-[400px] text-zinc-300 drop-shadow-md"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id="stitching-mask">
              <path 
                ref={pathRef}
                d="M70 70 Q 200 120, 330 70 Q 280 200, 330 330 Q 200 280, 70 330 Q 120 200, 70 70" 
                stroke="white" 
                strokeWidth="10" 
                strokeLinecap="round"
                strokeDasharray={pathLength}
                strokeDashoffset={isVisible ? 0 : pathLength}
                className="transition-all duration-[2000ms] ease-in-out"
                style={{ transitionDelay: '300ms' }}
              />
            </mask>
          </defs>

          {/* Base Fabric Representation */}
          <path 
            d="M50 50 Q 200 100, 350 50 Q 300 200, 350 350 Q 200 300, 50 350 Q 100 200, 50 50" 
            fill="#f4f4f5" 
            stroke="#e4e4e7" 
            strokeWidth="2" 
          />
          
          {/* Static Dashed Line (Masked) */}
          <path 
            d="M70 70 Q 200 120, 330 70 Q 280 200, 330 330 Q 200 280, 70 330 Q 120 200, 70 70" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round"
            strokeDasharray="12 12"
            className="text-foreground"
            mask="url(#stitching-mask)"
          />
        </svg>
      </div>
      
      <div className={`w-full md:w-1/2 space-y-6 transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
        <h3 className="text-3xl md:text-4xl font-serif font-medium tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-lg text-text-muted leading-relaxed max-w-md">
          {description}
        </p>
      </div>
    </div>
  );
}

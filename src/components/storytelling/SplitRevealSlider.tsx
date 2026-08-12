'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface SplitRevealSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt?: string;
  afterAlt?: string;
}

export default function SplitRevealSlider({
  beforeImage,
  afterImage,
  beforeAlt = 'Before',
  afterAlt = 'After',
}: SplitRevealSliderProps) {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setPosition(percent);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    } else {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDragging, onPointerMove, onPointerUp]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full max-w-4xl mx-auto aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100 select-none group shadow-2xl ${isDragging ? 'cursor-ew-resize' : 'cursor-auto'}`}
      onPointerDown={onPointerDown}
      style={{ touchAction: 'none' }}
    >
      {/* Background (After) Image */}
      <div className="absolute inset-0 pointer-events-none">
        <Image
          src={afterImage}
          alt={afterAlt}
          fill
          className="object-cover"
          sizes="(max-width: 1200px) 100vw, 1200px"
          priority
        />
        {/* Label for After */}
        <div className="absolute bottom-4 right-6 bg-black/50 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase shadow-lg">
          {afterAlt}
        </div>
      </div>

      {/* Foreground (Before) Image - Clipped */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)` }}
      >
        <Image
          src={beforeImage}
          alt={beforeAlt}
          fill
          className="object-cover"
          sizes="(max-width: 1200px) 100vw, 1200px"
          priority
        />
        {/* Label for Before */}
        <div className="absolute bottom-4 left-6 bg-black/50 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase shadow-lg">
          {beforeAlt}
        </div>
      </div>

      {/* Divider / Handle */}
      <div 
        className="absolute top-0 bottom-0 z-20 flex items-center justify-center -ml-[1px] w-[2px] bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <div className={`absolute flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-xl text-zinc-800 transition-transform ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L21 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 18L3 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

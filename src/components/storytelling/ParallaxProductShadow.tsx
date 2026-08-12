'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface ParallaxProductShadowProps {
  imageUrl: string;
  imageAlt?: string;
}

export default function ParallaxProductShadow({
  imageUrl,
  imageAlt = 'Product',
}: ParallaxProductShadowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shadowOffset, setShadowOffset] = useState({ x: 0, y: 20 });
  const [productOffset, setProductOffset] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance from center (-1 to 1)
    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);
    
    // Clamp values between -1 and 1 just in case
    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedY = Math.max(-1, Math.min(1, normalizedY));
    
    // Shadow moves opposite to cursor
    setShadowOffset({
      x: clampedX * -30,
      y: 20 + clampedY * -10,
    });
    
    // Product moves slightly towards cursor
    setProductOffset({
      x: clampedX * 10,
      y: clampedY * 10,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Reset to default on leave
    setShadowOffset({ x: 0, y: 20 });
    setProductOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-sm mx-auto aspect-square flex items-center justify-center p-8 group cursor-default"
      style={{ perspective: '1000px' }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Dynamic Shadow Layer */}
        <div 
          className="absolute inset-10 bg-black/40 rounded-full blur-2xl transition-transform duration-300 ease-out"
          style={{
            transform: `translate(${shadowOffset.x}px, ${shadowOffset.y}px) scale(0.8)`,
          }}
        ></div>

        {/* Product Image Layer */}
        <div 
          className="relative w-full h-full transition-transform duration-300 ease-out z-10"
          style={{
            transform: `translate(${productOffset.x}px, ${productOffset.y}px)`,
          }}
        >
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 400px"
            priority
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Rect } from '@/lib/coach-mark/types';
import { buildCutoutSvgPath } from '@/lib/coach-mark/positioning';

interface CoachMarkSpotlightProps {
  targetRect: Rect | null;
  onBackdropClick: () => void;
  prefersReducedMotion?: boolean;
}

export const CoachMarkSpotlight: React.FC<CoachMarkSpotlightProps> = ({
  targetRect,
  onBackdropClick,
  prefersReducedMotion = false,
}) => {
  const [viewportSize, setViewportSize] = useState({ width: 1024, height: 768 });

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  if (!targetRect) return null;

  const path = buildCutoutSvgPath(viewportSize.width, viewportSize.height, targetRect);

  return (
    <div className="fixed inset-0 z-[61] pointer-events-none select-none overflow-hidden">
      {/* SVG Dim Layer with cut-out hole (fill-rule="evenodd" keeps hole transparent and interactive) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${viewportSize.width} ${viewportSize.height}`}
        preserveAspectRatio="none"
      >
        <motion.path
          d={path}
          fill="rgba(0, 0, 0, 0.6)"
          fillRule="evenodd"
          className="pointer-events-auto cursor-pointer"
          onClick={onBackdropClick}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{
            opacity: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
            d: prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
          }}
        />

        {/* Thin 1.5px Accent Ring around the cutout */}
        <motion.rect
          initial={false}
          animate={{
            x: targetRect.x,
            y: targetRect.y,
            width: targetRect.width,
            height: targetRect.height,
            rx: targetRect.rx,
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
          }
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          className="pointer-events-none"
        />
      </svg>
    </div>
  );
};

'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Hotspot } from '@/lib/hotspots/types';

interface HotspotMarkerProps {
  hotspot: Hotspot;
  index: number;
  total: number;
  xPx: number;
  yPx: number;
  isActive: boolean;
  showPulse: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  markerRef?: (el: HTMLButtonElement | null) => void;
}

export const HotspotMarker: React.FC<HotspotMarkerProps> = ({
  hotspot,
  index,
  total,
  xPx,
  yPx,
  isActive,
  showPulse,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onKeyDown,
  markerRef,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      ref={markerRef}
      id={`hotspot-marker-${hotspot.id}`}
      type="button"
      aria-label={`Detail ${hotspot.order || index + 1} of ${total}: ${hotspot.title}`}
      aria-expanded={isActive}
      aria-controls={`hotspot-callout-${hotspot.id}`}
      tabIndex={0}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        duration: 0.25,
        delay: shouldReduceMotion ? 0 : index * 0.08, // Stagger 80ms apart
        ease: 'easeOut',
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      style={{
        left: `${xPx}px`,
        top: `${yPx}px`,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center pointer-events-auto cursor-pointer focus:outline-none group z-10 select-none"
    >
      {/* Pulse: slow outward ring (2s cycle, opacity fading to 0). No glow, strictly matte aesthetic */}
      {showPulse && !shouldReduceMotion && (
        <motion.span
          className="absolute w-[22px] h-[22px] rounded-full border border-white/60 pointer-events-none"
          animate={{
            scale: [1, 1.8],
            opacity: [0.65, 0],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}

      {/* Visible Ring: ~22px circle */}
      <motion.div
        whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
        className={`w-[22px] h-[22px] rounded-full flex items-center justify-center transition-colors duration-200 ${
          isActive
            ? 'border-[1.5px] border-accent bg-black/85 text-accent shadow-none ring-2 ring-accent/30'
            : 'border-[1.5px] border-white/80 group-hover:border-accent bg-black/65 text-white/90 group-hover:text-accent group-focus:border-accent'
        } backdrop-blur-xs focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
      >
        {/* Plus rotates 45 degrees to an "X" when active */}
        <motion.div
          animate={{ rotate: isActive ? 45 : 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.2,
            ease: 'easeOut',
          }}
          className="flex items-center justify-center"
        >
          <Plus size={11} strokeWidth={2.4} />
        </motion.div>
      </motion.div>
    </motion.button>
  );
};

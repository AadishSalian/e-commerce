'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ApertureReveal() {
  const [shouldPlay, setShouldPlay] = useState(true); // Default true to allow SSR rendering
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    // Check preferences and session storage on client
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasPlayedBefore = sessionStorage.getItem('aperture_played_v2');

    if (prefersReducedMotion || hasPlayedBefore) {
      setShouldPlay(false);
    } else {
      sessionStorage.setItem('aperture_played_v2', 'true');
    }
    
    setIsRendered(true);
  }, []);

  // Before hydration, we render the overlay to prevent the page from flashing before the aperture closes.
  // It is hidden by global CSS if data-aperture="played" to prevent black flashes on repeat visits.
  
  if (isRendered && !shouldPlay) {
    return null;
  }

  return (
    <AnimatePresence>
      {shouldPlay && (
        <motion.div
          id="aperture-overlay"
          aria-hidden="true"
          className="fixed inset-0 z-[9999] bg-[#0d0d0d] pointer-events-auto"
          initial={{ clipPath: 'circle(0vmax at 50% 50%)' }}
          animate={{ clipPath: 'circle(150vmax at 50% 50%)' }}
          transition={{
            duration: 1.2,
            delay: 0.3,
            ease: [0.65, 0, 0.35, 1],
          }}
          onAnimationComplete={() => setShouldPlay(false)}
          style={{ willChange: 'clip-path' }}
        >
          {/* Subtle aperture blades effect using conic gradients */}
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{
              background: `repeating-conic-gradient(
                from 0deg,
                transparent 0deg,
                transparent 45deg,
                #ffffff 45deg,
                #ffffff 46deg
              )`
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

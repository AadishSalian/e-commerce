'use client';

import { useEffect, useState } from 'react';
import { motion, useAnimate, AnimatePresence } from 'framer-motion';

export default function BrandReveal() {
  const [shouldPlay, setShouldPlay] = useState(true); // Default true to allow SSR rendering
  const [isRendered, setIsRendered] = useState(false);
  const [scope, animate] = useAnimate();

  useEffect(() => {
    // Check preferences and session storage on client
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasPlayedBefore = sessionStorage.getItem('brand_reveal_played');

    if (prefersReducedMotion || hasPlayedBefore) {
      // eslint-disable-next-line
      setShouldPlay(false);
    } else {
      sessionStorage.setItem('brand_reveal_played', 'true');
    }
    
    setIsRendered(true);
  }, []);

  useEffect(() => {
    if (isRendered && shouldPlay && scope.current) {
      const runAnimation = async () => {
        // 1. Badge appears (fade and scale from 0.6 -> 1)
        await animate('#badge', { scale: 1, opacity: 1 }, { duration: 0.5, ease: 'easeOut' });
        
        // 2. Hold
        await new Promise(r => setTimeout(r, 200));

        // 3. Expand (scale to 80+ to cover screen)
        animate('#badge-text', { opacity: 0 }, { duration: 0.3 });
        await animate('#badge', { scale: 80 }, { duration: 1.1, ease: [0.76, 0, 0.24, 1] });

        // 4. Solid hold (screen is green)
        await new Promise(r => setTimeout(r, 250));

        // 5. Punchy reveal (scale back slightly + opacity to 0)
        animate('#badge', { scale: 70 }, { duration: 0.45, ease: [0.55, 0, 0.1, 1] });
        await animate(scope.current, { opacity: 0 }, { duration: 0.45, ease: [0.55, 0, 0.1, 1] });

        setShouldPlay(false);
      };
      runAnimation();
    }
  }, [isRendered, shouldPlay, animate, scope]);

  if (isRendered && !shouldPlay) {
    return null;
  }

  return (
    <AnimatePresence>
      {shouldPlay && (
        <motion.div
          ref={scope}
          id="intro-overlay"
          aria-hidden="true"
          className="fixed inset-0 z-[9999] bg-[#0d0d0d] flex items-center justify-center pointer-events-auto"
        >
          <motion.div
            id="badge"
            initial={{ scale: 0.6, opacity: 0 }}
            className="w-[120px] h-[120px] md:w-[160px] md:h-[160px] rounded-full bg-[#8ed500] flex items-center justify-center origin-center"
            style={{ willChange: 'transform, opacity' }}
          >
            <motion.span
              id="badge-text"
              className="text-[#141414] font-bold text-xl md:text-3xl tracking-widest"
            >
              MATTE.
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

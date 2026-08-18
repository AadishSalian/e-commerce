'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      role="progressbar"
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-1 bg-accent z-[9999] origin-left shadow-[0_0_10px_rgba(var(--accent),0.5)]"
      style={{ scaleX }}
    />
  );
}

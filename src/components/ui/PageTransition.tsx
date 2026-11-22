'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

/**
 * PageTransition handles subtle page entry polish without layout transforms
 * that could disrupt scroll position restoration on long product listings.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.25,
        ease: 'easeOut',
      }}
      className="w-full flex-grow flex flex-col"
    >
      {children}
    </motion.div>
  );
}


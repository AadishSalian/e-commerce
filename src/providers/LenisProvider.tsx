'use client';

import 'lenis/dist/lenis.css';
import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode, useEffect, useState } from 'react';

function LenisSync() {
  useLenis((lenis) => {
    if (typeof window !== 'undefined') {
      (window as any).__lenis = lenis;
    }
  });
  return null;
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <ReactLenis 
      root 
      options={{ 
        lerp: 0.1,
        smoothWheel: !reduceMotion, 
        syncTouch: false,
      }}
    >
      <LenisSync />
      {children}
    </ReactLenis>
  );
}

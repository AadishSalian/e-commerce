'use client';

import 'lenis/dist/lenis.css';
import { ReactLenis } from 'lenis/react';
import { ReactNode } from 'react';

export function LenisProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis 
      root 
      options={{ 
        lerp: 0.1, 
        duration: 1.2, 
        smoothWheel: true, 
        syncTouch: false 
      }}
    >
      {children}
    </ReactLenis>
  );
}

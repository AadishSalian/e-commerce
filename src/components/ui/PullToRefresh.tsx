'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function PullToRefresh({ children, onRefresh }: { children: React.ReactNode, onRefresh: () => Promise<void> }) {
  const [startY, setStartY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  const maxPullDistance = 100;
  const triggerDistance = 70;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0 || refreshing) return;
      
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      if (distance > 0 && window.scrollY === 0) {
        setPulling(true);
        const easeDistance = distance > maxPullDistance ? maxPullDistance + (distance - maxPullDistance) * 0.2 : distance;
        setPullDistance(easeDistance);
        controls.set({ y: easeDistance });
        
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!pulling) return;
      
      setPulling(false);
      
      if (pullDistance >= triggerDistance) {
        setRefreshing(true);
        controls.start({ y: 50, transition: { type: 'spring', stiffness: 300, damping: 30 } });
        await onRefresh();
        setRefreshing(false);
      }
      
      controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
      setStartY(0);
      setPullDistance(0);
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: true });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [startY, pulling, refreshing, pullDistance, controls, onRefresh]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
        style={{ height: '50px', y: -50 }}
        animate={controls}
      >
        <div className="bg-surface shadow-md rounded-full p-2 flex items-center justify-center mt-8">
          <Loader2 
            className={`w-6 h-6 text-foreground ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: !refreshing ? `rotate(${pullDistance * 2}deg)` : 'none' }}
          />
        </div>
      </motion.div>
      <motion.div animate={controls}>
        {children}
      </motion.div>
    </div>
  );
}

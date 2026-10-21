'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function PullToRefresh({ children, onRefresh }: { children: React.ReactNode, onRefresh: () => Promise<void> }) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const refreshingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);

  refreshingRef.current = refreshing;
  onRefreshRef.current = onRefresh;

  const maxPullDistance = 100;
  const triggerDistance = 70;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        startYRef.current = e.touches[0].clientY;
      } else {
        startYRef.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === 0 || refreshingRef.current) return;
      
      const currentY = e.touches[0].clientY;
      const distance = currentY - startYRef.current;

      if (distance > 8 && window.scrollY <= 0) {
        isPullingRef.current = true;
        const easeDistance = distance > maxPullDistance 
          ? maxPullDistance + (distance - maxPullDistance) * 0.2 
          : distance;
        
        pullDistanceRef.current = easeDistance;
        setPullDistance(easeDistance);
        controls.set({ y: easeDistance });
        
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      startYRef.current = 0;
      if (!isPullingRef.current) return;
      
      isPullingRef.current = false;
      const currentDistance = pullDistanceRef.current;
      pullDistanceRef.current = 0;
      
      if (currentDistance >= triggerDistance) {
        setRefreshing(true);
        await controls.start({ y: 50, transition: { type: 'spring', stiffness: 300, damping: 30 } });
        try {
          await onRefreshRef.current();
        } finally {
          setRefreshing(false);
        }
      }
      
      await controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } });
      setPullDistance(0);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [controls]);

  return (
    <div ref={containerRef} className="relative w-full">
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
        style={{ height: '50px', y: -50, opacity: pullDistance > 0 || refreshing ? 1 : 0 }}
        animate={controls}
      >
        <div className="bg-surface shadow-md rounded-full p-2 flex items-center justify-center">
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

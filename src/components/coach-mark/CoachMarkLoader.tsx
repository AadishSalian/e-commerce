'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useSearchParams } from 'next/navigation';
import { useCoachMarkStore } from '@/store/useCoachMarkStore';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useUIStore } from '@/store/useUIStore';
import { DEFAULT_TOUR_CONFIG } from '@/lib/coach-mark/config';
import { evaluateTourEligibility } from '@/lib/coach-mark/gating';
import { filterValidSteps } from '@/lib/coach-mark/resolver';

// Dynamic import for CoachMarkTour (deferred until eligibility is confirmed)
const DynamicCoachMarkTour = dynamic(
  () => import('./CoachMarkTour').then((mod) => mod.CoachMarkTour),
  { ssr: false }
);

function CoachMarkLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuth();
  const { cartItems } = useCart();
  const isCartOpen = useUIStore((s) => s.isCartOpen);
  const isQuickViewOpen = useUIStore((s) => s.isQuickViewOpen);
  const isCompareOpen = useUIStore((s) => s.isCompareOpen);

  const {
    isActive,
    isManualReentry,
    isQuickTipsOpen,
    startTour,
    setValidSteps,
  } = useCoachMarkStore();

  const [shouldLoadComponent, setShouldLoadComponent] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // If manual re-entry or quick tips is triggered, immediately load and enable the tour
  useEffect(() => {
    if (isManualReentry || isQuickTipsOpen) {
      setShouldLoadComponent(true);
    }
  }, [isManualReentry, isQuickTipsOpen]);

  // Main evaluation and idle startup scheduling
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check pre-eligibility
    const context = {
      pathname,
      searchParams: searchParams || undefined,
      isLoggedIn,
      userOrderCount: 0,
      hasEngagedDeeply: cartItems.length > 0,
      hasActiveOverlays: isCartOpen || isQuickViewOpen || isCompareOpen,
      isIntroComplete: document.documentElement.getAttribute('data-intro') === 'played',
    };

    const result = evaluateTourEligibility(DEFAULT_TOUR_CONFIG, context);

    if (!result.eligible && !isManualReentry) {
      return;
    }

    const scheduleTourStart = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Wait 1.5 to 3 seconds (2000ms) after page stability
      timeoutRef.current = setTimeout(() => {
        // Re-check deep engagement and overlay conflicts before starting
        const latestCartState = cartItems.length > 0;
        const latestOverlays = isCartOpen || isQuickViewOpen || isCompareOpen;
        if (latestCartState || latestOverlays) {
          return;
        }

        const isMobile = window.innerWidth < 768;
        const validSteps = filterValidSteps(DEFAULT_TOUR_CONFIG.steps, isMobile);

        // Section 3: If fewer than two steps are valid, don't start the tour at all
        if (validSteps.length < DEFAULT_TOUR_CONFIG.minValidSteps) {
          return;
        }

        setValidSteps(validSteps.map((v) => v.step));
        setShouldLoadComponent(true);
        startTour({ manual: false, validSteps: validSteps.map((v) => v.step) });
      }, DEFAULT_TOUR_CONFIG.startDelayMs);
    };

    // If intro animation is still pending, wait for brand-reveal-complete event
    const introStatus = document.documentElement.getAttribute('data-intro');
    if (introStatus === 'pending') {
      const handleIntroComplete = () => {
        window.removeEventListener('brand-reveal-complete', handleIntroComplete);
        scheduleTourStart();
      };
      window.addEventListener('brand-reveal-complete', handleIntroComplete);
      return () => {
        window.removeEventListener('brand-reveal-complete', handleIntroComplete);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    } else {
      // Intro already played or skipped
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          scheduleTourStart();
        });
      } else {
        scheduleTourStart();
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [
    pathname,
    searchParams,
    isLoggedIn,
    cartItems.length,
    isCartOpen,
    isQuickViewOpen,
    isCompareOpen,
    isManualReentry,
    setValidSteps,
    startTour,
  ]);

  if (!shouldLoadComponent && !isActive && !isQuickTipsOpen) {
    return null;
  }

  return <DynamicCoachMarkTour />;
}

export const CoachMarkLoader: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <CoachMarkLoaderContent />
    </Suspense>
  );
};

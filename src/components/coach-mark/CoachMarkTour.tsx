'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useCoachMarkStore } from '@/store/useCoachMarkStore';
import { useUIStore } from '@/store/useUIStore';
import {
  isElementVisible,
  isTargetScrolledOutOfBounds,
  resolveTarget,
  scrollTargetIntoView,
} from '@/lib/coach-mark/resolver';
import {
  computeCardPlacement,
  computeCutoutRect,
} from '@/lib/coach-mark/positioning';
import { CoachMarkSpotlight } from './CoachMarkSpotlight';
import { CoachMarkCard } from './CoachMarkCard';
import { QuickTipsModal } from './QuickTipsModal';
import { checkPrefersReducedMotion } from '@/lib/coach-mark/gating';
import { getStorageKey } from '@/lib/coach-mark/persistence';
import { DEFAULT_TOUR_CONFIG } from '@/lib/coach-mark/config';

export const CoachMarkTour: React.FC = () => {
  const pathname = usePathname();
  const {
    isActive,
    currentStepIndex,
    validSteps,
    targetRect,
    cardPlacement,
    isQuickTipsOpen,
    nextStep,
    skipTour,
    interruptTour,
    setTargetGeometry,
    startTour,
    closeQuickTips,
  } = useCoachMarkStore();

  const isCartOpen = useUIStore((s) => s.isCartOpen);
  const isQuickViewOpen = useUIStore((s) => s.isQuickViewOpen);
  const isCompareOpen = useUIStore((s) => s.isCompareOpen);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const prevActiveElementRef = useRef<HTMLElement | null>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Check reduced motion on mount
  useEffect(() => {
    setPrefersReducedMotion(checkPrefersReducedMotion());
  }, []);

  // Save active element on tour start and restore on tour end
  useEffect(() => {
    if (isActive) {
      if (typeof document !== 'undefined') {
        prevActiveElementRef.current = document.activeElement as HTMLElement | null;
      }
    } else {
      if (prevActiveElementRef.current && typeof prevActiveElementRef.current.focus === 'function') {
        try {
          prevActiveElementRef.current.focus();
        } catch {}
        prevActiveElementRef.current = null;
      }
    }
  }, [isActive]);

  // Interrupt if another overlay opens mid-tour
  useEffect(() => {
    if (isActive && (isCartOpen || isQuickViewOpen || isCompareOpen)) {
      interruptTour('overlay_opened');
    }
  }, [isActive, isCartOpen, isQuickViewOpen, isCompareOpen, interruptTour]);

  // Interrupt on SPA route changes
  const initialPathRef = useRef(pathname);
  useEffect(() => {
    if (isActive && initialPathRef.current !== pathname) {
      interruptTour('route_change');
    }
    initialPathRef.current = pathname;
  }, [isActive, pathname, interruptTour]);

  // Multi-tab sync: listen for storage events from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      const targetKey = getStorageKey(DEFAULT_TOUR_CONFIG.id, DEFAULT_TOUR_CONFIG.version);
      if (e.key === targetKey && isActive) {
        try {
          const parsed = JSON.parse(e.newValue || '{}');
          if (parsed.status === 'completed' || parsed.status === 'skipped') {
            skipTour('close_button');
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isActive, skipTour]);

  // Keyboard navigation: Escape key exits
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        skipTour('esc_key');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, skipTour]);

  // Position update function
  const updateGeometry = useCallback(() => {
    const target = currentTargetRef.current;
    if (!target || !isElementVisible(target)) {
      return;
    }

    // Check if target scrolled out of bounds
    if (isTargetScrolledOutOfBounds(target, 160)) {
      interruptTour('scroll_out_of_bounds');
      return;
    }

    const isRTL = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const currentStep = validSteps[currentStepIndex];
    if (!currentStep) return;

    const rect = computeCutoutRect(target, 6);
    const placement = computeCardPlacement(rect, {
      preferredPlacement: currentStep.placement,
      isRTL,
    });

    setTargetGeometry(rect, placement);
  }, [validSteps, currentStepIndex, setTargetGeometry, interruptTour]);

  // Throttled rAF loop for layout/scroll tracking
  const scheduleUpdate = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(() => {
      updateGeometry();
    });
  }, [updateGeometry]);

  // Active step lifecycle: resolve target, scroll into view, announce, attach listeners
  useEffect(() => {
    if (!isActive) {
      currentTargetRef.current = null;
      setTargetGeometry(null, null);
      return;
    }

    const currentStep = validSteps[currentStepIndex];
    if (!currentStep) {
      return;
    }

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const target = resolveTarget(currentStep, isMobile);

    if (!target) {
      // Step's target is missing or hidden: advance silently or end
      if (currentStepIndex < validSteps.length - 1) {
        nextStep();
      } else {
        skipTour('close_button');
      }
      return;
    }

    currentTargetRef.current = target;

    // Smoothly scroll into view if offscreen
    scrollTargetIntoView(target, prefersReducedMotion, 80);

    // Initial geometry calculation
    updateGeometry();

    // Screen reader polite live region announcement
    const text = `Step ${currentStepIndex + 1} of ${validSteps.length}: ${currentStep.title}. ${
      currentStep.body
    }. Control: ${currentStep.controlName}.`;
    setAnnouncement(text);

    // Track layout changes via ResizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      resizeObserverRef.current = new ResizeObserver(() => {
        scheduleUpdate();
      });
      resizeObserverRef.current.observe(target);
      resizeObserverRef.current.observe(document.body);
    }

    // Listen to scroll, resize, and orientation
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });
    window.addEventListener('orientationchange', scheduleUpdate, { passive: true });

    // Allow user to tap the real control directly
    const handleTargetInteraction = () => {
      // Small timeout so control action (e.g. search click) completes
      setTimeout(() => {
        nextStep();
      }, 50);
    };

    target.addEventListener('click', handleTargetInteraction, { once: true });

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('orientationchange', scheduleUpdate);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      target.removeEventListener('click', handleTargetInteraction);
    };
  }, [isActive, currentStepIndex, validSteps, nextStep, skipTour, prefersReducedMotion, scheduleUpdate, updateGeometry, setTargetGeometry]);

  const currentStep = validSteps[currentStepIndex];

  return (
    <>
      {/* Polite Screen Reader Live Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isActive ? announcement : ''}
      </div>

      {/* Interactive Framer Motion Spotlight & Tooltip Card */}
      <AnimatePresence>
        {isActive && targetRect && cardPlacement && currentStep && (
          <React.Fragment key="tour-overlay-active">
            <CoachMarkSpotlight
              targetRect={targetRect}
              onBackdropClick={() => skipTour('dim_click')}
              prefersReducedMotion={prefersReducedMotion}
            />

            <CoachMarkCard
              step={currentStep}
              stepIndex={currentStepIndex}
              totalSteps={validSteps.length}
              placement={cardPlacement}
              onNext={nextStep}
              onSkip={() => skipTour('skip_button')}
              onClose={() => skipTour('close_button')}
              prefersReducedMotion={prefersReducedMotion}
            />
          </React.Fragment>
        )}
      </AnimatePresence>

      {/* Accessible Static Quick Tips Modal */}
      <QuickTipsModal
        isOpen={isQuickTipsOpen}
        onClose={closeQuickTips}
        onStartInteractiveTour={() => startTour({ manual: true })}
      />
    </>
  );
};

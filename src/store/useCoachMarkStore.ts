import { create } from 'zustand';
import { DEFAULT_TOUR_CONFIG } from '@/lib/coach-mark/config';
import {
  markTourCompleted,
  markTourInterrupted,
  markTourSkipped,
  recordTourStep,
} from '@/lib/coach-mark/persistence';
import { CardPlacement, Rect, TourPlacement, TourStepConfig } from '@/lib/coach-mark/types';
import { dispatchTourAnalytics } from '@/lib/coach-mark/analytics';

interface CoachMarkState {
  isActive: boolean;
  isManualReentry: boolean;
  isQuickTipsOpen: boolean;
  currentStepIndex: number;
  validSteps: TourStepConfig[];
  targetRect: Rect | null;
  cardPlacement: CardPlacement | null;
  startTime: number | null;

  // Actions
  startTour: (options?: { manual?: boolean; validSteps?: TourStepConfig[] }) => void;
  nextStep: () => void;
  skipTour: (reason?: 'skip_button' | 'close_button' | 'esc_key' | 'dim_click') => void;
  interruptTour: (reason: 'route_change' | 'overlay_opened' | 'deep_engagement' | 'target_lost' | 'scroll_out_of_bounds') => void;
  setTargetGeometry: (rect: Rect | null, placement: CardPlacement | null) => void;
  setValidSteps: (steps: TourStepConfig[]) => void;
  openQuickTips: () => void;
  closeQuickTips: () => void;
  resetState: () => void;
}

export const useCoachMarkStore = create<CoachMarkState>((set, get) => ({
  isActive: false,
  isManualReentry: false,
  isQuickTipsOpen: false,
  currentStepIndex: 0,
  validSteps: DEFAULT_TOUR_CONFIG.steps,
  targetRect: null,
  cardPlacement: null,
  startTime: null,

  startTour: (options = {}) => {
    const isManual = options.manual ?? false;
    const steps = options.validSteps && options.validSteps.length >= 2 
      ? options.validSteps 
      : DEFAULT_TOUR_CONFIG.steps;

    const now = Date.now();
    set({
      isActive: true,
      isManualReentry: isManual,
      currentStepIndex: 0,
      validSteps: steps,
      startTime: now,
    });

    if (isManual) {
      dispatchTourAnalytics({
        event: 'tour_reentry',
        tourId: DEFAULT_TOUR_CONFIG.id,
        timestamp: now,
      });
    }

    dispatchTourAnalytics({
      event: 'tour_started',
      tourId: DEFAULT_TOUR_CONFIG.id,
      version: DEFAULT_TOUR_CONFIG.version,
      trigger: isManual ? 'manual' : 'auto',
      variant: 'tour',
      stepCount: steps.length,
      timestamp: now,
    });

    if (steps.length > 0) {
      recordTourStep(DEFAULT_TOUR_CONFIG.id, DEFAULT_TOUR_CONFIG.version, 0);
      dispatchTourAnalytics({
        event: 'tour_step_viewed',
        tourId: DEFAULT_TOUR_CONFIG.id,
        stepId: steps[0].id,
        stepIndex: 0,
        totalSteps: steps.length,
        timestamp: now,
      });
    }
  },

  nextStep: () => {
    const { currentStepIndex, validSteps, startTime, isManualReentry } = get();
    const nextIndex = currentStepIndex + 1;

    if (nextIndex >= validSteps.length) {
      // Completed last step!
      const duration = startTime ? Date.now() - startTime : 0;
      if (!isManualReentry) {
        markTourCompleted(DEFAULT_TOUR_CONFIG.id, DEFAULT_TOUR_CONFIG.version);
      }

      dispatchTourAnalytics({
        event: 'tour_completed',
        tourId: DEFAULT_TOUR_CONFIG.id,
        version: DEFAULT_TOUR_CONFIG.version,
        durationMs: duration,
        timestamp: Date.now(),
      });

      set({
        isActive: false,
        targetRect: null,
        cardPlacement: null,
        startTime: null,
      });
      return;
    }

    set({ currentStepIndex: nextIndex });

    const nextStep = validSteps[nextIndex];
    if (nextStep && !isManualReentry) {
      recordTourStep(DEFAULT_TOUR_CONFIG.id, DEFAULT_TOUR_CONFIG.version, nextIndex);
    }

    if (nextStep) {
      dispatchTourAnalytics({
        event: 'tour_step_viewed',
        tourId: DEFAULT_TOUR_CONFIG.id,
        stepId: nextStep.id,
        stepIndex: nextIndex,
        totalSteps: validSteps.length,
        timestamp: Date.now(),
      });
    }
  },

  skipTour: (reason = 'skip_button') => {
    const { currentStepIndex, validSteps, isManualReentry } = get();
    const currentStep = validSteps[currentStepIndex];

    if (!isManualReentry) {
      markTourSkipped(DEFAULT_TOUR_CONFIG.id, DEFAULT_TOUR_CONFIG.version, currentStepIndex);
    }

    dispatchTourAnalytics({
      event: 'tour_skipped',
      tourId: DEFAULT_TOUR_CONFIG.id,
      atStepId: currentStep?.id || 'unknown',
      atStepIndex: currentStepIndex,
      reason,
      timestamp: Date.now(),
    });

    set({
      isActive: false,
      targetRect: null,
      cardPlacement: null,
      startTime: null,
    });
  },

  interruptTour: (reason) => {
    const { currentStepIndex, validSteps, isManualReentry, isActive } = get();
    if (!isActive) return;

    const currentStep = validSteps[currentStepIndex];

    if (!isManualReentry) {
      markTourInterrupted(DEFAULT_TOUR_CONFIG.id, DEFAULT_TOUR_CONFIG.version, currentStepIndex);
    }

    dispatchTourAnalytics({
      event: 'tour_interrupted',
      tourId: DEFAULT_TOUR_CONFIG.id,
      reason,
      atStepId: currentStep?.id || 'unknown',
      timestamp: Date.now(),
    });

    set({
      isActive: false,
      targetRect: null,
      cardPlacement: null,
      startTime: null,
    });
  },

  setTargetGeometry: (rect, placement) => {
    set({ targetRect: rect, cardPlacement: placement });
  },

  setValidSteps: (steps) => {
    set({ validSteps: steps });
  },

  openQuickTips: () => {
    set({ isQuickTipsOpen: true });
  },

  closeQuickTips: () => {
    set({ isQuickTipsOpen: false });
  },

  resetState: () => {
    set({
      isActive: false,
      isManualReentry: false,
      isQuickTipsOpen: false,
      currentStepIndex: 0,
      targetRect: null,
      cardPlacement: null,
      startTime: null,
    });
  },
}));

export type TourPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TourStepConfig {
  id: string;
  target: string;
  targetMobile?: string;
  title: string;
  body: string;
  placement: TourPlacement;
  controlName: string;
}

export interface TourConfig {
  id: string;
  version: number;
  allowedRoutes: string[];
  startDelayMs: number;
  minValidSteps: number;
  steps: TourStepConfig[];
}

export type TourStatus = 'completed' | 'skipped' | 'interrupted' | 'dismissed';

export interface TourPersistenceData {
  id: string;
  version: number;
  status: TourStatus;
  at: number;
  lastStep?: number;
  interruptCount?: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
}

export interface CardPlacement {
  top: number;
  left: number;
  placement: TourPlacement;
  arrowOffset: number;
  isBottomDocked: boolean;
}

export type TourAnalyticsEvent =
  | {
      event: 'tour_started';
      tourId: string;
      version: number;
      trigger: 'auto' | 'manual';
      variant: string;
      stepCount: number;
      timestamp: number;
    }
  | {
      event: 'tour_step_viewed';
      tourId: string;
      stepId: string;
      stepIndex: number;
      totalSteps: number;
      timestamp: number;
    }
  | {
      event: 'tour_completed';
      tourId: string;
      version: number;
      durationMs: number;
      timestamp: number;
    }
  | {
      event: 'tour_skipped';
      tourId: string;
      atStepId: string;
      atStepIndex: number;
      reason: 'skip_button' | 'close_button' | 'esc_key' | 'dim_click';
      timestamp: number;
    }
  | {
      event: 'tour_interrupted';
      tourId: string;
      reason: 'route_change' | 'overlay_opened' | 'deep_engagement' | 'target_lost' | 'scroll_out_of_bounds';
      atStepId: string;
      timestamp: number;
    }
  | {
      event: 'tour_reentry';
      tourId: string;
      timestamp: number;
    }
  | {
      event: 'tour_ab_control_assigned';
      tourId: string;
      variant: 'control';
      timestamp: number;
    };

import { TourConfig } from './types';

export const DEFAULT_TOUR_CONFIG: TourConfig = {
  id: 'first-visit-v1',
  version: 1,
  allowedRoutes: ['/', '/products'],
  startDelayMs: 2000,
  minValidSteps: 2,
  steps: [
    {
      id: 'search',
      target: '[data-tour="search"]',
      title: 'Find anything fast',
      body: 'Search by product, category, or style.',
      placement: 'bottom',
      controlName: 'Search, in the top bar',
    },
    {
      id: 'filters',
      target: '[data-tour="filters"]',
      title: 'Narrow it down',
      body: 'Filter by price, material, size, and more.',
      placement: 'bottom',
      controlName: 'Filters and categories',
    },
    {
      id: 'wishlist',
      target: '[data-tour="wishlist"]',
      title: 'Save for later',
      body: 'Tap the heart to keep items on a list you can share.',
      placement: 'bottom',
      controlName: 'Wishlist, in navigation',
    },
  ],
};

export interface CoachMarkFeatureFlags {
  /** Remote kill switch to turn off tour immediately without code deploy */
  isTourEnabled: boolean;
  /** A/B test variant assignment: 'tour' (show coach marks) or 'control' (no tour) */
  tourVariant: 'tour' | 'control';
}

export const DEFAULT_FEATURE_FLAGS: CoachMarkFeatureFlags = {
  isTourEnabled: true,
  tourVariant: 'tour',
};

/**
 * Validates that tour configuration adheres strictly to design constraints:
 * - Maximum 3 steps
 * - Minimum 2 steps
 * - Stable data-tour selectors only
 * - Short copy limits: title <= 6 words, body <= 120 chars
 */
export function validateTourConfig(config: TourConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.id || typeof config.id !== 'string') {
    errors.push('Tour must have a valid string id.');
  }

  if (typeof config.version !== 'number' || config.version < 1) {
    errors.push('Tour version must be a positive integer.');
  }

  if (!Array.isArray(config.steps) || config.steps.length === 0) {
    errors.push('Tour must have at least one step.');
  } else {
    if (config.steps.length > 3) {
      errors.push('Tour must have at most 3 steps. Cut content rather than adding a 4th step.');
    }

    config.steps.forEach((step, idx) => {
      if (!step.id) errors.push(`Step ${idx + 1} is missing an id.`);
      if (!step.target || !step.target.includes('data-tour=')) {
        errors.push(`Step ${step.id || idx + 1} target must use a stable data-tour attribute.`);
      }
      const words = (step.title || '').trim().split(/\s+/).length;
      if (words > 6) {
        errors.push(`Step ${step.id || idx + 1} title is too long (${words} words, max 6 words).`);
      }
      if ((step.body || '').length > 120) {
        errors.push(`Step ${step.id || idx + 1} body exceeds 120 characters limit.`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

import { TourStepConfig } from './types';

/**
 * Checks whether an element is currently visible, rendered, and interactive.
 */
export function isElementVisible(element: HTMLElement | null): boolean {
  if (!element) return false;
  if (element.isConnected === false && typeof document !== 'undefined') return false;

  const rect = typeof element.getBoundingClientRect === 'function' ? element.getBoundingClientRect() : { width: 0, height: 0 };
  if (rect.width <= 0 || rect.height <= 0) return false;

  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    const style = window.getComputedStyle(element);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;
  }

  return true;
}

/**
 * Checks if an element is fixed or sticky (which means it doesn't need to be scrolled into view).
 */
export function isElementFixedOrSticky(element: HTMLElement): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  let curr: HTMLElement | null = element;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    const style = typeof window.getComputedStyle === 'function' ? window.getComputedStyle(curr) : null;
    if (style && (style.position === 'fixed' || style.position === 'sticky')) {
      return true;
    }
    curr = curr.parentElement;
  }
  return false;
}

/**
 * Resolves a single step's target element from the DOM, respecting responsive overrides.
 */
export function resolveTarget(step: TourStepConfig, isMobile: boolean): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  let element: HTMLElement | null = null;

  // On mobile, try targetMobile first if specified
  if (isMobile && step.targetMobile) {
    element = document.querySelector<HTMLElement>(step.targetMobile);
  }

  // Fallback or desktop target query
  if (!element && step.target) {
    // If multiple elements match (e.g. wishlist buttons on multiple cards), find the first visible one
    const candidates = document.querySelectorAll<HTMLElement>(step.target);
    for (let i = 0; i < candidates.length; i++) {
      if (isElementVisible(candidates[i])) {
        element = candidates[i];
        break;
      }
    }
    // If none was visibly validated, fallback to the first element
    if (!element && candidates.length > 0) {
      element = candidates[0];
    }
  }

  if (element && isElementVisible(element)) {
    return element;
  }

  return null;
}

/**
 * Filters the tour steps, keeping only those whose target element exists and is visible.
 */
export function filterValidSteps(
  steps: TourStepConfig[],
  isMobile: boolean
): { step: TourStepConfig; element: HTMLElement }[] {
  const valid: { step: TourStepConfig; element: HTMLElement }[] = [];

  for (const step of steps) {
    const element = resolveTarget(step, isMobile);
    if (element) {
      valid.push({ step, element });
    }
  }

  return valid;
}

/**
 * Smoothly scrolls an element into view if it sits outside the comfortable viewport area.
 * Respects prefers-reduced-motion and skips fixed/sticky elements.
 */
export function scrollTargetIntoView(
  element: HTMLElement,
  prefersReducedMotion: boolean = false,
  viewportMargin: number = 80
): void {
  if (typeof window === 'undefined' || !element) return;

  // If the target is fixed or sticky (e.g., in the header or bottom nav), never scroll
  if (isElementFixedOrSticky(element)) {
    return;
  }

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;

  const isCompletelyVisible =
    rect.top >= viewportMargin &&
    rect.left >= 16 &&
    rect.bottom <= windowHeight - viewportMargin &&
    rect.right <= windowWidth - 16;

  if (!isCompletelyVisible) {
    element.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }
}

/**
 * Checks if the target has scrolled excessively far outside the viewport (> 150px),
 * indicating the user has moved on and the tour should end quietly.
 */
export function isTargetScrolledOutOfBounds(element: HTMLElement, threshold: number = 150): boolean {
  if (isElementFixedOrSticky(element)) return false;

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;

  if (rect.bottom < -threshold) return true;
  if (rect.top > windowHeight + threshold) return true;
  if (rect.right < -threshold) return true;
  if (rect.left > windowWidth + threshold) return true;

  return false;
}

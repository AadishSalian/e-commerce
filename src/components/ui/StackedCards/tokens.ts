/**
 * Design tokens, mathematical utilities, and layout validators for StackedCards.
 * Calibrated for a quiet, matte, and honest scroll-linked experience.
 */

export const STACKED_CARDS_TOKENS = {
  /** Default pin line offset in px below top of viewport on desktop */
  defaultStackTopDesktop: 84,

  /** Default pin line offset in px below top of viewport on mobile */
  defaultStackTopMobile: 72,

  /** Peek strip height in px visible above the active card on desktop */
  defaultStackPeekDesktop: 20,

  /** Peek strip height in px visible above the active card on mobile */
  defaultStackPeekMobile: 16,

  /** Depth scale decrement per covered card on desktop */
  scaleFactorDesktop: 0.035,

  /** Depth scale decrement per covered card on mobile/tablet */
  scaleFactorMobile: 0.02,

  /** Maximum opacity of the matte dimming overlay */
  maxDimOpacity: 0.35,

  /** Minimum viewport height (px) below which stacking falls back to flow list */
  minViewportHeight: 600,

  /** Card count bounds (3 to 5 cards for optimal story pacing) */
  minCards: 3,
  maxCards: 5,

  /** Default margin between card tracks controlling linger duration */
  defaultCardMarginBottom: '10svh',

  /** Entrance animation tokens (reveal on first activation) */
  entranceDuration: 0.5,
  entranceEase: [0.16, 1, 0.3, 1] as const,
  entranceTranslateY: 16,

  /** Distinct tone progression for dark theme layers */
  darkTones: ['#141414', '#181818', '#1c1c1c', '#202020', '#242424'],

  /** Distinct tone progression for light theme layers */
  lightTones: ['#ffffff', '#fafaf9', '#f5f5f3', '#f0f0ed', '#ebebe8'],
} as const;

/**
 * Computes the minimum scale a card reaches when fully covered by the rest of the stack.
 * Cards deeper in the stack shrink slightly more to convey spatial perspective.
 * The last card does not shrink (returns 1.0).
 */
export function computeTargetScale(
  cardIndex: number,
  totalCards: number,
  scaleFactor: number = STACKED_CARDS_TOKENS.scaleFactorDesktop
): number {
  if (cardIndex >= totalCards - 1) {
    return 1.0;
  }
  const stackDepth = totalCards - 1 - cardIndex;
  const target = 1.0 - stackDepth * scaleFactor;
  // Floor at 0.85 to preserve legibility and layout stability
  return Math.max(0.85, Math.round(target * 1000) / 1000);
}

/**
 * Computes the sticky top offset in pixels for card i:
 * top = stackTop + i * stackPeek
 */
export function computeCardTopOffset(
  cardIndex: number,
  stackTop: number = STACKED_CARDS_TOKENS.defaultStackTopDesktop,
  stackPeek: number = STACKED_CARDS_TOKENS.defaultStackPeekDesktop
): number {
  return stackTop + cardIndex * stackPeek;
}

/**
 * Retrieves the surface background tone for a card at a given index.
 */
export function getCardTone(cardIndex: number, isDark: boolean = true): string {
  const tones = isDark ? STACKED_CARDS_TOKENS.darkTones : STACKED_CARDS_TOKENS.lightTones;
  const clampedIndex = Math.min(Math.max(0, cardIndex), tones.length - 1);
  return tones[clampedIndex];
}

/**
 * Validates card count against optimal deck storytelling range (3 to 5 cards).
 */
export function validateCardCount(count: number): { isValid: boolean; message?: string } {
  if (count < STACKED_CARDS_TOKENS.minCards) {
    return {
      isValid: false,
      message: `[StackedCards] Received ${count} cards. Fewer than 3 cards does not read as a deck stack. Consider adding more steps or using standard cards.`,
    };
  }
  if (count > STACKED_CARDS_TOKENS.maxCards) {
    return {
      isValid: false,
      message: `[StackedCards] Received ${count} cards. More than 5 cards makes the stacked section feel endless and burdens scroll pace. Consider splitting into multiple sections.`,
    };
  }
  return { isValid: true };
}

/**
 * Dev-mode validation utility that walks up the DOM tree from the sticky container
 * to identify CSS properties on ancestors known to break position: sticky.
 */
export function checkStickyAncestors(element: HTMLElement | null): {
  hasOverflowIssue: boolean;
  hasTransformIssue: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let hasOverflowIssue = false;
  let hasTransformIssue = false;

  if (!element || typeof window === 'undefined') {
    return { hasOverflowIssue, hasTransformIssue, issues };
  }

  let current = element.parentElement;
  while (current && current !== document.body && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const overflowValues = `${style.overflow} ${style.overflowX} ${style.overflowY}`.toLowerCase();

    if (
      overflowValues.includes('hidden') ||
      overflowValues.includes('auto') ||
      overflowValues.includes('scroll')
    ) {
      hasOverflowIssue = true;
      const tag = current.tagName.toLowerCase();
      const cls = current.className ? `.${current.className.split(' ').join('.')}` : '';
      issues.push(`Ancestor <${tag}${cls}> has overflow: "${overflowValues}". Use overflow: clip instead.`);
    }

    if (
      style.transform !== 'none' ||
      style.filter !== 'none' ||
      style.perspective !== 'none'
    ) {
      hasTransformIssue = true;
      const tag = current.tagName.toLowerCase();
      const cls = current.className ? `.${current.className.split(' ').join('.')}` : '';
      issues.push(
        `Ancestor <${tag}${cls}> has transform/filter/perspective ("${style.transform || style.filter}"), which creates a new containing block and disables position: sticky.`
      );
    }

    current = current.parentElement;
  }

  return { hasOverflowIssue, hasTransformIssue, issues };
}

import React from 'react';

export interface StackedCardImage {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface StackedCardLink {
  href: string;
  label: string;
  isExternal?: boolean;
}

export interface StackedCardItem {
  /** Unique identifier for the card and deep-linking anchor */
  id: string;

  /** Number or uppercase eyebrow text (e.g. "01", "STEP 01", "PHILOSOPHY") */
  eyebrow?: string;

  /** Main card headline (rendered at h3 semantic level) */
  title: string;

  /** Explanatory narrative body (text or rich node) */
  body: string | React.ReactNode;

  /** Optional card visual (image path string or image object) */
  image?: string | StackedCardImage;

  /** Optional single link / CTA */
  link?: StackedCardLink;

  /** Optional small pill badge */
  badge?: string;

  /** Optional explicit ghost numeral string (defaults to padded index like "01") */
  ghostNumeral?: string;

  /** Optional per-card tone overrides */
  toneShift?: {
    dark?: string;
    light?: string;
  };

  /** Optional custom child content rendered inside the card */
  customContent?: React.ReactNode;
}

export interface StackedCardsProps {
  /** Section HTML id for in-page anchor navigation */
  id?: string;

  /** Optional section landmark heading */
  title?: string;

  /** Optional section eyebrow */
  eyebrow?: string;

  /** Optional section introductory narrative */
  description?: string;

  /**
   * The list of sequence items.
   * Recommended: 3 to 5 cards (calm, paced, memorable story).
   */
  cards: StackedCardItem[];

  /**
   * Sticky pin line offset in pixels below the top of viewport / navbar.
   * Defaults to reading from layout token or 84px on desktop / 72px on mobile.
   */
  stackTop?: number;

  /**
   * Visible strip height (in px) of earlier pinned cards peeking above active card.
   * Default: 20px (desktop), 16px (mobile).
   */
  stackPeek?: number;

  /**
   * Safe clearance gap from bottom of viewport (for mobile bottom tabs & safe areas).
   * Automatically integrates with `useBottomStackOffset` when omitted.
   */
  stackBottomGap?: number;

  /**
   * Spacing between card tracks (controlling linger duration before next card covers).
   * Default: '10svh' (8 to 12svh recommended).
   */
  cardMarginBottom?: string;

  /**
   * Depth scaling factor per covered layer.
   * Default: 0.035 (desktop), 0.02 (mobile).
   */
  scaleFactor?: number;

  /**
   * Maximum opacity of the dim overlay as card gets covered.
   * Default: 0.35.
   */
  maxDimOpacity?: number;

  /**
   * Whether to display the quiet discrete section progress indicator ("02 / 05").
   * Default: true.
   */
  showProgress?: boolean;

  /**
   * Whether to render subtle low-contrast ghost numerals behind content.
   * Default: true (automatically hidden on small mobile screens).
   */
  showGhostNumerals?: boolean;

  /**
   * Viewport height threshold below which stacking is disabled in favor of flow list.
   * Default: 600px.
   */
  minViewportHeight?: number;

  /** Optional container CSS class name */
  className?: string;

  /** Optional container inline styles */
  style?: React.CSSProperties;
}

'use client';

import React from 'react';
import { useReducedMotion } from 'framer-motion';
import styles from './RollingText.module.css';
import {
  MAX_LABEL_LENGTH,
  STAGGER_DEFAULT_DELAY,
  STAGGER_MAX_TOTAL,
  isComplexScript,
  splitGraphemes,
} from './tokens';

// Safe styles fallback for environments where CSS module exports differ
const s = (styles as any)?.container ? styles : ((styles as any)?.default || styles || {});

export interface RollingTextProps {
  /** Short text string to roll on hover/focus. Cap is ~24 chars. */
  children: string;

  /**
   * Optional letter-by-letter stagger for editorial hero and large navigation links.
   * If true or a number, characters roll sequentially.
   * Automatically falls back to whole-label roll for complex/connected scripts
   * (Arabic, Devanagari, Tamil, Thai, etc.) or when reduced motion is preferred.
   */
  stagger?: boolean | number;

  /** Additional CSS class names on the container */
  className?: string;

  /** Additional CSS class names on the inner line spans */
  lineClassName?: string;

  /** Container HTML element ('span' by default, or 'div') */
  as?: 'span' | 'div';

  /**
   * Explicit color for the duplicate line rolling in from below.
   * Useful when the roll doubles as a color transition (e.g., accent color or white for button wipe).
   */
  duplicateColor?: string;

  /** Base color for the visible line at rest */
  baseColor?: string;

  /** Controlled hover/focus state (when driven by parent motion state or custom controller) */
  isHovered?: boolean;
}

export const RollingText = React.forwardRef<HTMLElement, RollingTextProps>(
  (
    {
      children,
      stagger = false,
      className = '',
      lineClassName = '',
      as: Component = 'span',
      duplicateColor,
      baseColor,
      isHovered,
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    // Guard against non-string input safely
    const text = typeof children === 'string' ? children : String(children ?? '');

    // Edge case: Long labels (> 24 chars) fallback to plain text with dev warning
    if (text.length > MAX_LABEL_LENGTH) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `[RollingText] Label "${text}" exceeds the ${MAX_LABEL_LENGTH}-character cap (${text.length} chars). ` +
            `Falling back to a static label to protect layout stability.`
        );
      }
      return (
        <Component
          ref={ref as any}
          className={`inline-block transition-colors duration-200 ${className}`}
        >
          {text}
        </Component>
      );
    }

    // Determine if stagger should be enabled
    const wantsStagger = Boolean(stagger) && !prefersReducedMotion;
    const hasComplexScript = isComplexScript(text);
    const shouldStagger = wantsStagger && !hasComplexScript;

    // Custom CSS properties for colors
    const customStyle: React.CSSProperties = {
      ...(baseColor ? { '--roll-base-color': baseColor } : {}),
      ...(duplicateColor ? { '--roll-duplicate-color': duplicateColor } : {}),
    } as React.CSSProperties;

    const rolledClass = isHovered ? (s.isRolled || 'isRolled') : '';

    // Staggered letter-by-letter mode (for editorial / hero links)
    if (shouldStagger) {
      const graphemes = splitGraphemes(text);
      const requestedDelay = typeof stagger === 'number' ? stagger : STAGGER_DEFAULT_DELAY;
      const charCount = graphemes.length;
      const delayPerChar =
        charCount > 1 ? Math.min(requestedDelay, STAGGER_MAX_TOTAL / (charCount - 1)) : 0;

      return (
        <Component
          ref={ref as any}
          className={`${s.charContainer || 'charContainer'} ${rolledClass} ${className}`}
          style={customStyle}
          data-roll="stagger"
          role="text"
          aria-label={text}
        >
          {graphemes.map((char, index) => {
            const delaySeconds = Math.round(index * delayPerChar * 1000) / 1000;
            const displayChar = char === ' ' ? '\u00A0' : char;

            return (
              <span
                key={`${index}-${char}`}
                className={s.charItem || 'charItem'}
                aria-hidden="true"
              >
                <span
                  className={`${s.charLine || 'charLine'} ${s.charPrimary || 'charPrimary'} ${lineClassName}`}
                  style={{ transitionDelay: `${delaySeconds}s` }}
                >
                  {displayChar}
                </span>
                <span
                  className={`${s.charLine || 'charLine'} ${s.charDuplicate || 'charDuplicate'} ${lineClassName}`}
                  style={{ transitionDelay: `${delaySeconds}s` }}
                  aria-hidden="true"
                >
                  {displayChar}
                </span>
              </span>
            );
          })}
        </Component>
      );
    }

    // Standard whole-label roll (default, robust, zero JS overhead)
    return (
      <Component
        ref={ref as any}
        className={`${s.container || 'container'} ${rolledClass} ${className}`}
        style={customStyle}
        data-roll="label"
      >
        <span
          className={`${s.line || 'line'} ${s.primary || 'primary'} ${lineClassName}`}
          aria-hidden="false"
        >
          {text}
        </span>
        <span
          className={`${s.line || 'line'} ${s.duplicate || 'duplicate'} ${lineClassName}`}
          aria-hidden="true"
        >
          {text}
        </span>
      </Component>
    );
  }
);

RollingText.displayName = 'RollingText';

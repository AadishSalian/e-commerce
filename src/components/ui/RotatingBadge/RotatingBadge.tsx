'use client';

import React, { useId, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  motion,
  useMotionValue,
  useSpring,
  useAnimationFrame,
  useReducedMotion,
  useScroll,
  useVelocity,
} from 'framer-motion';
import { resolveBadgePreset, TRUST_POLICIES } from '@/config/trustPolicies';
import { RotatingBadgeProps, BadgeIconType } from './types';
import {
  BADGE_FX,
  getCircularPathData,
  formatSeamlessCircularText,
  isComplexScript,
  isNoisyRoute,
} from './tokens';
import { CenterBadgeIcon } from './icons';
import styles from './RotatingBadge.module.css';

// Safe styles fallback for environments where CSS module exports differ (e.g. Node tests / CJS)
const s = (styles as any)?.badgeContainer ? styles : ((styles as any)?.default || styles || {});

export function RotatingBadge({
  preset,
  text,
  accessibleLabel,
  icon,
  href,
  size = 'responsive',
  speed = BADGE_FX.defaultSpeed,
  direction = 'clockwise',
  corner = 'bottom-right',
  separator = BADGE_FX.defaultSeparator,
  accentSeparators = true,
  repeats,
  showInnerRing = true,
  showDisc = true,
  entranceComplete = true,
  enableScrollBoost = false,
  minTextDisplaySize = BADGE_FX.minTextDisplaySize,
  policyKey,
  className = '',
  style = {},
}: RotatingBadgeProps) {
  const pathname = usePathname();
  const rawId = useId();
  const pathId = `seal-path-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // 1. Resolve configuration from preset or props
  let resolvedPhrase = text;
  let resolvedAccessibleLabel = accessibleLabel;
  let resolvedHref = href;
  let resolvedIcon: BadgeIconType | React.ReactNode = icon;

  const activePresetKey = preset || (!text ? 'returns-30' : undefined);
  const presetConfig = activePresetKey ? resolveBadgePreset(activePresetKey) : null;
  if (presetConfig) {
    if (!resolvedPhrase) resolvedPhrase = presetConfig.phrase;
    if (!resolvedAccessibleLabel) resolvedAccessibleLabel = presetConfig.accessibleLabel;
    if (resolvedHref === undefined) resolvedHref = presetConfig.href;
    if (!resolvedIcon) resolvedIcon = presetConfig.icon;
  }

  // Evaluation of display suppression rules
  const isPresetInactive = Boolean(activePresetKey && !presetConfig);
  const isPolicyDisabled = Boolean(policyKey && !TRUST_POLICIES[policyKey]?.enabled);
  const isNoisy = isNoisyRoute(pathname);
  const hasNoPhrase = !resolvedPhrase || !resolvedPhrase.trim();
  const shouldHide = isNoisy || isPolicyDisabled || isPresetInactive || hasNoPhrase;

  // 2. React Hooks (Unconditionally called at top level per React Rules of Hooks)
  const containerRef = useRef<HTMLElement | null>(null);
  const textRef = useRef<SVGTextElement | null>(null);

  const shouldReduceMotion = useReducedMotion();
  const rotation = useMotionValue(0);
  const targetSpeedMultiplier = useMotionValue(1);
  const smoothSpeed = useSpring(targetSpeedMultiplier, BADGE_FX.springDeceleration);

  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { stiffness: 180, damping: 28 });

  const hasEnteredRef = useRef(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);
  const [measuredCircumference, setMeasuredCircumference] = useState<number>(BADGE_FX.circumference);

  const isVisibleRef = useRef(true);
  const isTabVisibleRef = useRef(true);

  // Format phrase with seamless repeating gaps
  const formatted = formatSeamlessCircularText(resolvedPhrase || '', separator, repeats);
  const finalAccessibleLabel =
    resolvedAccessibleLabel ||
    `${(resolvedPhrase || '').replace(new RegExp(`[\\s${separator}]+`, 'g'), ' ').trim()}${
      resolvedHref ? '. View details' : ''
    }`;

  // Visibility and Intersection Observer to pause RAF when offscreen or tab hidden
  useEffect(() => {
    if (shouldHide || typeof window === 'undefined') return;

    const handleVisibility = () => {
      isTabVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window && containerRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          isVisibleRef.current = entry.isIntersecting;
        },
        { threshold: 0.05 }
      );
      observer.observe(containerRef.current);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (observer) observer.disconnect();
    };
  }, [shouldHide]);

  // Measure text length after web fonts are completely ready
  useEffect(() => {
    if (shouldHide || typeof document === 'undefined') return;

    let isMounted = true;

    const checkFit = () => {
      if (!isMounted || !textRef.current) return;
      try {
        const textLen = textRef.current.getComputedTextLength();
        if (textLen > 0) {
          setMeasuredCircumference(textLen);
        }
      } catch {
        // Fallback in environments where getComputedTextLength is unmocked
      }
      setFontsReady(true);
    };

    if ('fonts' in document && document.fonts && typeof document.fonts.ready?.then === 'function') {
      document.fonts.ready.then(checkFit).catch(checkFit);
    } else {
      checkFit();
    }

    return () => {
      isMounted = false;
    };
  }, [shouldHide, formatted.fullText]);

  // Entrance coordination: fade and scale in once hero reveal finishes
  useEffect(() => {
    if (!shouldHide && entranceComplete && !hasEnteredRef.current) {
      hasEnteredRef.current = true;
      setHasEntered(true);
    }
  }, [shouldHide, entranceComplete]);

  // Clamp speed to safe readable range
  const clampedSpeed = Math.max(BADGE_FX.minSpeed, Math.min(BADGE_FX.maxSpeed, speed));

  // Per-frame compositor rotation with silky deceleration and battery conservation
  useAnimationFrame((_time, delta) => {
    if (
      shouldHide ||
      shouldReduceMotion ||
      !isVisibleRef.current ||
      !isTabVisibleRef.current ||
      !hasEntered
    ) {
      return;
    }

    const currentSpeedMultiplier = smoothSpeed.get();
    if (currentSpeedMultiplier <= 0.0001) {
      return;
    }

    let scrollBoost = 0;
    if (enableScrollBoost) {
      const v = Math.abs(smoothVelocity.get());
      scrollBoost = Math.min(0.4, v / 2500); // subtle capped boost during scroll
    }

    // Degrees per millisecond: 360 / (clampedSpeed * 1000)
    const degPerMs = 360 / (clampedSpeed * 1000);
    const dirFactor = direction === 'counter-clockwise' ? -1 : 1;
    const nextAngle =
      (rotation.get() + dirFactor * degPerMs * delta * (currentSpeedMultiplier + scrollBoost)) %
      360;
    rotation.set(nextAngle);
  });

  // Pointer & Focus slowdown handlers (disabled for touch to prevent sticky hover)
  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    targetSpeedMultiplier.set(0);
  };

  const handlePointerLeave = () => {
    targetSpeedMultiplier.set(1);
  };

  const handleFocus = () => {
    targetSpeedMultiplier.set(0);
  };

  const handleBlur = () => {
    targetSpeedMultiplier.set(1);
  };

  // 3. Early return if suppressed by policy, noisy page, or empty content
  if (shouldHide) {
    return null;
  }

  // Internationalization: fallback to static pill if complex script cannot bend safely on path
  if (isComplexScript(resolvedPhrase || '')) {
    return (
      <ComplexScriptPill
        phrase={resolvedPhrase || ''}
        accessibleLabel={finalAccessibleLabel}
        icon={resolvedIcon}
        href={resolvedHref}
        corner={corner}
        className={className}
        style={style}
      />
    );
  }

  // Determine if compact size drops the circular text
  const isNumericSize = typeof size === 'number';
  const isCompactSeal = isNumericSize && size < minTextDisplaySize;

  // Corner positioning classes
  const cornerClass =
    corner === 'bottom-right'
      ? s.cornerBottomRight
      : corner === 'bottom-left'
      ? s.cornerBottomLeft
      : corner === 'top-right'
      ? s.cornerTopRight
      : corner === 'top-left'
      ? s.cornerTopLeft
      : s.cornerNone;

  // Sizing classes and inline style
  const sizeClass =
    size === 'responsive'
      ? s.sizeResponsive
      : size === 'sm'
      ? s.sizeSm
      : size === 'md'
      ? s.sizeMd
      : size === 'lg'
      ? s.sizeLg
      : '';

  const dynamicStyle: React.CSSProperties = {
    ...style,
    ...(isNumericSize ? { width: `${size}px`, height: `${size}px` } : {}),
  };

  // SVG Geometry
  const pathData = getCircularPathData(
    BADGE_FX.textPathRadius,
    BADGE_FX.center,
    BADGE_FX.center,
    'clockwise'
  );

  // Split formatted phrase to highlight separator bullets if configured
  const renderTextSpans = () => {
    if (!accentSeparators) {
      return formatted.fullText;
    }

    const parts = formatted.fullText.split(formatted.separator);
    return parts.map((part, index) => {
      const isLast = index === parts.length - 1;
      return (
        <React.Fragment key={index}>
          <tspan className={s.textSegment}>{part}</tspan>
          {!isLast && <tspan className={s.separatorGlyph}>{formatted.separator}</tspan>}
        </React.Fragment>
      );
    });
  };

  const badgeContent = (
    <svg
      viewBox={`0 0 ${BADGE_FX.viewBoxSize} ${BADGE_FX.viewBoxSize}`}
      className={s.badgeSvg}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path id={pathId} d={pathData} fill="none" />
      </defs>

      {/* Layer 1: Optional Matte Surface Disc */}
      {showDisc && (
        <circle
          cx={BADGE_FX.center}
          cy={BADGE_FX.center}
          r={BADGE_FX.outerDiscRadius}
          className={s.badgeDisc}
        />
      )}

      {/* Layer 2: Optional Hairline Inner Ring */}
      {showInnerRing && (
        <circle
          cx={BADGE_FX.center}
          cy={BADGE_FX.center}
          r={BADGE_FX.innerRingRadius}
          className={s.badgeInnerRing}
        />
      )}

      {/* Layer 3: Rotating Text Ring (Omitted on compact size < 64px) */}
      {!isCompactSeal && (
        <motion.g
          style={{
            rotate: shouldReduceMotion ? 0 : rotation,
            transformOrigin: `${BADGE_FX.center}px ${BADGE_FX.center}px`,
          }}
          className={s.rotatingGroup}
        >
          <text
            ref={textRef}
            fontSize={BADGE_FX.fontSize}
            fontWeight={BADGE_FX.fontWeight}
            className={`${s.badgeText} ${
              fontsReady ? s.badgeTextReady : s.badgeTextLoading
            }`}
            dominantBaseline="central"
          >
            <textPath
              href={`#${pathId}`}
              startOffset="0"
              textLength={measuredCircumference || BADGE_FX.circumference}
              lengthAdjust="spacing"
            >
              {renderTextSpans()}
            </textPath>
          </text>
        </motion.g>
      )}

      {/* Layer 4: Static Center Icon */}
      <g className={s.centerIconGroup}>
        {typeof resolvedIcon === 'string' ? (
          <CenterBadgeIcon type={resolvedIcon as BadgeIconType} />
        ) : (
          resolvedIcon
        )}
      </g>
    </svg>
  );

  const containerClasses = `${s.badgeContainer} ${cornerClass} ${sizeClass} ${
    resolvedHref ? s.linkWrapper : s.decorativeWrapper
  } ${className}`;

  // Interactive link element
  if (resolvedHref) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: hasEntered ? 1 : 0,
          scale: hasEntered ? 1 : 0.9,
        }}
        transition={{
          duration: BADGE_FX.entranceDuration,
          ease: BADGE_FX.entranceEase,
        }}
        className={containerClasses}
        style={dynamicStyle}
      >
        <Link
          ref={containerRef as React.Ref<HTMLAnchorElement>}
          href={resolvedHref}
          aria-label={finalAccessibleLabel}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full h-full block rounded-full"
        >
          {badgeContent}
        </Link>
      </motion.div>
    );
  }

  // Non-interactive decorative element
  return (
    <motion.div
      ref={containerRef as React.Ref<HTMLDivElement>}
      role="img"
      aria-label={finalAccessibleLabel}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: hasEntered ? 1 : 0,
        scale: hasEntered ? 1 : 0.9,
      }}
      transition={{
        duration: BADGE_FX.entranceDuration,
        ease: BADGE_FX.entranceEase,
      }}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={containerClasses}
      style={dynamicStyle}
    >
      {badgeContent}
    </motion.div>
  );
}

/**
 * Fallback component for complex scripts (Devanagari, Arabic, Tamil)
 * where textPath bending breaks ligatures and typography.
 */
function ComplexScriptPill({
  phrase,
  accessibleLabel,
  icon,
  href,
  corner,
  className = '',
  style = {},
}: {
  phrase: string;
  accessibleLabel: string;
  icon?: BadgeIconType | React.ReactNode;
  href?: string;
  corner?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const cornerClass =
    corner === 'bottom-right'
      ? s.cornerBottomRight
      : corner === 'bottom-left'
      ? s.cornerBottomLeft
      : corner === 'top-right'
      ? s.cornerTopRight
      : corner === 'top-left'
      ? s.cornerTopLeft
      : s.cornerNone;

  const content = (
    <>
      {typeof icon === 'string' ? (
        <svg viewBox="0 0 120 120" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
          <CenterBadgeIcon type={icon as BadgeIconType} />
        </svg>
      ) : (
        icon
      )}
      <span>{phrase}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={accessibleLabel}
        className={`${s.fallbackPill} ${cornerClass} ${className}`}
        style={style}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      role="img"
      aria-label={accessibleLabel}
      className={`${s.fallbackPill} ${cornerClass} ${className}`}
      style={style}
    >
      {content}
    </div>
  );
}

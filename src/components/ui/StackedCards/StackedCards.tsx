'use client';

import React, { useId, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
} from 'framer-motion';
import { useBottomStackOffset } from '@/lib/compare/bottomStack';
import { StackedCardsProps, StackedCardItem } from './types';
import {
  STACKED_CARDS_TOKENS,
  computeTargetScale,
  computeCardTopOffset,
  getCardTone,
  validateCardCount,
  checkStickyAncestors,
} from './tokens';
import styles from './StackedCards.module.css';

// Safe styles fallback for environments where CSS module exports differ (e.g. Node tests / CJS)
const s = (styles as any)?.sectionWrapper ? styles : ((styles as any)?.default || styles || {});

export function StackedCards({
  id,
  title,
  eyebrow,
  description,
  cards,
  stackTop,
  stackPeek,
  stackBottomGap,
  cardMarginBottom = STACKED_CARDS_TOKENS.defaultCardMarginBottom,
  scaleFactor,
  maxDimOpacity = STACKED_CARDS_TOKENS.maxDimOpacity,
  showProgress = true,
  showGhostNumerals = true,
  minViewportHeight = STACKED_CARDS_TOKENS.minViewportHeight,
  className = '',
  style = {},
}: StackedCardsProps) {
  const generatedId = useId();
  const headingId = `stacked-cards-heading-${generatedId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Screen and viewport measurements
  const [isMobile, setIsMobile] = useState(false);
  const [isShortViewport, setIsShortViewport] = useState(false);
  const [isContentOverflowing, setIsContentOverflowing] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Dynamic bottom stack offset (mobile bottom nav bar ~64px + safe area + compare tray)
  const bottomOffset = useBottomStackOffset(isMobile);

  const resolvedStackTop =
    stackTop ?? (isMobile ? STACKED_CARDS_TOKENS.defaultStackTopMobile : STACKED_CARDS_TOKENS.defaultStackTopDesktop);
  const resolvedStackPeek =
    stackPeek ?? (isMobile ? STACKED_CARDS_TOKENS.defaultStackPeekMobile : STACKED_CARDS_TOKENS.defaultStackPeekDesktop);
  const resolvedBottomGap = stackBottomGap ?? Math.max(32, bottomOffset + (isMobile ? 16 : 24));
  const resolvedScaleFactor =
    scaleFactor ?? (isMobile ? STACKED_CARDS_TOKENS.scaleFactorMobile : STACKED_CARDS_TOKENS.scaleFactorDesktop);

  // Section-wide scroll progress for the discrete progress indicator
  const { scrollYProgress: sectionScrollProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(sectionScrollProgress, 'change', (latest) => {
    if (cards.length === 0) return;
    const discreteIndex = Math.min(cards.length - 1, Math.max(0, Math.floor(latest * cards.length)));
    setActiveCardIndex(discreteIndex);
  });

  // Viewport resize listener for responsive thresholds
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsShortViewport(window.innerHeight < minViewportHeight);
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [minViewportHeight]);

  // Dev-mode verification checks for ancestor overflows and card count
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      const countCheck = validateCardCount(cards.length);
      if (!countCheck.isValid && countCheck.message) {
        console.warn(countCheck.message);
      }

      const ancestorCheck = checkStickyAncestors(containerRef.current);
      if (ancestorCheck.hasOverflowIssue || ancestorCheck.hasTransformIssue) {
        ancestorCheck.issues.forEach((issue) => console.warn(`[StackedCards] ${issue}`));
      }
    }
  }, [cards.length]);

  // Content-fit rule: verify that pinned cards do not exceed available viewport height
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const availableHeight = window.innerHeight - resolvedStackTop - resolvedBottomGap;
    const cardInners = containerRef.current.querySelectorAll<HTMLElement>(`.${s.cardInner}`);

    let overflowDetected = false;
    cardInners.forEach((el, idx) => {
      if (el.scrollHeight > availableHeight + 2) {
        overflowDetected = true;
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[StackedCards] Card "${cards[idx]?.id || idx}" content height (${el.scrollHeight}px) exceeds available pinned viewport (${availableHeight}px). Falling back to flow list to prevent unreachable content.`
          );
        }
      }
    });

    setIsContentOverflowing(overflowDetected);
  }, [cards, resolvedStackTop, resolvedBottomGap]);

  // Stacking is disabled if reduced motion is requested, viewport is short, or content overflows
  const isStackingDisabled = Boolean(shouldReduceMotion || isShortViewport || isContentOverflowing);

  const containerDynamicStyle: React.CSSProperties = {
    ...style,
    '--stack-top': `${resolvedStackTop}px`,
    '--stack-peek': `${resolvedStackPeek}px`,
    '--stack-bottom-gap': `${resolvedBottomGap}px`,
    '--card-margin': cardMarginBottom,
  } as React.CSSProperties;

  return (
    <section
      id={id}
      ref={containerRef}
      aria-labelledby={title ? headingId : undefined}
      className={`${s.sectionWrapper} ${isStackingDisabled ? s.unstackedSection : ''} ${className}`}
      style={containerDynamicStyle}
    >
      {/* Optional Section Landmark Header */}
      {(title || eyebrow || description) && (
        <div className={s.header}>
          {eyebrow && (
            <span className="text-xs uppercase tracking-widest text-accent font-semibold block">
              {eyebrow}
            </span>
          )}
          {title && (
            <h2 id={headingId} className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-text-muted text-base md:text-xl leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Discrete Section Progress Indicator (quiet rail, decoration only) */}
      {showProgress && !isStackingDisabled && cards.length > 1 && (
        <div className={s.progressRail} aria-hidden="true">
          <span className={s.progressBadge}>
            0{activeCardIndex + 1} <span className="opacity-40">/ 0{cards.length}</span>
          </span>
        </div>
      )}

      {/* Main Ordered List of Cards */}
      <div className={s.cardsContainer}>
        <ol className={s.cardsList}>
          {cards.map((card, index) => (
            <SingleCardItem
              key={card.id}
              card={card}
              index={index}
              totalCards={cards.length}
              isStackingDisabled={isStackingDisabled}
              scaleFactor={resolvedScaleFactor}
              maxDimOpacity={maxDimOpacity}
              showGhostNumerals={showGhostNumerals}
              stackTop={resolvedStackTop}
              stackPeek={resolvedStackPeek}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

interface SingleCardItemProps {
  card: StackedCardItem;
  index: number;
  totalCards: number;
  isStackingDisabled: boolean;
  scaleFactor: number;
  maxDimOpacity: number;
  showGhostNumerals: boolean;
  stackTop: number;
  stackPeek: number;
}

function SingleCardItem({
  card,
  index,
  totalCards,
  isStackingDisabled,
  scaleFactor,
  maxDimOpacity,
  showGhostNumerals,
  stackTop,
  stackPeek,
}: SingleCardItemProps) {
  const trackRef = useRef<HTMLLIElement | null>(null);
  const hasRevealedRef = useRef(false);
  const [hasRevealed, setHasRevealed] = useState(false);

  // Track scroll progression relative to viewport as next card covers this card
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end start'],
  });

  const isLastCard = index === totalCards - 1;
  const targetScale = computeTargetScale(index, totalCards, scaleFactor);

  // Motion values driven by useTransform (zero React re-renders during scroll)
  const scale = useTransform(scrollYProgress, [0, 1], [1, isLastCard ? 1 : targetScale]);
  const dimOpacity = useTransform(scrollYProgress, [0, 1], [0, isLastCard ? 0 : maxDimOpacity]);
  const yShift = useTransform(scrollYProgress, [0, 1], [0, isLastCard ? 0 : -(totalCards - 1 - index) * 4]);

  // Keyboard navigation & accessibility focus handling
  const handleFocusCapture = () => {
    if (trackRef.current) {
      // Scroll to card's pinned position when focused by keyboard tabbing
      trackRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  };

  // Entrance reveal: fires once when card enters view, never replays on scroll back up
  const handleViewportEnter = () => {
    if (!hasRevealedRef.current) {
      hasRevealedRef.current = true;
      setHasRevealed(true);
    }
  };

  const topOffsetPx = computeCardTopOffset(index, stackTop, stackPeek);
  const cardTone = card.toneShift?.dark || getCardTone(index, true);

  const cardStyle: React.CSSProperties = {
    '--card-index': index,
    '--card-bg': cardTone,
  } as React.CSSProperties;

  // Resolve image source and attributes
  const imageSrc = typeof card.image === 'string' ? card.image : card.image?.src;
  const imageAlt = typeof card.image === 'object' ? card.image?.alt || card.title : card.title;
  const ghostNumeralText = card.ghostNumeral || (index + 1 < 10 ? `0${index + 1}` : `${index + 1}`);

  return (
    <li
      id={card.id}
      ref={trackRef}
      className={s.cardTrack}
      style={cardStyle}
      onFocusCapture={handleFocusCapture}
    >
      <div
        className={s.cardSticky}
        style={
          isStackingDisabled
            ? undefined
            : {
                top: `${topOffsetPx}px`,
                scrollMarginTop: `${topOffsetPx}px`,
              }
        }
      >
        <motion.div
          className={s.cardInner}
          style={
            isStackingDisabled
              ? undefined
              : {
                  scale,
                  y: yShift,
                  transformOrigin: 'top center',
                }
          }
          onViewportEnter={handleViewportEnter}
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Dimming overlay as card is covered (opacity animation, no brightness filter) */}
          {!isStackingDisabled && !isLastCard && (
            <motion.div
              className={s.dimOverlay}
              style={{ opacity: dimOpacity }}
              aria-hidden="true"
            />
          )}

          {/* Ghost Numeral behind content */}
          {showGhostNumerals && (
            <span className={s.ghostNumeral} aria-hidden="true">
              {ghostNumeralText}
            </span>
          )}

          {/* Inner content revealing once with subtle fade & upward translate */}
          <motion.div
            className={s.cardGrid}
            initial={{ opacity: 0, y: isStackingDisabled ? 0 : STACKED_CARDS_TOKENS.entranceTranslateY }}
            animate={{
              opacity: hasRevealed || isStackingDisabled ? 1 : 0,
              y: hasRevealed || isStackingDisabled ? 0 : STACKED_CARDS_TOKENS.entranceTranslateY,
            }}
            transition={{
              duration: STACKED_CARDS_TOKENS.entranceDuration,
              ease: STACKED_CARDS_TOKENS.entranceEase,
            }}
          >
            {/* Text narrative column */}
            <div className={s.textColumn}>
              <div className="flex items-center gap-3">
                {card.eyebrow && (
                  <span className="text-xs uppercase tracking-widest text-accent font-bold">
                    {card.eyebrow}
                  </span>
                )}
                {card.badge && (
                  <span className="text-[11px] uppercase tracking-wider text-text-muted bg-surface-hover border border-border px-2 py-0.5 rounded-full font-medium">
                    {card.badge}
                  </span>
                )}
              </div>

              <h3 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
                {card.title}
              </h3>

              <div className="text-text-muted text-base md:text-lg leading-relaxed font-light">
                {typeof card.body === 'string' ? <p>{card.body}</p> : card.body}
              </div>

              {card.customContent && (
                <div className="mt-2">{card.customContent}</div>
              )}

              {card.link && (
                <div className="pt-2">
                  <Link
                    href={card.link.href}
                    className={s.cardLink}
                    target={card.link.isExternal ? '_blank' : undefined}
                    rel={card.link.isExternal ? 'noopener noreferrer' : undefined}
                  >
                    <span>{card.link.label}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Optional Image column */}
            {imageSrc && (
              <div className={s.imageColumn}>
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                  priority={index === 0}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </li>
  );
}

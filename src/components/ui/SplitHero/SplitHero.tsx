'use client';

import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Play, Pause } from 'lucide-react';
import {
  SplitHeroProps,
  SplitHalfConfig,
} from './types';
import {
  SPLIT,
  SPLIT_HERO_TOKENS,
  validateHalvesCount,
  computeFlexGrow,
  computeWidthPercentage,
  clampDescriptor,
  getInitialClipPath,
  getFinalClipPath,
} from './tokens';
import styles from './SplitHero.module.css';

// Safe styles fallback for environments where CSS module exports differ (e.g. Node tests / CJS)
const s = (styles as any)?.splitHero ? styles : ((styles as any)?.default || styles || {});

/**
 * SplitHero
 * Reusable full-viewport split hero with hover-expansion.
 * Features calm, precise motion, inclusive escape hatch, 60fps hardware acceleration,
 * zero layout shift, and strict WCAG AA matte accessibility.
 */
export function SplitHero({
  halves,
  shopAll = {
    label: 'Shop all',
    href: '/products',
    ariaLabel: 'Shop all collections without selecting a category',
  },
  pageTitle = 'MATTE. — Architectural Essentials & Precision Hardware',
  isH1Hidden = true,
  className = '',
  forceNeutral = false,
  rememberLastChoice = false,
  storageKey = 'matte_split_hero_last_choice',
  dir = 'ltr',
  navbarHeight = SPLIT_HERO_TOKENS.defaultNavbarHeight,
  onActiveChange,
  testId = 'split-hero',
}: SplitHeroProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const componentId = useId();

  // Validate halves configuration
  const isValidConfig = validateHalvesCount(halves);
  const safeHalves = isValidConfig ? halves : halves.slice(0, 2);

  // Single Source of Truth for active half: null = neutral 50/50, "id" = expanded
  const [activeId, setActiveId] = useState<string | null>(null);

  // Entrance sequence state
  const [entranceCompleted, setEntranceCompleted] = useState<boolean>(false);
  const [isClient, setIsClient] = useState<boolean>(false);

  // Environmental capabilities & screen size states
  const [isFinePointer, setIsFinePointer] = useState<boolean>(true);
  const [isShortViewport, setIsShortViewport] = useState<boolean>(false);
  const [isStackedMobile, setIsStackedMobile] = useState<boolean>(false);
  const [mediaErrors, setMediaErrors] = useState<Record<string, boolean>>({});

  // Video playback management
  const [isDataSaverOrSlow, setIsDataSaverOrSlow] = useState<boolean>(false);
  const [videoPausedByUser, setVideoPausedByUser] = useState<boolean>(false);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const heroRef = useRef<HTMLElement | null>(null);

  // Timers and hover intent queues
  const hoverIntentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const returnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingHoverIdRef = useRef<string | null>(null);

  // 1. Initial hydration and environment detection
  useEffect(() => {
    setIsClient(true);

    // Detect data-saver and slow connections
    if (typeof navigator !== 'undefined') {
      const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      if (conn?.saveData || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g') {
        setIsDataSaverOrSlow(true);
      }
    }

    // Media query evaluation
    const checkEnvironment = () => {
      const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const isShort = window.innerHeight < SPLIT_HERO_TOKENS.shortViewportHeightThreshold;
      const isMobile = window.innerWidth < SPLIT_HERO_TOKENS.mobileBreakpoint;

      setIsFinePointer(hasFinePointer);
      setIsShortViewport(isShort);
      setIsStackedMobile(isMobile);
    };

    checkEnvironment();
    window.addEventListener('resize', checkEnvironment);
    return () => window.removeEventListener('resize', checkEnvironment);
  }, []);

  // 2. Coordinated entrance sequence (after site intro / BrandReveal finishes)
  useEffect(() => {
    if (!isClient) return;

    const startEntrance = () => {
      // Check session storage to skip entrance on repeat visits
      const hasSeenIntro = sessionStorage.getItem('split_hero_intro_seen');
      if (hasSeenIntro || prefersReducedMotion) {
        setEntranceCompleted(true);
        if (pendingHoverIdRef.current) {
          handleHoverIntent(pendingHoverIdRef.current);
          pendingHoverIdRef.current = null;
        }
        return;
      }

      // Play entrance clip and staggered text reveal
      const timer = setTimeout(() => {
        sessionStorage.setItem('split_hero_intro_seen', 'true');
        setEntranceCompleted(true);

        // Process any pending cursor hover queued during load
        if (pendingHoverIdRef.current) {
          handleHoverIntent(pendingHoverIdRef.current);
          pendingHoverIdRef.current = null;
        }
      }, SPLIT_HERO_TOKENS.entranceTotalSequence * 1000);

      return () => clearTimeout(timer);
    };

    // Check if BrandReveal intro is still pending
    const dataIntro = document.documentElement.getAttribute('data-intro');
    const brandRevealPlayed = sessionStorage.getItem('brand_reveal_played');

    if (dataIntro === 'played' || brandRevealPlayed || prefersReducedMotion) {
      startEntrance();
    } else {
      // Listen for custom completion event from BrandReveal
      const onBrandRevealComplete = () => {
        startEntrance();
      };

      window.addEventListener('brand-reveal-complete', onBrandRevealComplete);

      // Fallback timeout in case event is missed (BrandReveal takes max 2.6s)
      const fallbackTimer = setTimeout(() => {
        startEntrance();
      }, 2600);

      return () => {
        window.removeEventListener('brand-reveal-complete', onBrandRevealComplete);
        clearTimeout(fallbackTimer);
      };
    }
  }, [isClient, prefersReducedMotion]);

  // 3. Hover Intent Handler
  const handleHoverIntent = useCallback(
    (halfId: string) => {
      // If expansion disabled by environment or config, ignore
      if (forceNeutral || !isFinePointer || isShortViewport || isStackedMobile) {
        return;
      }

      // If entrance is still executing, queue pending hover
      if (!entranceCompleted) {
        pendingHoverIdRef.current = halfId;
        return;
      }

      // Cancel pending return timer
      if (returnTimerRef.current) {
        clearTimeout(returnTimerRef.current);
        returnTimerRef.current = null;
      }

      // Clear previous hover intent timer
      if (hoverIntentTimerRef.current) {
        clearTimeout(hoverIntentTimerRef.current);
      }

      // Debounce with hoverIntentDelay (90ms)
      hoverIntentTimerRef.current = setTimeout(() => {
        setActiveId(halfId);
        onActiveChange?.(halfId);

        // Prefetch route on intent
        const targetHalf = safeHalves.find((h) => h.id === halfId);
        if (targetHalf?.href) {
          router.prefetch(targetHalf.href);
        }
      }, SPLIT.hoverIntentDelay);
    },
    [forceNeutral, isFinePointer, isShortViewport, isStackedMobile, entranceCompleted, onActiveChange, safeHalves, router]
  );

  // 4. Pointer Leave Hero Handler (after returnDelay 300ms)
  const handlePointerLeaveHero = useCallback(() => {
    // Clear pending hover intent
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
    pendingHoverIdRef.current = null;

    if (!activeId) return;

    // Delay returning to neutral 50/50 state
    returnTimerRef.current = setTimeout(() => {
      setActiveId(null);
      onActiveChange?.(null);
    }, SPLIT.returnDelay);
  }, [activeId, onActiveChange]);

  // 5. Keyboard Focus Handlers
  const handleHalfFocus = useCallback(
    (halfId: string) => {
      if (forceNeutral || isShortViewport || isStackedMobile) return;

      if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
      if (hoverIntentTimerRef.current) clearTimeout(hoverIntentTimerRef.current);

      setActiveId(halfId);
      onActiveChange?.(halfId);

      const targetHalf = safeHalves.find((h) => h.id === halfId);
      if (targetHalf?.href) {
        router.prefetch(targetHalf.href);
      }
    },
    [forceNeutral, isShortViewport, isStackedMobile, onActiveChange, safeHalves, router]
  );

  const handleShopAllFocus = useCallback(() => {
    if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    if (hoverIntentTimerRef.current) clearTimeout(hoverIntentTimerRef.current);

    setActiveId(null);
    onActiveChange?.(null);
  }, [onActiveChange]);

  const handleHeroBlur = useCallback(
    (e: React.FocusEvent) => {
      // If focus moved outside the SplitHero container, return to neutral
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setActiveId(null);
        onActiveChange?.(null);
      }
    },
    [onActiveChange]
  );

  // 6. Navigation click handler (optional choice persistence)
  const handleHalfClick = useCallback(
    (half: SplitHalfConfig) => {
      if (rememberLastChoice && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(storageKey, half.id);
        } catch {
          // Ignore private mode storage quota issues
        }
      }
    },
    [rememberLastChoice, storageKey]
  );

  // 7. IntersectionObserver and Visibility for Video Playback
  useEffect(() => {
    if (typeof window === 'undefined' || !heroRef.current) return;

    const currentHero = heroRef.current;
    let isIntersecting = true;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting;
          updateVideoPlayback();
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(currentHero);

    const handleVisibilityChange = () => {
      updateVideoPlayback();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const updateVideoPlayback = () => {
      const shouldPlay =
        isIntersecting &&
        !document.hidden &&
        !prefersReducedMotion &&
        !isDataSaverOrSlow &&
        !videoPausedByUser;

      Object.values(videoRefs.current).forEach((video) => {
        if (!video) return;
        if (shouldPlay) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    };

    updateVideoPlayback();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [prefersReducedMotion, isDataSaverOrSlow, videoPausedByUser]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverIntentTimerRef.current) clearTimeout(hoverIntentTimerRef.current);
      if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    };
  }, []);

  // Determine actual interactive expansion capability
  const isExpansionActive =
    !forceNeutral &&
    !prefersReducedMotion &&
    isFinePointer &&
    !isShortViewport &&
    !isStackedMobile;

  const effectiveActiveId = isExpansionActive ? activeId : null;

  return (
    <section
      ref={heroRef}
      id={`split-hero-${componentId}`}
      data-testid={testId}
      aria-label="Shop by category"
      className={`${s.splitHero} ${className}`}
      dir={dir}
      style={{
        height: navbarHeight && navbarHeight !== '0px' ? `calc(100svh - ${navbarHeight})` : '100svh',
      }}
      onPointerLeave={handlePointerLeaveHero}
      onBlur={handleHeroBlur}
    >
      {/* Preload hero images for LCP performance */}
      {safeHalves[0]?.image && (
        <link
          rel="preload"
          as="image"
          href={safeHalves[0].image.src}
          imageSrcSet={safeHalves[0].image.srcset || safeHalves[0].image.srcSet}
          fetchPriority="high"
        />
      )}
      {safeHalves[1]?.image && (
        <link
          rel="preload"
          as="image"
          href={safeHalves[1].image.src}
          imageSrcSet={safeHalves[1].image.srcset || safeHalves[1].image.srcSet}
        />
      )}

      {/* Accessible Page H1 (Visually hidden by default to keep editorial cleanliness) */}
      <h1 className={isH1Hidden ? 'sr-only' : 'sr-only'}>{pageTitle}</h1>

      {/* Shared Matte Texture Grain Overlay */}
      <div className={s.grainOverlay} aria-hidden="true" />

      {/* Optional Accessible Video Pause/Play Control if video is present */}
      {safeHalves.some((h) => h.video) && !isDataSaverOrSlow && (
        <button
          type="button"
          aria-label={videoPausedByUser ? 'Play background video' : 'Pause background video'}
          className={s.videoToggleBtn}
          onClick={(e) => {
            e.stopPropagation();
            setVideoPausedByUser((prev) => !prev);
          }}
        >
          {videoPausedByUser ? (
            <>
              <Play className="w-3 h-3 text-[var(--accent)]" />
              <span>Play Video</span>
            </>
          ) : (
            <>
              <Pause className="w-3 h-3 text-[var(--text-muted)]" />
              <span>Pause Video</span>
            </>
          )}
        </button>
      )}

      {/* Render Exactly Two Halves */}
      {safeHalves.map((half, index) => {
        const isHalfExpanded = effectiveActiveId === half.id;
        const isHalfCompressed = effectiveActiveId !== null && effectiveActiveId !== half.id;
        const targetGrow = computeFlexGrow(half.id, effectiveActiveId);
        const widthPct = computeWidthPercentage(half.id, effectiveActiveId);
        const isFirstHalf = index === 0;
        const hasMediaError = mediaErrors[half.id];

        // Entrance clip path animation
        const initialClip = getInitialClipPath(index, dir === 'rtl');
        const finalClip = getFinalClipPath();

        return (
          <motion.div
            key={half.id}
            data-testid={`split-half-${half.id}`}
            data-active={isHalfExpanded ? 'expanded' : isHalfCompressed ? 'compressed' : 'neutral'}
            className={`${s.half} group`}
            initial={
              prefersReducedMotion || entranceCompleted
                ? { flexGrow: SPLIT.neutralGrow, clipPath: finalClip }
                : { flexGrow: SPLIT.neutralGrow, clipPath: initialClip }
            }
            animate={{
              flexGrow: targetGrow,
              clipPath: finalClip,
            }}
            transition={{
              flexGrow: {
                duration: prefersReducedMotion ? 0 : SPLIT.duration,
                ease: SPLIT.ease,
              },
              clipPath: {
                duration: prefersReducedMotion ? 0 : SPLIT_HERO_TOKENS.entranceClipDuration,
                ease: SPLIT.ease,
              },
            }}
            style={{
              flexBasis: 0,
              minWidth: 0,
              backgroundColor: half.image.placeholderColor || '#141414',
            }}
            onPointerEnter={() => handleHoverIntent(half.id)}
          >
            {/* 1px Boundary Divider riding with the seam */}
            {isFirstHalf && <div className={s.seamDivider} aria-hidden="true" />}

            {/* Media Masking Container (Fixed width 70vw, anchored left or right) */}
            <div
              className={`${s.mediaWrapper} ${isFirstHalf ? s.mediaLeft : s.mediaRight}`}
              aria-hidden="true"
            >
              {hasMediaError ? (
                <div className={s.mediaErrorFallback}>
                  <span className="text-xs uppercase tracking-widest text-[var(--text-muted)]">
                    {half.label}
                  </span>
                </div>
              ) : half.video && !prefersReducedMotion && !isDataSaverOrSlow ? (
                <video
                  ref={(el) => {
                    videoRefs.current[half.id] = el;
                  }}
                  src={half.video.src}
                  poster={half.video.poster || half.image.src}
                  playsInline
                  muted
                  loop
                  preload="metadata"
                  className={s.mediaElement}
                  onError={() => setMediaErrors((prev) => ({ ...prev, [half.id]: true }))}
                />
              ) : (
                <img
                  src={half.image.src}
                  srcSet={half.image.srcset || half.image.srcSet}
                  sizes="(max-width: 768px) 100vw, 72vw"
                  width={half.image.width}
                  height={half.image.height}
                  alt={half.image.alt || half.alt || ''}
                  loading="eager"
                  fetchPriority={isFirstHalf ? 'high' : 'auto'}
                  decoding="async"
                  className={s.mediaElement}
                  style={{
                    objectPosition: half.image.objectPosition || 'center center',
                  }}
                  onError={() => setMediaErrors((prev) => ({ ...prev, [half.id]: true }))}
                />
              )}
            </div>

            {/* Shared Matte Color Grade Overlay */}
            <div className={s.matteColorGrade} aria-hidden="true" />

            {/* Soft Bottom- and Edge-Weighted Dark Gradient for Guaranteed WCAG AA Contrast */}
            <div
              className={s.gradientOverlay}
              style={{
                opacity: isHalfCompressed ? 0.94 : 0.88,
              }}
              aria-hidden="true"
            />

            {/* Side edge gradient toward seam */}
            <div
              className={isFirstHalf ? s.sideGradientLeft : s.sideGradientRight}
              aria-hidden="true"
            />

            {/* Entire Half acts as accessible primary destination link */}
            <Link
              href={half.href}
              tabIndex={0}
              aria-label={`${half.cta}: ${half.label} — ${half.descriptor}`}
              className={`absolute inset-0 z-10 flex flex-col justify-end p-6 md:p-12 outline-none focus-visible:outline-2 focus-visible:outline-[var(--accent)] -outline-offset-2`}
              onClick={() => handleHalfClick(half)}
              onFocus={() => handleHalfFocus(half.id)}
            >
              {/* Content Area (positioned in lower third, anchored near seam) */}
              <div
                className={`${s.contentArea} ${isFirstHalf ? s.contentLeft : s.contentRight}`}
              >
                {/* Fixed-width text block to prevent wrapping changes mid-animation */}
                <div className={s.textBlock}>
                  {/* Primary Editorial Label */}
                  <motion.div
                    className={s.labelWrapper}
                    initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: prefersReducedMotion ? 0 : 0.35 + index * SPLIT_HERO_TOKENS.entranceStagger,
                      ease: SPLIT.ease,
                    }}
                  >
                    <span
                      className={`${s.label} ${
                        isHalfCompressed ? s.labelCompressed : s.labelStandard
                      }`}
                      title={half.label}
                    >
                      {half.label}
                    </span>

                    {/* Thin Accent Underline drawing from left under expanded label */}
                    <motion.div
                      className={s.underline}
                      initial={false}
                      animate={{
                        scaleX: isHalfExpanded ? 1 : 0,
                        opacity: isHalfExpanded ? 1 : 0,
                      }}
                      transition={{
                        duration: prefersReducedMotion ? 0 : SPLIT_HERO_TOKENS.underlineDuration,
                        ease: SPLIT_HERO_TOKENS.underlineEase,
                      }}
                      aria-hidden="true"
                    />
                  </motion.div>

                  {/* One-Line Secondary Descriptor */}
                  <motion.p
                    className={`${s.descriptor} ${
                      isHalfCompressed ? s.descriptorLowEmphasis : ''
                    }`}
                    initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                    animate={{
                      opacity: isHalfCompressed ? 0.52 : 0.85,
                      y: 0,
                    }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : SPLIT_HERO_TOKENS.textEnterDuration,
                      delay: prefersReducedMotion ? 0 : 0.45 + index * SPLIT_HERO_TOKENS.entranceStagger,
                      ease: SPLIT.ease,
                    }}
                  >
                    {clampDescriptor(half.descriptor)}
                  </motion.p>

                  {/* Quiet Editorial CTA */}
                  <motion.div
                    className={`${s.ctaRow} ${isHalfCompressed ? s.ctaRowLowEmphasis : ''}`}
                    initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
                    animate={{
                      opacity: isHalfCompressed ? 0.52 : 1,
                    }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.3,
                      delay: prefersReducedMotion ? 0 : 0.55 + index * SPLIT_HERO_TOKENS.entranceStagger,
                    }}
                  >
                    <span>{half.cta}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${s.ctaArrow}`} aria-hidden="true" />
                  </motion.div>

                  {/* Optional Quick Links revealed only when expanded */}
                  <AnimatePresence>
                    {isHalfExpanded && half.quickLinks && half.quickLinks.length > 0 && (
                      <motion.div
                        key="quick-links"
                        className={s.quickLinksRow}
                        initial={
                          prefersReducedMotion
                            ? { opacity: 1, y: 0 }
                            : { opacity: 0, y: SPLIT_HERO_TOKENS.textEnterRise }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        exit={
                          prefersReducedMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: -4, transition: { duration: SPLIT_HERO_TOKENS.textExitDuration } }
                        }
                        transition={{
                          duration: SPLIT_HERO_TOKENS.textEnterDuration,
                          ease: SPLIT.ease,
                        }}
                      >
                        {half.quickLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            aria-label={link.ariaLabel || `${link.label} in ${half.label}`}
                            className={s.quickLink}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}

      {/* Centered Inclusive Escape Hatch: "Shop all" Pill */}
      <motion.div
        className={s.shopAllContainer}
        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: prefersReducedMotion ? 0 : 0.65,
          ease: SPLIT.ease,
        }}
      >
        <Link
          href={shopAll.href || '/products'}
          aria-label={shopAll.ariaLabel || 'Shop all collections'}
          className={s.shopAllPill}
          onFocus={handleShopAllFocus}
        >
          {shopAll.label || 'Shop all'}
        </Link>
      </motion.div>
    </section>
  );
}

export default SplitHero;

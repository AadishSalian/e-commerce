'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  PANEL_GALLERY_TOKENS,
  validatePanelCount,
  computeExpandedWidth,
  formatCategoryIndex,
  clampDescription,
} from './tokens';
import { PanelGalleryProps, PanelItem } from './types';
import styles from './PanelGallery.module.css';

// Safe styles fallback for environments where CSS module exports differ (e.g. Node tests / CJS)
const s = (styles as any)?.galleryRow ? styles : ((styles as any)?.default || styles || {});

// Safe wrapper around useRouter to support standalone SSR / unit testing without AppRouterContext
function useSafeRouter() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}

export function PanelGallery({
  panels,
  defaultActiveId,
  returnToDefaultOnLeave = true,
  motionTokens = {},
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View all categories',
  className = '',
  containerClassName = '',
  sectionAriaLabel = 'Shop by category',
  onPanelChange,
  layoutMode = 'auto',
}: PanelGalleryProps) {
  const router = useSafeRouter();
  const shouldReduceMotion = useReducedMotion();
  const componentId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Validate panel array count bounds
  const validation = validatePanelCount(panels.length);
  const activePanels = validation.isTooMany ? panels.slice(0, PANEL_GALLERY_TOKENS.maxPanels) : panels;

  // Resolved default active ID (first panel if not provided or invalid)
  const resolvedDefaultActiveId =
    defaultActiveId && activePanels.some((p) => p.id === defaultActiveId)
      ? defaultActiveId
      : activePanels[0]?.id || '';

  // Single source of truth for expanded panel
  const [activeId, setActiveId] = useState<string>(resolvedDefaultActiveId);

  // Responsive layout mode (accordion for mobile/touch, flex row for desktop fine pointer)
  const [isAccordion, setIsAccordion] = useState<boolean>(() => {
    if (layoutMode === 'accordion-only') return true;
    if (layoutMode === 'desktop-only') return false;
    return false; // SSR default: desktop row
  });

  // Track expanded panel pixel width for the moving-mask image container
  const [expandedWidthPx, setExpandedWidthPx] = useState<number>(700);

  // Screen reader polite announcements
  const [announcement, setAnnouncement] = useState<string>('');

  // Track image load failures for graceful matte fallback
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Timers for hover-intent and return-on-leave
  const hoverIntentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const returnTimerRef = useRef<NodeJS.Timeout | null>(null);
  const panelRefs = useRef<Map<string, HTMLAnchorElement | HTMLButtonElement>>(new Map());

  // Resolved motion tokens with defaults
  const expandedGrow = motionTokens.expandedGrow ?? PANEL_GALLERY_TOKENS.expandedGrow;
  const compressedGrow = motionTokens.compressedGrow ?? PANEL_GALLERY_TOKENS.compressedGrow;
  const animDuration = shouldReduceMotion ? 0 : (motionTokens.duration ?? PANEL_GALLERY_TOKENS.duration);
  const animEase = motionTokens.ease ?? PANEL_GALLERY_TOKENS.ease;
  const hoverIntentDelay = motionTokens.hoverIntentDelay ?? PANEL_GALLERY_TOKENS.hoverIntentDelay;
  const returnDelay = motionTokens.returnDelay ?? PANEL_GALLERY_TOKENS.returnDelay;

  // Activate a panel and notify parent callback
  const activatePanel = useCallback(
    (panelId: string, announce: boolean = false) => {
      setActiveId((prev) => {
        if (prev === panelId) return prev;
        if (announce) {
          const panel = activePanels.find((p) => p.id === panelId);
          if (panel) {
            setAnnouncement(`${panel.title} expanded`);
          }
        }
        onPanelChange?.(panelId);
        return panelId;
      });
    },
    [activePanels, onPanelChange]
  );

  // Preload/prefetch helper on hover-intent or focus
  const prefetchDestination = useCallback(
    (panel: PanelItem) => {
      try {
        if (panel.href && router?.prefetch) {
          router.prefetch(panel.href);
        }
        if (typeof window !== 'undefined' && panel.image?.src) {
          const img = new window.Image();
          img.src = panel.image.src;
        }
      } catch {
        // Silently catch prefetch errors in test environments
      }
    },
    [router]
  );

  // Monitor screen width, hover capability, and container size
  useEffect(() => {
    if (layoutMode === 'accordion-only') {
      setIsAccordion(true);
      return;
    }
    if (layoutMode === 'desktop-only') {
      setIsAccordion(false);
      return;
    }

    const checkLayout = () => {
      if (typeof window === 'undefined') return;

      const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      const isNarrowScreen = window.innerWidth < 1024;
      const containerWidth = containerRef.current?.getBoundingClientRect().width || window.innerWidth;

      // Switch to accordion if touch-only, narrow viewport, or container cannot comfortably fit compressed panels
      const canFit = containerWidth >= activePanels.length * PANEL_GALLERY_TOKENS.minCompressedWidthDesktop;
      const shouldUseAccordion = !hasFinePointer || isNarrowScreen || !canFit;

      setIsAccordion(shouldUseAccordion);

      // Measure expanded panel width for the fixed inner image wrapper
      const calcWidth = computeExpandedWidth(
        containerWidth,
        activePanels.length,
        PANEL_GALLERY_TOKENS.panelGapDesktop,
        expandedGrow,
        compressedGrow
      );
      setExpandedWidthPx(Math.max(480, calcWidth));
    };

    checkLayout();
    window.addEventListener('resize', checkLayout, { passive: true });

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => checkLayout());
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', checkLayout);
      observer?.disconnect();
    };
  }, [layoutMode, activePanels.length, expandedGrow, compressedGrow]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (hoverIntentTimerRef.current) clearTimeout(hoverIntentTimerRef.current);
      if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    };
  }, []);

  // Desktop Hover Intent Handlers
  const handleMouseEnterPanel = (panel: PanelItem) => {
    if (isAccordion) return;

    if (returnTimerRef.current) {
      clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }

    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
    }

    // Hover intent delay: wait 90ms before expanding to avoid flicker when sweeping cursor
    hoverIntentTimerRef.current = setTimeout(() => {
      activatePanel(panel.id);
      prefetchDestination(panel);
    }, hoverIntentDelay);
  };

  const handleMouseLeavePanel = () => {
    if (isAccordion) return;
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }
  };

  const handleMouseLeaveRow = () => {
    if (isAccordion) return;
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }

    if (!returnToDefaultOnLeave || !resolvedDefaultActiveId) return;

    // Return delay: wait 350ms before gently returning to default active panel
    returnTimerRef.current = setTimeout(() => {
      activatePanel(resolvedDefaultActiveId);
    }, returnDelay);
  };

  // Keyboard navigation & Focus Handling
  const handlePanelFocus = (panel: PanelItem) => {
    if (returnTimerRef.current) {
      clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }
    if (hoverIntentTimerRef.current) {
      clearTimeout(hoverIntentTimerRef.current);
      hoverIntentTimerRef.current = null;
    }

    activatePanel(panel.id);
    prefetchDestination(panel);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const isRtl = typeof document !== 'undefined' && document.dir === 'rtl';
    let targetIndex: number | null = null;

    if (isAccordion) {
      if (e.key === 'ArrowDown') {
        targetIndex = (index + 1) % activePanels.length;
      } else if (e.key === 'ArrowUp') {
        targetIndex = (index - 1 + activePanels.length) % activePanels.length;
      }
    } else {
      if (e.key === (isRtl ? 'ArrowLeft' : 'ArrowRight')) {
        targetIndex = (index + 1) % activePanels.length;
      } else if (e.key === (isRtl ? 'ArrowRight' : 'ArrowLeft')) {
        targetIndex = (index - 1 + activePanels.length) % activePanels.length;
      }
    }

    if (e.key === 'Home') targetIndex = 0;
    if (e.key === 'End') targetIndex = activePanels.length - 1;

    if (targetIndex !== null) {
      e.preventDefault();
      const targetPanel = activePanels[targetIndex];
      if (targetPanel) {
        const el = panelRefs.current.get(targetPanel.id);
        el?.focus();
        activatePanel(targetPanel.id);
      }
    }
  };

  // Mobile / Touch Tap Handler: First tap expands, second tap navigates
  const handleAccordionTap = (e: React.MouseEvent, panel: PanelItem) => {
    if (panel.id !== activeId) {
      e.preventDefault();
      activatePanel(panel.id, true);
      prefetchDestination(panel);
    }
    // If panel.id === activeId, natural Link navigation proceeds to panel.href
  };

  // Fallback layout when panels < 4
  if (validation.isTooFew) {
    return (
      <section
        className={`${s.section} ${className}`}
        aria-label={sectionAriaLabel}
        data-testid="panel-gallery-fallback-grid"
      >
        <div className={`${s.container} ${containerClassName}`}>
          {(title || subtitle) && (
            <div className={s.header}>
              <div className={s.headerText}>
                {subtitle && <span className={s.subtitle}>{subtitle}</span>}
                {title && <h2 className={s.title}>{title}</h2>}
              </div>
            </div>
          )}
          <ul className={s.fallbackGrid} role="list">
            {panels.map((panel, idx) => (
              <li key={panel.id} className={s.fallbackCard} role="listitem">
                <Link href={panel.href} className={s.panelLink} aria-label={`Shop ${panel.title}`}>
                  <div
                    className={s.imageWrapper}
                    style={{
                      width: '100%',
                      left: '0',
                      transform: 'none',
                      backgroundColor: panel.image?.dominantColor || '#1a1a1a',
                    }}
                  >
                    {!failedImages[panel.id] ? (
                      <Image
                        src={panel.image.src}
                        alt={panel.alt || panel.title}
                        width={panel.image.width || 800}
                        height={panel.image.height || 800}
                        className={s.image}
                        style={{ objectPosition: panel.image.objectPosition || 'center center' }}
                        onError={() => setFailedImages((prev) => ({ ...prev, [panel.id]: true }))}
                      />
                    ) : null}
                  </div>
                  <div className={s.gradientOverlay} style={{ opacity: 0.5 }} />
                  <div className={s.grainOverlay} />
                  <div className={s.expandedContainer} style={{ pointerEvents: 'auto' }}>
                    <div className={s.expandedContentBlock}>
                      <div className={s.expandedMeta}>
                        <span className={s.expandedIndex}>{formatCategoryIndex(idx)}</span>
                        {panel.itemCount && <span className={s.expandedCount}>{panel.itemCount} items</span>}
                      </div>
                      <h3 className={s.expandedTitle}>{panel.title}</h3>
                      {panel.description && <p className={s.expandedDescription}>{panel.description}</p>}
                      <span className={s.expandedAction}>
                        Explore category <span className={s.actionArrow} aria-hidden="true">&rarr;</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`${s.section} ${className}`}
      aria-label={sectionAriaLabel}
      data-testid="panel-gallery-root"
      id={`panel-gallery-${componentId.replace(/[^a-zA-Z0-9_-]/g, '')}`}
    >
      <div className={`${s.container} ${containerClassName}`} ref={containerRef}>
        {/* Header with Title and optional "View all categories" link */}
        {(title || subtitle || (validation.isTooMany && viewAllHref)) && (
          <div className={s.header}>
            <div className={s.headerText}>
              {subtitle && <span className={s.subtitle}>{subtitle}</span>}
              {title && <h2 className={s.title}>{title}</h2>}
            </div>
            {viewAllHref && (
              <Link href={viewAllHref} className={s.viewAllLink}>
                {viewAllLabel}
                <span aria-hidden="true">&rarr;</span>
              </Link>
            )}
          </div>
        )}

        {/* Polite Screen Reader Live Region for Expansion Announcements */}
        <div className={s.srOnly} aria-live="polite" aria-atomic="true">
          {announcement}
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP FLEX ROW GALLERY                                                  */}
        {/* ========================================================================= */}
        {!isAccordion ? (
          <motion.ul
            className={s.galleryRow}
            role="list"
            data-testid="panel-gallery-desktop-row"
            onMouseLeave={handleMouseLeaveRow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            style={
              {
                '--expanded-width': `${expandedWidthPx}px`,
                '--panel-count': activePanels.length,
              } as React.CSSProperties
            }
          >
            {activePanels.map((panel, index) => {
              const isActive = panel.id === activeId;
              const isDefault = panel.id === resolvedDefaultActiveId;
              const hasImageFailed = failedImages[panel.id];

              return (
                <motion.li
                  key={panel.id}
                  role="listitem"
                  className={s.panelItem}
                  data-testid={`panel-item-${panel.id}`}
                  data-active={isActive ? 'true' : 'false'}
                  custom={index}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: (i: number) => ({
                      opacity: 1,
                      y: 0,
                      transition: {
                        delay: i * PANEL_GALLERY_TOKENS.revealStagger,
                        duration: PANEL_GALLERY_TOKENS.revealDuration,
                        ease: [0.16, 1, 0.3, 1],
                      },
                    }),
                  }}
                  animate={{
                    flexGrow: isActive ? expandedGrow : compressedGrow,
                  }}
                  transition={{
                    duration: animDuration,
                    ease: animEase,
                  }}
                  style={{
                    flexBasis: 0,
                    minWidth: 0,
                  }}
                  onMouseEnter={() => handleMouseEnterPanel(panel)}
                  onMouseLeave={handleMouseLeavePanel}
                >
                  <Link
                    href={panel.href}
                    ref={(el) => {
                      if (el) panelRefs.current.set(panel.id, el);
                      else panelRefs.current.delete(panel.id);
                    }}
                    className={s.panelLink}
                    aria-current={isActive ? 'true' : undefined}
                    onFocus={() => handlePanelFocus(panel)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  >
                    {/* Screen reader content: Full text always accessible in DOM regardless of visual state */}
                    <span className={s.srOnly}>
                      {panel.title}. {panel.description || ''}{' '}
                      {panel.itemCount ? `(${panel.itemCount} items)` : ''}
                    </span>

                    {/* Sized Inner Wrapper (Moving Mask): Fixed expanded width prevents squishing */}
                    <div
                      className={s.imageWrapper}
                      style={
                        {
                          '--placeholder-bg': panel.image?.dominantColor || '#1a1a1a',
                          width: `${expandedWidthPx}px`,
                        } as React.CSSProperties
                      }
                    >
                      {!hasImageFailed ? (
                        <Image
                          src={panel.image.src}
                          alt={panel.alt || ''}
                          width={panel.image.width || 800}
                          height={panel.image.height || 800}
                          className={s.image}
                          priority={isDefault}
                          loading={isDefault ? 'eager' : 'lazy'}
                          sizes={`(max-width: 1400px) ${expandedWidthPx}px, 800px`}
                          style={{
                            objectPosition: panel.image.objectPosition || 'center center',
                          }}
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [panel.id]: true }))
                          }
                        />
                      ) : null}
                    </div>

                    {/* Dark Matte Bottom-weighted Gradient Overlay */}
                    <motion.div
                      className={s.gradientOverlay}
                      animate={{
                        opacity: isActive
                          ? PANEL_GALLERY_TOKENS.activeOverlayOpacity
                          : PANEL_GALLERY_TOKENS.inactiveOverlayOpacity,
                      }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.4,
                        ease: 'easeOut',
                      }}
                    />

                    {/* Matte Grain Overlay */}
                    <div className={s.grainOverlay} />

                    {/* COMPRESSED STATE: Vertical Label & Index */}
                    <AnimatePresence>
                      {!isActive && (
                        <motion.div
                          key="compressed"
                          className={s.compressedContainer}
                          aria-hidden="true"
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: 1,
                            transition: {
                              duration: shouldReduceMotion ? 0 : 0.25,
                              delay: shouldReduceMotion ? 0 : 0.18,
                            },
                          }}
                          exit={{
                            opacity: 0,
                            transition: {
                              duration: shouldReduceMotion
                                ? 0
                                : PANEL_GALLERY_TOKENS.textExitDuration,
                            },
                          }}
                        >
                          <span className={s.compressedIndex}>
                            {formatCategoryIndex(index)}
                          </span>
                          <div className={s.compressedTitleWrapper}>
                            <span className={s.compressedTitle}>{panel.title}</span>
                          </div>
                          <span aria-hidden="true" style={{ height: '14px' }} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* EXPANDED STATE: Title with Underline, Description, Count & CTA */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          key="expanded"
                          className={s.expandedContainer}
                          aria-hidden="true"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: shouldReduceMotion
                                ? 0
                                : PANEL_GALLERY_TOKENS.textEnterDuration,
                              delay: shouldReduceMotion
                                ? 0
                                : PANEL_GALLERY_TOKENS.textEnterDelay,
                              ease: [0.16, 1, 0.3, 1],
                            },
                          }}
                          exit={{
                            opacity: 0,
                            y: 6,
                            transition: {
                              duration: shouldReduceMotion ? 0 : 0.15,
                              ease: 'easeIn',
                            },
                          }}
                        >
                          <div className={s.expandedContentBlock}>
                            <div className={s.expandedMeta}>
                              <span className={s.expandedIndex}>
                                {formatCategoryIndex(index)}
                              </span>
                              {panel.itemCount && (
                                <span className={s.expandedCount}>
                                  {panel.itemCount} items
                                </span>
                              )}
                            </div>

                            <div className={s.expandedTitleWrapper}>
                              <h3 className={s.expandedTitle}>{panel.title}</h3>
                              <motion.div
                                className={s.titleUnderline}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{
                                  duration: shouldReduceMotion
                                    ? 0
                                    : PANEL_GALLERY_TOKENS.underlineDuration,
                                  delay: shouldReduceMotion ? 0 : 0.2,
                                  ease: [0.16, 1, 0.3, 1],
                                }}
                              />
                            </div>

                            {panel.description && (
                              <p className={s.expandedDescription}>
                                {clampDescription(panel.description, 80)}
                              </p>
                            )}

                            <span className={s.expandedAction}>
                              Explore category{' '}
                              <span className={s.actionArrow} aria-hidden="true">
                                &rarr;
                              </span>
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        ) : (
          /* ========================================================================= */
          /* TOUCH / MOBILE ACCORDION STACK                                            */
          /* ========================================================================= */
          <ul
            className={s.accordionStack}
            role="list"
            data-testid="panel-gallery-mobile-accordion"
          >
            {activePanels.map((panel, index) => {
              const isActive = panel.id === activeId;
              const hasImageFailed = failedImages[panel.id];

              return (
                <motion.li
                  key={panel.id}
                  role="listitem"
                  className={s.accordionItem}
                  data-testid={`accordion-item-${panel.id}`}
                  data-active={isActive ? 'true' : 'false'}
                  animate={{
                    height: isActive
                      ? PANEL_GALLERY_TOKENS.accordionExpandedHeight
                      : PANEL_GALLERY_TOKENS.accordionCollapsedHeight,
                  }}
                  transition={{
                    duration: animDuration,
                    ease: animEase,
                  }}
                  style={{
                    minHeight: PANEL_GALLERY_TOKENS.minTapTargetHeight,
                  }}
                >
                  <Link
                    href={panel.href}
                    ref={(el) => {
                      if (el) panelRefs.current.set(panel.id, el);
                      else panelRefs.current.delete(panel.id);
                    }}
                    className={s.accordionButton}
                    aria-expanded={isActive}
                    onClick={(e) => handleAccordionTap(e, panel)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  >
                    {/* Screen reader text */}
                    <span className={s.srOnly}>
                      {panel.title}. {panel.description || ''}{' '}
                      {panel.itemCount ? `(${panel.itemCount} items)` : ''}
                    </span>

                    {/* Image container */}
                    <div
                      className={s.accordionImageWrapper}
                      style={{
                        backgroundColor: panel.image?.dominantColor || '#1a1a1a',
                      }}
                    >
                      {!hasImageFailed ? (
                        <Image
                          src={panel.image.src}
                          alt={panel.alt || ''}
                          width={panel.image.width || 800}
                          height={panel.image.height || 800}
                          className={s.image}
                          loading="lazy"
                          style={{
                            objectPosition: panel.image.objectPosition || 'center center',
                          }}
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [panel.id]: true }))
                          }
                        />
                      ) : null}
                    </div>

                    {/* Gradient Overlay */}
                    <div
                      className={s.gradientOverlay}
                      style={{
                        opacity: isActive
                          ? PANEL_GALLERY_TOKENS.activeOverlayOpacity
                          : PANEL_GALLERY_TOKENS.inactiveOverlayOpacity,
                      }}
                    />

                    {/* Matte Grain */}
                    <div className={s.grainOverlay} />

                    {/* Collapsed Horizontal Bar */}
                    <AnimatePresence>
                      {!isActive && (
                        <motion.div
                          key="accordion-collapsed"
                          className={s.accordionCollapsedBar}
                          aria-hidden="true"
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: 1,
                            transition: {
                              duration: shouldReduceMotion ? 0 : 0.2,
                              delay: shouldReduceMotion ? 0 : 0.15,
                            },
                          }}
                          exit={{
                            opacity: 0,
                            transition: {
                              duration: shouldReduceMotion
                                ? 0
                                : PANEL_GALLERY_TOKENS.textExitDuration,
                            },
                          }}
                        >
                          <div className={s.accordionCollapsedLeft}>
                            <span className={s.accordionCollapsedIndex}>
                              {formatCategoryIndex(index)}
                            </span>
                            <span className={s.accordionCollapsedTitle}>
                              {panel.title}
                            </span>
                          </div>
                          <span
                            className={s.accordionCollapsedIcon}
                            aria-hidden="true"
                          >
                            +
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Expanded Accordion Body with CTA */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          key="accordion-expanded"
                          className={s.accordionExpandedBody}
                          aria-hidden="true"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: shouldReduceMotion
                                ? 0
                                : PANEL_GALLERY_TOKENS.textEnterDuration,
                              delay: shouldReduceMotion
                                ? 0
                                : PANEL_GALLERY_TOKENS.textEnterDelay,
                              ease: [0.16, 1, 0.3, 1],
                            },
                          }}
                          exit={{
                            opacity: 0,
                            y: 6,
                            transition: {
                              duration: shouldReduceMotion ? 0 : 0.15,
                              ease: 'easeIn',
                            },
                          }}
                        >
                          <div className={s.expandedMeta}>
                            <span className={s.expandedIndex}>
                              {formatCategoryIndex(index)}
                            </span>
                            {panel.itemCount && (
                              <span className={s.expandedCount}>
                                {panel.itemCount} items
                              </span>
                            )}
                          </div>

                          <div className={s.expandedTitleWrapper}>
                            <h3 className={s.expandedTitle}>{panel.title}</h3>
                            <motion.div
                              className={s.titleUnderline}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{
                                duration: shouldReduceMotion
                                  ? 0
                                  : PANEL_GALLERY_TOKENS.underlineDuration,
                                delay: shouldReduceMotion ? 0 : 0.2,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                            />
                          </div>

                          {panel.description && (
                            <p className={s.expandedDescription}>
                              {clampDescription(panel.description, 80)}
                            </p>
                          )}

                          <span className={s.accordionCtaButton}>
                            Explore category{' '}
                            <span className={s.actionArrow} aria-hidden="true">
                              &rarr;
                            </span>
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

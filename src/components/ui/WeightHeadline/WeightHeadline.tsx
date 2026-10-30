'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useId,
  useCallback,
} from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
  useReducedMotion,
  MotionValue,
} from 'framer-motion';
import styles from './WeightHeadline.module.css';
import {
  WEIGHT_FX,
  computeProximityWeight,
  distanceToRect,
  distanceToPoint,
  splitGraphemes,
  isComplexScript,
  BoundingRect,
} from './tokens';
import { coordinator } from './coordinator';

// Safe styles fallback for various bundler module resolutions
const s = (styles as any)?.root ? styles : ((styles as any)?.default || styles || {});

export interface WeightHeadlineProps extends React.HTMLAttributes<HTMLElement> {
  /** Headline text (max ~40 characters for display headlines) */
  children: string;

  /** HTML heading element tag to render ('h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div') */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div';

  /**
   * Mode B opt-in: Per-letter proximity wave.
   * Each grapheme computes its own weight from cursor distance.
   * Automatically falls back to Mode A for joined/complex scripts or long text.
   */
  perLetter?: boolean;

  /** Alignment: 'left' | 'center' | 'right'. Default: 'left' */
  align?: 'left' | 'center' | 'right';

  /** Custom base resting weight override (otherwise uses theme token: 380 dark, 400 light) */
  baseWeight?: number;

  /** Custom maximum peak weight override (default: 620) */
  maxWeight?: number;

  /** Proximity radius in pixels (default: 180) */
  radius?: number;

  /** Gate proximity until an entrance reveal animation completes */
  entranceComplete?: boolean;

  /** Debug overlay showing radius and live weight metrics */
  debug?: boolean;

  /** Additional className */
  className?: string;

  /** Style overrides */
  style?: React.CSSProperties;
}

/**
 * LetterSpan sub-component for Mode B.
 * Each letter has its own Framer Motion spring and transforms without triggering React re-renders.
 */
interface LetterSpanProps {
  char: string;
  index: number;
  baseWeight: number;
  registerLetter: (index: number, node: HTMLElement | null, mv: MotionValue<number>) => void;
}

function LetterSpan({ char, index, baseWeight, registerLetter }: LetterSpanProps) {
  const targetWeight = useMotionValue(baseWeight);
  const springWeight = useSpring(targetWeight, WEIGHT_FX.spring);
  const fontVariationSettings = useTransform(springWeight, (w) => `"wght" ${Math.round(w)}`);

  const setNodeRef = useCallback(
    (node: HTMLElement | null) => {
      registerLetter(index, node, targetWeight);
    },
    [index, registerLetter, targetWeight]
  );

  const displayChar = char === ' ' ? '\u00A0' : char;

  return (
    <motion.span
      ref={setNodeRef}
      className={s.letter || 'letter'}
      style={{ fontVariationSettings }}
      aria-hidden="true"
    >
      {displayChar}
    </motion.span>
  );
}

export const WeightHeadline = React.forwardRef<HTMLElement, WeightHeadlineProps>(
  (
    {
      children,
      as: Component = 'h1',
      perLetter = false,
      align = 'left',
      baseWeight: customBaseWeight,
      maxWeight = WEIGHT_FX.maxWeight,
      radius = WEIGHT_FX.radius,
      entranceComplete = true,
      debug = false,
      className = '',
      style = {},
      ...rest
    },
    forwardedRef
  ) => {
    const rawId = useId();
    const id = `weight-hl-${rawId.replace(/[^a-zA-Z0-9-_]/g, '')}`;

    const prefersReducedMotion = useReducedMotion();
    const text = typeof children === 'string' ? children : String(children ?? '');

    const containerRef = useRef<HTMLElement | null>(null);
    const visibleLayerRef = useRef<HTMLElement | null>(null);

    // Track theme-aware base weight
    const [themeBaseWeight, setThemeBaseWeight] = useState<number>(() => {
      if (customBaseWeight !== undefined) return customBaseWeight;
      if (typeof document !== 'undefined') {
        const theme = document.documentElement.getAttribute('data-theme');
        return theme === 'light' ? WEIGHT_FX.baseWeight : WEIGHT_FX.baseWeightDark;
      }
      return WEIGHT_FX.baseWeightDark;
    });

    const effectiveBaseWeight = customBaseWeight ?? themeBaseWeight;

    // Performance safety guard: automatically degrade to Mode A if frame budget exceeded
    const [modeBDegraded, setModeBDegraded] = useState(false);

    // Debug state (only updated when debug === true)
    const [debugInfo, setDebugInfo] = useState<{
      distance: number;
      weight: number;
      active: boolean;
      mode: 'A' | 'B';
    }>({ distance: 999, weight: effectiveBaseWeight, active: false, mode: perLetter ? 'B' : 'A' });

    // Mode A motion values
    const targetWeight = useMotionValue(effectiveBaseWeight);
    const springWeight = useSpring(targetWeight, WEIGHT_FX.spring);
    const fontVariationSettings = useTransform(springWeight, (w) => `"wght" ${Math.round(w)}`);

    // Mode B letter registration refs
    const letterNodesRef = useRef<Map<number, HTMLElement>>(new Map());
    const letterMotionValuesRef = useRef<Map<number, MotionValue<number>>>(new Map());
    const letterCentersRef = useRef<{ x: number; y: number }[]>([]);

    // Cached container geometry relative to viewport
    const cachedRectRef = useRef<BoundingRect | null>(null);
    const isActiveRef = useRef(false);
    const isInViewRef = useRef(false);
    const rafIdRef = useRef<number | null>(null);
    const degradedFramesCountRef = useRef(0);
    const touchEasePlayedRef = useRef(false);

    // Letter splitting validation
    const graphemes = useMemo(() => splitGraphemes(text), [text]);
    const hasComplexScript = useMemo(() => isComplexScript(text), [text]);
    const exceedsLengthLimit = text.length > WEIGHT_FX.maxLetterCount;

    // Determine active mode
    const isModeB = perLetter && !modeBDegraded && !hasComplexScript && !exceedsLengthLimit;

    // Warn in development if exceeding length limit
    useEffect(() => {
      if (exceedsLengthLimit && process.env.NODE_ENV !== 'production') {
        console.warn(
          `[WeightHeadline] Headline "${text}" exceeds the ${WEIGHT_FX.maxLetterCount}-character limit (${text.length} chars). ` +
            `Falling back to whole-headline mode to protect performance and layout stability.`
        );
      }
    }, [exceedsLengthLimit, text]);

    // Update base weight when theme changes on documentElement
    useEffect(() => {
      if (customBaseWeight !== undefined) return;

      const updateWeightFromTheme = () => {
        const theme = document.documentElement.getAttribute('data-theme');
        const nextBase = theme === 'light' ? WEIGHT_FX.baseWeight : WEIGHT_FX.baseWeightDark;
        setThemeBaseWeight(nextBase);
        targetWeight.set(nextBase);
        for (const mv of letterMotionValuesRef.current.values()) {
          mv.set(nextBase);
        }
      };

      updateWeightFromTheme();

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.attributeName === 'data-theme') {
            updateWeightFromTheme();
          }
        }
      });

      observer.observe(document.documentElement, { attributes: true });
      return () => observer.disconnect();
    }, [customBaseWeight, targetWeight]);

    // Measure geometry
    const updateGeometry = useCallback(() => {
      if (!visibleLayerRef.current) return;
      const b = visibleLayerRef.current.getBoundingClientRect();
      cachedRectRef.current = {
        left: b.left,
        top: b.top,
        right: b.right,
        bottom: b.bottom,
      };

      // Measure letter centers for Mode B
      if (isModeB) {
        const centers: { x: number; y: number }[] = [];
        for (let i = 0; i < graphemes.length; i++) {
          const node = letterNodesRef.current.get(i);
          if (node) {
            const rect = node.getBoundingClientRect();
            centers.push({
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            });
          } else {
            centers.push({ x: 0, y: 0 });
          }
        }
        letterCentersRef.current = centers;
      }
    }, [isModeB, graphemes.length]);

    // Register letter span for Mode B
    const registerLetter = useCallback(
      (index: number, node: HTMLElement | null, mv: MotionValue<number>) => {
        if (node) {
          letterNodesRef.current.set(index, node);
          letterMotionValuesRef.current.set(index, mv);
        } else {
          letterNodesRef.current.delete(index);
          letterMotionValuesRef.current.delete(index);
        }
      },
      []
    );

    // Register with Viewport Coordinator
    useEffect(() => {
      const unregister = coordinator.register({
        id,
        getRect: () => cachedRectRef.current,
        setActive: (active: boolean) => {
          isActiveRef.current = active;
          if (!active) {
            // Smoothly relax to base weight
            targetWeight.set(effectiveBaseWeight);
            for (const mv of letterMotionValuesRef.current.values()) {
              mv.set(effectiveBaseWeight);
            }
          }
        },
        inView: isInViewRef.current,
      });

      return () => {
        unregister();
      };
    }, [id, effectiveBaseWeight, targetWeight]);

    // Pointer move and Intersection tracking
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // Check browser environment capabilities
      const supportsVarFonts =
        typeof CSS !== 'undefined' && CSS.supports && CSS.supports('font-variation-settings', 'normal');
      const isFinePointer =
        typeof window !== 'undefined' &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;

      // Reduced motion or missing variable font support: render static
      if (prefersReducedMotion || !supportsVarFonts) {
        targetWeight.set(effectiveBaseWeight);
        return;
      }

      // Find nearest section container (or parent element)
      const section =
        container.closest('section') ||
        container.closest('[data-weight-section]') ||
        container.parentElement ||
        document.body;

      let latestX = -9999;
      let latestY = -9999;

      const onFrame = () => {
        rafIdRef.current = null;
        if (!isInViewRef.current || !entranceComplete) return;

        // Query coordinator for active headline designation
        const activeId = coordinator.updateActiveHeadline(latestX, latestY);
        const isActive = activeId === id;
        isActiveRef.current = isActive;

        if (!isActive || !cachedRectRef.current) {
          targetWeight.set(effectiveBaseWeight);
          for (const mv of letterMotionValuesRef.current.values()) {
            mv.set(effectiveBaseWeight);
          }
          if (debug) {
            setDebugInfo({
              distance: 999,
              weight: effectiveBaseWeight,
              active: false,
              mode: isModeB ? 'B' : 'A',
            });
          }
          return;
        }

        const frameStart = performance.now();

        if (isModeB) {
          // Mode B: Per-letter proximity wave
          let minLetterDist = 9999;
          let peakLetterWeight = effectiveBaseWeight;
          const centers = letterCentersRef.current;

          for (let i = 0; i < centers.length; i++) {
            const center = centers[i];
            const dist = distanceToPoint(latestX, latestY, center.x, center.y);
            const w = computeProximityWeight(dist, radius, effectiveBaseWeight, maxWeight);
            const mv = letterMotionValuesRef.current.get(i);
            if (mv) mv.set(w);

            if (dist < minLetterDist) minLetterDist = dist;
            if (w > peakLetterWeight) peakLetterWeight = w;
          }

          const frameDuration = performance.now() - frameStart;
          if (frameDuration > 16) {
            degradedFramesCountRef.current += 1;
            if (degradedFramesCountRef.current >= 5) {
              setModeBDegraded(true);
            }
          } else {
            degradedFramesCountRef.current = Math.max(0, degradedFramesCountRef.current - 1);
          }

          if (debug) {
            setDebugInfo({
              distance: Math.round(minLetterDist),
              weight: Math.round(peakLetterWeight),
              active: true,
              mode: 'B',
            });
          }
        } else {
          // Mode A: Whole-headline proximity
          const dist = distanceToRect(latestX, latestY, cachedRectRef.current);
          const computedWeight = computeProximityWeight(dist, radius, effectiveBaseWeight, maxWeight);
          targetWeight.set(computedWeight);

          if (debug) {
            setDebugInfo({
              distance: Math.round(dist),
              weight: Math.round(computedWeight),
              active: true,
              mode: 'A',
            });
          }
        }
      };

      const handlePointerMove = (e: PointerEvent) => {
        latestX = e.clientX;
        latestY = e.clientY;
        if (rafIdRef.current === null) {
          rafIdRef.current = requestAnimationFrame(onFrame);
        }
      };

      const handlePointerLeave = () => {
        latestX = -9999;
        latestY = -9999;
        coordinator.resetAll();
        targetWeight.set(effectiveBaseWeight);
        for (const mv of letterMotionValuesRef.current.values()) {
          mv.set(effectiveBaseWeight);
        }
        if (debug) {
          setDebugInfo({
            distance: 999,
            weight: effectiveBaseWeight,
            active: false,
            mode: isModeB ? 'B' : 'A',
          });
        }
      };

      const handleScroll = () => {
        updateGeometry();
      };

      // IntersectionObserver: Only listen when headline is inside viewport
      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const inView = entry.isIntersecting;
            isInViewRef.current = inView;
            coordinator.setInView(id, inView);

            if (inView) {
              updateGeometry();

              // Touch Enhancement: gentle one-time ease-in on first viewport entry
              if (!isFinePointer && !touchEasePlayedRef.current) {
                touchEasePlayedRef.current = true;
                const touchStartWeight = Math.max(WEIGHT_FX.minFontWeight, effectiveBaseWeight - 60);
                targetWeight.set(touchStartWeight);
                animate(springWeight, effectiveBaseWeight, {
                  duration: WEIGHT_FX.touchEntryDuration,
                  ease: 'easeOut',
                });
              }

              if (isFinePointer) {
                section.addEventListener('pointermove', handlePointerMove, { passive: true });
                section.addEventListener('pointerleave', handlePointerLeave, { passive: true });
                window.addEventListener('scroll', handleScroll, { passive: true });
                window.addEventListener('resize', handleScroll, { passive: true });
              }
            } else {
              handlePointerLeave();
              if (isFinePointer) {
                section.removeEventListener('pointermove', handlePointerMove);
                section.removeEventListener('pointerleave', handlePointerLeave);
                window.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', handleScroll);
              }
            }
          }
        },
        { threshold: [0, 0.2, 0.5, 1.0] }
      );

      intersectionObserver.observe(container);

      // ResizeObserver to track layout changes
      const resizeObserver = new ResizeObserver(() => {
        updateGeometry();
      });
      resizeObserver.observe(container);

      return () => {
        intersectionObserver.disconnect();
        resizeObserver.disconnect();
        if (isFinePointer) {
          section.removeEventListener('pointermove', handlePointerMove);
          section.removeEventListener('pointerleave', handlePointerLeave);
          window.removeEventListener('scroll', handleScroll);
          window.removeEventListener('resize', handleScroll);
        }
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }
      };
    }, [
      id,
      isModeB,
      radius,
      effectiveBaseWeight,
      maxWeight,
      entranceComplete,
      prefersReducedMotion,
      debug,
      targetWeight,
      springWeight,
      updateGeometry,
    ]);

    // Alignment class lookup
    const alignClass =
      align === 'center'
        ? (s.alignCenter || 'alignCenter')
        : align === 'right'
        ? (s.alignRight || 'alignRight')
        : (s.alignLeft || 'alignLeft');

    return (
      <Component
        ref={(node: HTMLElement | null) => {
          containerRef.current = node;
          if (typeof forwardedRef === 'function') {
            forwardedRef(node);
          } else if (forwardedRef) {
            (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
          }
        }}
        className={`${s.root || 'root'} ${alignClass} ${className}`}
        style={style}
        role={isModeB ? 'heading' : undefined}
        aria-label={isModeB ? text : undefined}
        {...rest}
      >
        {/*
          1. GHOST ELEMENT (Width & Height Reservation):
          Rendered at maxWeight in the identical grid cell with visibility: hidden.
          Prevents any layout shift (CLS: 0.000) when the visible text thickens.
        */}
        <span
          className={s.ghost || 'ghost'}
          aria-hidden="true"
          tabIndex={-1}
        >
          {text}
        </span>

        {/*
          2. VISIBLE INTERACTIVE LAYER:
          Positioned on top of the ghost element in the same grid cell.
          Driven by Framer Motion motion values without React re-renders.
        */}
        {isModeB ? (
          <span
            ref={visibleLayerRef as React.RefObject<HTMLSpanElement>}
            className={s.visible || 'visible'}
            aria-hidden="true"
          >
            {graphemes.map((char, index) => (
              <LetterSpan
                key={`${index}-${char}`}
                char={char}
                index={index}
                baseWeight={effectiveBaseWeight}
                registerLetter={registerLetter}
              />
            ))}
          </span>
        ) : (
          <motion.span
            ref={visibleLayerRef as React.RefObject<HTMLSpanElement>}
            className={s.visible || 'visible'}
            style={{ fontVariationSettings }}
            aria-hidden="false"
          >
            {text}
          </motion.span>
        )}

        {/* 3. DEBUG HUD (Rendered only when debug={true}) */}
        {debug && (
          <span className={s.debugOverlay || 'debugOverlay'}>
            <span>mode: {debugInfo.mode}</span>
            <span>|</span>
            <span>w: {debugInfo.weight}</span>
            <span>|</span>
            <span>d: {debugInfo.distance}px</span>
            <span>|</span>
            <span>active: {String(debugInfo.active)}</span>
          </span>
        )}
      </Component>
    );
  }
);

WeightHeadline.displayName = 'WeightHeadline';

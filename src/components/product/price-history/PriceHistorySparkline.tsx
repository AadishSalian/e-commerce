'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { PriceHistoryResponse } from '@/lib/price-history/types';
import { formatPriceMinor, formatShortDate } from '@/lib/price-history/currency';
import { generateSparklinePath } from '@/lib/price-history/chartMath';

// Lazy load detail view modal on demand
const PriceHistoryModal = dynamic(
  () => import('./PriceHistoryModal'),
  { ssr: false }
);

interface PriceHistorySparklineProps {
  productId: string;
  productName: string;
  variantName?: string | null;
  className?: string;
  /** Custom fallback or trigger styling */
  compact?: boolean;
}

export const PriceHistorySparkline: React.FC<PriceHistorySparklineProps> = ({
  productId,
  productName,
  variantName,
  className = '',
  compact = false,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [data, setData] = useState<PriceHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Track if initial line draw-in animation has completed once
  const hasAnimatedRef = useRef<boolean>(false);
  const [tagVisible, setTagVisible] = useState<boolean>(shouldReduceMotion ? true : false);

  // Fetch 30-day price history
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(false);

    const url = `/api/products/${productId}/price-history?days=30${
      variantName ? `&variantId=${encodeURIComponent(variantName)}` : ''
    }`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: PriceHistoryResponse) => {
        if (!isCancelled) {
          setData(json);
          setIsLoading(false);
          if (shouldReduceMotion) {
            setTagVisible(true);
          }
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load sparkline price history:', err);
          setError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [productId, variantName, shouldReduceMotion]);

  // Sparkline dimensions
  const sparkWidth = 100;
  const sparkHeight = 28;

  const sparklineData = useMemo(() => {
    if (!data || !data.dailyPoints || data.dailyPoints.length === 0) return null;
    return generateSparklinePath(data.dailyPoints, sparkWidth, sparkHeight);
  }, [data]);

  // If there's an error or no data was ever found, silently render nothing (Non-negotiable rule #9)
  if (error || (!isLoading && !data)) {
    return null;
  }

  // Skeleton loading state sized precisely to final element to prevent layout jump
  if (isLoading) {
    return (
      <div
        className={`inline-flex items-center gap-3 py-1 animate-pulse select-none ${className}`}
        aria-hidden="true"
      >
        <div className="w-[100px] h-[26px] rounded bg-surface/50 border border-border/40" />
        <div className="w-32 h-3.5 rounded bg-surface/50 border border-border/40" />
      </div>
    );
  }

  if (!data) return null;

  const currency = data.currency || 'INR';
  const tag = data.tag;
  const stats = data.stats;
  const qualifiesForChart = data.qualifiesForChart;

  // Accessible label for screen readers
  const accessibleLabel = stats
    ? `Price over the last ${stats.daysTracked} days: lowest ${formatPriceMinor(
        stats.lowest,
        currency
      )}${stats.lowestDate ? ` on ${formatShortDate(stats.lowestDate)}` : ''}, currently ${formatPriceMinor(
        stats.current,
        currency
      )}.`
    : `Price history for ${productName}`;

  // If product has fewer than minimum days, show no chart and at most neutral tracking note
  if (!qualifiesForChart) {
    if (tag && tag.type === 'tracking_started') {
      return (
        <div
          className={`inline-flex items-center gap-2 text-xs text-text-muted py-1 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-text-muted/60" />
          <span>{tag.text}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`group inline-flex items-center flex-wrap gap-2.5 py-1 text-left rounded-lg transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${className}`}
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
        aria-label={`View detailed price history. ${accessibleLabel}`}
      >
        {/* Sparkline Inline SVG */}
        {sparklineData && (
          <div
            role="img"
            aria-label={accessibleLabel}
            className="relative w-[100px] h-[28px] shrink-0 overflow-visible"
          >
            <svg
              viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
              className="w-full h-full overflow-visible"
            >
              {/* Sparkline Path */}
              <motion.path
                d={sparklineData.path}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={
                  shouldReduceMotion || hasAnimatedRef.current
                    ? { pathLength: 1 }
                    : { pathLength: 0 }
                }
                animate={{ pathLength: 1 }}
                transition={
                  shouldReduceMotion || hasAnimatedRef.current
                    ? { duration: 0 }
                    : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                }
                onAnimationComplete={() => {
                  hasAnimatedRef.current = true;
                  if (!shouldReduceMotion) {
                    setTimeout(() => setTagVisible(true), 200);
                  }
                }}
              />

              {/* Lowest point hollow dot (if distinct) */}
              {sparklineData.lowestPoint && (
                <circle
                  cx={sparklineData.lowestPoint.x}
                  cy={sparklineData.lowestPoint.y}
                  r="2.2"
                  fill="var(--background)"
                  stroke="var(--accent)"
                  strokeWidth="1.5"
                />
              )}

              {/* Current price solid dot at right end */}
              <circle
                cx={sparklineData.currentPoint.x}
                cy={sparklineData.currentPoint.y}
                r="2.5"
                fill="var(--accent)"
              />
            </svg>
          </div>
        )}

        {/* Server-computed Truthful Tag */}
        {tag && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={tagVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-1 text-[12px] md:text-[13px] text-text-muted"
          >
            {tag.type === 'higher_than_usual' ? (
              <span className="text-amber-400 font-medium">{tag.text}</span>
            ) : tag.type === 'lowest_in_days' || tag.type === 'price_dropped' ? (
              <span>
                <strong className="text-foreground group-hover:text-accent font-medium transition-colors">
                  {tag.highlightPhrase}
                </strong>
                {tag.sinceDate && tag.type === 'price_dropped' && (
                  <span className="ml-1 text-text-muted">
                    since {formatShortDate(tag.sinceDate)}
                  </span>
                )}
              </span>
            ) : (
              <span>{tag.text}</span>
            )}

            <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-accent" />
          </motion.div>
        )}

        {/* If no tag qualifies, still show quiet clickable entry */}
        {!tag && (
          <span className="inline-flex items-center gap-1 text-[12px] text-text-muted group-hover:text-foreground transition-colors">
            <span>Price history</span>
            <ChevronRight className="w-3 h-3 text-accent" />
          </span>
        )}
      </button>

      {/* Lazy Detail Modal */}
      {isModalOpen && (
        <PriceHistoryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productId={productId}
          productName={productName}
          variantName={variantName}
          initialData={data}
          triggerRef={triggerRef}
        />
      )}
    </>
  );
};

export default PriceHistorySparkline;

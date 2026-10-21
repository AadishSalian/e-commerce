'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, TrendingDown, ArrowUpRight, ArrowDownRight, Minus, Calendar, ShieldCheck } from 'lucide-react';
import { DailyPricePoint, PriceHistoryResponse, PriceHistoryStats } from '@/lib/price-history/types';
import { formatPriceMinor, formatShortDate } from '@/lib/price-history/currency';
import { generateStepChartPath, Point2D } from '@/lib/price-history/chartMath';

interface PriceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  variantName?: string | null;
  initialData?: PriceHistoryResponse | null;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

type RangeOption = '30' | '90' | 'all';

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  variantName,
  initialData,
  triggerRef,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [range, setRange] = useState<RangeOption>('30');
  const [data, setData] = useState<PriceHistoryResponse | null>(initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Scrubbing state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch data when range changes or productId/variantName changes
  const fetchData = useCallback(
    async (selectedRange: RangeOption) => {
      setIsLoading(true);
      try {
        const url = `/api/products/${productId}/price-history?days=${selectedRange}${
          variantName ? `&variantId=${encodeURIComponent(variantName)}` : ''
        }`;
        const res = await fetch(url);
        if (res.ok) {
          const json: PriceHistoryResponse = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Error loading price history for range:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [productId, variantName]
  );

  useEffect(() => {
    if (isOpen) {
      fetchData(range);
    }
  }, [isOpen, range, fetchData]);

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus close button initially
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      triggerRef?.current?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  // Chart dimensions
  const svgWidth = 540;
  const svgHeight = 220;
  const padding = { top: 28, bottom: 36, left: 52, right: 24 };

  const chartData = useMemo(() => {
    if (!data || !data.dailyPoints || data.dailyPoints.length === 0) return null;
    return generateStepChartPath(
      data.dailyPoints,
      svgWidth,
      svgHeight,
      data.promotionPeriods,
      padding
    );
  }, [data]);

  // Active scrubbed point (defaults to the latest point if not hovering)
  const activePoint: Point2D | null = useMemo(() => {
    if (!chartData || chartData.points.length === 0) return null;
    if (hoverIndex !== null && chartData.points[hoverIndex]) {
      return chartData.points[hoverIndex];
    }
    return chartData.points[chartData.points.length - 1];
  }, [chartData, hoverIndex]);

  // Handle pointer scrubbing
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || !chartData || chartData.points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = svgWidth / rect.width;
    const pointerSvgX = (e.clientX - rect.left) * scaleX;

    // Find nearest point along x axis
    let closestIdx = 0;
    let closestDist = Infinity;
    chartData.points.forEach((p, idx) => {
      const dist = Math.abs(p.x - pointerSvgX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  // Keyboard navigation for scrubbing
  const handleChartKeyDown = (e: React.KeyboardEvent) => {
    if (!chartData || chartData.points.length === 0) return;
    const maxIdx = chartData.points.length - 1;
    const currentIdx = hoverIndex ?? maxIdx;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setHoverIndex(Math.max(0, currentIdx - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setHoverIndex(Math.min(maxIdx, currentIdx + 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setHoverIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setHoverIndex(maxIdx);
    }
  };

  if (!isOpen) return null;

  const currency = data?.currency || 'INR';
  const stats = data?.stats;
  const daysTracked = data?.daysTracked || 0;
  const rangeLabel = range === '30' ? '30 days' : range === '90' ? '90 days' : 'all time';

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-history-dialog-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.05 : 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Modal / Bottom Sheet Panel */}
        <motion.div
          ref={modalRef}
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { y: '100%', opacity: 1 }
          }
          animate={
            shouldReduceMotion
              ? { opacity: 1 }
              : { y: 0, opacity: 1 }
          }
          exit={
            shouldReduceMotion
              ? { opacity: 0 }
              : { y: '100%', opacity: 0.8 }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0.1 }
              : { type: 'spring', damping: 28, stiffness: 300 }
          }
          drag={shouldReduceMotion ? false : 'y'}
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 120 || info.velocity.y > 450) {
              onClose();
            }
          }}
          className="relative w-full md:max-w-xl max-h-[92vh] md:max-h-[88vh] bg-surface border border-border rounded-t-3xl md:rounded-2xl flex flex-col overflow-hidden text-foreground shadow-2xl z-10"
        >
          {/* Mobile Drag Indicator Handle */}
          <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-12 h-1.5 rounded-full bg-border opacity-80" />
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="price-history-dialog-title"
                  className="text-lg md:text-xl font-bold tracking-tight text-foreground"
                >
                  {variantName ? `Price history — ${variantName}` : 'Price history'}
                </h2>
                {data?.tag && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${
                      data.tag.isNeutral
                        ? 'bg-surface border-border text-text-muted'
                        : 'bg-accent/10 border-accent/30 text-accent'
                    }`}
                  >
                    {data.tag.highlightPhrase}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5 line-clamp-1">
                {productName}
              </p>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="p-2 rounded-full border border-border hover:bg-surface-hover text-text-muted hover:text-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-accent"
              aria-label="Close price history"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            {/* Top Bar: Range Toggle & Active Price Inspection */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Range Toggle with sliding pill */}
              <div
                className="inline-flex p-1 rounded-xl bg-background border border-border text-xs font-medium"
                role="radiogroup"
                aria-label="Select history range"
              >
                {(['30', '90', 'all'] as RangeOption[]).map((opt) => {
                  const isSelected = range === opt;
                  const label = opt === '30' ? '30 days' : opt === '90' ? '90 days' : 'All time';
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setRange(opt)}
                      className={`relative px-3 py-1.5 rounded-lg transition-colors duration-150 select-none ${
                        isSelected
                          ? 'text-foreground font-semibold'
                          : 'text-text-muted hover:text-foreground'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="priceHistoryRangePill"
                          className="absolute inset-0 bg-surface border border-border shadow-sm rounded-lg"
                          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Inspector Display */}
              {activePoint && (
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <div className="text-base font-bold text-foreground tabular-nums">
                      {formatPriceMinor(activePoint.price, currency)}
                    </div>
                    <div className="text-[11px] text-text-muted tabular-nums">
                      {formatShortDate(activePoint.date, true)}
                    </div>
                  </div>
                  {activePoint.isPromotion && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent/15 text-accent border border-accent/30 font-medium">
                      Sale
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Stepped Chart Container */}
            <div className="relative rounded-2xl bg-background border border-border p-3 pt-5 select-none">
              {isLoading && (
                <div className="absolute inset-0 z-20 bg-background/50 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {chartData ? (
                <div className="relative">
                  <svg
                    ref={svgRef}
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto cursor-crosshair overflow-visible touch-none"
                    onPointerMove={handlePointerMove}
                    onPointerLeave={handlePointerLeave}
                    tabIndex={0}
                    role="application"
                    aria-label={`Interactive price history chart over ${rangeLabel}. Use left and right arrow keys to explore prices by date.`}
                    onKeyDown={handleChartKeyDown}
                  >
                    <defs>
                      <linearGradient id="priceHistoryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" />
                      </linearGradient>
                    </defs>

                    {/* Promotion Background Bands */}
                    {chartData.promotionBands.map((band, idx) => (
                      <g key={idx}>
                        <rect
                          x={band.x}
                          y={padding.top}
                          width={band.width}
                          height={svgHeight - padding.top - padding.bottom}
                          fill="var(--accent)"
                          fillOpacity="0.08"
                          rx={3}
                        />
                        <text
                          x={band.x + 4}
                          y={padding.top - 8}
                          fontSize="10"
                          fill="var(--accent)"
                          fontFamily="inherit"
                          fontWeight="600"
                          opacity="0.85"
                        >
                          SALE
                        </text>
                      </g>
                    ))}

                    {/* Y-Axis Grid Lines & Labeled Baseline */}
                    <line
                      x1={padding.left}
                      y1={padding.top}
                      x2={svgWidth - padding.right}
                      y2={padding.top}
                      stroke="currentColor"
                      strokeOpacity="0.12"
                      strokeDasharray="2 3"
                    />
                    <text
                      x={padding.left - 8}
                      y={padding.top + 3}
                      textAnchor="end"
                      fontSize="10"
                      fill="var(--text-muted)"
                      className="tabular-nums font-mono"
                    >
                      {formatPriceMinor(chartData.yMax, currency)}
                    </text>

                    <line
                      x1={padding.left}
                      y1={svgHeight - padding.bottom}
                      x2={svgWidth - padding.right}
                      y2={svgHeight - padding.bottom}
                      stroke="currentColor"
                      strokeOpacity="0.18"
                    />
                    <text
                      x={padding.left - 8}
                      y={svgHeight - padding.bottom + 3}
                      textAnchor="end"
                      fontSize="10"
                      fill="var(--text-muted)"
                      className="tabular-nums font-mono"
                    >
                      {formatPriceMinor(chartData.yMin, currency)}
                    </text>

                    {/* Stepped Area Fill */}
                    <path
                      d={chartData.areaPath}
                      fill="url(#priceHistoryAreaGrad)"
                    />

                    {/* Stepped Line Path */}
                    <motion.path
                      d={chartData.linePath}
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="miter"
                      initial={shouldReduceMotion ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                    />

                    {/* Scrubbing Guide Line & Active Dot */}
                    {activePoint && (
                      <g>
                        <line
                          x1={activePoint.x}
                          y1={padding.top}
                          x2={activePoint.x}
                          y2={svgHeight - padding.bottom}
                          stroke="currentColor"
                          strokeOpacity="0.4"
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                        />
                        {/* Outer ping indicator */}
                        <circle
                          cx={activePoint.x}
                          cy={activePoint.y}
                          r="5"
                          fill="var(--accent)"
                          fillOpacity="0.3"
                        />
                        {/* Solid center dot */}
                        <circle
                          cx={activePoint.x}
                          cy={activePoint.y}
                          r="3"
                          fill="var(--accent)"
                          stroke="var(--surface)"
                          strokeWidth="1.5"
                        />
                      </g>
                    )}

                    {/* X-Axis Date Labels */}
                    {chartData.points.length > 0 && (
                      <g className="text-[10px] fill-text-muted font-mono select-none">
                        <text
                          x={padding.left}
                          y={svgHeight - 10}
                          textAnchor="start"
                        >
                          {formatShortDate(chartData.points[0].date)}
                        </text>
                        {chartData.points.length > 2 && (
                          <text
                            x={svgWidth / 2}
                            y={svgHeight - 10}
                            textAnchor="middle"
                          >
                            {formatShortDate(
                              chartData.points[Math.floor(chartData.points.length / 2)].date
                            )}
                          </text>
                        )}
                        <text
                          x={svgWidth - padding.right}
                          y={svgHeight - 10}
                          textAnchor="end"
                        >
                          {formatShortDate(
                            chartData.points[chartData.points.length - 1].date
                          )}
                        </text>
                      </g>
                    )}
                  </svg>
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-text-muted">
                  No chart data available for this range
                </div>
              )}
            </div>

            {/* Stat Row: Lowest, Highest, Current, Average */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3 text-accent" />
                    Lowest
                  </span>
                  <div className="text-sm md:text-base font-bold text-foreground tabular-nums mt-0.5">
                    {formatPriceMinor(stats.lowest, currency)}
                  </div>
                  {stats.lowestDate && (
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      on {formatShortDate(stats.lowestDate)}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-red-400" />
                    Highest
                  </span>
                  <div className="text-sm md:text-base font-bold text-foreground tabular-nums mt-0.5">
                    {formatPriceMinor(stats.highest, currency)}
                  </div>
                  {stats.highestDate && (
                    <span className="text-[10px] text-text-muted block mt-0.5">
                      on {formatShortDate(stats.highestDate)}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <Minus className="w-3 h-3 text-text-muted" />
                    Current
                  </span>
                  <div className="text-sm md:text-base font-bold text-foreground tabular-nums mt-0.5">
                    {formatPriceMinor(stats.current, currency)}
                  </div>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    Effective now
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-text-muted" />
                    Average
                  </span>
                  <div className="text-sm md:text-base font-bold text-foreground tabular-nums mt-0.5">
                    {formatPriceMinor(stats.average, currency)}
                  </div>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    Over {stats.daysTracked} days
                  </span>
                </div>
              </div>
            )}

            {/* Truthful Anchor Note if Was-Price exists */}
            {stats?.wasPrice && stats.wasPrice > stats.current && (
              <div className="p-3 rounded-xl bg-surface-hover/50 border border-border text-xs text-text-muted flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                <span>
                  Previous price held for at least 7 days was{' '}
                  <strong className="text-foreground tabular-nums line-through">
                    {formatPriceMinor(stats.wasPrice, currency)}
                  </strong>
                  .
                </span>
              </div>
            )}

            {/* Non-negotiable Footnote */}
            <p className="text-[11px] text-text-muted leading-relaxed border-t border-border pt-4">
              Based on this product’s price on MATTE over the last{' '}
              {stats?.daysTracked || rangeLabel}. Prices on other sites are not included.
            </p>

            {/* Accessible Visually Hidden Table for Screen Readers */}
            {data?.dailyPoints && data.dailyPoints.length > 0 && (
              <table className="sr-only">
                <caption>
                  Price history data table for {productName}
                  {variantName ? ` (${variantName})` : ''} over {rangeLabel}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Price</th>
                    <th scope="col">Promotion Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dailyPoints.map((point) => (
                    <tr key={point.date}>
                      <td>{point.date}</td>
                      <td>{formatPriceMinor(point.closingPrice, currency)}</td>
                      <td>{point.isPromotion ? 'On promotion' : 'Standard price'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PriceHistoryModal;

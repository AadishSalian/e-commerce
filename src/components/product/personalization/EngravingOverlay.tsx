'use client';

import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  EngravingZone,
  PersonalizationValue,
  EngravingFont
} from '@/lib/personalization/types';
import {
  calculateAutoFitText,
  buildZoneTransformCss,
  formatMonogramText
} from '@/lib/personalization/math';
import { useFontLoader } from './useFontLoader';
import { AlertCircle, Loader2 } from 'lucide-react';

interface EngravingOverlayProps {
  zone: EngravingZone;
  value: PersonalizationValue;
  selectedVariantValue?: string | null;
  isFocused?: boolean;
  isZoomed?: boolean;
}

export function EngravingOverlay({
  zone,
  value,
  selectedVariantValue,
  isFocused = false,
  isZoomed = false
}: EngravingOverlayProps) {
  const shouldReduceMotion = useReducedMotion();
  const font: EngravingFont =
    zone.fonts.find((f) => f.id === value.font_id) || zone.fonts[0];

  const fontState = useFontLoader(font);

  // Compute text lines considering monogram mode or standard lines
  const displayLines = useMemo(() => {
    if (zone.supports_monogram && value.monogram_mode) {
      const rawInitials = value.lines[0] || '';
      const monogramData = formatMonogramText(rawInitials, value.monogram_mode);
      if (value.monogram_mode === 'stacked') {
        return monogramData.displayText.split('\n');
      }
      return [monogramData.displayText];
    }
    return value.lines;
  }, [value.lines, value.monogram_mode, zone.supports_monogram]);

  const hasContent = displayLines.some((l) => l.trim().length > 0);

  // Auto-fit calculations
  const fitResult = useMemo(() => {
    return calculateAutoFitText(
      displayLines,
      zone,
      font,
      500, // virtual box width
      200  // virtual box height
    );
  }, [displayLines, zone, font]);

  // Compute finish color based on variant finish overrides
  const finishColors = useMemo(() => {
    const overrides = selectedVariantValue && zone.variant_finish_overrides
      ? zone.variant_finish_overrides[selectedVariantValue]
      : undefined;

    if (zone.finish_style === 'debossed_leather') {
      return {
        fill: overrides?.color || '#161009',
        opacity: overrides?.opacity ?? 0.88,
        highlight: overrides?.highlightColor || 'rgba(255, 255, 255, 0.18)',
        shadow: 'rgba(0, 0, 0, 0.65)'
      };
    }

    if (zone.finish_style === 'laser_metal') {
      return {
        fill: overrides?.color || '#e8eaed',
        opacity: overrides?.opacity ?? 0.72,
        highlight: 'transparent',
        shadow: 'rgba(0, 0, 0, 0.35)'
      };
    }

    if (zone.finish_style === 'foil_emboss' || zone.finish_style === 'embroidery') {
      return {
        fill: value.foil_color || '#c5a358', // 24k Gold default
        opacity: 0.95,
        highlight: 'rgba(255, 255, 255, 0.25)',
        shadow: 'rgba(0, 0, 0, 0.4)'
      };
    }

    return {
      fill: overrides?.color || '#e0e0e0',
      opacity: 0.75,
      highlight: 'transparent',
      shadow: 'transparent'
    };
  }, [zone.finish_style, zone.variant_finish_overrides, selectedVariantValue, value.foil_color]);

  // SVG text anchors
  const textAnchor =
    value.alignment === 'center'
      ? 'middle'
      : value.alignment === 'right'
      ? 'end'
      : 'start';

  const anchorX =
    value.alignment === 'center'
      ? 250
      : value.alignment === 'right'
      ? 475
      : 25;

  const transformStyle = buildZoneTransformCss(zone);

  // Hide or scale overlay if zoomed
  if (isZoomed) {
    return null;
  }

  return (
    <div
      className="absolute pointer-events-none select-none transition-all duration-300"
      style={{
        left: `${zone.geometry.x}%`,
        top: `${zone.geometry.y}%`,
        width: `${zone.geometry.width}%`,
        height: `${zone.geometry.height}%`,
        transform: transformStyle,
        transformOrigin: 'center center',
        zIndex: 15
      }}
      aria-hidden="true"
    >
      {/* Zone Focus Highlight (visible when typing in personalization panel) */}
      <div
        className={`absolute inset-0 rounded-sm pointer-events-none transition-opacity duration-300 ${
          isFocused
            ? 'opacity-100 border border-dashed border-accent/60 bg-accent/5 ring-2 ring-accent/20'
            : 'opacity-0'
        }`}
      >
        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-wider text-accent uppercase bg-background/80 px-1.5 py-0.5 rounded shadow-sm">
          {zone.name}
        </span>
      </div>

      {/* Font Loading / Error State */}
      {fontState.isLoading && hasContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-text-muted/60" />
        </div>
      )}

      {fontState.hasError && hasContent && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-950/20 rounded p-1 border border-red-500/30">
          <span className="text-[9px] text-red-400 text-center font-mono flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5" /> Font Unavailable
          </span>
        </div>
      )}

      {/* SVG Crisply Scaled Text Layer */}
      {fontState.isLoaded && hasContent && (
        <motion.div
          key={`overlay-motion-${font.id}-${value.monogram_mode || 'text'}`}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
          className="w-full h-full"
        >
          <svg
            viewBox="0 0 500 200"
            className="w-full h-full overflow-visible"
            style={{
              mixBlendMode:
                zone.finish_style === 'laser_metal'
                  ? 'overlay'
                  : zone.finish_style === 'debossed_leather'
                  ? 'multiply'
                  : 'normal'
            }}
          >
            <defs>
              {/* Subtle inner deboss highlight shader */}
              {zone.finish_style === 'debossed_leather' && (
                <filter id="deboss-depth" x="-10%" y="-10%" width="120%" height="130%">
                  <feOffset in="SourceAlpha" dx="0" dy="1.5" result="offset" />
                  <feFlood floodColor={finishColors.highlight} result="highlightColor" />
                  <feComposite in2="offset" in="highlightColor" operator="in" result="highlight" />
                  <feMerge>
                    <feMergeNode in="highlight" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              )}

              {/* Laser etch subtle shadow */}
              {zone.finish_style === 'laser_metal' && (
                <filter id="laser-etch" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow
                    dx="0"
                    dy="0.8"
                    stdDeviation="0.6"
                    floodColor="rgba(0, 0, 0, 0.45)"
                  />
                </filter>
              )}
            </defs>

            {/* Traditional Monogram Layout with Large Center Initial */}
            {zone.supports_monogram &&
            value.monogram_mode === 'traditional' &&
            fitResult.lines[0]?.length >= 2 ? (
              <g
                fontFamily={font.font_family}
                fill={finishColors.fill}
                fillOpacity={finishColors.opacity}
                filter={
                  zone.finish_style === 'debossed_leather'
                    ? 'url(#deboss-depth)'
                    : zone.finish_style === 'laser_metal'
                    ? 'url(#laser-etch)'
                    : undefined
                }
              >
                {(() => {
                  const mono = formatMonogramText(fitResult.lines[0], 'traditional');
                  const count = mono.letters.length;
                  const baseSize = fitResult.fontSize * 0.95;
                  const centerY = 100 + baseSize * 0.35;

                  if (count === 3) {
                    const first = mono.letters[0];
                    const center = mono.letters[1];
                    const last = mono.letters[2];
                    return (
                      <>
                        {/* First Name Initial (Left) */}
                        <text
                          x={250 - baseSize * 1.1}
                          y={centerY}
                          fontSize={baseSize * first.scale}
                          textAnchor="middle"
                          letterSpacing={font.letter_spacing}
                        >
                          {first.char}
                        </text>
                        {/* Last Name Initial (Center Prominent) */}
                        <text
                          x={250}
                          y={centerY}
                          fontSize={baseSize * center.scale}
                          fontWeight="600"
                          textAnchor="middle"
                          letterSpacing={font.letter_spacing}
                        >
                          {center.char}
                        </text>
                        {/* Middle Name Initial (Right) */}
                        <text
                          x={250 + baseSize * 1.1}
                          y={centerY}
                          fontSize={baseSize * last.scale}
                          textAnchor="middle"
                          letterSpacing={font.letter_spacing}
                        >
                          {last.char}
                        </text>
                      </>
                    );
                  }

                  // 2 letters fallback
                  return (
                    <>
                      <text
                        x={250 - baseSize * 0.65}
                        y={centerY}
                        fontSize={baseSize}
                        textAnchor="middle"
                        letterSpacing={font.letter_spacing}
                      >
                        {mono.letters[0]?.char}
                      </text>
                      <text
                        x={250 + baseSize * 0.65}
                        y={centerY}
                        fontSize={baseSize * 1.25}
                        fontWeight="600"
                        textAnchor="middle"
                        letterSpacing={font.letter_spacing}
                      >
                        {mono.letters[1]?.char}
                      </text>
                    </>
                  );
                })()}
              </g>
            ) : (
              /* Standard Lines or Stacked Monogram Rendering */
              <g
                fontFamily={font.font_family}
                fill={finishColors.fill}
                fillOpacity={finishColors.opacity}
                filter={
                  zone.finish_style === 'debossed_leather'
                    ? 'url(#deboss-depth)'
                    : zone.finish_style === 'laser_metal'
                    ? 'url(#laser-etch)'
                    : undefined
                }
              >
                {fitResult.lines.map((line, i) => {
                  const y = fitResult.yOffsets[i] || (i + 1) * fitResult.fontSize * 1.35;
                  const content = value.icon_id
                    ? value.icon_position === 'before'
                      ? `${value.icon_id} ${line}`
                      : `${line} ${value.icon_id}`
                    : line;

                  return (
                    <text
                      key={i}
                      x={anchorX}
                      y={y}
                      fontSize={fitResult.fontSize}
                      textAnchor={textAnchor}
                      letterSpacing={font.letter_spacing}
                      className="transition-all duration-75"
                    >
                      {content}
                    </text>
                  );
                })}
              </g>
            )}
          </svg>
        </motion.div>
      )}
    </div>
  );
}

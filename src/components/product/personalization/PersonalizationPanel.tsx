'use client';

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Check,
  Tag,
  Clock,
  Trash2,
  ChevronDown
} from 'lucide-react';
import {
  EngravingZone,
  PersonalizationValue,
  EngravingFont,
  MonogramLayout
} from '@/lib/personalization/types';
import {
  validateCharInput,
  validatePersonalization,
  sanitizePersonalizationText
} from '@/lib/personalization/validation';
import { CURATED_SYMBOLS, FOIL_THREAD_SWATCHES } from '@/lib/personalization/data';

interface PersonalizationPanelProps {
  zone: EngravingZone;
  value: PersonalizationValue;
  onChange: (value: PersonalizationValue) => void;
  onFocusChange: (isFocused: boolean) => void;
  selectedVariantValue?: string | null;
  isOpen: boolean;
  onToggleOpen: (open: boolean) => void;
}

export function PersonalizationPanel({
  zone,
  value,
  onChange,
  onFocusChange,
  selectedVariantValue,
  isOpen,
  onToggleOpen
}: PersonalizationPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const formId = useId();

  // Internal inputs state for instant typing responsiveness
  const [internalLines, setInternalLines] = useState<string[]>(
    value.lines.length > 0 ? value.lines : Array(zone.max_lines).fill('')
  );
  const [activeMode, setActiveMode] = useState<'text' | 'monogram'>(
    value.monogram_mode && value.monogram_mode !== 'single' && value.monogram_mode !== 'stacked' && value.monogram_mode !== 'traditional'
      ? 'text'
      : (zone.supports_monogram && value.monogram_mode ? 'monogram' : 'text')
  );
  const [blockedCharWarning, setBlockedCharWarning] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync internal lines if external value changes (e.g. clear or preset)
  useEffect(() => {
    if (value.lines.join('|') !== internalLines.join('|')) {
      setInternalLines(value.lines.length > 0 ? value.lines : Array(zone.max_lines).fill(''));
    }
  }, [value.lines, zone.max_lines]);

  // Debounced notification to parent overlay (60-80ms)
  const propagateChange = useCallback(
    (newLines: string[]) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        if (!isComposing) {
          onChange({
            ...value,
            lines: newLines
          });
        }
      }, 70);
    },
    [onChange, value, isComposing]
  );

  const handleLineChange = (index: number, rawInput: string) => {
    // Check characters entered
    const sanitized = sanitizePersonalizationText(rawInput);
    
    // Check if any character was rejected
    if (rawInput.length > sanitized.length) {
      setBlockedCharWarning('Unsupported formatting characters were removed.');
      setTimeout(() => setBlockedCharWarning(null), 3000);
    }

    // Check last typed character
    if (sanitized.length > (internalLines[index] || '').length) {
      const addedChar = sanitized[sanitized.length - 1];
      const check = validateCharInput(addedChar, zone);
      if (!check.isAllowed) {
        setBlockedCharWarning(check.errorMessage || `Character "${addedChar}" is not supported.`);
        setTimeout(() => setBlockedCharWarning(null), 3500);
        return; // Don't append blocked character
      }
    }

    // Enforce max characters limit
    const finalLine = sanitized.slice(0, zone.max_chars_per_line);

    const updated = [...internalLines];
    updated[index] = finalLine;
    setInternalLines(updated);
    propagateChange(updated);
  };

  const handleTryExample = () => {
    const example =
      activeMode === 'monogram'
        ? (zone.fonts.find(f => f.id === value.font_id)?.sample_text || 'JFK').slice(0, 3)
        : (zone.fonts.find(f => f.id === value.font_id)?.sample_text || 'ALEXANDER');

    const newLines = Array(zone.max_lines).fill('');
    newLines[0] = example;
    setInternalLines(newLines);
    onChange({
      ...value,
      lines: newLines
    });
  };

  const handleClear = () => {
    const emptyLines = Array(zone.max_lines).fill('');
    setInternalLines(emptyLines);
    onChange({
      ...value,
      lines: emptyLines,
      icon_id: undefined
    });
  };

  const selectedFont = zone.fonts.find((f) => f.id === value.font_id) || zone.fonts[0];
  const priceDollars = (zone.price_addon / 100).toFixed(2);
  const hasText = internalLines.some((l) => l.trim().length > 0);

  return (
    <div className="w-full rounded-2xl border border-border bg-surface overflow-hidden transition-all duration-200">
      {/* Panel Toggle Header */}
      <button
        type="button"
        onClick={() => onToggleOpen(!isOpen)}
        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-surface-hover/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm sm:text-base">
                Custom Personalization & Engraving
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold tracking-wider">
                +${priceDollars}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {hasText
                ? `Inscribed with "${internalLines.filter(Boolean).join(' ')}" • ${selectedFont.label}`
                : 'Engrave initials, names, or meaningful dates in real time'}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-text-muted shrink-0"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Expandable Panel Body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-border px-4 py-5 sm:p-6 space-y-6"
          >
            {/* Live announcements for screen readers */}
            <div className="sr-only" aria-live="polite">
              {blockedCharWarning}
            </div>

            {/* Mode Selector (Standard Text vs Monogram) */}
            {zone.supports_monogram && (
              <div className="flex items-center gap-2 p-1 bg-background rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('text');
                    onChange({ ...value, monogram_mode: undefined });
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                    activeMode === 'text'
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  Standard Text / Names
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('monogram');
                    onChange({ ...value, monogram_mode: 'traditional' });
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                    activeMode === 'monogram'
                      ? 'bg-surface text-foreground shadow-sm'
                      : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  Monogram Initials
                </button>
              </div>
            )}

            {/* Monogram Layout Options */}
            {activeMode === 'monogram' && zone.supports_monogram && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="font-medium text-foreground">Monogram Style:</span>
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" />
                    Traditional: First • LAST (center) • Middle
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'traditional', label: 'Traditional (Large Center)' },
                      { id: 'stacked', label: 'Vertical Stacked' },
                      { id: 'single', label: 'Single Letter' }
                    ] as { id: MonogramLayout; label: string }[]
                  ).map((layout) => (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => onChange({ ...value, monogram_mode: layout.id })}
                      className={`p-2 rounded-xl border text-xs text-center transition-colors ${
                        value.monogram_mode === layout.id
                          ? 'border-accent bg-accent/10 text-foreground font-semibold'
                          : 'border-border bg-background hover:bg-surface-hover text-text-muted'
                      }`}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Inscription Text Input Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`${formId}-line-0`}
                  className="text-xs font-medium text-foreground uppercase tracking-wider"
                >
                  {activeMode === 'monogram' ? 'Enter Initials (1 to 3 letters)' : 'Your Text / Inscription'}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleTryExample}
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                  >
                    Try an example
                  </button>
                  {hasText && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-xs text-text-muted hover:text-red-400 flex items-center gap-1 transition-colors"
                      aria-label="Clear entered text"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {Array.from({ length: activeMode === 'monogram' ? 1 : zone.max_lines }).map(
                (_, lineIdx) => {
                  const currentLine = internalLines[lineIdx] || '';
                  const maxChars =
                    activeMode === 'monogram' ? 3 : zone.max_chars_per_line;
                  const isNearLimit = currentLine.length >= maxChars * 0.8;
                  const isAtLimit = currentLine.length >= maxChars;

                  return (
                    <div key={lineIdx} className="space-y-1.5">
                      <div className="relative flex items-center">
                        <input
                          id={`${formId}-line-${lineIdx}`}
                          type="text"
                          value={currentLine}
                          onChange={(e) => handleLineChange(lineIdx, e.target.value)}
                          onFocus={() => onFocusChange(true)}
                          onBlur={() => onFocusChange(false)}
                          onCompositionStart={() => setIsComposing(true)}
                          onCompositionEnd={() => {
                            setIsComposing(false);
                            propagateChange(internalLines);
                          }}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize={selectedFont.is_uppercase_only ? 'characters' : 'words'}
                          spellCheck="false"
                          placeholder={
                            activeMode === 'monogram'
                              ? 'e.g. JFK'
                              : zone.max_lines > 1
                              ? `Line ${lineIdx + 1} (e.g. ${lineIdx === 0 ? 'ALEXANDER' : 'EST. 2026'})`
                              : 'e.g. ALEXANDER'
                          }
                          aria-describedby={`${formId}-desc-${lineIdx}`}
                          className="w-full bg-background border border-border focus:border-accent text-foreground text-sm px-4 py-3 rounded-xl focus:outline-none transition-colors font-medium placeholder:text-text-muted/40"
                          style={{
                            fontFamily: selectedFont.font_family,
                            letterSpacing: selectedFont.letter_spacing
                          }}
                        />

                        {/* Character Limit Counter */}
                        <div
                          className={`absolute right-3.5 text-xs font-mono tabular-nums px-1.5 py-0.5 rounded transition-colors ${
                            isAtLimit
                              ? 'text-red-400 font-semibold bg-red-950/20'
                              : isNearLimit
                              ? 'text-amber-400 font-medium bg-amber-950/20'
                              : 'text-text-muted/60'
                          }`}
                        >
                          {currentLine.length} / {maxChars}
                        </div>
                      </div>

                      <div
                        id={`${formId}-desc-${lineIdx}`}
                        className="flex justify-between items-center text-[11px] text-text-muted px-1"
                      >
                        <span>{zone.charset_description}</span>
                        {isAtLimit && (
                          <span className="text-amber-400 font-medium">Limit reached</span>
                        )}
                      </div>
                    </div>
                  );
                }
              )}

              {/* Blocked character feedback alert */}
              <AnimatePresence>
                {blockedCharWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>{blockedCharWarning}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Typography / Font Picker (Radio Group Pattern with layoutId) */}
            <div className="space-y-2.5">
              <span className="text-xs font-medium text-foreground uppercase tracking-wider block">
                Engraving Typography Style
              </span>
              <div
                role="radiogroup"
                aria-label="Engraving font styles"
                className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              >
                {zone.fonts.map((f) => {
                  const isSelected = f.id === value.font_id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => onChange({ ...value, font_id: f.id })}
                      className={`relative p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-accent bg-accent/10 text-foreground'
                          : 'border-border bg-background hover:bg-surface-hover text-text-muted hover:text-foreground'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="active-font-indicator"
                          className="absolute inset-0 rounded-xl border-2 border-accent pointer-events-none"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <p className="text-xs font-semibold text-foreground">{f.label}</p>
                      <p
                        className="text-sm mt-1 text-foreground/90 truncate"
                        style={{ fontFamily: f.font_family, letterSpacing: f.letter_spacing }}
                      >
                        {f.sample_text || 'SAMPLE'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alignment Controls (if supported by zone) */}
            {zone.supports_alignment && activeMode !== 'monogram' && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-foreground uppercase tracking-wider block">
                  Text Alignment
                </span>
                <div className="flex items-center gap-2">
                  {(
                    [
                      { id: 'left', icon: AlignLeft, label: 'Left' },
                      { id: 'center', icon: AlignCenter, label: 'Center' },
                      { id: 'right', icon: AlignRight, label: 'Right' }
                    ] as const
                  ).map((align) => {
                    const isSelected = value.alignment === align.id;
                    const Icon = align.icon;
                    return (
                      <button
                        key={align.id}
                        type="button"
                        onClick={() => onChange({ ...value, alignment: align.id })}
                        className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
                          isSelected
                            ? 'border-accent bg-accent/10 text-accent font-semibold'
                            : 'border-border bg-background hover:bg-surface-hover text-text-muted'
                        }`}
                        aria-label={`Align ${align.label}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{align.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Curated Symbols / Glyphs */}
            {zone.allowed_symbols && zone.allowed_symbols.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="font-medium text-foreground uppercase tracking-wider">
                    Add Curated Emblem / Symbol (Optional)
                  </span>
                  {value.icon_id && (
                    <button
                      type="button"
                      onClick={() => onChange({ ...value, icon_id: undefined })}
                      className="text-accent hover:underline text-[11px]"
                    >
                      Remove emblem
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {zone.allowed_symbols.map((symbol) => {
                    const isSelected = value.icon_id === symbol.glyph;
                    return (
                      <button
                        key={symbol.id}
                        type="button"
                        onClick={() =>
                          onChange({
                            ...value,
                            icon_id: isSelected ? undefined : symbol.glyph,
                            icon_position: 'before'
                          })
                        }
                        className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center transition-all ${
                          isSelected
                            ? 'border-accent bg-accent/15 text-accent font-bold scale-105'
                            : 'border-border bg-background hover:bg-surface-hover text-text-muted hover:text-foreground'
                        }`}
                        title={symbol.name}
                        aria-label={`Add ${symbol.name}`}
                      >
                        {symbol.glyph}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Foil / Embroidery Color Swatches */}
            {(zone.finish_style === 'foil_emboss' || zone.finish_style === 'embroidery') && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-foreground uppercase tracking-wider block">
                  Thread / Foil Color
                </span>
                <div className="flex items-center gap-3">
                  {FOIL_THREAD_SWATCHES.map((swatch) => {
                    const isSelected = (value.foil_color || '#c5a358') === swatch.color;
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => onChange({ ...value, foil_color: swatch.color })}
                        className={`group relative p-1 rounded-full border transition-all ${
                          isSelected ? 'border-accent ring-2 ring-accent/30' : 'border-border hover:border-text-muted'
                        }`}
                        title={swatch.name}
                        aria-label={`Select ${swatch.name}`}
                      >
                        <span
                          className="w-6 h-6 rounded-full block border border-black/20"
                          style={{ backgroundColor: swatch.color }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Add-On & Workshop Lead Time Breakdown */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-text-muted">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  <Tag className="w-3.5 h-3.5 text-accent" />
                  +${priceDollars} Engraving Fee
                </span>
                <span className="flex items-center gap-1.5 text-text-muted">
                  <Clock className="w-3.5 h-3.5" />
                  +{zone.lead_time_days} business days to craft
                </span>
              </div>
              <span className="text-[11px] text-text-muted/80">
                Non-returnable bespoke item
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

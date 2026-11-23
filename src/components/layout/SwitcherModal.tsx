'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Globe, Check, Search, X, AlertCircle } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { LOCALES, SUPPORTED_CURRENCIES, LocaleConfig, CurrencyConfig } from '@/lib/i18n/config';

export interface SwitcherTriggerProps {
  className?: string;
  variant?: 'nav' | 'footer' | 'mobile-drawer';
}

/**
 * Compact, fixed-width friendly trigger button.
 * Used identically in Navbar right cluster, Footer, and Mobile Drawer.
 */
export function SwitcherTrigger({ className = '', variant = 'nav' }: SwitcherTriggerProps) {
  const { locale, currency, localeConfig, currencyConfig, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const langShort = locale.split('-')[0].toUpperCase();
  const currSymbol = currencyConfig.symbol;

  const accessibleName = t('switcher.triggerLabel', {
    language: localeConfig.name,
    currency: currencyConfig.name,
  });

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={accessibleName}
        title={accessibleName}
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-surface text-xs font-mono font-medium text-text-muted hover:text-foreground hover:bg-surface-hover hover:border-border-strong transition-colors select-none ${
          variant === 'nav' ? 'h-8' : variant === 'footer' ? 'h-9 px-3 text-xs' : 'w-full justify-between h-11 px-4 text-sm'
        } ${className}`}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <Globe className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition-colors shrink-0" aria-hidden="true" />
          <span className="tracking-wider tabular-nums font-semibold text-foreground">
            {langShort} · {currSymbol}
          </span>
        </div>
        {variant === 'mobile-drawer' && (
          <span className="text-xs text-text-muted font-sans capitalize">{localeConfig.native}</span>
        )}
      </button>

      <SwitcherModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          // Restore focus to trigger
          setTimeout(() => triggerRef.current?.focus(), 50);
        }}
      />
    </>
  );
}

interface SwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SwitcherModal({ isOpen, onClose }: SwitcherModalProps) {
  const {
    locale,
    currency,
    setLocale,
    setCurrency,
    t,
    isPaymentLocked,
    recentlyUsedLocales,
    recentlyUsedCurrencies,
  } = useLocale();

  const prefersReducedMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<'language' | 'currency'>('language');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset search when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter locales
  const filteredLocales = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return LOCALES;
    return LOCALES.filter(
      (l) =>
        l.native.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Filter currencies
  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SUPPORTED_CURRENCIES;
    return SUPPORTED_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.nativeName.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Recently used items
  const recentLocaleItems = useMemo(() => {
    return recentlyUsedLocales
      .map((code) => LOCALES.find((l) => l.code === code))
      .filter(Boolean) as LocaleConfig[];
  }, [recentlyUsedLocales]);

  const recentCurrencyItems = useMemo(() => {
    return recentlyUsedCurrencies
      .map((code) => SUPPORTED_CURRENCIES.find((c) => c.code === code))
      .filter(Boolean) as CurrencyConfig[];
  }, [recentlyUsedCurrencies]);

  const handleSelectLocale = (code: string) => {
    setLocale(code);
    // Stay open as per Prompt Section 2: "popover staying open until closed so both can be changed in one visit"
  };

  const handleSelectCurrency = (code: string) => {
    if (isPaymentLocked) return;
    setCurrency(code);
  };

  // Keyboard arrow navigation helper for radio-group
  const handleRadioKeyDown = (
    e: React.KeyboardEvent,
    list: any[],
    currentIndex: number,
    onSelect: (item: any) => void
  ) => {
    let nextIndex = -1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % list.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + list.length) % list.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(list[currentIndex]);
      return;
    }

    if (nextIndex >= 0) {
      const items = containerRef.current?.querySelectorAll<HTMLElement>('[role="radio"]');
      if (items && items[nextIndex]) {
        items[nextIndex].focus();
        onSelect(list[nextIndex]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal / Sheet Container */}
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="switcher-heading"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full md:w-[380px] max-h-[85vh] md:max-h-[620px] flex flex-col bg-surface border-t md:border border-border rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden z-10 pb-safe"
          >
            {/* Header with Title, Tabs & Close */}
            <div className="p-4 border-b border-border shrink-0 bg-surface">
              {/* Mobile Drag Indicator */}
              <div className="w-10 h-1 bg-border rounded-full mx-auto mb-3 md:hidden" />

              <div className="flex items-center justify-between mb-3">
                <h2 id="switcher-heading" className="text-sm font-semibold text-foreground tracking-wide flex items-center gap-2">
                  <Globe className="w-4 h-4 text-accent" />
                  <span>{t('switcher.languageTitle')} & {t('switcher.currencyTitle')}</span>
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t('switcher.close')}
                  className="p-1 rounded-md text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Segmented Tab Selector */}
              <div className="grid grid-cols-2 p-1 bg-background rounded-lg border border-border text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab('language')}
                  className={`py-1.5 px-3 rounded-md transition-all text-center relative ${
                    activeTab === 'language'
                      ? 'text-foreground font-semibold bg-surface border border-border/80 shadow-sm'
                      : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  {t('switcher.languageTitle')} ({locale.split('-')[0].toUpperCase()})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('currency')}
                  className={`py-1.5 px-3 rounded-md transition-all text-center relative ${
                    activeTab === 'currency'
                      ? 'text-foreground font-semibold bg-surface border border-border/80 shadow-sm'
                      : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  {t('switcher.currencyTitle')} ({currency})
                </button>
              </div>

              {/* Search Bar (Appears when more than 8 options exist, matching Section 2) */}
              <div className="mt-3 relative">
                <Search className="w-3.5 h-3.5 absolute start-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'language'
                      ? 'Search languages (e.g. Hindi, Deutsch)...'
                      : 'Search currencies (e.g. INR, USD, EUR)...'
                  }
                  className="w-full ps-9 pe-8 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Lists */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              {/* Payment Locked Warning at Checkout Step */}
              {isPaymentLocked && activeTab === 'currency' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{t('checkout.lockedCurrencyNotice')}</p>
                    <p className="text-text-muted mt-0.5">
                      Changing payment currency during checkout ends the current transaction session.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 1: LANGUAGES */}
              {activeTab === 'language' && (
                <div role="radiogroup" aria-label={t('switcher.languageTitle')} className="space-y-4">
                  {/* Recently Used Section (when no search query) */}
                  {!searchQuery && recentLocaleItems.length > 0 && (
                    <div>
                      <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                        {t('switcher.recentlyUsed')}
                      </p>
                      <div className="space-y-1">
                        {recentLocaleItems.map((loc, idx) => {
                          const isSelected = locale === loc.code;
                          return (
                            <button
                              key={`recent-${loc.code}`}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              tabIndex={isSelected ? 0 : -1}
                              onClick={() => handleSelectLocale(loc.code)}
                              onKeyDown={(e) =>
                                handleRadioKeyDown(e, recentLocaleItems, idx, (item) =>
                                  handleSelectLocale(item.code)
                                )
                              }
                              className={`w-full min-h-[48px] px-3 py-2 rounded-xl flex items-center justify-between text-start transition-colors border ${
                                isSelected
                                  ? 'bg-surface-hover border-border-strong text-foreground font-semibold'
                                  : 'border-transparent text-text-muted hover:text-foreground hover:bg-surface-hover/60'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground" lang={loc.code}>
                                  {loc.native}
                                </span>
                                <span className="text-[11px] text-text-muted">{loc.name}</span>
                              </div>
                              {isSelected && (
                                <motion.div
                                  layoutId="locale-active-check"
                                  transition={{ duration: 0.18 }}
                                  className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All Languages Section */}
                  <div>
                    <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                      {t('switcher.allLanguages')}
                    </p>
                    {filteredLocales.length === 0 ? (
                      <p className="p-4 text-xs text-center text-text-muted">No languages match your search.</p>
                    ) : (
                      <div className="space-y-1">
                        {filteredLocales.map((loc, idx) => {
                          const isSelected = locale === loc.code;
                          return (
                            <button
                              key={loc.code}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              tabIndex={isSelected ? 0 : -1}
                              onClick={() => handleSelectLocale(loc.code)}
                              onKeyDown={(e) =>
                                handleRadioKeyDown(e, filteredLocales, idx, (item) =>
                                  handleSelectLocale(item.code)
                                )
                              }
                              className={`w-full min-h-[48px] px-3 py-2 rounded-xl flex items-center justify-between text-start transition-colors border ${
                                isSelected
                                  ? 'bg-surface-hover border-border-strong text-foreground font-semibold'
                                  : 'border-transparent text-text-muted hover:text-foreground hover:bg-surface-hover/60'
                              }`}
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground" lang={loc.code}>
                                    {loc.native}
                                  </span>
                                  {loc.tier === 1 && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-accent font-mono uppercase tracking-wider">
                                      Tier 1
                                    </span>
                                  )}
                                  {loc.isPseudo && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                                      TEST
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-text-muted">{loc.name}</span>
                              </div>
                              {isSelected && (
                                <motion.div
                                  layoutId="locale-active-check"
                                  transition={{ duration: 0.18 }}
                                  className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: CURRENCIES */}
              {activeTab === 'currency' && (
                <div role="radiogroup" aria-label={t('switcher.currencyTitle')} className="space-y-4">
                  {/* Recently Used Section (when no search query) */}
                  {!searchQuery && recentCurrencyItems.length > 0 && (
                    <div>
                      <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                        {t('switcher.recentlyUsed')}
                      </p>
                      <div className="space-y-1">
                        {recentCurrencyItems.map((curr, idx) => {
                          const isSelected = currency === curr.code;
                          return (
                            <button
                              key={`recent-${curr.code}`}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              tabIndex={isSelected ? 0 : -1}
                              disabled={isPaymentLocked}
                              onClick={() => handleSelectCurrency(curr.code)}
                              onKeyDown={(e) =>
                                handleRadioKeyDown(e, recentCurrencyItems, idx, (item) =>
                                  handleSelectCurrency(item.code)
                                )
                              }
                              className={`w-full min-h-[48px] px-3 py-2 rounded-xl flex items-center justify-between text-start transition-colors border ${
                                isSelected
                                  ? 'bg-surface-hover border-border-strong text-foreground font-semibold'
                                  : 'border-transparent text-text-muted hover:text-foreground hover:bg-surface-hover/60'
                              } ${isPaymentLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center font-mono text-xs font-bold text-foreground shrink-0">
                                  {curr.symbol}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-foreground">
                                    {curr.name} ({curr.code})
                                  </span>
                                  <span className="text-[11px] text-text-muted">
                                    {curr.isSettlement ? t('switcher.nativeSettlement') : t('switcher.convertedEstimate')}
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <motion.div
                                  layoutId="currency-active-check"
                                  transition={{ duration: 0.18 }}
                                  className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All Currencies Section */}
                  <div>
                    <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-text-muted uppercase">
                      {t('switcher.allCurrencies')}
                    </p>
                    {filteredCurrencies.length === 0 ? (
                      <p className="p-4 text-xs text-center text-text-muted">No currencies match your search.</p>
                    ) : (
                      <div className="space-y-1">
                        {filteredCurrencies.map((curr, idx) => {
                          const isSelected = currency === curr.code;
                          return (
                            <button
                              key={curr.code}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              tabIndex={isSelected ? 0 : -1}
                              disabled={isPaymentLocked}
                              onClick={() => handleSelectCurrency(curr.code)}
                              onKeyDown={(e) =>
                                handleRadioKeyDown(e, filteredCurrencies, idx, (item) =>
                                  handleSelectCurrency(item.code)
                                )
                              }
                              className={`w-full min-h-[48px] px-3 py-2 rounded-xl flex items-center justify-between text-start transition-colors border ${
                                isSelected
                                  ? 'bg-surface-hover border-border-strong text-foreground font-semibold'
                                  : 'border-transparent text-text-muted hover:text-foreground hover:bg-surface-hover/60'
                              } ${isPaymentLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center font-mono text-xs font-bold text-foreground shrink-0">
                                  {curr.symbol}
                                </span>
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground">
                                      {curr.name} ({curr.code})
                                    </span>
                                    {curr.isSettlement && (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-mono font-medium">
                                        Settlement
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-text-muted">
                                    {curr.nativeName} · {curr.isSettlement ? t('switcher.nativeSettlement') : t('switcher.convertedEstimate')}
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <motion.div
                                  layoutId="currency-active-check"
                                  transition={{ duration: 0.18 }}
                                  className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Honest Disclosure Footer */}
            <div className="p-3 bg-surface-hover border-t border-border shrink-0 text-center text-[11px] text-text-muted flex items-center justify-between">
              <span>{t('pricing.nativeSettlement', { currency: 'INR' })}</span>
              <span className="font-mono text-xs text-foreground/80">
                {locale.split('-')[0].toUpperCase()} · {currency}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

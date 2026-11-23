'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Globe, X, Check } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { LOCALES, LocaleConfig } from '@/lib/i18n/config';

const STORAGE_DISMISSED_KEY = 'shop_locale_suggestion_dismissed';

export function SuggestionBanner() {
  const { locale, setLocale, t } = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const [suggestedLocale, setSuggestedLocale] = useState<LocaleConfig | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Do not show to search engine crawlers / bots
    const ua = navigator.userAgent.toLowerCase();
    if (/bot|crawler|spider|crawling|googlebot|bingbot|yandex/i.test(ua)) {
      return;
    }

    try {
      const alreadyDismissed = localStorage.getItem(STORAGE_DISMISSED_KEY);
      if (alreadyDismissed) return;

      const browserLangs = navigator.languages || [navigator.language || ''];
      for (const lang of browserLangs) {
        const langPrefix = lang.split('-')[0].toLowerCase();
        // Look for enabled tier 1 or 2 locales matching browser
        const match = LOCALES.find(
          (l) =>
            l.enabled &&
            (l.code.toLowerCase() === lang.toLowerCase() ||
              l.code.split('-')[0].toLowerCase() === langPrefix)
        );

        if (match && match.code !== locale) {
          setSuggestedLocale(match);
          setIsDismissed(false);
          break;
        }
      }
    } catch {
      // safe fallback
    }
  }, [locale]);

  if (isDismissed || !suggestedLocale) {
    return null;
  }

  const handleSwitch = () => {
    setLocale(suggestedLocale.code);
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
    } catch {}
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
    } catch {}
  };

  return (
    <AnimatePresence>
      <motion.div
        role="region"
        aria-label="Language Suggestion"
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
        transition={{ duration: 0.25 }}
        className="w-full bg-surface border-b border-border py-2 px-4 shadow-sm relative z-40"
      >
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-foreground font-medium text-center sm:text-start">
            <Globe className="w-4 h-4 text-accent shrink-0" aria-hidden="true" />
            <span>
              {t('suggestion.prompt', { language: suggestedLocale.native })}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSwitch}
              className="px-3 py-1 rounded-full bg-accent text-background font-semibold text-xs hover:bg-accent-hover transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t('suggestion.switch', { language: suggestedLocale.native })}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1 rounded-full border border-border text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              {t('suggestion.dismiss')}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

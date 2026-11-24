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
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-20 md:bottom-6 start-4 end-4 md:start-auto md:end-6 md:max-w-md z-[55] bg-surface/95 backdrop-blur-md border border-border rounded-2xl p-3.5 shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
            <Globe className="w-4 h-4" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">
              {t('suggestion.prompt', { language: suggestedLocale.native })}
            </p>
            <div className="flex items-center gap-2 mt-2.5">
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
                className="px-3 py-1 rounded-full border border-border text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors text-xs"
              >
                {t('suggestion.dismiss')}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('suggestion.dismiss')}
            className="p-1 rounded-md text-text-muted hover:text-foreground hover:bg-surface-hover transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

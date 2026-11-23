'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  DEFAULT_LOCALE,
  DEFAULT_CURRENCY,
  getLocaleConfig,
  getCurrencyConfig,
  LocaleConfig,
  CurrencyConfig,
  TextDirection,
  ScriptType,
} from '@/lib/i18n/config';
import { getTranslation } from '@/lib/i18n/translations';
import {
  formatHonestPrice,
  HonestPrice,
  isEmiSupportedForCurrency,
} from '@/lib/i18n/currencyEngine';

export interface LocaleContextType {
  locale: string;
  currency: string;
  localeConfig: LocaleConfig;
  currencyConfig: CurrencyConfig;
  dir: TextDirection;
  script: ScriptType;
  setLocale: (code: string) => void;
  setCurrency: (code: string) => void;
  t: (keyPath: string, params?: Record<string, any>) => string;
  formatPrice: (baseAmountINR: number, isMinor?: boolean) => HonestPrice;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (value: number, unit: Intl.RelativeTimeFormatUnit) => string;
  isPaymentLocked: boolean;
  setPaymentLocked: (locked: boolean) => void;
  recentlyUsedLocales: string[];
  recentlyUsedCurrencies: string[];
  emiSupported: boolean;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const COOKIE_LOCALE = 'shop_locale';
const COOKIE_CURRENCY = 'shop_currency';
const STORAGE_LOCALE_KEY = 'shop_locale';
const STORAGE_CURRENCY_KEY = 'shop_currency';
const STORAGE_RECENT_LOCALES = 'shop_recent_locales';
const STORAGE_RECENT_CURRENCIES = 'shop_recent_currencies';

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export function LocaleProvider({
  children,
  initialLocale,
  initialCurrency,
}: {
  children: React.ReactNode;
  initialLocale?: string;
  initialCurrency?: string;
}) {
  const [locale, setLocaleState] = useState<string>(initialLocale || DEFAULT_LOCALE);
  const [currency, setCurrencyState] = useState<string>(initialCurrency || DEFAULT_CURRENCY);
  const [isPaymentLocked, setPaymentLocked] = useState<boolean>(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');
  const [recentlyUsedLocales, setRecentlyUsedLocales] = useState<string[]>([DEFAULT_LOCALE]);
  const [recentlyUsedCurrencies, setRecentlyUsedCurrencies] = useState<string[]>([DEFAULT_CURRENCY]);

  const localeConfig = useMemo(() => getLocaleConfig(locale), [locale]);
  const currencyConfig = useMemo(() => getCurrencyConfig(currency), [currency]);
  const emiSupported = useMemo(() => isEmiSupportedForCurrency(currency), [currency]);

  // Sync with document element attributes on locale change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = localeConfig.code;
      document.documentElement.dir = localeConfig.dir;
      document.documentElement.setAttribute('data-script', localeConfig.script);
    }
  }, [localeConfig]);

  // Load saved preferences on client mount
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(STORAGE_LOCALE_KEY) || getCookie(COOKIE_LOCALE);
      if (savedLocale) {
        setLocaleState(savedLocale);
      }
      const savedCurrency = localStorage.getItem(STORAGE_CURRENCY_KEY) || getCookie(COOKIE_CURRENCY);
      if (savedCurrency) {
        setCurrencyState(savedCurrency);
      }
      const recentLoc = localStorage.getItem(STORAGE_RECENT_LOCALES);
      if (recentLoc) {
        setRecentlyUsedLocales(JSON.parse(recentLoc));
      }
      const recentCurr = localStorage.getItem(STORAGE_RECENT_CURRENCIES);
      if (recentCurr) {
        setRecentlyUsedCurrencies(JSON.parse(recentCurr));
      }
    } catch {
      // safe fallback in restricted contexts
    }
  }, []);

  const setLocale = useCallback(
    (newLocale: string) => {
      const config = getLocaleConfig(newLocale);
      setLocaleState(config.code);
      setCookie(COOKIE_LOCALE, config.code);
      setCookie('NEXT_LOCALE', config.code);
      try {
        localStorage.setItem(STORAGE_LOCALE_KEY, config.code);
        setRecentlyUsedLocales((prev) => {
          const updated = [config.code, ...prev.filter((c) => c !== config.code)].slice(0, 3);
          localStorage.setItem(STORAGE_RECENT_LOCALES, JSON.stringify(updated));
          return updated;
        });
      } catch {}

      // Announce to screen reader
      const announcement = getTranslation('switcher.announcementLang', config.code, {
        name: config.native,
      });
      setLiveAnnouncement(announcement);
    },
    []
  );

  const setCurrency = useCallback(
    (newCurrency: string) => {
      if (isPaymentLocked) {
        console.warn('Currency is locked during active checkout payment session.');
        return;
      }

      const config = getCurrencyConfig(newCurrency);
      setCurrencyState(config.code);
      setCookie(COOKIE_CURRENCY, config.code);
      try {
        localStorage.setItem(STORAGE_CURRENCY_KEY, config.code);
        setRecentlyUsedCurrencies((prev) => {
          const updated = [config.code, ...prev.filter((c) => c !== config.code)].slice(0, 3);
          localStorage.setItem(STORAGE_RECENT_CURRENCIES, JSON.stringify(updated));
          return updated;
        });
      } catch {}

      // Announce to screen reader
      const announcement = getTranslation('switcher.announcementCurr', locale, {
        name: config.name,
      });
      setLiveAnnouncement(announcement);
    },
    [isPaymentLocked, locale]
  );

  const t = useCallback(
    (keyPath: string, params?: Record<string, any>) => {
      return getTranslation(keyPath, locale, params);
    },
    [locale]
  );

  const formatPrice = useCallback(
    (baseAmountINR: number, isMinor: boolean = false): HonestPrice => {
      return formatHonestPrice({
        baseAmountINR,
        isMinor,
        targetCurrency: currency,
        locale,
      });
    },
    [currency, locale]
  );

  const formatDate = useCallback(
    (dateInput: Date | string, options?: Intl.DateTimeFormatOptions) => {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      if (isNaN(date.getTime())) return '';
      try {
        return new Intl.DateTimeFormat(locale, options || { dateStyle: 'medium' }).format(date);
      } catch {
        return date.toLocaleDateString();
      }
    },
    [locale]
  );

  const formatRelativeTime = useCallback(
    (value: number, unit: Intl.RelativeTimeFormatUnit) => {
      try {
        return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
      } catch {
        return `${value} ${unit} ago`;
      }
    },
    [locale]
  );

  return (
    <LocaleContext.Provider
      value={{
        locale,
        currency,
        localeConfig,
        currencyConfig,
        dir: localeConfig.dir,
        script: localeConfig.script,
        setLocale,
        setCurrency,
        t,
        formatPrice,
        formatDate,
        formatRelativeTime,
        isPaymentLocked,
        setPaymentLocked,
        recentlyUsedLocales,
        recentlyUsedCurrencies,
        emiSupported,
      }}
    >
      {/* Screen Reader Polite Live Region for Switcher State Announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveAnnouncement}
      </div>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

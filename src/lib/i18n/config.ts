export type ScriptType =
  | 'Latn'
  | 'Deva'
  | 'Knda'
  | 'Taml'
  | 'Arab'
  | 'Cyrl'
  | 'Jpan'
  | 'Kore'
  | 'Hans'
  | 'Hant'
  | 'Thai'
  | 'Hebr';

export type TextDirection = 'ltr' | 'rtl';

export interface LocaleConfig {
  code: string;
  native: string;
  name: string;
  dir: TextDirection;
  script: ScriptType;
  currency: string | null;
  tier: 1 | 2;
  enabled: boolean;
  isPseudo?: boolean;
  lineHeightMultiplier?: number;
  unitSystem?: 'metric' | 'imperial';
  digits?: 'latn' | 'deva' | 'arab';
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  nativeName: string;
  minorUnits: number;
  isSettlement: boolean;
  roundingRule: 'standard' | 'whole' | 'charm99' | 'step05';
  rateToBaseINR: number; // 1 Base (INR) = rate * Target Currency
  taxInclusive: boolean;
}

/**
 * All supported locales matching Prompt Section 1 & Section 14
 */
export const LOCALES: LocaleConfig[] = [
  // Tier 1: launch-ready (full UI, catalog, checkout, legal pages, support)
  {
    code: 'en-IN',
    native: 'English',
    name: 'English (India)',
    dir: 'ltr',
    script: 'Latn',
    currency: 'INR',
    tier: 1,
    enabled: true,
    lineHeightMultiplier: 1.5,
    unitSystem: 'metric',
  },
  {
    code: 'hi-IN',
    native: 'हिन्दी',
    name: 'Hindi',
    dir: 'ltr',
    script: 'Deva',
    currency: 'INR',
    tier: 1,
    enabled: true,
    lineHeightMultiplier: 1.65,
    unitSystem: 'metric',
  },
  {
    code: 'kn-IN',
    native: 'ಕನ್ನಡ',
    name: 'Kannada',
    dir: 'ltr',
    script: 'Knda',
    currency: 'INR',
    tier: 1,
    enabled: true,
    lineHeightMultiplier: 1.7,
    unitSystem: 'metric',
  },
  {
    code: 'ta-IN',
    native: 'தமிழ்',
    name: 'Tamil',
    dir: 'ltr',
    script: 'Taml',
    currency: 'INR',
    tier: 1,
    enabled: true,
    lineHeightMultiplier: 1.65,
    unitSystem: 'metric',
  },

  // Tier 2: enable per market once the readiness gate in section 16 passes
  {
    code: 'es-ES',
    native: 'Español (España)',
    name: 'Spanish (Spain)',
    dir: 'ltr',
    script: 'Latn',
    currency: 'EUR',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.5,
    unitSystem: 'metric',
  },
  {
    code: 'es-MX',
    native: 'Español (México)',
    name: 'Spanish (Mexico)',
    dir: 'ltr',
    script: 'Latn',
    currency: 'MXN',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.5,
    unitSystem: 'metric',
  },
  {
    code: 'fr-FR',
    native: 'Français',
    name: 'French',
    dir: 'ltr',
    script: 'Latn',
    currency: 'EUR',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.5,
    unitSystem: 'metric',
  },
  {
    code: 'de-DE',
    native: 'Deutsch',
    name: 'German',
    dir: 'ltr',
    script: 'Latn',
    currency: 'EUR',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.5,
    unitSystem: 'metric',
  },
  {
    code: 'pt-BR',
    native: 'Português (Brasil)',
    name: 'Portuguese (Brazil)',
    dir: 'ltr',
    script: 'Latn',
    currency: 'BRL',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.5,
    unitSystem: 'metric',
  },
  {
    code: 'it-IT',
    native: 'Italiano',
    name: 'Italian',
    dir: 'ltr',
    script: 'Latn',
    currency: 'EUR',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.5,
    unitSystem: 'metric',
  },
  {
    code: 'nl-NL',
    native: 'Nederlands',
    name: 'Dutch',
    dir: 'ltr',
    script: 'Latn',
    currency: 'EUR',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.5,
    unitSystem: 'metric',
  },
  {
    code: 'tr-TR',
    native: 'Türkçe',
    name: 'Turkish',
    dir: 'ltr',
    script: 'Latn',
    currency: 'TRY',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.5,
    unitSystem: 'metric',
  },
  {
    code: 'ru',
    native: 'Русский',
    name: 'Russian',
    dir: 'ltr',
    script: 'Cyrl',
    currency: null,
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.5,
    unitSystem: 'metric',
  },
  {
    code: 'ja-JP',
    native: '日本語',
    name: 'Japanese',
    dir: 'ltr',
    script: 'Jpan',
    currency: 'JPY',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.6,
    unitSystem: 'metric',
  },
  {
    code: 'ko-KR',
    native: '한국어',
    name: 'Korean',
    dir: 'ltr',
    script: 'Kore',
    currency: 'KRW',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.6,
    unitSystem: 'metric',
  },
  {
    code: 'zh-CN',
    native: '简体中文',
    name: 'Chinese (Simplified)',
    dir: 'ltr',
    script: 'Hans',
    currency: 'CNY',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.6,
    unitSystem: 'metric',
  },
  {
    code: 'zh-TW',
    native: '繁體中文',
    name: 'Chinese (Traditional)',
    dir: 'ltr',
    script: 'Hant',
    currency: 'TWD',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.6,
    unitSystem: 'metric',
  },
  {
    code: 'th-TH',
    native: 'ไทย',
    name: 'Thai',
    dir: 'ltr',
    script: 'Thai',
    currency: 'THB',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.65,
    unitSystem: 'metric',
  },
  {
    code: 'vi-VN',
    native: 'Tiếng Việt',
    name: 'Vietnamese',
    dir: 'ltr',
    script: 'Latn',
    currency: 'VND',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.55,
    unitSystem: 'metric',
  },
  {
    code: 'id-ID',
    native: 'Bahasa Indonesia',
    name: 'Indonesian',
    dir: 'ltr',
    script: 'Latn',
    currency: 'IDR',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.5,
    unitSystem: 'metric',
  },
  {
    code: 'ar-AE',
    native: 'العربية',
    name: 'Arabic (UAE)',
    dir: 'rtl',
    script: 'Arab',
    currency: 'AED',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.65,
    unitSystem: 'metric',
  },
  {
    code: 'he-IL',
    native: 'עברית',
    name: 'Hebrew (Israel)',
    dir: 'rtl',
    script: 'Hebr',
    currency: 'ILS',
    tier: 2,
    enabled: false,
    lineHeightMultiplier: 1.6,
    unitSystem: 'metric',
  },

  // Pseudo-locales for development, visual regression, and overflow stress tests
  {
    code: 'en-XA',
    native: '[!!! Ȧḋḋ ţǿ ɓȧɠ Pseudo (+40%) !!!]',
    name: 'Pseudo-Locale (+40% Expansion)',
    dir: 'ltr',
    script: 'Latn',
    currency: 'USD',
    tier: 2,
    enabled: true,
    isPseudo: true,
    lineHeightMultiplier: 1.5,
    unitSystem: 'metric',
  },
  {
    code: 'ar-XB',
    native: '[!!! ɌŤŁ Pşėŭďǿ العربية !!!]',
    name: 'Pseudo-RTL Stress Locale',
    dir: 'rtl',
    script: 'Arab',
    currency: 'AED',
    tier: 2,
    enabled: true,
    isPseudo: true,
    lineHeightMultiplier: 1.65,
    unitSystem: 'metric',
  },
];

/**
 * Supported currencies with minor units, symbols, base exchange rates, and tax policies
 */
export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    nativeName: 'भारतीय रुपया',
    minorUnits: 2,
    isSettlement: true, // Native settlement currency
    roundingRule: 'whole',
    rateToBaseINR: 1.0,
    taxInclusive: true, // MRP includes GST
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    nativeName: 'US Dollar',
    minorUnits: 2,
    isSettlement: false, // Converted estimate
    roundingRule: 'standard',
    rateToBaseINR: 0.012, // 1 INR ~ 0.012 USD
    taxInclusive: false,
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    nativeName: 'Euro',
    minorUnits: 2,
    isSettlement: false,
    roundingRule: 'standard',
    rateToBaseINR: 0.011, // 1 INR ~ 0.011 EUR
    taxInclusive: true,
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    nativeName: 'British Pound',
    minorUnits: 2,
    isSettlement: false,
    roundingRule: 'standard',
    rateToBaseINR: 0.0095,
    taxInclusive: true,
  },
  {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    nativeName: '日本円',
    minorUnits: 0, // Zero decimals
    roundingRule: 'whole',
    rateToBaseINR: 1.82,
    taxInclusive: true,
  },
  {
    code: 'AED',
    symbol: 'AED',
    name: 'UAE Dirham',
    nativeName: 'درهم إماراتي',
    minorUnits: 2,
    isSettlement: false,
    roundingRule: 'standard',
    rateToBaseINR: 0.044,
    taxInclusive: true,
  },
  {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    nativeName: 'Canadian Dollar',
    minorUnits: 2,
    isSettlement: false,
    roundingRule: 'standard',
    rateToBaseINR: 0.016,
    taxInclusive: false,
  },
  {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    nativeName: 'Australian Dollar',
    minorUnits: 2,
    isSettlement: false,
    roundingRule: 'standard',
    rateToBaseINR: 0.018,
    taxInclusive: true,
  },
  {
    code: 'KWD',
    symbol: 'KD',
    name: 'Kuwaiti Dinar',
    nativeName: 'دينار كويتي',
    minorUnits: 3, // 3 decimals!
    roundingRule: 'standard',
    rateToBaseINR: 0.0037,
    taxInclusive: true,
  },
  {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    nativeName: 'Real Brasileiro',
    minorUnits: 2,
    isSettlement: false,
    roundingRule: 'standard',
    rateToBaseINR: 0.065,
    taxInclusive: true,
  },
  {
    code: 'CNY',
    symbol: 'CN¥',
    name: 'Chinese Yuan',
    nativeName: '人民币',
    minorUnits: 2,
    isSettlement: false,
    roundingRule: 'standard',
    rateToBaseINR: 0.086,
    taxInclusive: true,
  },
  {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    nativeName: '대한민국 원',
    minorUnits: 0,
    roundingRule: 'whole',
    rateToBaseINR: 16.2,
    taxInclusive: true,
  },
  {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    nativeName: 'Singapore Dollar',
    minorUnits: 2,
    isSettlement: false,
    roundingRule: 'standard',
    rateToBaseINR: 0.016,
    taxInclusive: true,
  },
  {
    code: 'TRY',
    symbol: '₺',
    name: 'Turkish Lira',
    nativeName: 'Türk Lirası',
    minorUnits: 2,
    isSettlement: false,
    roundingRule: 'standard',
    rateToBaseINR: 0.41,
    taxInclusive: true,
  },
  {
    code: 'MXN',
    symbol: 'MX$',
    name: 'Mexican Peso',
    nativeName: 'Peso Mexicano',
    minorUnits: 2,
    isSettlement: false,
    roundingRule: 'standard',
    rateToBaseINR: 0.22,
    taxInclusive: true,
  },
  {
    code: 'ILS',
    symbol: '₪',
    name: 'Israeli New Shekel',
    nativeName: 'שקל חדש',
    minorUnits: 2,
    isSettlement: false,
    roundingRule: 'standard',
    rateToBaseINR: 0.045,
    taxInclusive: true,
  },
];

export const DEFAULT_LOCALE = 'en-IN';
export const DEFAULT_CURRENCY = 'INR';
export const BASE_SETTLEMENT_CURRENCY = 'INR';

export function getLocaleConfig(code: string): LocaleConfig {
  const normalized = code.toLowerCase().trim();
  const match = LOCALES.find(
    (l) => l.code.toLowerCase() === normalized || l.code.split('-')[0].toLowerCase() === normalized
  );
  return match || LOCALES[0];
}

export function getCurrencyConfig(code: string): CurrencyConfig {
  const normalized = (code || DEFAULT_CURRENCY).toUpperCase().trim();
  const match = SUPPORTED_CURRENCIES.find((c) => c.code === normalized);
  return match || SUPPORTED_CURRENCIES[0];
}

export function isRTL(localeCode: string): boolean {
  return getLocaleConfig(localeCode).dir === 'rtl';
}

export function getScriptForLocale(localeCode: string): ScriptType {
  return getLocaleConfig(localeCode).script;
}
